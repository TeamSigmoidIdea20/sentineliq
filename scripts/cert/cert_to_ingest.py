"""
cert_to_ingest.py  —  Tier-2 demo: replay a REAL CERT malicious insider through
SentinelIQ's /api/ingest endpoint.

The idea: take one of CMU CERT r4.2's known malicious users (default CAH0936, the
"logs on at 4am, plugs in a USB device, uploads to wikileaks" scenario) and turn
that user's recorded malicious events into /api/ingest payloads. This shows the
live ML pipeline reacting to a documented real-world attack pattern, not just our
own synthetic fraud.

Two modes:
  --dry-run  (DEFAULT) : just print the mapped JSON payloads. Sends NOTHING.
  --send               : actually POST each payload to the backend and print the
                         returned risk_score / risk_level / alert_triggered.

Examples (safe):
    python cert_to_ingest.py            # dry run, prints payloads only
    python cert_to_ingest.py --dry-run  # same as above

To actually send (requires a running backend — not used in this build step):
    python cert_to_ingest.py --send --url http://localhost:8000

This script ONLY reads CSVs. In --dry-run mode it makes no network calls at all.
"""
from __future__ import annotations

# Standard-library only for reading data. The network call (only in --send mode)
# tries "requests" first and falls back to urllib if it is not installed.
import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Where this script lives.
HERE = Path(__file__).resolve().parent

# CERT data location (not in git). Defaults to the project's datasets/cert folder;
# override with the CERT_DATA_DIR environment variable.
DATA_DIR = Path(os.environ.get("CERT_DATA_DIR") or (HERE.parents[2] / "datasets" / "cert"))

# Which malicious user to replay. CAH0936 is the classic off-hours USB+wikileaks case.
TARGET_USER = "CAH0936"

# Default backend URL used only in --send mode.
DEFAULT_URL = "http://localhost:8000"

# If we cannot find the user in any LDAP file, use these safe defaults.
FALLBACK_ROLE = "analyst"
FALLBACK_DEPT = "IT"

# Night hours, matching SentinelIQ's off-hours definition (0-5 and 22-23).
NIGHT_HOURS = [0, 1, 2, 3, 4, 5, 22, 23]


# Find a file or folder by name anywhere under the CERT data folder. First match or None.
def _find(name: str) -> Path | None:
    matches = list(DATA_DIR.rglob(name))
    return matches[0] if matches else None


