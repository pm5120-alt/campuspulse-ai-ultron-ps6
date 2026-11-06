# Project notes

CampusPulse AI has two parts: the inherited CampusIQ dashboard and the team’s PS6 occupancy-aware energy demo. The PS6 page is available at `/ps6` when the frontend and API are running locally.

## Current implementation

- The PS6 API serves deterministic, simulated room and energy readings.
- Users can manage a room timetable and compare expected occupancy with the sample readings.
- The service produces rule-based load flags, estimated recommendations, and a schedule-scaled peak estimate.
- Recommendations can be approved or rejected, then marked as executed in simulation. The service records these state changes in SQLite.
- Fire and server/network equipment are excluded from the proposed actions.
- Tests cover the telemetry-ingestion and PS6 service/API paths. The recorded results are in [TESTING_REPORT.md](TESTING_REPORT.md).

## Limits to keep in mind

- No real sensor feed, building-management integration, or equipment control is present.
- Timetable entries are manual; there is no external calendar sync.
- The PS6 checks are simple rules over simulated values, not a trained or field-validated forecast.
- Savings figures are estimates based on editable demo assumptions.
- The actor name is self-reported and is not authentication or role-based access control.
- The audit history is stored by the application and is not cryptographically protected.
- The inherited dashboard contains fixed demo values as well as model code and sample assets. Displayed metrics should not be read as live campus measurements or validated model performance.

## Layout

- `application/` — Next.js interface.
- `ML/api/main.py` — FastAPI routes, including the PS6 endpoints.
- `ML/api/ps6_service.py` — PS6 workflow and SQLite operations.
- `ML/models/`, `ML/data/`, and `ML/trained_models/` — inherited model code, sample data, and model artifacts.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the request flow and [FEATURES.md](FEATURES.md) for a capability-by-capability summary.
