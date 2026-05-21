from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta

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

# (id, name, role, dept, login_start, login_end, avg_tx, typical_depts, normal_locs)
_EMPLOYEE_SPECS = [
    ("usr_001","James Sterling","teller","retail_banking",8,17,50,["retail_banking","branch_ops"],["branch_01","branch_02"]),
    ("usr_002","Maria Lopez","teller","retail_banking",8,17,45,["retail_banking","branch_ops"],["branch_02","branch_03"]),
    ("usr_003","Robert Chen","teller","branch_ops",9,18,55,["retail_banking","branch_ops"],["branch_01","branch_03"]),
    ("usr_004","Sarah Williams","teller","retail_banking",8,16,40,["retail_banking"],["branch_02"]),
    ("usr_005","David Patel","teller","branch_ops",7,16,60,["retail_banking","branch_ops"],["branch_01"]),
    ("usr_006","Emily Johnson","teller","retail_banking",9,18,48,["retail_banking","branch_ops"],["branch_03"]),
    ("usr_007","Michael Torres","teller","branch_ops",8,17,52,["retail_banking"],["branch_01","branch_02"]),
    ("usr_008","Priya Sharma","teller","retail_banking",8,17,44,["retail_banking","branch_ops"],["branch_02"]),
    ("usr_009","Kevin Murphy","teller","branch_ops",9,18,58,["retail_banking","branch_ops"],["branch_03"]),
    ("usr_010","Aisha Rahman","teller","retail_banking",8,17,46,["retail_banking"],["branch_01","branch_03"]),
    ("usr_011","Thomas Wright","analyst","risk_analytics",9,18,20,["risk_analytics","compliance"],["hq","remote"]),
    ("usr_012","Jennifer Kim","analyst","risk_analytics",9,19,18,["risk_analytics","data_science"],["hq"]),
    ("usr_013","Carlos Mendoza","analyst","data_science",10,19,22,["data_science","risk_analytics"],["hq","remote"]),
    ("usr_014","Natasha Volkov","analyst","compliance",9,18,16,["compliance","risk_analytics"],["hq"]),
    ("usr_015","Rahul Gupta","analyst","data_science",9,18,24,["data_science","risk_analytics"],["hq","remote"]),
    ("usr_016","Sophie Martin","analyst","risk_analytics",9,18,19,["risk_analytics"],["hq"]),
    ("usr_017","Alex Kowalski","analyst","compliance",9,18,17,["compliance","risk_analytics"],["hq","remote"]),
    ("usr_018","Yuki Tanaka","analyst","data_science",10,19,21,["data_science"],["hq"]),
    ("usr_019","Omar Hassan","analyst","risk_analytics",9,18,23,["risk_analytics","compliance"],["hq"]),
    ("usr_020","Fatima Al-Rashid","analyst","compliance",9,18,15,["compliance"],["hq"]),
    ("usr_021","William Anderson","manager","retail_banking",8,19,10,["retail_banking","branch_ops","management"],["hq","branch_01"]),
    ("usr_022","Linda Thompson","manager","risk_analytics",8,19,8,["risk_analytics","compliance","management"],["hq"]),
    ("usr_023","Richard Scott","manager","operations",8,20,12,["operations","retail_banking","management"],["hq","branch_02"]),
    ("usr_024","Patricia Davis","manager","compliance",9,19,9,["compliance","management"],["hq"]),
    ("usr_025","Christopher Lee","manager","IT",8,19,11,["IT","operations","management"],["hq","datacenter"]),
    ("usr_026","Barbara Miller","manager","treasury",9,18,7,["treasury","compliance","management"],["hq"]),
    ("usr_027","Daniel Wilson","manager","retail_banking",8,19,10,["retail_banking","management"],["hq","branch_03"]),
    ("usr_028","Susan Moore","manager","operations",9,19,9,["operations","management"],["hq"]),
    ("usr_029","Matthew Taylor","manager","IT",8,20,11,["IT","management"],["hq","datacenter"]),
    ("usr_030","Elizabeth Jackson","manager","risk_analytics",9,19,8,["risk_analytics","management"],["hq"]),
    ("usr_031","Joshua White","admin","IT",8,20,30,["IT","admin","security","operations"],["hq","datacenter"]),
    ("usr_032","Amanda Harris","admin","IT",8,20,28,["IT","admin","security"],["hq","datacenter"]),
    ("usr_033","Ryan Martinez","admin","security",8,20,32,["security","IT","admin"],["hq","datacenter"]),
    ("usr_034","Michelle Robinson","admin","IT",9,21,25,["IT","admin"],["hq","datacenter"]),
    ("usr_035","Kevin Clark","admin","security",8,20,29,["security","IT","admin"],["hq","datacenter"]),
    ("usr_036","Lisa Rodriguez","admin","IT",8,20,27,["IT","admin"],["hq"]),
    ("usr_037","Brian Lewis","admin","security",9,21,31,["security","admin","IT"],["hq","datacenter"]),
    ("usr_038","Nicole Walker","admin","IT",8,20,26,["IT","admin","security"],["hq"]),
    ("usr_039","Mark Hall","admin","security",8,20,33,["security","IT"],["hq","datacenter"]),
    ("usr_040","Diana Young","admin","IT",9,21,24,["IT","admin"],["hq"]),
    ("usr_041","Arun Kapoor","treasury_officer","treasury",9,17,15,["treasury","compliance"],["hq"]),
    ("usr_042","Catherine Brown","treasury_officer","treasury",9,17,12,["treasury"],["hq"]),
    ("usr_043","Samuel Okafor","treasury_officer","treasury",9,18,14,["treasury","compliance"],["hq"]),
    ("usr_044","Victoria Chen","treasury_officer","treasury",9,17,13,["treasury"],["hq"]),
    ("usr_045","Emmanuel Diallo","treasury_officer","treasury",9,17,16,["treasury","compliance"],["hq"]),
    ("usr_046","Hannah Schmidt","treasury_officer","compliance",9,17,11,["compliance","treasury"],["hq"]),
    ("usr_047","Isaac Nwankwo","treasury_officer","treasury",9,18,15,["treasury"],["hq"]),
    ("usr_048","Grace Kimura","treasury_officer","treasury",9,17,13,["treasury","compliance"],["hq"]),
    ("usr_049","Felix Dube","treasury_officer","treasury",9,17,14,["treasury"],["hq"]),
    ("usr_050","Mei Lin Zhang","treasury_officer","compliance",9,17,12,["compliance","treasury"],["hq"]),
]

