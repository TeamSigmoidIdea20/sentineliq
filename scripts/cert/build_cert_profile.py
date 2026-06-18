"""
build_cert_profile.py  —  Tier-1.5 profile builder (READ-ONLY input, writes one JSON).

Purpose: read the real CMU CERT r4.2 logon data and measure when people actually
log on during the day. We turn that into a tiny "profile" file the synthetic
generator can OPTIONALLY use to make its login hours look more like real life.

What it produces (cert_profile.json):
  - hour_weights : a list of 24 numbers, one per hour 0..23, that add up to 1.0.
                   Each number is the real probability of a logon happening in that hour.
  - night_rate   : the fraction of logons that happen at night (hours 0-5 or 22-23).
  - source       : where the numbers came from (CERT r4.2 logon.csv).
  - rows_used    : how many logon rows we actually counted.

This script ONLY reads a CSV and writes a JSON. It never starts the web app and
never trains a model. It is safe to run on its own:

    python build_cert_profile.py
"""
from __future__ import annotations

# Standard-library only — keeps this script simple and dependency-free.
import csv
import json
import os
from datetime import datetime
from pathlib import Path

# Where this script lives.
HERE = Path(__file__).resolve().parent

# Where the downloaded CERT r4.2 files live. The multi-GB CERT data is NOT in git;
# by default we look in the project's datasets/cert folder (a sibling of sentineliq).
# Override the location with the CERT_DATA_DIR environment variable if needed.
DATA_DIR = Path(os.environ.get("CERT_DATA_DIR") or (HERE.parents[2] / "datasets" / "cert"))

# Where to write the profile: bundled into the backend so the generator can load it.
PROFILE_OUT = HERE.parents[1] / "backend" / "data" / "cert_profile.json"

# We cap how many rows we read so we never load the whole 56 MB file into memory.
# 400k logon rows is plenty to get a stable hour distribution.
SAMPLE_ROWS = 400_000

# "Night" hours, matching how SentinelIQ defines off-hours fraud (0-5 and 22-23).
NIGHT_HOURS = [0, 1, 2, 3, 4, 5, 22, 23]


# Find a file by name anywhere under the CERT data folder. First match or None.
def _find(filename: str) -> Path | None:
    matches = list(DATA_DIR.rglob(filename))
    return matches[0] if matches else None


# Read logon.csv and count how many logons fall in each hour of the day.
# Returns a list of 24 counts (index = hour) and the total rows we counted.
def count_logon_hours(path: Path, limit: int) -> tuple[list[int], int]:
    # Start with a zero count for every hour 0..23.
    hour_counts = [0] * 24
    rows_used = 0

    # Open the CSV. errors="ignore" protects against any odd bytes in the file.
    with open(path, newline="", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)

        # Detect the real column names from the header (case-insensitive),
        # so small schema differences do not break us.
        cols = {}
        for header in (reader.fieldnames or []):
            cols[header.lower()] = header
        date_col = cols.get("date")
        act_col = cols.get("activity")

        # Walk the rows one at a time (streaming — low memory).
        for i, row in enumerate(reader):
            # Stop once we have looked at "limit" rows.
            if i >= limit:
                break

            # Only count actual logons, not logoffs.
            if act_col and "logon" not in str(row.get(act_col, "")).lower():
                continue

            # Parse the timestamp; CERT uses MM/DD/YYYY HH:MM:SS.
            raw = row.get(date_col, "")
            try:
                hour = datetime.strptime(raw, "%m/%d/%Y %H:%M:%S").hour
            except (ValueError, TypeError):
                # Skip any row whose date we cannot parse.
                continue

            # Add one to that hour's bucket.
            hour_counts[hour] += 1
            rows_used += 1

    return hour_counts, rows_used


# Turn raw hour counts into a normalized weight list that sums to 1.0.
def to_weights(hour_counts: list[int]) -> list[float]:
    total = sum(hour_counts)
    # Guard against an empty file (avoid divide-by-zero).
    if total == 0:
        # If we somehow counted nothing, fall back to an even spread.
        return [1.0 / 24] * 24
    # Each weight is that hour's share of all logons.
    weights = [count / total for count in hour_counts]
    return weights


# Work out what fraction of logons happened during the night hours.
def night_fraction(hour_counts: list[int]) -> float:
    total = sum(hour_counts)
    if total == 0:
        return 0.0
    night = 0
    for h in NIGHT_HOURS:
        night += hour_counts[h]
    return night / total


# Main: tie it all together — read, compute, write JSON, print a short summary.
def main() -> None:
    logon_csv = _find("logon.csv")
    if logon_csv is None:
        print("ERROR: logon.csv not found under", DATA_DIR)
        return

    print("CERT logon.csv :", logon_csv)
    print("Sampling up to", f"{SAMPLE_ROWS:,}", "rows...")

    # Step 1: count logons per hour.
    hour_counts, rows_used = count_logon_hours(logon_csv, SAMPLE_ROWS)

    # Step 2: turn counts into weights and a night rate.
    weights = to_weights(hour_counts)
    night_rate = night_fraction(hour_counts)

    # Step 3: assemble the profile dict and write it into the backend (bundled).
    profile = {
        "hour_weights": weights,
        "night_rate": night_rate,
        "source": "CERT r4.2 logon.csv",
        "rows_used": rows_used,
    }
    out_path = PROFILE_OUT
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(profile, f, indent=2)

    # Step 4: print a short, human-friendly summary.
    print("")
    print("Profile written to:", out_path)
    print("Logon rows used   :", f"{rows_used:,}")
    print("Night rate (0-5,22-23):", round(night_rate, 4))
    print("Busiest hours (hour: share):")
    # Find and show the top 3 busiest hours, simply.
    indexed = []
    for h in range(24):
        indexed.append((weights[h], h))
    indexed.sort(reverse=True)
    for share, h in indexed[:3]:
        print("   {:02d}:00  ->  {:.3f}".format(h, share))


if __name__ == "__main__":
    main()
