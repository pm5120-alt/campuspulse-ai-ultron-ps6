# Telemetry ingestion contract

This document describes the CSV and JSON upload contract enforced by the frontend and FastAPI endpoint. Browser validation provides quick feedback; the server repeats validation and is authoritative. Invalid batches are rejected as a whole.

## Identity and arrival order

A record key is the compact JSON array `[facility_type, domain, normalized_entity_id, canonical_event_timestamp_utc]`. The identifier is `entity_id` for energy, water and waste; `sensor_id` for AQI; and `asset_id` for assets. Identifiers are trimmed and Unicode NFC-normalized. Timestamps are normalized to UTC with microsecond precision, so offsets representing the same instant have the same key.

Arrival order is separate from event time. A merge assigns increasing `_arrival_order`; `_arrival_at` stores receipt time, `_arrival_source` records CSV, JSON records or existing data, `_arrival_row` identifies the batch row, and `_record_identity` stores the key. For one key, the latest arrival wins even when its event timestamp is stale. Within one batch the later row wins. The same rule applies to identified rows already in the active telemetry table. A legacy row without a valid identity is retained but cannot be deduplicated. Successful response counts are distinct winning incoming records (`accepted`), rejected records (`rejected`), and superseded duplicates in the batch or identified stored data (`duplicates`). Conflict resolution is silent. Records missing an ID or timestamp are rejected.

## Schemas and numeric bounds

Each record requires `timestamp`, its domain identifier, and its primary measurement. Other listed measurement fields are optional; unknown fields are rejected. CSV headers must be unique and may not name internal metadata. Bounds are inclusive, conservative input-hygiene limits; they do not claim sensor accuracy, calibration, or site-validated operating limits.

| Domain | Identifier | Required measurement | Accepted numeric bounds |
|---|---|---|---|
| Energy | `entity_id` | `kwh` | `kwh` 0-1,000,000; `kw_demand` 0-100,000; `power_factor` 0-1; `voltage_v` 0-1,000; `temperature_c` -50-100 |
| Water | `entity_id` | `litres` | `litres` 0-10,000,000; `flow_rate_lpm` 0-100,000; `pressure_bar` 0-100; `ph_level` 0-14; `tds_ppm` 0-100,000 |
| Waste | `entity_id` | `fill_level_kg` | `fill_level_kg` 0-1,000,000; `capacity_pct` 0-100; `temperature_c` -50-200; optional `category` text |
| AQI | `sensor_id` | `aqi_index` | `pm25` 0-2,000; `pm10` 0-5,000; `co2_ppm` 0-100,000; `aqi_index` 0-500; `temp_c` -100-100; `humidity_pct` 0-100 |
| Assets | `asset_id` | `vibration_mm_s` | `vibration_mm_s` 0-1,000; `operating_temp_c` -50-300; `power_kw` 0-100,000; `duty_cycle_pct` 0-100; `health_score` 0-100 |

JSON measurements must be finite numbers; booleans, numeric strings, nulls, arrays, NaN and infinities are rejected. CSV numeric cells must match a complete decimal/scientific-notation number and fit the same bounds. Values are not silently coerced. IDs have 1-128 printable characters. Other text fields have 1-256 printable characters. Control, formatting and invalid Unicode characters are rejected.

## Timestamp, CSV and request policy

Timestamps use ISO 8601 date-time syntax. Explicit offsets are converted to UTC; timezone-less values are treated as UTC. Events earlier than `2000-01-01T00:00:00Z` or later than 24 hours after the server's current UTC time are rejected. Timestamp strings are limited to 64 characters.

The request body and CSV text are limited to 1 MiB; a batch can contain at most 500 data rows. Malformed quoting, duplicate or blank headers, missing required columns, unknown headers, ragged rows, missing required values, invalid JSON shapes and unsupported domains are rejected with row/field errors. Error responses do not echo uploaded cell contents or unknown header names.

The browser parser and Python `csv.reader` support quoted fields, commas inside quotes, doubled-quote escapes, Unicode, and LF or CRLF line endings. Invalid quoting and unexpected text after a closing quoted field are rejected. CSV is parsed as records, not by splitting lines or commas.

## Failure handling and limitations

The server validates the entire upload before merging and assigns new active data only after validation and merge complete. A validation failure returns HTTP 422 with `accepted: 0`, a rejected count and actionable errors; active telemetry remains unchanged and retraining is not reported as successful. Successful replies include accepted, rejected, duplicate and retraining-status fields.

Only the five schemas above are accepted. The API does not infer a domain, repair malformed rows, or import arbitrary vendor columns. Timezone-less timestamps cannot express an unknown local timezone and are interpreted as UTC. Legacy rows without a valid ID or timestamp cannot be deduplicated. The dashboard's active telemetry tables are in process memory, so uploaded changes are not durable across an API restart without a separate persistence layer. The prototype does not authenticate telemetry sources or establish their reliability.
