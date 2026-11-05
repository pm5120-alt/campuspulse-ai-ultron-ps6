"""PS6 occupancy intelligence and approval workflow backed by local SQLite.

All telemetry in this module is explicitly simulated. Execution changes only the
simulation state and never controls building equipment.
"""
from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path


class ScheduleValidationError(ValueError):
    """Raised when a timetable entry is malformed. Maps to HTTP 422."""


def _parse_dt(value, field: str) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ScheduleValidationError(f"{field} must be an ISO-8601 datetime string")
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise ScheduleValidationError(f"{field} is not a valid ISO-8601 datetime") from exc


def _require_actor(actor) -> str:
    if not isinstance(actor, str) or not actor.strip():
        raise ValueError("A named actor is required for approval, rejection and execution")
    return actor.strip()


class PS6Service:
    def __init__(self, db_path: str | Path):
        self.db_path = str(db_path)
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(self.db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def _init_db(self):
        with self._connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS schedules (
                  id TEXT PRIMARY KEY, building_id TEXT NOT NULL, room_id TEXT NOT NULL,
                  starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, expected_occupancy INTEGER NOT NULL,
                  title TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS recommendations (
                  id TEXT PRIMARY KEY, building_id TEXT NOT NULL, room_id TEXT NOT NULL,
                  baseline_kwh REAL NOT NULL, proposed_kwh REAL NOT NULL, savings_kwh REAL NOT NULL,
                  savings_inr REAL NOT NULL, assumptions TEXT NOT NULL, affected_equipment TEXT NOT NULL,
                  safety_validation TEXT NOT NULL, status TEXT NOT NULL, actor TEXT, created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL, simulated_after_kwh REAL
                );
                CREATE TABLE IF NOT EXISTS audit (
                  id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
                  action TEXT NOT NULL, actor TEXT NOT NULL, previous_state TEXT, new_state TEXT NOT NULL,
                  timestamp TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS operating_settings (
                  id INTEGER PRIMARY KEY CHECK(id=1), idle_load_kwh REAL NOT NULL,
                  saving_fraction REAL NOT NULL, tariff_inr REAL NOT NULL,
                  comfort_min_c REAL NOT NULL, updated_at TEXT NOT NULL, actor TEXT NOT NULL
                );
            """)
            db.execute("INSERT OR IGNORE INTO operating_settings VALUES(1,4.0,0.25,7.5,22.0,?,?)",
                       (self._now(), "system"))

    @staticmethod
    def _now():
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _row(row):
        return dict(row) if row else None

    def rooms(self, facility_type: str, buildings: list[dict]):
        now = datetime.now(timezone.utc)
        rooms = []
        for b_index, b in enumerate(buildings):
            floors = max(1, min(int(b.get("floors", 1)), 5))
            for floor in range(1, floors + 1):
                for num in range(1, 4):
                    room_id = f"{b['id']}-F{floor}-R{num:02d}"
                    cap = 30 if num != 3 else 20
                    occupied = (b_index * 7 + floor * 3 + num * 5) % (cap + 1)
                    # Reproducible demo case for the energy-waste scenario.
                    if b_index == 0 and floor == 1 and num == 1:
                        occupied = 0
                    base = round(1.4 + (b_index % 4) * .3 + floor * .12 + num * .08, 2)
                    power = round(base * (3.6 if occupied == 0 and b_index == 0 and floor == 1 and num == 1 else 1 + occupied / cap), 2)
                    equipment = [
                        {"id": f"{room_id}-lighting", "name": "LED lighting", "class": "standard", "protected": False},
                        {"id": f"{room_id}-hvac", "name": "HVAC", "class": "standard", "protected": False},
                        {"id": f"{room_id}-fire", "name": "Fire alarm panel", "class": "safety_critical", "protected": True},
                    ]
                    # Essential infrastructure stays visible and ineligible for control.
                    if num == 3:
                        equipment.append({"id": f"{room_id}-server", "name": "Network/server rack", "class": "essential", "protected": True})
                    rooms.append({"facility_type": facility_type, "building_id": b["id"], "building_name": b["name"],
                                  "floor": floor, "room_id": room_id, "capacity": cap,
                                  "occupancy_count": occupied, "occupancy_pct": round(100 * occupied / cap, 1),
                                  "power_kwh": power, "temperature_c": round(22 + (floor + num) % 5 * .7, 1),
                                  "equipment": equipment, "data_mode": "SIMULATED", "updated_at": now.isoformat()})
        return rooms

    def schedules(self):
        with self._connect() as db:
            return [self._row(r) for r in db.execute("SELECT * FROM schedules ORDER BY starts_at")]

    def operating_settings(self):
        with self._connect() as db:
            return self._row(db.execute("SELECT * FROM operating_settings WHERE id=1").fetchone())

    def update_operating_settings(self, item: dict):
        actor = _require_actor(item.get("actor"))
        values = (item.get("idle_load_kwh"), item.get("saving_fraction"),
                  item.get("tariff_inr"), item.get("comfort_min_c"))
        if any(isinstance(v, bool) or not isinstance(v, (int, float)) for v in values):
            raise ScheduleValidationError("All operating settings must be finite numbers")
        idle, fraction, tariff, comfort = map(float, values)
        if not all(map(__import__("math").isfinite, (idle, fraction, tariff, comfort))):
            raise ScheduleValidationError("All operating settings must be finite numbers")
        if not 0.5 <= idle <= 20 or not 0.05 <= fraction <= 0.4 or not 0.1 <= tariff <= 100 or not 18 <= comfort <= 26:
            raise ScheduleValidationError("Bounds: idle load 0.5–20 kWh/h, savings 5–40%, tariff ₹0.1–100/kWh, comfort floor 18–26°C")
        now = self._now()
        with self._connect() as db:
            old = db.execute("SELECT * FROM operating_settings WHERE id=1").fetchone()
            db.execute("UPDATE operating_settings SET idle_load_kwh=?,saving_fraction=?,tariff_inr=?,comfort_min_c=?,updated_at=?,actor=? WHERE id=1",
                       (idle, fraction, tariff, comfort, now, actor))
            new = db.execute("SELECT * FROM operating_settings WHERE id=1").fetchone()
            self._audit(db, "operating_settings", "ps6", "updated", actor, old, new)
        return dict(new)

    @staticmethod
    def intelligence(rooms: list[dict], schedules: list[dict], settings: dict):
        by_id = {r["room_id"]: r for r in rooms}
        loads = [r["power_kwh"] for r in rooms]
        avg = sum(loads) / len(loads) if loads else 0
        anomalies = []
        for room in rooms:
            if room["occupancy_count"] == 0 and room["power_kwh"] >= settings["idle_load_kwh"]:
                anomalies.append({"room_id": room["room_id"], "building_name": room["building_name"],
                                  "kind": "idle_high_load", "load_kwh_per_hour": room["power_kwh"],
                                  "message": "No occupants are expected in the simulated reading, but load exceeds the configured idle threshold. Review standard HVAC/lighting; protected equipment is excluded.",
                                  "data_mode": "SIMULATED"})
            elif room["power_kwh"] > max(settings["idle_load_kwh"], avg * 1.8):
                anomalies.append({"room_id": room["room_id"], "building_name": room["building_name"],
                                  "kind": "unusual_load", "load_kwh_per_hour": room["power_kwh"],
                                  "message": "Simulated room load is unusually high relative to this campus demo snapshot; inspect standard equipment.",
                                  "data_mode": "SIMULATED"})
        projected = []
        for event in schedules:
            room = by_id.get(event["room_id"])
            if not room:
                continue
            base = room["power_kwh"] / max(1 + room["occupancy_count"] / room["capacity"], 1)
            estimate = round(base * (1 + event["expected_occupancy"] / room["capacity"]), 2)
            projected.append({"event": event["title"], "room_id": event["room_id"],
                              "starts_at": event["starts_at"], "ends_at": event["ends_at"],
                              "expected_occupancy": event["expected_occupancy"],
                              "estimated_load_kwh_per_hour": estimate, "data_mode": "SIMULATED"})
        return {"data_mode": "SIMULATED", "method": "rule-based schedule-scaled estimate; not a trained forecast",
                "anomalies": anomalies, "scheduled_load_estimates": projected,
                "estimated_peak_kwh_per_hour": max((x["estimated_load_kwh_per_hour"] for x in projected), default=None)}

    def save_schedule(self, item: dict, known_room_ids=None):
        item = dict(item)
        for key in ("building_id", "room_id", "title"):
            if not isinstance(item.get(key), str) or not item[key].strip():
                raise ScheduleValidationError(f"{key} is required")
        occ = item.get("expected_occupancy")
        if isinstance(occ, bool) or not isinstance(occ, int) or occ < 0:
            raise ScheduleValidationError("expected_occupancy must be a non-negative integer")
        start, end = _parse_dt(item.get("starts_at"), "starts_at"), _parse_dt(item.get("ends_at"), "ends_at")
        if (start.tzinfo is None) != (end.tzinfo is None):
            raise ScheduleValidationError("starts_at and ends_at must both include a timezone offset or both omit it")
        if end <= start:
            raise ScheduleValidationError("ends_at must be later than starts_at")
        if known_room_ids is not None and item["room_id"] not in known_room_ids:
            raise ScheduleValidationError("room_id is not part of the configured demonstration campus")
        if not item.get("id"):
            item["id"] = str(uuid.uuid4())
        item["updated_at"] = self._now()
        with self._connect() as db:
            old = db.execute("SELECT * FROM schedules WHERE id=?", (item["id"],)).fetchone()
            for existing in db.execute("SELECT id,starts_at,ends_at FROM schedules WHERE room_id=? AND id<>?",
                                       (item["room_id"], item["id"])):
                other_start = _parse_dt(existing["starts_at"], "starts_at")
                other_end = _parse_dt(existing["ends_at"], "ends_at")
                candidate_start, candidate_end = start, end
                if candidate_start.tzinfo is None and other_start.tzinfo is not None:
                    candidate_start = candidate_start.replace(tzinfo=timezone.utc)
                    candidate_end = candidate_end.replace(tzinfo=timezone.utc)
                elif candidate_start.tzinfo is not None and other_start.tzinfo is None:
                    other_start = other_start.replace(tzinfo=timezone.utc)
                    other_end = other_end.replace(tzinfo=timezone.utc)
                if candidate_start < other_end and other_start < candidate_end:
                    raise ScheduleValidationError(f"Schedule overlaps existing calendar event {existing['id']} for this room")
            db.execute("""INSERT INTO schedules VALUES(?,?,?,?,?,?,?,?)
                ON CONFLICT(id) DO UPDATE SET building_id=excluded.building_id, room_id=excluded.room_id,
                starts_at=excluded.starts_at, ends_at=excluded.ends_at,
                expected_occupancy=excluded.expected_occupancy, title=excluded.title, updated_at=excluded.updated_at""",
                (item["id"], item["building_id"], item["room_id"], item["starts_at"], item["ends_at"],
                 item["expected_occupancy"], item["title"], item["updated_at"]))
            self._audit(db, "schedule", item["id"], "created" if not old else "updated", item.get("actor", "administrator"), old, item)
        return item

    def delete_schedule(self, schedule_id: str, actor: str):
        with self._connect() as db:
            old = db.execute("SELECT * FROM schedules WHERE id=?", (schedule_id,)).fetchone()
            if not old:
                return False
            db.execute("DELETE FROM schedules WHERE id=?", (schedule_id,))
            self._audit(db, "schedule", schedule_id, "deleted", actor, old, {"deleted": True})
        return True

    def recommendations(self, rooms: list[dict]):
        with self._connect() as db:
            settings = dict(db.execute("SELECT * FROM operating_settings WHERE id=1").fetchone())
            for room in rooms:
                if room["occupancy_count"] != 0 or room["power_kwh"] < settings["idle_load_kwh"]:
                    continue
                if db.execute("SELECT 1 FROM recommendations WHERE room_id=? AND status IN ('PENDING','APPROVED','REJECTED','EXECUTED IN SIMULATION')", (room["room_id"],)).fetchone():
                    continue
                protected = [e["name"] for e in room["equipment"] if e["protected"]]
                baseline = room["power_kwh"]
                saved = round(baseline * settings["saving_fraction"], 2)
                rec_id, now = str(uuid.uuid4()), self._now()
                safe = {"valid": True, "action": "Schedule HVAC setback and switch off standard lighting only",
                        "excluded_protected_equipment": protected, "comfort_min_c": settings["comfort_min_c"], "requires_manual_approval": True,
                        "execution_mode": "simulation_only"}
                db.execute("INSERT INTO recommendations VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                           (rec_id, room["building_id"], room["room_id"], baseline, round(baseline-saved, 2), saved,
                            round(saved*settings["tariff_inr"], 2), json.dumps({"basis": f"{settings['saving_fraction']:.0%} of current simulated room load per hour", "tariff_inr_per_kwh": settings["tariff_inr"],
                                                            "occupancy": 0, "measurement": "simulated"}),
                            json.dumps([e["name"] for e in room["equipment"] if not e["protected"]]),
                            json.dumps(safe), "PENDING", None, now, now, None))
                self._audit(db, "recommendation", rec_id, "created", "system", None,
                            {"status": "PENDING", "room_id": room["room_id"], "safety_validation": safe})
            rows = {r["id"]: r for r in db.execute("SELECT * FROM recommendations ORDER BY created_at DESC")}
        return [self._decode_recommendation(r) for r in rows.values()]

    @staticmethod
    def _decode_recommendation(row):
        r = dict(row)
        for k in ("assumptions", "affected_equipment", "safety_validation"):
            r[k] = json.loads(r[k])
        return r

    def decide(self, rec_id: str, decision: str, actor: str):
        if decision not in ("APPROVED", "REJECTED"):
            raise ValueError("Decision must be APPROVED or REJECTED")
        actor = _require_actor(actor)
        with self._connect() as db:
            old = db.execute("SELECT * FROM recommendations WHERE id=?", (rec_id,)).fetchone()
            if not old:
                return None
            if old["status"] != "PENDING":
                raise ValueError("Only pending recommendations can be approved or rejected")
            db.execute("UPDATE recommendations SET status=?,actor=?,updated_at=? WHERE id=?", (decision, actor, self._now(), rec_id))
            new = db.execute("SELECT * FROM recommendations WHERE id=?", (rec_id,)).fetchone()
            self._audit(db, "recommendation", rec_id, decision.lower(), actor, old, new)
        return self._decode_recommendation(new)

    def execute_simulation(self, rec_id: str, actor: str):
        actor = _require_actor(actor)
        with self._connect() as db:
            old = db.execute("SELECT * FROM recommendations WHERE id=?", (rec_id,)).fetchone()
            if not old:
                return None
            if old["status"] != "APPROVED":
                raise ValueError("Only approved recommendations can be executed in simulation")
            after = round(old["proposed_kwh"], 2)
            db.execute("UPDATE recommendations SET status='EXECUTED IN SIMULATION', simulated_after_kwh=?,actor=?,updated_at=? WHERE id=?",
                       (after, actor, self._now(), rec_id))
            new = db.execute("SELECT * FROM recommendations WHERE id=?", (rec_id,)).fetchone()
            self._audit(db, "recommendation", rec_id, "executed_in_simulation", actor, old, new)
        return self._decode_recommendation(new)

    def audit_history(self, limit: int = 200):
        with self._connect() as db:
            rows = db.execute("SELECT * FROM audit ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        result = []
        for row in rows:
            r = dict(row)
            r["previous_state"] = json.loads(r["previous_state"]) if r["previous_state"] else None
            r["new_state"] = json.loads(r["new_state"])
            result.append(r)
        return result

    @staticmethod
    def _audit(db, kind, entity, action, actor, previous, new):
        db.execute("INSERT INTO audit(entity_type,entity_id,action,actor,previous_state,new_state,timestamp) VALUES(?,?,?,?,?,?,?)",
                   (kind, entity, action, actor or "administrator",
                    json.dumps(dict(previous), default=str) if previous else None,
                    json.dumps(dict(new), default=str), PS6Service._now()))
