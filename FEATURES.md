# Features and Provenance

## Retained from CampusIQ (original author: Omprakash Behera, MIT)

Next.js multi-sector dashboard, FastAPI service, synthetic CSV generators/data, model classes (Prophet/XGBoost forecasting, Isolation Forest anomaly detection, etc.) and serialized artifacts. Original copyright and license are retained (`LICENSE`). Several inherited dashboard values (KPI cards, chart arrays, insight text, sync/retraining metrics) are fixed demo payloads, not measurements.

## Added for PS6 (ULTRON adaptation)

| Feature | Where | Notes |
|---|---|---|
| Simulated room telemetry (building/floor/room) | `PS6Service.rooms`, `GET /api/v1/ps6/rooms` | Deterministic; every record has `data_mode: "SIMULATED"`. Only the first building's F1-R01 is an engineered idle/high-load demo case. |
| Campus event calendar / timetable create, update, list, delete and compare | `/api/v1/ps6/timetable*` | Manually entered room events include expected occupancy; invalid times, unknown rooms and overlapping events in one room are rejected. There is no third-party calendar sync. |
| Rule-based unusual-load checks and scheduled peak estimate | `PS6Service.intelligence`, `GET /api/v1/ps6/intelligence` | Empty-room high load and peer-relative high load flags; scheduled load is scaled from simulated readings and event occupancy. Explicitly rule-based, not a trained forecast or equipment diagnosis. |
| Rule-based recommendation and configurable operating assumptions | `PS6Service.recommendations`, `/api/v1/ps6/settings` | Editable idle threshold, estimated savings fraction, tariff and comfort floor have server-side bounds and audit entries. These are demonstration assumptions, not calibrated site policy. |
| Equipment protection | same | Fire panels and network/server racks are always excluded from actions; configurable settings cannot disable this invariant. Affected list contains only standard HVAC and LED lighting. |
| Manual approval / rejection | `POST …/decision` | A named actor is mandatory. Rejected rooms are not re-proposed. |
| Simulated execution | `POST …/execute-simulation` | Only from `APPROVED`; response states `SIMULATION ONLY`, `measured_savings: false`. |
| Audit history | `GET /api/v1/ps6/audit` | actor, UTC timestamp, action, previous/new state JSON. Application-level append-only, not tamper-proof. |
| PS6 demo page | `application/app/ps6/page.tsx`, `app/lib/ps6Api.ts` | Overview, room table, anomaly/peak estimate, editable settings, event timetable, recommendations, approval/simulation and audit. Verified with lint/build and local browser review; open `/ps6` directly. |

## Not implemented / not verified

- No external calendar-provider sync; events are entered in the local campus timetable.
- No trained peak-demand forecast, held-out evaluation, verified equipment diagnosis, or sensor accuracy claim. The current checks are transparent rules over simulated values.
- No real sensor feed or BMS integration. API actor labels provide audit attribution but are not authentication or backend RBAC.
