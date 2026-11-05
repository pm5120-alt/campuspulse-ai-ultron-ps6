import unittest
from unittest.mock import patch

import pandas as pd

from fastapi.testclient import TestClient
from ML.api import main


class TelemetryApiTests(unittest.TestCase):
    def setUp(self):
        self.original_datasets = main.DATASETS
        self.original_models = main.MODELS
        self.original_pipeline = main.CL_PIPELINE
        self.frame = pd.DataFrame([{
            "timestamp": "2026-11-04T10:00:00Z", "building_id": "existing", "kwh": 2.0,
        }])
        main.DATASETS = {"engineering_college": {"energy": self.frame.copy(deep=True)}}
        main.MODELS = {}
        main.CL_PIPELINE = None
        self.client = TestClient(main.app)

    def tearDown(self):
        main.DATASETS = self.original_datasets
        main.MODELS = self.original_models
        main.CL_PIPELINE = self.original_pipeline

    def test_api_rejects_bad_batch_atomically_and_does_not_claim_retraining(self):
        before = main.DATASETS["engineering_college"]["energy"].copy(deep=True)
        response = self.client.post("/api/v1/continuous-learning/sync-and-learn", json={
            "facility_type": "engineering_college", "domain": "energy", "records": [
                {"timestamp": "2026-11-04T10:00:00Z", "entity_id": "main", "kwh": 8},
                {"timestamp": "invalid", "entity_id": "other", "kwh": 1},
            ],
        })
        self.assertEqual(response.status_code, 422, response.text)
        payload = response.json()["detail"]
        self.assertEqual(payload["accepted"], 0)
        self.assertEqual(payload["rejected"], 2)
        self.assertNotIn("retrained_models", payload)
        pd.testing.assert_frame_equal(main.DATASETS["engineering_college"]["energy"], before)

    def test_success_reports_deduplicated_counts_and_arrival_winner(self):
        response = self.client.post("/api/v1/continuous-learning/sync-and-learn", json={
            "facility_type": "engineering_college", "domain": "energy", "records": [
                {"timestamp": "2026-11-04T10:00:00Z", "entity_id": "main", "kwh": 8},
                {"timestamp": "2026-11-04T10:00:00Z", "entity_id": "main", "kwh": 12},
            ],
        })
        self.assertEqual(response.status_code, 200, response.text)
        body = response.json()
        self.assertEqual((body["accepted"], body["rejected"], body["duplicates"]), (1, 0, 1))
        rows = main.DATASETS["engineering_college"]["energy"]
        winner = rows[rows["entity_id"] == "main"].iloc[0]
        self.assertEqual(winner["kwh"], 12)
        self.assertEqual(winner["_arrival_row"], 2)
        self.assertEqual(body["retraining_status"], "not_run")
        self.assertEqual(body["retrained_models"], [])

    def test_csv_is_parsed_by_server_and_unknown_fields_are_non_success(self):
        response = self.client.post("/api/v1/continuous-learning/sync-and-learn", json={
            "facility_type": "engineering_college", "domain": "energy",
            "csv_data": "timestamp,entity_id,kwh\r\n2026-11-04T10:00:00Z,main,3\r\n",
        })
        self.assertEqual(response.status_code, 200, response.text)
        bad = self.client.post("/api/v1/continuous-learning/sync-and-learn", json={
            "facility_type": "engineering_college", "domain": "energy",
            "csv_data": "timestamp,entity_id,kwh,unsafe_secret_header\n2026-11-04T10:00:00Z,main,3,x",
        })
        self.assertEqual(bad.status_code, 422)
        self.assertNotIn("unsafe_secret_header", bad.text)

    def test_malformed_json_is_non_success_with_safe_error_shape(self):
        response = self.client.post("/api/v1/continuous-learning/sync-and-learn", content='{"records":')
        self.assertEqual(response.status_code, 422)
        detail = response.json()["detail"]
        self.assertEqual(detail["accepted"], 0)
        self.assertEqual(detail["rejected"], 1)
        self.assertNotIn("retrained_models", detail)

    def test_failed_training_is_not_reported_as_success(self):
        class BrokenModel:
            def train(self, _data):
                raise RuntimeError("private error")

        main.MODELS = {"energy_forecaster": BrokenModel()}
        response = self.client.post("/api/v1/continuous-learning/sync-and-learn", json={
            "facility_type": "engineering_college", "domain": "energy", "records": [
                {"timestamp": "2026-11-04T10:00:00Z", "entity_id": "main", "kwh": 8},
            ],
        })
        body = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(body["retraining_status"], "failed")
        self.assertEqual(body["retrained_models"], [])
        self.assertNotIn("successfully retrained", body["message"])
        self.assertNotIn("private error", response.text)


if __name__ == "__main__":
    unittest.main()
