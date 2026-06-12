# LSTM Autoencoder — the "temporal" member of the 3-model ensemble.
# Where Isolation Forest looks at one event in isolation, this looks at a SEQUENCE
# of a user's recent events and learns what "normal" sequences look like. It tries
# to reconstruct the sequence; a high reconstruction error means the recent pattern
# of behaviour is unusual for that user → higher anomaly score.
from __future__ import annotations

import numpy as np
from collections import deque

# PyTorch is optional — if it isn't installed the model degrades gracefully to a
# neutral 0.5 score instead of crashing (see the TORCH_AVAILABLE guards below).
try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

SEQ_LEN = 10        # how many recent events form one sequence
N_FEATURES = 8      # the 8 engineered behavioural features per event
HIDDEN_SIZE = 16    # size of the compressed "bottleneck" representation


# Placeholder so the class name always exists even when torch is missing.
class _LSTMAENet:
    pass


if TORCH_AVAILABLE:
    # The actual network: encoder LSTM compresses the sequence to a hidden vector,
    # decoder LSTM tries to rebuild the original sequence from that vector.
    class _LSTMAENet(nn.Module):  # type: ignore[no-redef]
        def __init__(self):
            super().__init__()
            self.encoder = nn.LSTM(N_FEATURES, HIDDEN_SIZE, batch_first=True)
            self.decoder = nn.LSTM(HIDDEN_SIZE, N_FEATURES, batch_first=True)

        def forward(self, x):
            # Encode → take the final hidden state → repeat it across the sequence
            # length → decode back into a reconstructed sequence.
            _, (h, _) = self.encoder(x)
            repeated = h.squeeze(0).unsqueeze(1).expand(-1, SEQ_LEN, -1)
            out, _ = self.decoder(repeated)
            return out