ALL_DEPARTMENTS = [
    "retail_banking","branch_ops","risk_analytics","data_science",
    "compliance","management","IT","security","operations","treasury","admin",
]
EVENT_TYPES = [
    "login","transaction","file_access","report_download",
    "system_query","data_export","privilege_use","department_access",
]
DEVICES = ["workstation_corp","laptop_01","laptop_02","terminal_branch","mobile_vpn","tablet_remote"]


class SyntheticGenerator:
    def __init__(self):
        self._specs = {s[0]: s for s in _EMPLOYEE_SPECS}
        self._event_counter = 0
        self._user_ids = [s[0] for s in _EMPLOYEE_SPECS]

        self.users = [
            {
                "id": s[0],
                "name": s[1],
                "role": s[2],
                "department": s[3],
                "risk_score": 0.0,
                "last_seen": datetime.utcnow(),
                "location": s[8][0],
            }
            for s in _EMPLOYEE_SPECS
        ]

    def _normal_event(self, spec, ts: datetime) -> dict:
        uid, name, role, dept, ls, le, avg_tx, typ_depts, norm_locs = spec
        hour = random.randint(ls, le - 1)
        event_ts = ts.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
        department = random.choice(typ_depts)
        location = random.choice(norm_locs)
        event_type = random.choice(EVENT_TYPES)
        device = random.choice(DEVICES[:3])
        download_mb = random.gauss(3, 1) if event_type == "report_download" else random.gauss(0.5, 0.2)
        return {
            "id": str(uuid.uuid4()),
            "user_id": uid,
            "user_name": name,
            "timestamp": event_ts,
            "event_type": event_type,
            "department": department,
            "location": location,
            "hour": hour,
            "device": device,
            "download_mb": max(0.0, download_mb),
            "tx_count": max(1, int(random.gauss(avg_tx / 8, avg_tx / 20))),
            "fraud_type": "",
            "is_fraud": 0,
            "description": f"{name} performed {event_type.replace('_', ' ')} in {department}",
            "risk_score": 0.0,
            "features_json": "{}",
            # Baseline metadata for FeatureEngineer._get_history — not stored to DB
            "login_start": ls,
            "login_end": le,
            "avg_daily_tx": avg_tx,
            "normal_locations": norm_locs,
        }

    def _fraud_event(self, spec, ts: datetime, pattern: str) -> dict:
        ev = self._normal_event(spec, ts)
        uid, name, role, dept, ls, le, avg_tx, typ_depts, norm_locs = spec

        baseline_tx = max(1, int(random.gauss(avg_tx / 8, max(1, avg_tx / 20))))
        baseline_dl = max(0.0, random.gauss(0.5, 0.2))

        if pattern == "off_hours_login":
            hour = random.choice([0, 1, 2, 3, 4, 5, 22, 23])
            ev["hour"] = hour
            ev["timestamp"] = ev["timestamp"].replace(hour=hour)
            ev["event_type"] = "login"
            ev["tx_count"] = baseline_tx
            ev["download_mb"] = baseline_dl
            ev["description"] = f"{name} logged in at {hour:02d}:00 — outside normal hours"

        elif pattern == "bulk_download":
            ev["event_type"] = "data_export"
            ev["download_mb"] = random.uniform(50, 200)
            ev["tx_count"] = baseline_tx
            ev["description"] = f"{name} exported {ev['download_mb']:.0f} MB — anomalous volume"

        elif pattern == "cross_department_access":
            foreign_depts = [d for d in ALL_DEPARTMENTS if d not in typ_depts]
            foreign = random.choice(foreign_depts)
            ev["department"] = foreign
            ev["event_type"] = "department_access"
            ev["tx_count"] = baseline_tx
            ev["download_mb"] = baseline_dl
            ev["description"] = f"{name} accessed {foreign} — outside normal scope"

        elif pattern == "privilege_escalation":
            ev["event_type"] = "privilege_use"
            ev["tx_count"] = baseline_tx
            ev["download_mb"] = baseline_dl
            ev["description"] = f"{name} invoked elevated privileges — not typical for {role}"

        elif pattern == "velocity_spike":
            ev["tx_count"] = int(avg_tx * random.uniform(8, 15))
            ev["event_type"] = "transaction"
            ev["department"] = random.choice(typ_depts)
            ev["download_mb"] = baseline_dl
            ev["description"] = f"{name} processed {ev['tx_count']} transactions — {ev['tx_count'] // max(1, avg_tx)}x normal rate"

        ev["fraud_type"] = pattern
        ev["is_fraud"] = 1
        return ev

    def generate_batch(self, n: int, base_ts: datetime | None = None) -> list[dict]:
        if base_ts is None:
            base_ts = datetime.utcnow() - timedelta(hours=random.randint(0, 2))

        events = []
        fraud_patterns = ["off_hours_login","bulk_download","cross_department_access","privilege_escalation","velocity_spike"]

        for i in range(n):
            self._event_counter += 1
            uid = random.choice(self._user_ids)
            spec = self._specs[uid]
            ts = base_ts + timedelta(seconds=i * random.randint(10, 60))

            if self._event_counter % 30 == 0:
                pattern = random.choice(fraud_patterns)
                ev = self._fraud_event(spec, ts, pattern)
            else:
                ev = self._normal_event(spec, ts)

            events.append(ev)

        return events

    def generate_one(self) -> dict:
        return self.generate_batch(1)[0]

    def generate_forced_fraud(self, pattern: str) -> dict:
        spec = random.choice(list(self._specs.values()))
        ts = datetime.utcnow()
        ev = self._fraud_event(spec, ts, pattern)
        return ev
