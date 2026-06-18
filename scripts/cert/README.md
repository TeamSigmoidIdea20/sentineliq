# CERT Benchmark Tooling

Scripts that validate SentinelIQ's synthetic behaviour against the **CMU CERT r4.2**
insider-threat dataset (the standard academic benchmark) and demo the pipeline on a
real documented insider.

> **The CERT data itself is NOT in this repo** (it is multi-GB). Download r4.2 from
> CMU KiltHub, extract it, and place the files so that `logon.csv`, `device.csv`,
> `LDAP/`, and `answers/` sit under a folder the scripts can find.
>
> By default the scripts look in `../../../datasets/cert` (i.e. `<project>/datasets/cert`,
> a sibling of `sentineliq/`). To use a different location, set the environment
> variable `CERT_DATA_DIR` to the folder that contains the extracted `r4.2/` and
> `answers/` folders.

## Scripts

| Script | What it does | Safe to run? |
|---|---|---|
| `build_cert_profile.py` | Reads CERT `logon.csv`, measures the real login-hour distribution + night rate, writes `backend/data/cert_profile.json`. | Yes — reads CSV, writes one small JSON. |
| `validate_against_cert.py` | Compares SentinelIQ's synthetic login-hour / off-hours distributions against CERT and writes comparison charts to `out/`. | Yes — read-only + writes PNGs. |
| `cert_to_ingest.py` | Replays a real CERT malicious insider (default `CAH0936`) through `POST /api/ingest`. `--dry-run` (default) only prints payloads; `--send` posts to a backend. | Yes in dry-run (no network). `--send` needs a running backend. |

## Quick use

```bash
# 1. (optional) rebuild the calibration profile from CERT
python build_cert_profile.py

# 2. validate synthetic vs CERT (writes out/*.png)
python validate_against_cert.py

# 3. preview the malicious-insider replay (no network)
python cert_to_ingest.py --dry-run

# 4. actually replay against a running backend
python cert_to_ingest.py --send --url http://localhost:8000
```

## Findings (see `out/validation_summary.txt`)

1. Both CERT and SentinelIQ are strongly business-hours-dominant with rare night
   activity — validating the off-hours behavioural signal.
2. CERT keeps a small ~4.5% benign night-activity background; SentinelIQ's baseline
   is ~0% (idealised). The optional **CERT calibration** (Tier 1.5) closes this gap.

## Optional CERT calibration (Tier 1.5)

`backend/data/synthetic_generator.py` can sample login hours from the real CERT
distribution instead of a flat business-hours window. It is **OFF by default** and
only activates when the environment variable `SENTINELIQ_CERT_PROFILE` points to a
profile JSON (e.g. the bundled `backend/data/cert_profile.json`). With the variable
unset, the generator behaves exactly as before.
