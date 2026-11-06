# CampusPulse AI

CampusPulse AI is our PS6 prototype for exploring how campus room schedules and energy use could work together. The project includes a campus dashboard inherited from CampusIQ and a separate occupancy-aware energy demo at `/ps6`.

The PS6 page uses simulated rooms and readings. You can add timetable entries, review rule-based flags and estimated savings, approve or reject a recommendation, and record a simulated action in the audit history. Nothing here connects to or controls real building equipment, and the savings figures are examples rather than measured results.

## Run it locally

You’ll need Python and Node.js installed. Start the API from the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r ML/requirements.txt
python -m uvicorn ML.api.main:app --reload --port 8000
```

In a second terminal, start the web app:

```powershell
cd application
npm ci
npm run dev
```

Open [http://localhost:3000/ps6](http://localhost:3000/ps6) for the campus workflow or [http://localhost:3000/constraints](http://localhost:3000/constraints) for the two live constraint demos. The API defaults to `http://localhost:8000`; set `NEXT_PUBLIC_API_URL` if it runs somewhere else. API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

## What’s in the repo

- `application/` — the Next.js interface, including the inherited campus dashboard and the PS6 page.
- `ML/api/` — the FastAPI routes and PS6 workflow service.
- `ML/data/` and `ML/trained_models/` — sample data and model assets from the upstream project.
- `FEATURES.md` — a short guide to what is implemented and what remains a demo assumption.
- `SETUP_GUIDE.md`, `ARCHITECTURE.md`, and `TELEMETRY_INGESTION.md` — setup and implementation details.
- `TESTING_REPORT.md` — the latest recorded local checks and their limits.

The dashboard includes inherited demo data and model code. Its presence does not mean every dashboard metric is live or that the models have been validated for a real campus. The PS6 workflow is intentionally labeled as simulated.

## Checks

The latest recorded local checks are in [TESTING_REPORT.md](TESTING_REPORT.md). To run them again:

```powershell
python -m unittest ML.test_telemetry_ingestion ML.test_telemetry_api ML.test_ps6_service ML.test_ps6_api
```

```powershell
cd application
npm run lint
npm run build
```

These checks cover local code and a production frontend build. They do not verify live sensors, equipment control, model accuracy, or measured energy savings.

## Attribution

This project builds on [CampusIQ by Omprakash Behera](https://github.com/CodeByPrakash/CampusIQ). The upstream MIT notice for inherited portions is kept in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). There is no project-wide license for the team’s additions. See [TEAM.md](TEAM.md) for the contribution boundary.
