"""Standard-library tests for the PS6 persistence, validation and safety workflow.

Run from the repository root with: python -m unittest ML.test_ps6_service -v
Every test uses a temporary SQLite database; the persistent demo database is never touched.
"""
import json
import sqlite3
from contextlib import closing
import tempfile
import unittest
from pathlib import Path

from ML.api.ps6_service import PS6Service, ScheduleValidationError

BUILDINGS = [{"id": "academic_block", "name": "Academic Block", "floors": 2},
             {"id": "library", "name": "Library", "floors": 1}]


def schedule(**over):
    base = {"id": None, "building_id": "academic_block", "room_id": "academic_block-F1-R01",
            "starts_at": "2026-11-06T09:00:00+05:30", "ends_at": "2026-11-06T10:00:00+05:30",
            "expected_occupancy": 0, "title": "Test schedule", "actor": "tester"}
    base.update(over)
    return base


class Base(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test.sqlite3"
        self.service = PS6Service(self.db_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def rooms(self):
        return self.service.rooms("engineering_college", BUILDINGS)

    def recommendation(self):
        recs = self.service.recommendations(self.rooms())
        self.assertTrue(recs)
        return recs[0]


class RoomTests(Base):
    def test_room_schema_and_simulated_labels(self):
        rooms = self.rooms()
        self.assertEqual(len(rooms), 9)  # 2 floors x 3 + 1 floor x 3
        required = {"facility_type", "building_id", "building_name", "floor", "room_id", "capacity",
                    "occupancy_count", "occupancy_pct", "power_kwh", "temperature_c", "equipment",
                    "data_mode", "updated_at"}
        for room in rooms:
            self.assertTrue(required <= room.keys())
            self.assertEqual(room["data_mode"], "SIMULATED")
            self.assertLessEqual(room["occupancy_count"], room["capacity"])
        self.assertEqual(len({r["room_id"] for r in rooms}), len(rooms))

    def test_fire_panel_always_protected_and_server_rack_protected(self):
        for room in self.rooms():
            fire = [e for e in room["equipment"] if "Fire" in e["name"]]
            self.assertTrue(fire and all(e["protected"] for e in fire))
            for e in room["equipment"]:
                if e["class"] in ("safety_critical", "essential"):
                    self.assertTrue(e["protected"])

    def test_empty_building_list_returns_no_rooms_and_no_recommendations(self):
        self.assertEqual(self.service.rooms("engineering_college", []), [])
        self.assertEqual(self.service.recommendations([]), [])

    def test_floor_count_is_clamped(self):
        rooms = self.service.rooms("x", [{"id": "tall", "name": "Tall", "floors": 99}])
        self.assertEqual(max(r["floor"] for r in rooms), 5)
        rooms = self.service.rooms("x", [{"id": "flat", "name": "Flat", "floors": 0}])
        self.assertEqual({r["floor"] for r in rooms}, {1})


class TimetableTests(Base):
    def test_create_list_update_delete(self):
        created = self.service.save_schedule(schedule())
        self.assertTrue(created["id"])
        self.assertEqual([s["id"] for s in self.service.schedules()], [created["id"]])

        updated = self.service.save_schedule(schedule(id=created["id"], title="Renamed", expected_occupancy=12))
        self.assertEqual(updated["id"], created["id"])
        stored = self.service.schedules()
        self.assertEqual(len(stored), 1)
        self.assertEqual((stored[0]["title"], stored[0]["expected_occupancy"]), ("Renamed", 12))

        self.assertTrue(self.service.delete_schedule(created["id"], "tester"))
        self.assertEqual(self.service.schedules(), [])
        self.assertFalse(self.service.delete_schedule(created["id"], "tester"))

    def test_audit_records_create_update_delete_with_old_and_new_state(self):
        s = self.service.save_schedule(schedule())
        self.service.save_schedule(schedule(id=s["id"], title="v2"))
        self.service.delete_schedule(s["id"], "deleter")
        audit = [a for a in self.service.audit_history() if a["entity_id"] == s["id"]]
        self.assertEqual([a["action"] for a in reversed(audit)], ["created", "updated", "deleted"])
        created, updated, deleted = reversed(audit)
        self.assertIsNone(created["previous_state"])
        self.assertEqual(updated["previous_state"]["title"], "Test schedule")
        self.assertEqual(updated["new_state"]["title"], "v2")
        self.assertEqual(deleted["actor"], "deleter")
        self.assertEqual(deleted["previous_state"]["title"], "v2")

    def test_invalid_time_ranges_rejected(self):
        with self.assertRaises(ScheduleValidationError):
            self.service.save_schedule(schedule(ends_at="2026-11-06T08:00:00+05:30"))
        with self.assertRaises(ScheduleValidationError):
            self.service.save_schedule(schedule(ends_at="2026-11-06T09:00:00+05:30"))  # zero length
        with self.assertRaises(ScheduleValidationError):
            self.service.save_schedule(schedule(starts_at="not-a-date"))
        with self.assertRaises(ScheduleValidationError):  # mixed naive/aware must not raise TypeError
            self.service.save_schedule(schedule(starts_at="2026-11-06T09:00:00", ends_at="2026-11-06T10:00:00+05:30"))
        self.assertEqual(self.service.schedules(), [])

    def test_malformed_fields_rejected(self):
        for bad in (schedule(room_id=""), schedule(title="   "), schedule(building_id=None),
                    schedule(expected_occupancy=-1), schedule(expected_occupancy="5"),
                    schedule(expected_occupancy=True), schedule(starts_at=None)):
            with self.assertRaises(ScheduleValidationError, msg=str(bad)):
                self.service.save_schedule(bad)
        self.assertEqual(self.service.schedules(), [])
        self.assertEqual(self.service.audit_history(), [])

    def test_invalid_room_id_rejected_when_known_rooms_supplied(self):
        known = {r["room_id"] for r in self.rooms()}
        with self.assertRaises(ScheduleValidationError):
            self.service.save_schedule(schedule(room_id="nope-F9-R99"), known_room_ids=known)
        ok = self.service.save_schedule(schedule(), known_room_ids=known)
        self.assertTrue(ok["id"])

    def test_schedule_without_optional_id_generates_id_and_audit(self):
        s = self.service.save_schedule(schedule(id=None))
        self.assertTrue(s["id"])
        self.assertEqual(self.service.schedules()[0]["id"], s["id"])
        self.assertEqual(self.service.audit_history()[0]["action"], "created")

    def test_comparison_inputs_are_orderable_by_start_time(self):
        self.service.save_schedule(schedule(title="late", starts_at="2026-11-06T15:00:00+05:30", ends_at="2026-11-06T16:00:00+05:30"))
        self.service.save_schedule(schedule(title="early"))
        self.assertEqual([s["title"] for s in self.service.schedules()], ["early", "late"])


class RecommendationTests(Base):
    def test_assumptions_and_estimate_disclosed(self):
        rec = self.recommendation()
        self.assertEqual(rec["status"], "PENDING")
        self.assertEqual(rec["assumptions"]["measurement"], "simulated")
        self.assertIn("basis", rec["assumptions"])
        self.assertIn("tariff_inr_per_kwh", rec["assumptions"])
        self.assertGreater(rec["savings_kwh"], 0)
        self.assertAlmostEqual(rec["baseline_kwh"] - rec["proposed_kwh"], rec["savings_kwh"], places=1)
        self.assertAlmostEqual(rec["savings_inr"], rec["savings_kwh"] * 7.5, places=1)
        self.assertIsNone(rec["simulated_after_kwh"])
        self.assertEqual(rec["safety_validation"]["execution_mode"], "simulation_only")
        self.assertTrue(rec["safety_validation"]["requires_manual_approval"])

    def test_protected_and_essential_equipment_never_in_actions(self):
        rooms = self.rooms()
        # Force every room to look idle and high-load so that all of them are eligible.
        for r in rooms:
            r["occupancy_count"], r["power_kwh"] = 0, 6.0
        recs = self.service.recommendations(rooms)
        self.assertEqual(len(recs), len(rooms))
        by_room = {r["room_id"]: r for r in rooms}
        for rec in recs:
            protected = {e["name"] for e in by_room[rec["room_id"]]["equipment"] if e["protected"]}
            self.assertTrue(protected)
            self.assertFalse(protected & set(rec["affected_equipment"]))
            self.assertEqual(set(rec["safety_validation"]["excluded_protected_equipment"]), protected)
            self.assertEqual(set(rec["affected_equipment"]), {"LED lighting", "HVAC"})
        server_rooms = [r for r in recs if r["room_id"].endswith("R03")]
        self.assertTrue(server_rooms)
        for rec in server_rooms:
            self.assertIn("Network/server rack", rec["safety_validation"]["excluded_protected_equipment"])
            self.assertNotIn("Network/server rack", rec["affected_equipment"])

    def test_occupied_or_low_load_rooms_get_no_recommendation(self):
        rooms = self.rooms()
        for r in rooms:
            r["occupancy_count"], r["power_kwh"] = 5, 9.0
        self.assertEqual(self.service.recommendations(rooms), [])
        for r in rooms:
            r["occupancy_count"], r["power_kwh"] = 0, 1.0
        self.assertEqual(self.service.recommendations(rooms), [])

    def test_recommendations_are_not_duplicated_on_repeat_calls(self):
        first = self.service.recommendations(self.rooms())
        second = self.service.recommendations(self.rooms())
        self.assertEqual(len(first), len(second))

    def test_rejected_recommendation_is_not_re_proposed(self):
        rec = self.recommendation()
        self.service.decide(rec["id"], "REJECTED", "manager")
        again = self.service.recommendations(self.rooms())
        self.assertEqual([r["status"] for r in again if r["room_id"] == rec["room_id"]], ["REJECTED"])


class ApprovalExecutionTests(Base):
    def test_execution_blocked_while_pending(self):
        rec = self.recommendation()
        with self.assertRaises(ValueError):
            self.service.execute_simulation(rec["id"], "manager")
        self.assertEqual(self.service.recommendations(self.rooms())[0]["status"], "PENDING")

    def test_full_flow_is_marked_simulated_and_audited(self):
        rec = self.recommendation()
        approved = self.service.decide(rec["id"], "APPROVED", "facility-manager")
        self.assertEqual(approved["status"], "APPROVED")
        executed = self.service.execute_simulation(rec["id"], "facility-manager")
        self.assertEqual(executed["status"], "EXECUTED IN SIMULATION")
        self.assertEqual(executed["simulated_after_kwh"], executed["proposed_kwh"])
        self.assertEqual(executed["baseline_kwh"], rec["baseline_kwh"])
        self.assertEqual(executed["safety_validation"]["execution_mode"], "simulation_only")

    def test_rejected_cannot_execute_or_be_redecided(self):
        rec = self.recommendation()
        self.service.decide(rec["id"], "REJECTED", "manager")
        with self.assertRaises(ValueError):
            self.service.execute_simulation(rec["id"], "manager")
        with self.assertRaises(ValueError):
            self.service.decide(rec["id"], "APPROVED", "manager")

    def test_cannot_execute_twice_or_decide_after_execution(self):
        rec = self.recommendation()
        self.service.decide(rec["id"], "APPROVED", "m")
        self.service.execute_simulation(rec["id"], "m")
        with self.assertRaises(ValueError):
            self.service.execute_simulation(rec["id"], "m")
        with self.assertRaises(ValueError):
            self.service.decide(rec["id"], "REJECTED", "m")

    def test_invalid_decision_blank_actor_and_unknown_id(self):
        rec = self.recommendation()
        with self.assertRaises(ValueError):
            self.service.decide(rec["id"], "MAYBE", "m")
        for bad in ("", "   ", None):
            with self.assertRaises(ValueError):
                self.service.decide(rec["id"], "APPROVED", bad)
            with self.assertRaises(ValueError):
                self.service.execute_simulation(rec["id"], bad)
        self.assertIsNone(self.service.decide("missing", "APPROVED", "m"))
        self.assertIsNone(self.service.execute_simulation("missing", "m"))
        self.assertEqual(self.recommendation()["status"], "PENDING")

    def test_audit_preserves_actor_timestamp_action_and_old_new_state(self):
        rec = self.recommendation()
        self.service.decide(rec["id"], "APPROVED", "alice")
        self.service.execute_simulation(rec["id"], "bob")
        entries = {a["action"]: a for a in self.service.audit_history() if a["entity_id"] == rec["id"]}
        self.assertEqual(set(entries), {"created", "approved", "executed_in_simulation"})
        self.assertEqual(entries["approved"]["actor"], "alice")
        self.assertEqual(entries["approved"]["previous_state"]["status"], "PENDING")
        self.assertEqual(entries["approved"]["new_state"]["status"], "APPROVED")
        self.assertEqual(entries["executed_in_simulation"]["actor"], "bob")
        self.assertEqual(entries["executed_in_simulation"]["previous_state"]["status"], "APPROVED")
        self.assertEqual(entries["executed_in_simulation"]["new_state"]["status"], "EXECUTED IN SIMULATION")
        self.assertEqual(entries["created"]["actor"], "system")
        self.assertIsNone(entries["created"]["previous_state"])
        for e in entries.values():
            self.assertRegex(e["timestamp"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")
            self.assertTrue(e["timestamp"].endswith("+00:00"))

    def test_failed_transitions_write_no_audit_entries(self):
        rec = self.recommendation()
        before = len(self.service.audit_history())
        with self.assertRaises(ValueError):
            self.service.execute_simulation(rec["id"], "m")
        self.assertEqual(len(self.service.audit_history()), before)

    def test_audit_limit_and_order(self):
        for i in range(5):
            hour = 9 + i
            self.service.save_schedule(schedule(title=f"s{i}", starts_at=f"2026-11-06T{hour:02d}:00:00+05:30", ends_at=f"2026-11-06T{hour+1:02d}:00:00+05:30"))
        recent = self.service.audit_history(limit=3)
        self.assertEqual(len(recent), 3)
        self.assertEqual([a["id"] for a in recent], sorted((a["id"] for a in recent), reverse=True))

    def test_calendar_rejects_overlapping_events_in_same_room(self):
        self.service.save_schedule(schedule())
        with self.assertRaises(ScheduleValidationError):
            self.service.save_schedule(schedule(starts_at="2026-11-06T09:30:00+05:30", ends_at="2026-11-06T10:30:00+05:30"))
        self.assertEqual(len(self.service.schedules()), 1)

    def test_operating_settings_are_bounded_and_audited(self):
        updated = self.service.update_operating_settings({"idle_load_kwh": 5, "saving_fraction": .2,
            "tariff_inr": 8, "comfort_min_c": 21, "actor": "operator"})
        self.assertEqual(updated["idle_load_kwh"], 5)
        self.assertEqual(self.service.audit_history()[0]["action"], "updated")
        with self.assertRaises(ScheduleValidationError):
            self.service.update_operating_settings({"idle_load_kwh": 100, "saving_fraction": .2,
                "tariff_inr": 8, "comfort_min_c": 21, "actor": "operator"})

    def test_schedule_estimates_and_anomaly_flags_are_explicitly_simulated(self):
        rooms = self.rooms()
        schedules = [dict(title="class", room_id=rooms[1]["room_id"], starts_at="2026-11-06T09:00:00",
                          ends_at="2026-11-06T10:00:00", expected_occupancy=10)]
        insight = self.service.intelligence(rooms, schedules, self.service.operating_settings())
        self.assertEqual(insight["data_mode"], "SIMULATED")
        self.assertIn("not a trained forecast", insight["method"])
        self.assertIsNotNone(insight["estimated_peak_kwh_per_hour"])
        self.assertTrue(any(row["kind"] == "idle_high_load" for row in insight["anomalies"]))


class PersistenceAndFailureTests(Base):
    def test_state_survives_reopening_database(self):
        rec = self.recommendation()
        self.service.decide(rec["id"], "APPROVED", "m")
        reopened = PS6Service(self.db_path)
        self.assertEqual(reopened.recommendations([])[0]["status"], "APPROVED")
        self.assertTrue(reopened.audit_history())

    def test_connections_are_closed_and_failed_writes_roll_back(self):
        svc = self.service
        with self.assertRaises(sqlite3.IntegrityError):
            with svc._connect() as db:
                db.execute("INSERT INTO schedules(id) VALUES('x')")  # NOT NULL violations
        self.assertEqual(svc.schedules(), [])
        with svc._connect() as db:
            pass
        with self.assertRaises(sqlite3.ProgrammingError):
            db.execute("SELECT 1")  # connection must be closed after the context exits

    def test_audit_json_is_valid_json(self):
        self.recommendation()
        with closing(sqlite3.connect(self.db_path)) as raw:
            for prev, new in raw.execute("SELECT previous_state, new_state FROM audit"):
                json.loads(new)
                if prev:
                    json.loads(prev)

    def test_unwritable_database_path_fails_loudly(self):
        blocker = Path(self.temp_dir.name) / "blocker"
        blocker.write_text("not a directory")
        with self.assertRaises(OSError):
            PS6Service(blocker / "nested" / "db.sqlite3")


if __name__ == "__main__":
    unittest.main()
