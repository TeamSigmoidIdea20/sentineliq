from __future__ import annotations

import numpy as np
from collections import deque

try:
    import torch
    import torch.nn as nn
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

SEQ_LEN = 10
N_FEATURES = 8
HIDDEN_SIZE = 16


class _LSTMAENet:
    pass


if TORCH_AVAILABLE:
    class _LSTMAENet(nn.Module):  # type: ignore[no-redef]
        def __init__(self):
            super().__init__()
            self.encoder = nn.LSTM(N_FEATURES, HIDDEN_SIZE, batch_first=True)
            self.decoder = nn.LSTM(HIDDEN_SIZE, N_FEATURES, batch_first=True)

        def forward(self, x):
            _, (h, _) = self.encoder(x)
            repeated = h.squeeze(0).unsqueeze(1).expand(-1, SEQ_LEN, -1)
            out, _ = self.decoder(repeated)
            return out


class LSTMAutoencoderModel:
    def __init__(self):
        self._net = None
        self._scaler_mean = None
        self._scaler_std = None
        self._user_seqs: dict[str, deque] = {}
        self._threshold = 1.0
        self.is_fitted = False

    def _scale(self, X: np.ndarray) -> np.ndarray:
        return (X - self._scaler_mean) / (self._scaler_std + 1e-8)

    def fit(self, user_events: dict[str, list[np.ndarray]]) -> None:
        if not TORCH_AVAILABLE:
            self.is_fitted = True
            return

        all_features = [f for events in user_events.values() for f in events]
        if len(all_features) < SEQ_LEN:
            self.is_fitted = True
            return

        arr = np.array(all_features, dtype=np.float32)
        self._scaler_mean = arr.mean(axis=0)
        self._scaler_std = arr.std(axis=0)

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

        net.eval()
        with torch.no_grad():
            recons = net(X_tensor)
            errors = ((recons - X_tensor) ** 2).mean(dim=(1, 2)).numpy()
        self._threshold = float(np.percentile(errors, 90))
        self._net = net
        self.is_fitted = True

    def _get_seq(self, user_id: str, features: np.ndarray) -> np.ndarray:
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

    def score(self, user_id: str, features: np.ndarray) -> float:
        """Returns anomaly score [0, 1]. Higher = more anomalous."""
        seq = self._get_seq(user_id, features)
        if not self.is_fitted or self._net is None or not TORCH_AVAILABLE:
            return 0.5

        import torch
        with torch.no_grad():
            x = torch.tensor(seq[None], dtype=torch.float32)
            out = self._net(x)
            error = float(((out - x) ** 2).mean().item())
        normalized = error / (self._threshold + 1e-8)
        return float(np.clip(normalized, 0.0, 1.0))

    def save(self, path: str) -> None:
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
