# Setup Guide

Simulated demonstration only; no real equipment controls are connected.

## Backend

Python 3.10–3.13 (3.13 used in earlier verification; unit tests also pass on 3.12). From the repository root:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r ML/requirements.txt
uvicorn ML.api.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs. The SQLite file `ML/data/campuspulse.sqlite3` is created on first import; delete it only to intentionally reset schedules, recommendations and audit history. Set `CAMPUSPULSE_DB=/path/to/other.sqlite3` to use a throwaway database.

> `ML/requirements.txt` lists `httpx2`. This was recorded from an earlier session and could not be re-verified offline; Starlette's `TestClient` normally needs the package `httpx`. If `ML.test_ps6_api` fails on import, run `pip install httpx` and correct the requirement.

## Frontend

```bash
cd application
npm ci
npm run dev        # http://localhost:3000   → PS6 demo at http://localhost:3000/ps6
```

The API URL defaults to `http://localhost:8000`; override with `NEXT_PUBLIC_API_URL`. `/ps6` is not linked from the inherited sidebar.

## Checks

The current recorded checks and their scope are in [TESTING_REPORT.md](TESTING_REPORT.md). To rerun the focused backend suite and frontend checks:

```powershell
python -m unittest ML.test_telemetry_ingestion ML.test_telemetry_api ML.test_ps6_service ML.test_ps6_api
```

```powershell
cd application
npm run lint
npm run build
```

The separate legacy smoke script, `ML/test_api.py`, writes to the configured demo database. If you use it, set `CAMPUSPULSE_DB` to a disposable path first.

## Recommended demo sequence (open http://localhost:3000/ps6)

1. Read the SIMULATED banner and the executive overview.
2. In **Recommendations**, open the card for `…-F1-R01`: note the empty room, estimated before/after, assumptions, and the protected equipment that is excluded.
3. Confirm Approve/Reject are disabled with no name, and "Execute in simulation" is disabled while PENDING.
4. Enter an actor name (e.g. `facility-manager`), click **Approve**, then **Execute in simulation**.
5. Create a schedule for that room (expected people 0) and see the "Idle energy" flag in the timetable comparison.
6. Scroll to **Audit history** to show created → approved → executed_in_simulation with actor and status change.
7. Say plainly what is not covered (forecasting/anomaly not wired in; values are synthetic).

## Equivalent API sequence

`GET /api/v1/ps6/rooms` → `GET /api/v1/ps6/recommendations` → `POST /api/v1/ps6/recommendations/{id}/decision` `{"decision":"APPROVED","actor":"facility-manager"}` → `POST …/{id}/execute-simulation` `{"actor":"facility-manager"}` → `GET /api/v1/ps6/audit`.