# Look up a user's role and department from any LDAP monthly file.
# LDAP files are read by HEADER NAME so column order does not matter.
def lookup_role_dept(user_id: str) -> tuple[str, str]:
    # Find the LDAP folder (it sits under the r4.2 extraction).
    ldap_dir = _find("LDAP")
    if ldap_dir is None or not ldap_dir.is_dir():
        # No LDAP folder at all -> use the safe fallbacks.
        return FALLBACK_ROLE, FALLBACK_DEPT

    # Walk each monthly CSV until we find this user.
    for csv_path in sorted(ldap_dir.glob("*.csv")):
        try:
            with open(csv_path, newline="", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                # Map lowercase header -> actual header, for case-insensitive lookup.
                cols = {}
                for header in (reader.fieldnames or []):
                    cols[header.lower()] = header
                id_col = cols.get("user_id")
                role_col = cols.get("role")
                dept_col = cols.get("department")
                if id_col is None:
                    continue  # this file has no user_id column; skip it
                for row in reader:
                    if str(row.get(id_col, "")).strip() == user_id:
                        # Found the user. Read role/dept defensively.
                        role = FALLBACK_ROLE
                        dept = FALLBACK_DEPT
                        if role_col and row.get(role_col):
                            role = str(row[role_col]).strip()
                        if dept_col and row.get(dept_col):
                            dept = str(row[dept_col]).strip()
                        return role, dept
        except Exception:
            # Any problem reading a file -> just try the next one.
            continue

    # User not found anywhere -> safe fallbacks.
    return FALLBACK_ROLE, FALLBACK_DEPT


# Parse a CERT timestamp string (MM/DD/YYYY HH:MM:SS). Returns hour 0..23, or None.
def parse_hour(raw: str):
    try:
        return datetime.strptime(raw.strip(), "%m/%d/%Y %H:%M:%S").hour
    except (ValueError, TypeError):
        return None


# Read the malicious answer file and turn each relevant row into an /api/ingest payload.
# Returns a list of payload dicts (in time order, as they appear in the file).
def build_payloads(user_id: str, role: str, dept: str) -> list[dict]:
    # The answer file name follows the pattern r4.2-1-<USER>.csv
    answer_file = _find("r4.2-1-{}.csv".format(user_id))
    if answer_file is None:
        print("ERROR: answer file r4.2-1-{}.csv not found under".format(user_id), HERE)
        return []

    payloads = []
    # These answer files have NO header — they are raw rows like:
    #   <type>,<id>,<MM/DD/YYYY HH:MM:SS>,<user>,<pc>,<detail...>
    # The http detail itself contains commas, so we read columns by position and
    # do NOT rely on a fixed column count beyond the first five fields.
    with open(answer_file, newline="", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        for row in reader:
            # Need at least: type, id, date, user, pc.
            if len(row) < 5:
                continue
            ev_type = row[0].strip().lower()
            raw_date = row[2].strip()
            pc = row[4].strip()
            # The "detail" is everything from column 6 onward joined back together
            # (the http detail can itself contain commas, so we re-join the tail).
            if len(row) > 5:
                detail = ",".join(row[5:]).strip()
            else:
                detail = ""

            hour = parse_hour(raw_date)
            if hour is None:
                continue  # cannot place this event in time; skip it

            # Decide whether this hour counts as off-hours night activity.
            is_night = hour in NIGHT_HOURS

            # --- Map each CERT event type to a SentinelIQ ingest payload ---------
            payload = None

            if ev_type == "logon":
                # These rows can be a Logon or a Logoff. We only ingest real Logons;
                # skip Logoffs. A night-time logon trips the off-hours signal on its own.
                if "logoff" in detail.lower():
                    continue
                # Build a short note, marking it off-hours if it happened at night.
                note = "CERT logon at {:02d}:00".format(hour)
                if is_night:
                    note += " (off-hours)"
                # Off-hours logons come from an external location; daytime from hq.
                if is_night:
                    location = "external"
                else:
                    location = "hq"
                payload = {
                    "user_id": user_id,
                    "event_type": "login",
                    "department": dept,
                    "location": location,
                    "hour": hour,
                    "device": "workstation_corp",
                    "download_mb": 0.0,
                    "tx_count": 1,
                    "description": note,
                    "system": "CERT-r4.2",
                }

            elif ev_type == "device":
                # Device rows are Connect or Disconnect. Only a Connect (USB plug-in)
                # is interesting — that is the exfiltration step. Skip Disconnect.
                if "connect" in detail.lower() and "disconnect" not in detail.lower():
                    payload = {
                        "user_id": user_id,
                        "event_type": "data_export",
                        "department": dept,
                        "location": "external",
                        "hour": hour,
                        "device": "mobile_vpn",
                        # Realistic bulk USB copy volume.
                        "download_mb": 120.0,
                        "tx_count": 1,
                        "description": "CERT USB device connected on {} — possible exfiltration".format(pc),
                        "system": "CERT-r4.2",
                    }
                else:
                    continue

            elif ev_type == "http":
                # An http row in these files is the wikileaks upload. Treat it as a
                # large data export / report download with elevated volume.
                payload = {
                    "user_id": user_id,
                    "event_type": "data_export",
                    "department": dept,
                    "location": "external",
                    "hour": hour,
                    "device": "mobile_vpn",
                    # Upload to an external site — elevated volume.
                    "download_mb": 90.0,
                    "tx_count": 1,
                    "description": "CERT http upload to external site (wikileaks) — data exfiltration",
                    "system": "CERT-r4.2",
                }

            else:
                # Any other event type we do not map.
                continue

            if payload is not None:
                payloads.append(payload)

    return payloads


# Build a few NORMAL daytime logon payloads for this user from the big logon.csv,
# so the backend can form a baseline before seeing the malicious events.
# Kept simple: we scan logon.csv for up to "want" daytime logons for this user.
# If logon.csv is missing we just return an empty list (and note it).
def build_baseline_payloads(user_id: str, role: str, dept: str, want: int = 4) -> list[dict]:
    logon_csv = _find("logon.csv")
    if logon_csv is None:
        # Not fatal — baseline is just a nicety.
        return []

    baseline = []
    # Cap how many rows we scan so this stays fast even on the 56 MB file.
    max_scan = 500_000
    with open(logon_csv, newline="", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        # Map lowercase header -> actual header, for case-insensitive lookup.
        cols = {}
        for header in (reader.fieldnames or []):
            cols[header.lower()] = header
        date_col = cols.get("date")
        user_col = cols.get("user")
        act_col = cols.get("activity")
        for i, row in enumerate(reader):
            if i >= max_scan or len(baseline) >= want:
                break
            if user_col is None or str(row.get(user_col, "")).strip() != user_id:
                continue
            if act_col and "logon" not in str(row.get(act_col, "")).lower():
                continue  # only Logon rows, not Logoff
            hour = parse_hour(str(row.get(date_col, "")))
            if hour is None or hour in NIGHT_HOURS:
                continue  # we want NORMAL daytime logons for the baseline
            baseline.append({
                "user_id": user_id,
                "event_type": "login",
                "department": dept,
                "location": "hq",
                "hour": hour,
                "device": "workstation_corp",
                "download_mb": 0.0,
                "tx_count": 1,
                "description": "CERT baseline daytime logon at {:02d}:00".format(hour),
                "system": "CERT-r4.2",
            })
    return baseline


# Send one payload to the backend's /api/ingest and return the parsed response dict.
# Tries "requests"; falls back to urllib if requests is not installed.
def post_payload(url: str, payload: dict) -> dict:
    endpoint = url.rstrip("/") + "/api/ingest"
    body = json.dumps(payload).encode("utf-8")

    # First choice: the "requests" library if it is available.
    try:
        import requests
        resp = requests.post(endpoint, json=payload, timeout=15)
        return resp.json()
    except ImportError:
        # Fallback: plain urllib from the standard library.
        import urllib.request
        req = urllib.request.Request(
            endpoint,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode("utf-8"))


# Pretty-print a single payload as indented JSON with a small header line.
def print_payload(index: int, payload: dict) -> None:
    print("--- event #{} : {} (hour {:02d}) ---".format(index, payload["event_type"], payload["hour"]))
    print(json.dumps(payload, indent=2))
    print("")


# Main: parse simple argv flags, build payloads, then either print or send them.
def main() -> None:
    args = sys.argv[1:]

    # Default mode is dry-run (safe). --send turns on real POSTing.
    send = "--send" in args
    # --dry-run is accepted explicitly too, but it is already the default.

    # Allow overriding the backend URL with: --url http://host:port
    url = DEFAULT_URL
    if "--url" in args:
        pos = args.index("--url")
        if pos + 1 < len(args):
            url = args[pos + 1]

    # Allow overriding the target user with: --user XYZ0000
    user_id = TARGET_USER
    if "--user" in args:
        pos = args.index("--user")
        if pos + 1 < len(args):
            user_id = args[pos + 1].strip()

    # Step 1: find the user's role + department from LDAP.
    role, dept = lookup_role_dept(user_id)
    print("Target user :", user_id)
    print("Role / Dept :", role, "/", dept)
    print("Mode        :", "SEND -> " + url if send else "DRY-RUN (no network calls)")
    print("")

    # Step 2: build the malicious-event payloads.
    payloads = build_payloads(user_id, role, dept)
    if not payloads:
        print("No payloads built — nothing to do.")
        return

    # Step 3 (nicety): build a few baseline daytime logons first.
    baseline = build_baseline_payloads(user_id, role, dept, want=4)
    if baseline:
        print("Baseline daytime logons to send first:", len(baseline))
    else:
        print("Baseline daytime logons: none found (skipped — baseline is optional).")
    print("Malicious events mapped:", len(payloads))
    print("")

    # Step 4: act on the payloads. Baseline first, then the malicious sequence.
    full_sequence = baseline + payloads

    if not send:
        # DRY-RUN: just print everything. No network at all.
        for i, payload in enumerate(full_sequence, start=1):
            print_payload(i, payload)
        print("Dry-run complete. Re-run with --send to POST these to the backend.")
        return

    # SEND mode: POST each payload and show the backend's verdict.
    for i, payload in enumerate(full_sequence, start=1):
        try:
            result = post_payload(url, payload)
            print("event #{} {:>12}  ->  risk_score={}  risk_level={}  alert_triggered={}".format(
                i,
                payload["event_type"],
                result.get("risk_score"),
                result.get("risk_level"),
                result.get("alert_triggered"),
            ))
        except Exception as exc:
            print("event #{} {:>12}  ->  ERROR: {}".format(i, payload["event_type"], exc))


if __name__ == "__main__":
    main()
