# CampusIQ ML Backend — Render Deployment & Maintenance Guide

This document provides a comprehensive operational guide for deploying, monitoring, and maintaining the **CampusIQ Multi-Sector Machine Learning Backend (FastAPI)** on [Render.com](https://render.com) with automated zero-downtime health checks.

---

## 1. System Architecture & Directory Layout

The ML microservice is built using **FastAPI** and serves multi-sector real-time analytics, Prophet + XGBoost energy forecasting, Isolation Forest anomaly detection, Random Forest predictive maintenance, and active continuous learning endpoints.

```
ML/
├── api/
│   ├── __init__.py
│   └── main.py                  # FastAPI Application & Healthcheck endpoints
├── config/
│   ├── __init__.py
│   └── facility_config.py       # Multi-Sector Facilities & GPS Metadata
├── data/
│   ├── generators/              # Synthetic 90-day & 180-day telemetry generators
│   └── generated/               # Generated CSV time-series datasets
├── models/
│   ├── __init__.py
│   ├── alert_classifier.py      # Alert prioritization & categorization
│   ├── aqi_forecaster.py        # Multi-pollutant AQI forecaster (XGBoost)
│   ├── continuous_learning.py   # Operator active feedback & retraining pipeline
│   ├── energy_anomaly.py        # Substation & Chiller Isolation Forest
│   ├── energy_forecaster.py     # Hybrid Prophet + XGBoost Load Forecaster
│   ├── facility_health.py       # Multi-axis Facility Health Engine
│   ├── pdm_model.py             # Predictive Maintenance & RUL (Random Forest)
│   ├── recommendation_engine.py # Sector actionable insights generator
│   ├── safety_model.py          # Spatial risk & hotspot clustering
│   ├── scenario_simulator.py    # Monte Carlo policy what-if impact simulator
│   ├── sustainability_scorer.py # 6-Axis ESG scorecard engine
│   └── water_anomaly.py         # Acoustic & hydrodynamic leak detector
├── trained_models/              # Serialized joblib/pickle model artifacts
├── requirements.txt             # Python dependencies
├── run_pipeline.py              # End-to-end training & validation script
├── test_api.py                  # Pytest / TestClient verification suite
└── DEPLOYMENT.md                # This deployment documentation
```

---

## 2. Prerequisites & Environment

- **Python Version**: `3.10.x` or `3.11.x` (Recommended: Python 3.11)
- **Render Service Type**: **Web Service** (Linux / Docker / Python native environment)
- **Base Memory**: Free Tier (512 MB) or Starter Tier (512 MB - 1 GB RAM)
- **Port Binding**: Dynamic port mapped via `$PORT` environment variable.

---

## 3. Step-by-Step Render Deployment Guide

### Method A: Web UI Manual Setup (Render Dashboard)

1. **Sign in to Render**: Log in at [dashboard.render.com](https://dashboard.render.com).
2. **Create New Web Service**:
   - Click **New +** > **Web Service**.
   - Connect your GitHub / GitLab repository (`CampusIQ` / `BPUT_Hackathon`).
3. **Configure Service Settings**:

| Setting | Value | Description |
| :--- | :--- | :--- |
| **Name** | `campusiq-ml-backend` | Unique identifier on Render |
| **Region** | `Singapore (Southeast Asia)` or `Frankfurt` | Pick region closest to your users |
| **Branch** | `main` (or active branch) | Production deployment branch |
| **Root Directory** | `ML` | Sets execution directory inside `ML/` |
| **Runtime** | `Python 3` | Native Python runtime |
| **Build Command** | `pip install -r requirements.txt && python run_pipeline.py` | Installs dependencies & pre-trains models |
| **Start Command** | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` | Starts FastAPI listening on Render's assigned port |
| **Instance Type** | `Free` or `Starter` | Suitable compute instance |

4. **Health Check Path Configuration**:
   - Under **Advanced Settings**, locate **Health Check Path**.
   - Set value to: `/health` (or `/api/v1/health`).
   - Render will send automated `GET` requests to this path during deployment and periodic health monitoring. A `200 OK` response guarantees zero-downtime rolling deploys.

5. **Environment Variables** (Optional):
   Under **Environment Variables**, configure:
   ```env
   PYTHONUNBUFFERED=1
   ENVIRONMENT=production
   ALLOWED_ORIGINS=*
   ```

6. **Deploy**: Click **Create Web Service**.

---

### Method B: Infrastructure as Code (`render.yaml` Blueprint)

You can also deploy automatically using the `render.yaml` file located in the root repository.

```yaml
services:
  - type: web
    name: campusiq-ml-backend
    env: python
    region: singapore
    plan: free
    rootDir: ML
    buildCommand: pip install -r requirements.txt && python run_pipeline.py
    startCommand: uvicorn api.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    autoDeploy: true
    envVars:
      - key: PYTHONUNBUFFERED
        value: "1"
      - key: ENVIRONMENT
        value: production
```

---

## 4. Health Check & Live Monitoring

### Health Check Endpoint Specification

- **Path**: `GET /health` or `GET /` or `GET /api/v1/health`
- **Expected Status**: `200 OK`
- **Response Payload**:
```json
{
  "status": "healthy",
  "service": "CampusIQ ML Backend",
  "version": "2.0.0",
  "timestamp": "2026-10-04T22:15:00.000000",
  "models_loaded": true,
  "active_sectors": [
    "engineering_college",
    "hospital",
    "industrial_estate",
    "municipal_campus"
  ]
}
```

### Verifying Service Health via CLI

Replace `<your-render-app-url>` with your deployed service URL (e.g. `https://campusiq-ml-backend.onrender.com`):

```bash
# 1. Test Healthcheck
curl -i https://campusiq-ml-backend.onrender.com/health

# 2. Test Sector Overview Endpoint
curl -i "https://campusiq-ml-backend.onrender.com/api/v1/dashboard/overview?facility_type=engineering_college"

# 3. Test Simulation Endpoint
curl -X POST https://campusiq-ml-backend.onrender.com/api/v1/simulation/run \
     -H "Content-Type: application/json" \
     -d '{"scenario_id":"reduce_hvac","parameter_pct":25.0,"target_buildings":["academic_block"],"simulation_period":"Next 4 weeks"}'
```

---

## 5. Connecting Next.js Frontend to Render Backend

In your Next.js frontend (`application/`):

1. Set the environment variable in `application/.env.local` or on your frontend host (e.g., Vercel / Render Static Site):
   ```env
   NEXT_PUBLIC_ML_API_URL=https://campusiq-ml-backend.onrender.com
   ```
2. Verify that [application/app/lib/api.ts](file:///c:/Users/absol/Desktop/BPUT_Hackathon/application/app/lib/api.ts) reads `process.env.NEXT_PUBLIC_ML_API_URL || "http://localhost:8000"`.

---

## 6. Maintenance & Routine Operations

### 1. Manual Retraining on Live Server
When new telemetry records are uploaded via the Data Upload Studio, the backend automatically triggers continuous learning loops. To manually trigger retraining:

```bash
curl -X POST https://campusiq-ml-backend.onrender.com/api/v1/continuous-learning/retrain
```

### 2. Viewing Real-time Application Logs
On the Render dashboard, navigate to **Logs** tab to view real-time uvicorn access logs, model training durations, and anomaly telemetry streams:
```
INFO:     10.0.0.1:48212 - "GET /health HTTP/1.1" 200 OK
INFO:     10.0.0.1:48214 - "GET /api/v1/energy/analytics?facility_type=engineering_college HTTP/1.1" 200 OK
[SyncAndLearn] Retrained Prophet + XGBoost Forecaster in 0.42s
```

### 3. Handling Render Free Tier Spin-Down (Cold Starts)
- Render Free instances spin down after 15 minutes of inactivity.
- On incoming requests, the service spins back up in ~30–45 seconds.
- **Pro-Tip**: Use a free uptime monitor (e.g., [UptimeRobot](https://uptimerobot.com) or GitHub Actions cron) pinging `https://<your-render-url>/health` every 10 minutes to keep the instance active during hackathon demos and evaluations.

---

## 7. API Endpoints Quick Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Render health check and uptime probe |
| `GET` | `/api/v1/facility/types` | List available sectors & facilities |
| `GET` | `/api/v1/dashboard/overview` | Main KPI cards, health score & alerts |
| `GET` | `/api/v1/campus-map/buildings` | GIS building telemetry & sensor counts |
| `GET` | `/api/v1/energy/analytics` | Load forecast, peak shaving & building breakdown |
| `GET` | `/api/v1/ai-insights` | Filtered anomaly diagnosis & AI actions |
| `GET` | `/api/v1/assets/operations` | Random Forest asset health & vibration telemetry |
| `POST` | `/api/v1/simulation/run` | Monte Carlo policy scenario simulator |
| `GET` | `/api/v1/reports/sustainability` | 6-Axis ESG scorecard & period comparisons |
| `GET` | `/api/v1/safety/overview` | Spatial hazard clustering & incident metrics |
| `POST` | `/api/v1/continuous-learning/feedback` | Operator anomaly confirmation loop |
| `POST` | `/api/v1/continuous-learning/sync-and-learn` | Telemetry CSV ingestion & live retrain |
