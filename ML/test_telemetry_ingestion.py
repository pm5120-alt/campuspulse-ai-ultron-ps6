import math
import unittest
from datetime import datetime, timezone

from ML.api.telemetry_ingestion import (
    TelemetryValidationError,
    merge_batch,
    parse_csv_batch,
    record_identity,
    validate_records,
)


NOW = datetime(2026, 11, 5, tzinfo=timezone.utc)


class TelemetryParsingTests(unittest.TestCase):
    def csv(self, rows, header="timestamp,entity_id,kwh"):
        return header + "\r\n" + "\r\n".join(rows)

    def test_quoted_escaped_unicode_and_crlf(self):
        data = 'timestamp,entity_id,kwh,temperature_c\r\n2026-11-04T10:00:00Z,"café, 東\"\"1",12.5,20\r\n'
        row = parse_csv_batch(data, "energy", NOW)[0]
        self.assertEqual(row["entity_id"], 'café, 東"1')
        self.assertEqual(row["kwh"], 12.5)

    def test_lf_and_quoted_comma_text(self):
        data = 'timestamp,entity_id,fill_level_kg,category\n2026-11-04T10:00:00Z,bin-1,3,"bío, medical"\n'
        self.assertEqual(parse_csv_batch(data, "waste", NOW)[0]["category"], "bío, medical")

    def test_malformed_csv_quotes(self):
        with self.assertRaises(TelemetryValidationError):
            parse_csv_batch('timestamp,entity_id,kwh\n2026-11-04T10:00:00Z,x,"4', "energy", NOW)

    def test_ragged_row_is_rejected(self):
        with self.assertRaises(TelemetryValidationError) as caught:
            parse_csv_batch(self.csv(["2026-11-04T10:00:00Z,x,4,extra"]), "energy", NOW)
        self.assertEqual(caught.exception.errors[0]["row"], 2)

    def test_missing_and_extra_columns_are_rejected(self):
        for header in ("timestamp,kwh", "timestamp,entity_id,kwh,rogue"):
            with self.subTest(header=header), self.assertRaises(TelemetryValidationError):
                parse_csv_batch(header + "\n2026-11-04T10:00:00Z,x,4,1", "energy", NOW)

    def test_duplicate_headers_are_rejected(self):
        with self.assertRaises(TelemetryValidationError):
            parse_csv_batch("timestamp,entity_id,kwh,kwh\n2026-11-04T10:00:00Z,x,4,5", "energy", NOW)

    def test_required_identifier_and_timestamp(self):
        cases = [
            {"timestamp": "2026-11-04T10:00:00Z", "kwh": 2},
            {"entity_id": "x", "kwh": 2},
            {"timestamp": "2026-11-04T10:00:00Z", "entity_id": " ", "kwh": 2},
        ]
        for record in cases:
            with self.subTest(record=record), self.assertRaises(TelemetryValidationError):
                validate_records([record], "energy", NOW)

    def test_invalid_and_out_of_policy_dates(self):
        for timestamp in ("yesterday", "2026-02-30T00:00:00Z", "1999-12-31T23:59:00Z", "2026-11-07T00:00:00Z"):
            record = {"timestamp": timestamp, "entity_id": "x", "kwh": 2}
            with self.subTest(timestamp=timestamp), self.assertRaises(TelemetryValidationError):
                validate_records([record], "energy", NOW)

    def test_naive_timestamps_are_treated_as_utc(self):
        record = validate_records([{"timestamp": "2026-11-04T10:00:00", "entity_id": "x", "kwh": 2}], "energy", NOW)[0]
        self.assertEqual(record["timestamp"], "2026-11-04T10:00:00.000000Z")

    def test_negative_nonfinite_and_implausible_numbers(self):
        for value in (-1, math.nan, math.inf, 1_000_001):
            record = {"timestamp": "2026-11-04T10:00:00Z", "entity_id": "x", "kwh": value}
            with self.subTest(value=value), self.assertRaises(TelemetryValidationError):
                validate_records([record], "energy", NOW)

    def test_wrong_json_types_and_boolean_are_rejected(self):
        for value in ("12", True, None, []):
            record = {"timestamp": "2026-11-04T10:00:00Z", "entity_id": "x", "kwh": value}
            with self.subTest(value=value), self.assertRaises(TelemetryValidationError):
                validate_records([record], "energy", NOW)

    def test_text_control_and_invalid_unicode_are_rejected(self):
        for entity in ("bad\u202e", "bad\ud800"):
            record = {"timestamp": "2026-11-04T10:00:00Z", "entity_id": entity, "kwh": 2}
            with self.subTest(entity=repr(entity)), self.assertRaises(TelemetryValidationError):
                validate_records([record], "energy", NOW)

    def test_size_and_row_limits(self):
        with self.assertRaises(TelemetryValidationError):
            parse_csv_batch("x" * (1_048_577), "energy", NOW)
        records = [{"timestamp": "2026-11-04T10:00:00Z", "entity_id": str(i), "kwh": 1} for i in range(501)]
        with self.assertRaises(TelemetryValidationError):
            validate_records(records, "energy", NOW)


