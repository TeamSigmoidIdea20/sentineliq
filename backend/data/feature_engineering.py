from __future__ import annotations

import math
from collections import deque, defaultdict
from dataclasses import dataclass, field
import numpy as np

FEATURE_NAMES = [
    "login_hour_deviation",
    "transaction_velocity_ratio",
    "access_entropy",
    "download_volume_zscore",
    "location_mismatch",
    "privilege_use_ratio",
    "device_change_frequency",
    "off_hours_ratio",
]

WINDOW = 20  # rolling window size


@dataclass
class UserHistory:
    hours: deque = field(default_factory=lambda: deque(maxlen=WINDOW))
    tx_counts: deque = field(default_factory=lambda: deque(maxlen=WINDOW))
    departments: deque = field(default_factory=lambda: deque(maxlen=WINDOW))
    downloads: deque = field(default_factory=lambda: deque(maxlen=WINDOW))
    locations: deque = field(default_factory=lambda: deque(maxlen=WINDOW))
    devices: deque = field(default_factory=lambda: deque(maxlen=WINDOW))
    event_types: deque = field(default_factory=lambda: deque(maxlen=WINDOW))
    normal_hours: tuple = (9, 17)
    normal_locations: list = field(default_factory=list)
    avg_tx: float = 10.0


class FeatureEngineer:
    def __init__(self):
        self._histories: dict[str, UserHistory] = {}

    def _get_history(self, user_id: str, event: dict) -> UserHistory:
        if user_id not in self._histories:
            self._histories[user_id] = UserHistory(
                normal_hours=(event.get("login_start", 9), event.get("login_end", 17)),
                normal_locations=event.get("normal_locations", ["hq"]),
                avg_tx=float(event.get("avg_daily_tx", 20)),
            )
        return self._histories[user_id]

    def _entropy(self, items) -> float:
        if not items:
            return 0.0
        counts: dict = defaultdict(int)
        for it in items:
            counts[it] += 1
        total = len(items)
        return -sum((c / total) * math.log2(c / total) for c in counts.values() if c > 0)

    def compute_features(self, user_id: str, event: dict) -> np.ndarray:
        h = self._get_history(user_id, event)

        hour = event.get("hour", 12)
        tx = float(event.get("tx_count", 1))
        dept = event.get("department", "")
        download = float(event.get("download_mb", 0.0))
        location = event.get("location", "")
        device = event.get("device", "")
        etype = event.get("event_type", "")

        # login_hour_deviation
        normal_mid = (h.normal_hours[0] + h.normal_hours[1]) / 2
        hour_dev = abs(hour - normal_mid) / max(1.0, (h.normal_hours[1] - h.normal_hours[0]) / 2)

        # transaction_velocity_ratio
        avg_tx_window = float(np.mean(h.tx_counts)) if h.tx_counts else h.avg_tx
        tx_ratio = tx / max(1.0, avg_tx_window)

        # access_entropy
        entropy = self._entropy(list(h.departments) + [dept])

        # download_volume_zscore
        if len(h.downloads) >= 2:
            dl_mean = float(np.mean(h.downloads))
            dl_std = float(np.std(h.downloads)) + 1e-6
            dl_z = (download - dl_mean) / dl_std
        elif len(h.downloads) == 1:
            prev = h.downloads[0]
            dl_z = (download - prev) / (prev + 1e-6)
        else:
            # No history: ratio vs rough expected baseline per event
            baseline = max(1.0, h.avg_tx * 0.1)
            dl_z = download / baseline

        # location_mismatch
        loc_mismatch = 0.0 if location in h.normal_locations else 1.0

        # privilege_use_ratio — include current event so a single privilege_use fires immediately
        all_event_types = list(h.event_types) + [etype]
        priv_count = sum(1 for e in all_event_types if e == "privilege_use")
        priv_ratio = priv_count / max(1, len(all_event_types))

        # device_change_frequency
        unique_devices = len(set(list(h.devices) + [device]))
        device_freq = unique_devices / max(1, len(h.devices) + 1)

        # off_hours_ratio — include current event so an off-hours login fires immediately
        nh_start, nh_end = h.normal_hours
        all_hours = list(h.hours) + [hour]
        off_count = sum(1 for hh in all_hours if hh < nh_start or hh > nh_end)
        off_ratio = off_count / max(1, len(all_hours))

        # Update history
        h.hours.append(hour)
        h.tx_counts.append(tx)
        h.departments.append(dept)
        h.downloads.append(download)
        h.locations.append(location)
        h.devices.append(device)
        h.event_types.append(etype)

        features = np.array([
            hour_dev,
            tx_ratio,
            entropy,
            dl_z,
            loc_mismatch,
            priv_ratio,
            device_freq,
            off_ratio,
        ], dtype=np.float32)

        return np.clip(features, -10, 10)

    @staticmethod
    def feature_names() -> list[str]:
        return FEATURE_NAMES
