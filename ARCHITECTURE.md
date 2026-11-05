# Architecture

## Existing system (CampusIQ, original author Omprakash Behera)

- `application/`: Next.js 16 client; `app/page.tsx` is the view orchestrator, `app/lib/api.ts` the API client.
- `ML/api/main.py`: FastAPI app; loads CSVs and joblib artifacts into process memory at import.
- `ML/models/`, `ML/data/generated/`, `ML/trained_models/`: model code, synthetic data, serialized models.

## PS6 additions

```
/ps6 page (React) ──► app/lib/ps6Api.ts ──► FastAPI /api/v1/ps6/* ──► PS6Service ──► SQLite
```

- `ML/api/ps6_service.py` — framework-free service (stdlib only). Owns room simulation, schedule validation/CRUD, recommendation generation and state machine, audit inserts. Each operation runs in one transaction (`_connect()` commits, rolls back on error and always closes the connection).
- `ML/api/main.py` — Pydantic request models and thin routes. Service `ValueError`s map to 422 (validation) or 409 (illegal state transition); unknown IDs map to 404.
- Database path: `ML/data/campuspulse.sqlite3`, overridable with the `CAMPUSPULSE_DB` environment variable (used by tests).

### Recommendation state machine

`PENDING → APPROVED → EXECUTED IN SIMULATION`, or `PENDING → REJECTED`. No other transitions are allowed; failed transitions write no audit row. A room with a PENDING, APPROVED, REJECTED or EXECUTED proposal is not re-proposed.

### Safety design

Protected (fire, network/server) equipment is never in `affected_equipment`. Execution requires a prior APPROVED decision by a named actor. Execution only updates the SQLite row; no code path contacts equipment.

## Trust boundaries and known gaps

Backend has no authentication/RBAC (the actor string is self-declared), CORS is inherited as wildcard-with-credentials, and the audit table is not cryptographically immutable. Telemetry, tariff and savings are synthetic assumptions. The inherited API/UI limitations are listed in `PROJECT_AUDIT.md`.
