# Verification record

## Local checks (2026-11-06)

| Working directory | Command | Result |
|---|---|---|
| Repository root | `python -m unittest ML.test_telemetry_ingestion ML.test_telemetry_api ML.test_ps6_service ML.test_ps6_api` | Passed: 60 tests, 0 failures. |
| `application/` | `npm run lint` | Passed, exit code 0. |
| `application/` | `npm run build` | Passed. Next.js generated `/`, `/_not-found`, and `/ps6`. |

The Python suite emitted an optional Plotly import warning and FastAPI/Pydantic deprecation notices. They did not fail the run. The tests use local fixtures and clients; they are not real sensor or live-hosting tests.

## Coverage represented

Telemetry tests cover quoted/escaped Unicode CSV with CRLF/LF; malformed quoting; duplicate, unknown and missing headers; ragged rows; missing IDs/timestamps; timezone normalization and date policy; wrong JSON types; control/invalid Unicode; negative, non-finite and out-of-range values; body/row limits; identity normalization; duplicate winners; stale event-time arrivals; legacy-table merging; API error status and response shape; and copy-on-write batch rejection. PS6 service/API tests cover timetable and room validation, protected equipment, recommendation settings, approval/rejection/simulated execution, and audit transitions.

## Verification boundaries

The frontend production build and local unit/API checks do not verify public hosting, third-party calendar synchronization, real sensors, live BMS control, forecast accuracy, anomaly precision, or measured energy savings. PS6 readings and recommendations remain simulated; the rule-based checks and schedule-scaled estimate are not a trained peak forecast. Telemetry merged into the active data frames is in memory and is not durable across an API restart without separate persistence.
