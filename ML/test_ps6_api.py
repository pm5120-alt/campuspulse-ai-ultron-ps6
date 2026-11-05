"""HTTP-level tests for the PS6 routes using FastAPI's TestClient and a TEMPORARY database.

Requires the packages in ML/requirements.txt (fastapi, httpx-compatible TestClient deps).
Skipped automatically when FastAPI is not installed. Run from the repository root:
    python -m unittest ML.test_ps6_api -v
The persistent demo database (ML/data/campuspulse.sqlite3) is never opened: CAMPUSPULSE_DB is
pointed at a temp file BEFORE the app module is imported.
"""
import importlib.util
import os
import tempfile
import unittest

HAVE_FASTAPI = importlib.util.find_spec("fastapi") is not None


@unittest.skipUnless(HAVE_FASTAPI, "fastapi is not installed")
class PS6ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory()
        os.environ["CAMPUSPULSE_DB"] = os.path.join(cls._tmp.name, "api-test.sqlite3")
        from fastapi.testclient import TestClient
        import ML.api.main as main
        main = importlib.reload(main)
        cls.client = TestClient(main.app)

    @classmethod
    def tearDownClass(cls):
        os.environ.pop("CAMPUSPULSE_DB", None)
        cls._tmp.cleanup()

    def _sched(self, **over):
        body = {"building_id": "academic_block", "room_id": "academic_block-F1-R01",
                "starts_at": "2026-11-06T09:00:00", "ends_at": "2026-11-06T10:00:00",
                "expected_occupancy": 0, "title": "API test", "actor": "api-test"}
        body.update(over)
        return body

    def test_health(self):
        self.assertEqual(self.client.get("/api/v1/health").status_code, 200)

    def test_rooms_are_labelled_simulated(self):
        data = self.client.get("/api/v1/ps6/rooms").json()
        self.assertEqual(data["data_mode"], "SIMULATED")
        self.assertTrue(data["rooms"])
        self.assertTrue(all(r["data_mode"] == "SIMULATED" for r in data["rooms"]))

    def test_intelligence_and_settings_endpoints(self):
        result = self.client.get("/api/v1/ps6/intelligence")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["data_mode"], "SIMULATED")
        self.assertIn("estimated_peak_kwh_per_hour", result.json())
        settings = self.client.get("/api/v1/ps6/settings").json()
        self.assertEqual(settings["idle_load_kwh"], 4.0)
        changed = self.client.put("/api/v1/ps6/settings", json={**settings, "idle_load_kwh": 5, "actor": "operator"})
        self.assertEqual(changed.status_code, 200)
        invalid = self.client.put("/api/v1/ps6/settings", json={**settings, "idle_load_kwh": 99, "actor": "operator"})
        self.assertEqual(invalid.status_code, 422)

    def test_timetable_crud_and_validation(self):
        res = self.client.post("/api/v1/ps6/timetable", json=self._sched())
        self.assertEqual(res.status_code, 201, res.text)
        sid = res.json()["id"]
        upd = self.client.post("/api/v1/ps6/timetable", json={**self._sched(title="renamed"), "id": sid})
        self.assertEqual(upd.status_code, 201)
        listed = [s for s in self.client.get("/api/v1/ps6/timetable").json()["schedules"] if s["id"] == sid]
        self.assertEqual(listed[0]["title"], "renamed")
        cmp = self.client.get("/api/v1/ps6/timetable/comparison").json()
        self.assertTrue(any(c["schedule"]["id"] == sid for c in cmp["comparisons"]))
        self.assertEqual(self.client.post("/api/v1/ps6/timetable", json=self._sched(room_id="bogus")).status_code, 422)
        self.assertEqual(self.client.post("/api/v1/ps6/timetable", json=self._sched(ends_at="2026-11-06T08:00:00")).status_code, 422)
        self.assertEqual(self.client.post("/api/v1/ps6/timetable", json={"room_id": "x"}).status_code, 422)
        self.assertEqual(self.client.delete(f"/api/v1/ps6/timetable/{sid}?actor=api-test").status_code, 200)
        self.assertEqual(self.client.delete(f"/api/v1/ps6/timetable/{sid}?actor=api-test").status_code, 404)

    def test_recommendation_workflow_and_failure_states(self):
        recs = self.client.get("/api/v1/ps6/recommendations").json()
        self.assertIn("ESTIMATED", recs["estimated_savings_label"])
        rec = next(r for r in recs["recommendations"] if r["status"] == "PENDING")
        rid = rec["id"]
        self.assertNotIn("Fire alarm panel", rec["affected_equipment"])
        self.assertEqual(self.client.post(f"/api/v1/ps6/recommendations/{rid}/execute-simulation", json={"actor": "m"}).status_code, 409)
        self.assertEqual(self.client.post(f"/api/v1/ps6/recommendations/{rid}/decision", json={"decision": "MAYBE", "actor": "m"}).status_code, 422)
        self.assertEqual(self.client.post(f"/api/v1/ps6/recommendations/{rid}/decision", json={"decision": "APPROVED"}).status_code, 422)
        self.assertEqual(self.client.post("/api/v1/ps6/recommendations/missing/decision", json={"decision": "APPROVED", "actor": "m"}).status_code, 404)
        self.assertEqual(self.client.post(f"/api/v1/ps6/recommendations/{rid}/decision", json={"decision": "approved", "actor": "alice"}).status_code, 200)
        done = self.client.post(f"/api/v1/ps6/recommendations/{rid}/execute-simulation", json={"actor": "alice"}).json()
        self.assertEqual(done["status"], "EXECUTED IN SIMULATION")
        self.assertEqual(done["execution_mode"], "SIMULATION ONLY")
        self.assertIs(done["measured_savings"], False)
        audit = self.client.get("/api/v1/ps6/audit").json()["records"]
        mine = {a["action"]: a for a in audit if a["entity_id"] == rid}
        self.assertEqual(mine["approved"]["actor"], "alice")
        self.assertEqual(mine["executed_in_simulation"]["previous_state"]["status"], "APPROVED")
        self.assertEqual(self.client.get("/api/v1/ps6/audit?limit=0").status_code, 422)


if __name__ == "__main__":
    unittest.main()