class LSTMAutoencoderModel:
    def __init__(self):
        self._net = None              # the trained PyTorch network
        self._scaler_mean = None      # per-feature mean (for normalisation)
        self._scaler_std = None       # per-feature std  (for normalisation)
        self._user_seqs: dict[str, deque] = {}  # rolling buffer of recent events per user
        self._threshold = 1.0         # reconstruction error that counts as "normal"
        self.is_fitted = False

    def _scale(self, X: np.ndarray) -> np.ndarray:
        # Standardise features to mean 0 / std 1; +1e-8 avoids divide-by-zero.
        return (X - self._scaler_mean) / (self._scaler_std + 1e-8)

    def fit(self, user_events: dict[str, list[np.ndarray]]) -> None:
        # No torch → stay in graceful-fallback mode (score() returns 0.5).
        if not TORCH_AVAILABLE:
            self.is_fitted = True
            return

        # Need at least one full sequence worth of events to train on.
        all_features = [f for events in user_events.values() for f in events]
        if len(all_features) < SEQ_LEN:
            self.is_fitted = True
            return

        # Compute normalisation stats across every user's events.
        arr = np.array(all_features, dtype=np.float32)
        self._scaler_mean = arr.mean(axis=0)
        self._scaler_std = arr.std(axis=0)

        # Build training sequences with a sliding window over each user's history.
        # Short histories are left-padded with zeros up to SEQ_LEN.
        sequences = []
        for events in user_events.values():
            scaled = [self._scale(f) for f in events]
            for i in range(max(1, len(scaled) - SEQ_LEN + 1)):
                seq = scaled[i: i + SEQ_LEN]
                if len(seq) < SEQ_LEN:
                    pad = [np.zeros(N_FEATURES, dtype=np.float32)] * (SEQ_LEN - len(seq))
                    seq = pad + seq
                sequences.append(np.array(seq, dtype=np.float32))

        if not sequences:
            self.is_fitted = True
            return

        import torch
        import torch.nn as nn

        # Train the autoencoder to reconstruct normal sequences (8 quick epochs).
        X_tensor = torch.tensor(np.array(sequences), dtype=torch.float32)
        net = _LSTMAENet()
        optimizer = torch.optim.Adam(net.parameters(), lr=0.005)
        criterion = nn.MSELoss()

        net.train()
        for _ in range(8):
            optimizer.zero_grad()
            out = net(X_tensor)
            loss = criterion(out, X_tensor)
            loss.backward()
            optimizer.step()

        # Set the "normal" threshold at the 90th percentile of training errors —
        # anything reconstructed worse than this looks anomalous at scoring time.
        net.eval()
        with torch.no_grad():
            recons = net(X_tensor)
            errors = ((recons - X_tensor) ** 2).mean(dim=(1, 2)).numpy()
        self._threshold = float(np.percentile(errors, 90))
        self._net = net
        self.is_fitted = True

    def update_seq(self, user_id: str, features: np.ndarray) -> None:
        """Append features to the user's sequence buffer without scoring."""
        # Used when replaying history on restart so the buffer is warm before
        # the first live score, without emitting alerts during the replay.
        if user_id not in self._user_seqs:
            self._user_seqs[user_id] = deque(maxlen=SEQ_LEN)
        scaled = self._scale(features) if self._scaler_mean is not None else features
        self._user_seqs[user_id].append(scaled.astype(np.float32))

    def _get_seq(self, user_id: str, features: np.ndarray) -> np.ndarray:
        # Add the new event to the user's rolling buffer and return the current
        # window as a fixed-length array (left-padded with zeros if still warming up).
        if user_id not in self._user_seqs:
            self._user_seqs[user_id] = deque(maxlen=SEQ_LEN)
        if self._scaler_mean is not None:
            scaled = self._scale(features)
        else:
            scaled = features
        self._user_seqs[user_id].append(scaled.astype(np.float32))
        seq = list(self._user_seqs[user_id])
        if len(seq) < SEQ_LEN:
            pad = [np.zeros(N_FEATURES, dtype=np.float32)] * (SEQ_LEN - len(seq))
            seq = pad + seq
        return np.array(seq, dtype=np.float32)

    def _score_seq(self, seq: np.ndarray) -> float:
        # Reconstruct the sequence and turn the error into a 0-1 score by
        # dividing by the learned "normal" threshold, then clipping.
        if not self.is_fitted or self._net is None or not TORCH_AVAILABLE:
            return 0.5
        import torch
        with torch.no_grad():
            x = torch.tensor(seq[None], dtype=torch.float32)
            out = self._net(x)
            error = float(((out - x) ** 2).mean().item())
        normalized = error / (self._threshold + 1e-8)
        return float(np.clip(normalized, 0.0, 1.0))

    def score(self, user_id: str, features: np.ndarray) -> float:
        """Update sequence buffer, then return anomaly score [0, 1]."""
        seq = self._get_seq(user_id, features)
        return self._score_seq(seq)

    def save(self, path: str) -> None:
        # Persist network weights + normalisation stats + threshold to disk.
        if not TORCH_AVAILABLE or self._net is None:
            return
        import torch
        torch.save(
            {
                "state_dict": self._net.state_dict(),
                "scaler_mean": self._scaler_mean,
                "scaler_std": self._scaler_std,
                "threshold": self._threshold,
                "is_fitted": self.is_fitted,
            },
            path,
        )

    def load(self, path: str) -> None:
        # Rebuild the network and restore weights/stats/threshold from a saved file.
        if not TORCH_AVAILABLE:
            self.is_fitted = True
            return
        import torch
        payload = torch.load(path, map_location="cpu")
        net = _LSTMAENet()
        net.load_state_dict(payload["state_dict"])
        net.eval()
        self._net = net
        self._scaler_mean = payload.get("scaler_mean")
        self._scaler_std = payload.get("scaler_std")
        self._threshold = float(payload.get("threshold", 1.0))
        self.is_fitted = bool(payload.get("is_fitted", True))
