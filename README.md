# CAMPUSPULSE AI

### Occupancy-aware energy intelligence for campus facilities

**Team ULTRON | PS6 - The Sleeping Campus**

CAMPUSPULSE AI is a campus operations prototype that compares simulated room occupancy and energy readings with timetable entries. It presents reviewable energy recommendations with an approval step and an audit trail.

> **Demo boundary:** room readings and actions are simulated. Savings are estimates based on stated assumptions. The software does not connect to or control building equipment.

## PS6 capabilities

- Room-level simulated occupancy and energy readings across building, floor, and room inventory.
- Manually entered events/timetable with expected occupancy and a room comparison view.
- Rule-based unusual-load flags and schedule-scaled peak estimates over simulated readings.
- Reviewable savings estimates with bounded operating settings and assumptions shown.
- Fire panels and server/network racks are excluded from proposed control actions.
- Manual approve/reject gate, simulated execution, and an application-level audit history.

See [FEATURES.md](FEATURES.md) for the implementation map and limitations. The workflow is in `ML/api/ps6_service.py`, routes are in `ML/api/main.py`, and the interface is in `application/app/ps6/`.

## Competition constraints

- **Newest arrival wins:** records use the identity `[facility, domain, normalized entity ID, canonical UTC event timestamp]`. Arrival sequence is tracked separately; the last batch row wins a tie. See [TELEMETRY_INGESTION.md](TELEMETRY_INGESTION.md).
- **Hostile input:** CSV and JSON are validated against domain schemas, request and row limits, timestamp policy, identifier rules, finite numeric types and bounds. Invalid batches fail atomically with actionable errors.

## Run locally

Start the API from the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ML/requirements.txt
python -m uvicorn ML.api.main:app --reload --port 8000
```

In another terminal, start the web application:

```powershell
cd application
npm ci
npm run dev
```

Open `http://localhost:3000/ps6`. The frontend uses `NEXT_PUBLIC_API_URL` when set and otherwise targets `http://localhost:8000`.

## Verification (2026-11-06)

Verified locally from the repository root: `python -m unittest ML.test_telemetry_ingestion ML.test_telemetry_api ML.test_ps6_service ML.test_ps6_api` passed all 60 tests. From `application/`, `npm run lint` exited successfully and `npm run build` completed, generating `/`, `/_not-found`, and `/ps6`. The backend suite emitted a Plotly import warning and FastAPI/Pydantic deprecation notices; these did not fail the checks.

These checks establish local unit/API behavior and a production frontend build. They do not establish a public deployment, live sensors, real campus control, forecast accuracy, or field-validated savings. See [TESTING_REPORT.md](TESTING_REPORT.md).

## Team and attribution

**ULTRON** - Priyanshu Mishra and Argha Atta, SRM Institute of Science and Technology, Kattankulathur (SRM KTR).

This submission adapts the MIT-licensed [CampusIQ project by Omprakash Behera](https://github.com/CodeByPrakash/CampusIQ). The upstream copyright and license are retained in [LICENSE](LICENSE). The team's contribution boundary is documented in [TEAM.md](TEAM.md); inherited dashboard code, datasets, and model assets remain credited to the original author.