class ArrivalMergeTests(unittest.TestCase):
    def record(self, stamp, kwh):
        return {"timestamp": stamp, "entity_id": "main", "kwh": kwh}

    def test_identity_uses_facility_domain_entity_and_event_timestamp(self):
        identity = record_identity("engineering_college", "energy", self.record("2026-11-04T10:00:00Z", 1))
        self.assertEqual(identity, '["engineering_college","energy","main","2026-11-04T10:00:00.000000Z"]')
        same_instant = record_identity("engineering_college", "energy", self.record("2026-11-04T15:30:00+05:30", 2))
        self.assertEqual(same_instant, identity)

    def test_last_duplicate_in_batch_wins_and_counts(self):
        import pandas as pd
        merged, counts = merge_batch(pd.DataFrame(), [self.record("2026-11-04T10:00:00Z", 3), self.record("2026-11-04T10:00:00Z", 8)], "engineering_college", "energy", "records")
        self.assertEqual(float(merged.iloc[-1]["kwh"]), 8)
        self.assertEqual(counts, {"accepted": 1, "rejected": 0, "duplicates": 1})
        self.assertEqual(merged.iloc[-1]["_arrival_row"], 2)

    def test_new_arrival_wins_even_when_event_time_is_stale(self):
        import pandas as pd
        prior, _ = merge_batch(pd.DataFrame(), [self.record("2026-11-04T10:00:00Z", 9)], "engineering_college", "energy", "csv")
        stale_arrival, counts = merge_batch(prior, [self.record("2026-11-04T10:00:00Z", 2)], "engineering_college", "energy", "records")
        self.assertEqual(len(stale_arrival), 1)
        self.assertEqual(float(stale_arrival.iloc[0]["kwh"]), 2)
        self.assertGreater(stale_arrival.iloc[0]["_arrival_order"], prior.iloc[0]["_arrival_order"])
        self.assertEqual(stale_arrival.iloc[0]["_arrival_source"], "records")
        self.assertEqual(counts["duplicates"], 1)

    def test_rejected_record_cannot_partially_merge(self):
        import pandas as pd
        stored, _ = merge_batch(pd.DataFrame(), [self.record("2026-11-04T10:00:00Z", 9)], "engineering_college", "energy", "csv")
        before = stored.copy(deep=True)
        with self.assertRaises(TelemetryValidationError):
            validate_records([self.record("2026-11-04T10:00:00Z", 5), self.record("bad", 4)], "energy", NOW)
        pd.testing.assert_frame_equal(stored, before)

    def test_incoming_record_replaces_matching_legacy_stored_row(self):
        import pandas as pd
        legacy = pd.DataFrame([{"timestamp": "2026-11-04T10:00:00Z", "building_id": "main", "kwh": 4}])
        merged, _ = merge_batch(legacy, [self.record("2026-11-04T10:00:00Z", 11)], "engineering_college", "energy", "records")
        self.assertEqual(len(merged), 1)
        self.assertEqual(float(merged.iloc[0]["kwh"]), 11)

    def test_legacy_rows_without_identity_are_preserved(self):
        import pandas as pd
        legacy = pd.DataFrame([{"timestamp": None, "building_id": None, "kwh": 4}])
        merged, _ = merge_batch(legacy, [self.record("2026-11-04T10:00:00Z", 11)], "engineering_college", "energy", "records")
        self.assertEqual(len(merged), 2)


if __name__ == "__main__":
    unittest.main()
