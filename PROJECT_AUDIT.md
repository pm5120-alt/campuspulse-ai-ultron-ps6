# CampusIQ PS6 Repository Audit

Audit target: the supplied `CampusIQ-main.zip` source. This audit distinguishes code paths observed in the repository from claims in its README. `IMPLEMENTED AND TESTED` is not assigned unless runtime verification is available.

## Original repository

- MIT-licensed CampusIQ by Omprakash Behera (copyright notice in `LICENSE`). Preserve that notice and attribution in redistributed copies.
- Frontend: Next.js 16 / React 19 / TypeScript / Tailwind 4, under `application/`.
- Backend: FastAPI, pandas, scikit-learn, Prophet/XGBoost optional model imports under `ML/`.
- CSV synthetic telemetry and serialized model artifacts are present in `ML/data/generated/` and `ML/trained_models/`.
- The README describes BPUT PS-4, not the requested PS6 occupancy-aware energy problem.
- The UI is an eight-view multi-sector facility dashboard. No database, room-level model, timetable editor, or approval workflow existed in the inspected source.

## Architecture overview

`application/app/page.tsx` orchestrates login, navigation, and dashboard data loading. `application/app/lib/api.ts` calls the FastAPI service. `ML/api/main.py` loads CSVs and model objects into module-level dictionaries and exposes dashboard, analytics, insights, simulation, sustainability, safety, and feedback routes. `ML/models/` contains forecasting, anomaly, recommendation, safety and other model classes. A new `ML/api/ps6_service.py` adds a local SQLite store for room schedule CRUD, recommendation state transitions, and append-only audit events; corresponding `/api/v1/ps6/*` endpoints are in `ML/api/main.py`.

## PS6 compliance matrix (honest status)

Status vocabulary: IMPLEMENTED = built and covered by a test that was run; PARTIAL = some of it built; NOT DONE; UNVERIFIED = code exists but not run in a real toolchain.

| # | PS6 expectation | Status | Evidence / limitation |
|---|---|---|---|
| 1 | Room-level occupancy & energy monitoring (supplied/simulated) | PARTIAL | Simulated rooms API (tested, service level) and `/ps6` table (UNVERIFIED build). No history charts, no real feed. |
| 2 | Timetable / event-calendar integration | PARTIAL | CRUD + schedule-vs-simulated comparison tested at service level; UI form UNVERIFIED. No event calendar, conflict detection or occupancy inference. |
| 3 | Unusual consumption / equipment-issue detection | PARTIAL | Inherited Isolation-Forest/z-score code only; not wired to PS6 rooms; no held-out evaluation. Only a rule-based "idle energy" flag exists for PS6. |
| 4 | Peak-demand forecasting & saving recommendations | PARTIAL | Recommendations: transparent rule (tested). Forecasting: inherited models only, unvalidated, not in PS6 flow. |
| 5 | Essential-equipment protection & configurable constraints | PARTIAL | Protection enforced and tested; constraints (22 °C, 25 %, ₹7.5) are hard-coded, not configurable. |
| 6 | Before/after savings, manual approval, audit history | IMPLEMENTED (backend) / UNVERIFIED (UI) | Full state machine and audit tested (28 tests). Savings are estimates; execution is simulation only. |
| - | Executive overview / savings simulator UI | PARTIAL | Overview KPIs on `/ps6`; no PS6 what-if simulator. |
| - | Auth/RBAC on actor identity | NOT DONE | Actor is a self-declared string. |

**Submission readiness: NOT declared.** Blockers are listed in `TESTING_REPORT.md` (frontend lint, unbuilt `/ps6` page, remaining moderate audit findings, un-rerun HTTP/live checks).

## Existing behavior requiring caution

The source code returns fixed dashboard KPI cards, fixed actual/forecast chart arrays, fixed energy insights and recommendation strings, fixed recent asset alerts, fixed sustainability inputs/trends, and fabricated numeric sync/retraining metrics (including F1 and RMSE improvement). These are UI/demo payloads and must not be presented as measured performance. The repository README's accuracy metrics were not reproduced by a validation run. The legacy API enables wildcard CORS with credentials and has no backend authentication/RBAC enforcement; frontend persona selection is not server-side authorization.

## Validation and audit scope

The initial audit was static. A later verification run used the project's Python and Node environments; see `TESTING_REPORT.md` for the test results, remaining lint errors, and limits.

## Verification update (Session A, earlier)

Subsequent local verification was performed with Python 3.13.14 and Node.js 24.21.0. Four PS6 unit tests, the backend API test script, Python compile checks, the live health/room/recommendation/audit workflow, and the frontend production build passed. The frontend lint command still reports 72 errors and 116 warnings; see `TESTING_REPORT.md` for details. A timetable create request exposed an optional-ID bug (`id: null`); the service now generates an ID for null or omitted IDs and the regression/API checks pass.

## Session B update

Backend fixes (rejected-recommendation re-proposal, service-level validation incl. mixed timezone handling, actor checks, 422 for invalid decisions, `CAMPUSPULSE_DB` override), 28 offline tests, an HTTP test module (skipped offline), a typed PS6 client and a `/ps6` page were added. Frontend lint/build/audit, FastAPI-dependent tests and live checks could not be run (no network). See `TESTING_REPORT.md`.
