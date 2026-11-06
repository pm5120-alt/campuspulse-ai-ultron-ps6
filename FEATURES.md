# What the project does

CampusPulse AI combines an inherited CampusIQ dashboard with a smaller PS6 occupancy and energy prototype. This page separates those parts so the demo’s scope is clear.

## PS6 demo

| Capability | What is implemented | Current limit |
| --- | --- | --- |
| Room readings | Deterministic sample occupancy and energy values for campus rooms. | Simulated data, not a sensor feed. |
| Timetable | Add, edit, list, remove, and compare manually entered room events. | No calendar-provider integration or automatic occupancy inference. |
| Load flags | Rule-based flags for selected unusual-load cases and a schedule-scaled peak estimate. | Not a trained forecast, equipment diagnosis, or validated prediction. |
| Recommendations | Recommendations based on the demo rules, with editable assumptions and bounds. | Savings and tariff values are estimates, not site-calibrated figures. |
| Equipment exclusions | Fire panels and server/network racks are excluded from proposed actions. | This is a software rule in the demo, not a physical safety interlock. |
| Review and audit | A named actor can approve or reject a recommendation; approved actions can be simulated and recorded. | The actor name is self-declared. The audit history is application-level, not tamper-proof. |

The service is in `ML/api/ps6_service.py`, its routes are in `ML/api/main.py`, and the interface is in `application/app/ps6/`.

## Constraint demonstrations

Open `/constraints` in the website for two interactive demos that submit requests to the telemetry API:

- **Constraint 2 — newest arrival wins:** send two conflicting energy readings with the same meter ID and stale event timestamp. They are submitted in sequence; the API reports the second as a duplicate replacement and the page shows its reading as the winner.
- **Constraint 4 — hostile input:** choose a missing field, invalid timestamp, negative or out-of-range value, unexpected Unicode or field, wrong type, malformed CSV, or malformed JSON. The page sends a batch with one valid row and one invalid row; the API should reject it with HTTP 422 and apply neither row.

These use synthetic demo readings. The telemetry store is in memory and is reset when the API restarts.

## Inherited campus dashboard

The repository also contains the CampusIQ multi-view dashboard, backend, sample datasets, model code, and serialized model assets. Some displayed values are fixed demonstration payloads. The inherited material is credited to its original author; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Not part of this prototype

- Live building sensors, building-management-system connections, or equipment control.
- External timetable/calendar synchronization.
- Verified forecast accuracy, anomaly precision, or measured energy savings.
- Authentication or server-side role enforcement for the actor name.
