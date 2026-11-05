"""
CampusIQ ML Backend API
Provides REST endpoints for all 8 Dashboard Navigation Views, Multi-Sector configurations,
Scenario Simulation, and Continuous Active Learning feedback loops.
"""
import os
import sys
import threading
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Any, List, Optional
from fastapi import FastAPI, Query, HTTPException, Body, Request
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse
from pydantic import BaseModel, Field, StrictStr
from datetime import timezone

try:
    from ML.api.ps6_service import PS6Service
    from ML.api.telemetry_ingestion import (
        MAX_CSV_BYTES, MAX_ROWS, TelemetryValidationError, merge_batch,
        parse_csv_batch, validate_records,
    )
except ImportError:
    from ps6_service import PS6Service
    from telemetry_ingestion import (
        MAX_CSV_BYTES, MAX_ROWS, TelemetryValidationError, merge_batch,
        parse_csv_batch, validate_records,
    )

# Add ML root and project root to path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.abspath(os.path.join(current_dir, '..'))
project_root = os.path.abspath(os.path.join(ml_dir, '..'))

for p in [project_root, ml_dir, current_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from ML.config.facility_config import (
        FACILITY_TYPES, DEFAULT_FACILITY, get_facility_config, get_all_facility_types, get_buildings
    )
    from ML.models import (
        EnergyForecaster,
        EnergyAnomalyDetector,
        WaterAnomalyDetector,
        WastePredictor,
        AQIForecaster,
        PredictiveMaintenanceModel,
        FacilityHealthEngine,
        ScenarioSimulator,
        SustainabilityScorer,
        SafetyRiskClassifier,
        AlertClassifier,
        RecommendationEngine,
        ContinuousLearningPipeline
    )
except ImportError:
    from config.facility_config import (
        FACILITY_TYPES, DEFAULT_FACILITY, get_facility_config, get_all_facility_types, get_buildings
    )
    from models import (
        EnergyForecaster,
        EnergyAnomalyDetector,
        WaterAnomalyDetector,
        WastePredictor,
        AQIForecaster,
        PredictiveMaintenanceModel,
        FacilityHealthEngine,
        ScenarioSimulator,
        SustainabilityScorer,
        SafetyRiskClassifier,
        AlertClassifier,
        RecommendationEngine,
        ContinuousLearningPipeline
    )

app = FastAPI(
    title="CampusIQ Facility Intelligence ML API",
    description="Multi-Sector AI Engine for Smart Estate and Facility Decision Support",
    version="2.0.0"
)

_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
# CAMPUSPULSE_DB lets tests/demos use a throwaway database without touching persistent demo history.
PS6 = PS6Service(os.environ.get("CAMPUSPULSE_DB") or os.path.join(_project_root, "ML", "data", "campuspulse.sqlite3"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def limit_telemetry_upload_size(request: Request, call_next):
    if request.url.path == "/api/v1/continuous-learning/sync-and-learn":
        declared = request.headers.get("content-length")
        if declared and declared.isdigit() and int(declared) > MAX_CSV_BYTES:
            return JSONResponse(status_code=413, content={"detail": {
                "message": "Telemetry request exceeds the 1 MiB limit.", "errors": [],
                "accepted": 0, "rejected": 0, "duplicates": 0,
            }})
        body = await request.body()
        if len(body) > MAX_CSV_BYTES:
            return JSONResponse(status_code=413, content={"detail": {
                "message": "Telemetry request exceeds the 1 MiB limit.", "errors": [],
                "accepted": 0, "rejected": 0, "duplicates": 0,
            }})
    return await call_next(request)

# -------------------------------------------------------------
# HEALTH CHECK & SERVICE STATUS (Render / Cloud Health Monitoring)
# -------------------------------------------------------------
@app.get("/")
@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    """Health check endpoint for Render service uptime monitoring."""
    return {
        "status": "healthy",
        "service": "CampusIQ ML Backend",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": len(MODELS) > 0,
        "active_sectors": list(FACILITY_TYPES.keys()) if 'FACILITY_TYPES' in globals() else ["engineering_college"]
    }

# Global model holders & cached datasets
MODELS = {}
DATASETS = {}
CL_PIPELINE = None
TELEMETRY_MERGE_LOCK = threading.RLock()

@app.on_event("startup")
def load_all_models():
    global MODELS, DATASETS, CL_PIPELINE
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "trained_models")
    data_dir = os.path.join(base_dir, "data", "generated")

    CL_PIPELINE = ContinuousLearningPipeline(storage_dir=os.path.join(models_dir, "continuous_learning"))

    # Load datasets for default facility
    for ftype in FACILITY_TYPES.keys():
        try:
            DATASETS[ftype] = {
                "energy": pd.read_csv(os.path.join(data_dir, f"energy_{ftype}.csv")),
                "water": pd.read_csv(os.path.join(data_dir, f"water_{ftype}.csv")),
                "waste": pd.read_csv(os.path.join(data_dir, f"waste_{ftype}.csv")),
                "aqi": pd.read_csv(os.path.join(data_dir, f"aqi_{ftype}.csv")),
                "assets": pd.read_csv(os.path.join(data_dir, f"assets_{ftype}.csv")),
                "safety": pd.read_csv(os.path.join(data_dir, f"safety_{ftype}.csv")),
            }
        except Exception:
            pass

    # Initialize / Load trained models
    try:
        MODELS["energy_anomaly"] = EnergyAnomalyDetector()
        MODELS["energy_anomaly"].load(models_dir)
    except Exception:
        pass

    try:
        MODELS["energy_forecaster"] = EnergyForecaster()
        MODELS["energy_forecaster"].load(models_dir)
    except Exception:
        pass

    try:
        MODELS["water_anomaly"] = WaterAnomalyDetector()
        MODELS["water_anomaly"].load(models_dir)
    except Exception:
        pass

    try:
        MODELS["waste_predictor"] = WastePredictor()
        MODELS["waste_predictor"].load(models_dir)
    except Exception:
        pass

    try:
        MODELS["aqi_forecaster"] = AQIForecaster()
        MODELS["aqi_forecaster"].load(models_dir)
    except Exception:
        pass

    try:
        MODELS["pdm"] = PredictiveMaintenanceModel()
        MODELS["pdm"].load(models_dir)
    except Exception:
        pass

    try:
        MODELS["safety_model"] = SafetyRiskClassifier()
        MODELS["safety_model"].load(models_dir)
    except Exception:
        pass

    MODELS["scenario_simulator"] = ScenarioSimulator()
    MODELS["sustainability_scorer"] = SustainabilityScorer()
    MODELS["alert_classifier"] = AlertClassifier()
    MODELS["recommendation_engine"] = RecommendationEngine()

    print("[OK] CampusIQ Models and Datasets initialized.")


# Helper to get sector data
def _get_sector_data(facility_type: str):
    if not DATASETS:
        load_all_models()
    ft = facility_type if facility_type in DATASETS else DEFAULT_FACILITY
    if ft not in DATASETS or not DATASETS.get(ft):
        load_all_models()
    return DATASETS.get(ft, DATASETS.get(DEFAULT_FACILITY, {}))


# -------------------------------------------------------------
# 1. FACILITY CONFIGURATION & SECTORS
# -------------------------------------------------------------
@app.get("/api/v1/facility/types")
def list_facilities():
    return {
        "current_default": DEFAULT_FACILITY,
        "facility_types": get_all_facility_types(),
        "sectors_supported": ["Engineering College", "Hospital", "Industrial Estate", "Municipal Campus"]
    }

@app.get("/api/v1/facility/config")
def get_facility_metadata(facility_type: str = Query(DEFAULT_FACILITY)):
    return get_facility_config(facility_type)


# -------------------------------------------------------------
# 2. MAIN DASHBOARD OVERVIEW
# -------------------------------------------------------------
@app.get("/api/v1/dashboard/overview")
def get_dashboard_overview(facility_type: str = Query(DEFAULT_FACILITY)):
    data = _get_sector_data(facility_type)
    health_engine = FacilityHealthEngine(facility_type=facility_type)

    df_e = data["energy"].tail(168)
    df_w = data["water"].tail(168)
    df_ws = data["waste"].tail(168)
    df_aq = data["aqi"].tail(24)
    df_as = data["assets"].groupby('asset_id').last().reset_index()

    # Model inference
    e_anom = MODELS["energy_anomaly"].detect(df_e) if "energy_anomaly" in MODELS else df_e.assign(is_anomaly_pred=False)
    w_anom = MODELS["water_anomaly"].detect(df_w) if "water_anomaly" in MODELS else df_w.assign(is_anomaly_pred=False)
    ws_pred = MODELS["waste_predictor"].predict(df_ws) if "waste_predictor" in MODELS else df_ws.assign(is_overflow=False)
    as_assess = MODELS["pdm"].assess_assets(df_as) if "pdm" in MODELS else df_as.assign(health_status="Healthy")

    avg_aqi = float(df_aq['aqi'].mean()) if not df_aq.empty else 42.0

    health_summary = health_engine.calculate_health(
        energy_anomalies_count=int(e_anom['is_anomaly_pred'].sum()),
        energy_total_buildings=df_e['building_id'].nunique(),
        water_anomalies_count=int(w_anom['is_anomaly_pred'].sum()),
        waste_overflows_count=int(ws_pred['is_overflow'].sum()),
        waste_total_bins=df_ws['bin_id'].nunique(),
        avg_aqi=avg_aqi,
        assets_critical_count=int((as_assess['health_status'] == 'Critical').sum()),
        assets_total_count=len(as_assess),
        safety_incidents_active=1
    )

    alerts = MODELS["alert_classifier"].compile_dashboard_alerts(
        energy_anomalies=e_anom,
        water_anomalies=w_anom,
        waste_overflows=ws_pred,
        aqi_status={"aqi": int(avg_aqi), "category": "Good"},
        asset_alerts=as_assess
    )

    # Dynamic rolling 7-day trend points & dates
    daily_energy = df_e.groupby(df_e['timestamp'].astype(str).str[:10])['kwh'].sum().tail(7).tolist()
    daily_water = (df_w.groupby(df_w['timestamp'].astype(str).str[:10])['litres'].sum() / 1000.0).tail(7).round(1).tolist()
    daily_waste = (df_ws.groupby(df_ws['timestamp'].astype(str).str[:10])['fill_level_kg'].sum() / 10.0).tail(7).round(0).tolist()

    now = datetime.now()
    trend_dates = [(now - timedelta(days=6 - i)).strftime("%b %d") for i in range(7)]

    return {
        "facility_type": facility_type,
        "kpi_cards": {
            "energy_usage_kwh": 24850,
            "energy_change_pct": 12,
            "water_usage_kl": 124,
            "water_change_pct": -8,
            "waste_collected_kg": 680,
            "waste_change_pct": 5,
            "air_quality_aqi": int(avg_aqi),
            "air_quality_status": "Good" if avg_aqi <= 50 else "Moderate"
        },
        "facility_health": health_summary,
        "alerts": alerts[:4],
        "trends_7days": {
            "dates": trend_dates,
            "energy_kwh": daily_energy if len(daily_energy) == 7 else [1250, 1340, 1480, 1520, 1380, 1290, 1620],
            "water_kl": daily_water if len(daily_water) == 7 else [340, 390, 420, 480, 450, 430, 490],
            "waste_kg": daily_waste if len(daily_waste) == 7 else [65, 72, 78, 85, 80, 75, 90]
        }
    }


# -------------------------------------------------------------
# 3. CAMPUS MAP & SENSOR OVERLAY
# -------------------------------------------------------------
@app.get("/api/v1/campus-map/buildings")
def get_campus_map_status(facility_type: str = Query(DEFAULT_FACILITY)):
    buildings = get_buildings(facility_type)
    data = _get_sector_data(facility_type)

    # Building health tagging
    building_statuses = []
    status_counts = {"Normal": 0, "Warning": 0, "Critical": 0, "Offline": 0}

    sample_notes = {
        "academic_block": "High Energy Usage (35% spike)",
        "canteen": "Waste 80% Full",
        "hostel_a": "Normal",
        "admin_block": "Normal",
        "library": "Normal",
        "sports_complex": "Normal"
    }

    for b in buildings:
        bid = b["id"]
        note = sample_notes.get(bid, "Normal")
        status = "Warning" if "High Energy" in note or "Waste" in note else "Normal"
        status_counts[status] += 1

        building_statuses.append({
            "id": bid,
            "name": b["name"],
            "occupancy": b["occupancy"],
            "area_sqm": b["area_sqm"],
            "live_status": status,
            "status_label": note,
            "sensors_count": 8,
            "active_anomalies": 1 if status != "Normal" else 0
        })

    return {
        "facility_type": facility_type,
        "total_buildings": len(buildings),
        "active_sensors": len(buildings) * 8,
        "live_alerts": 4,
        "facility_health_pct": 86,
        "status_distribution": status_counts,
        "buildings": building_statuses
    }


# -------------------------------------------------------------
# 4. ENERGY ANALYTICS & FORECASTING
# -------------------------------------------------------------
@app.get("/api/v1/energy/analytics")
def get_energy_analytics(facility_type: str = Query(DEFAULT_FACILITY)):
    data = _get_sector_data(facility_type)
    df_e = data["energy"]

    # Consumption by building breakdown
    b_breakdown = df_e.groupby('building_name')['kwh'].sum().sort_values(ascending=False).to_dict()

    # Actual vs Forecast 7-day timeline
    actual_series = [1050, 720, 1300, 700, 920, 950, 1680, 850, 1200, 930, 1150]
    forecast_series = [None]*7 + [1120, 950, 1250, 1300, 1100, 980]

    return {
        "facility_type": facility_type,
        "kpis": {
            "total_consumption_kwh": 24850,
            "total_consumption_delta_pct": 12,
            "peak_demand_kw": 320,
            "peak_demand_delta_pct": 5,
            "estimated_cost_inr": 248500,
            "estimated_cost_delta_pct": 10,
            "carbon_emissions_tco2": 18.2,
            "carbon_emissions_delta_pct": 12
        },
        "consumption_by_building": [
            {"building": b_name, "kwh": int(kwh_val)} for b_name, kwh_val in b_breakdown.items()
        ],
        "actual_vs_forecast": {
            "dates": ["Nov 10", "Nov 11", "Nov 12", "Nov 13", "Nov 14", "Nov 15", "Nov 16"],
            "actual_kwh": actual_series,
            "forecast_kwh": forecast_series,
            "anomaly_points": [{"date": "Nov 13", "kwh": 1680, "severity": "Critical"}]
        },
        "ai_insights": {
            "title": "Energy usage in Academic Block is 35% higher than usual between 2 PM - 5 PM.",
            "recommended_actions": [
                "Check if HVAC systems are running longer than required.",
                "Consider adjusting schedule by -10%.",
                "Potential savings: ~₹12,000/month."
            ]
        }
    }


# -------------------------------------------------------------
# 5. AI INSIGHTS & ANOMALIES
# -------------------------------------------------------------
@app.get("/api/v1/ai-insights")
def get_ai_insights(facility_type: str = Query(DEFAULT_FACILITY), domain: Optional[str] = Query("All")):
    data = _get_sector_data(facility_type)
    rec_engine = MODELS["recommendation_engine"]

    all_insights = rec_engine.generate_all_insights(
        energy_df=data["energy"],
        water_df=data["water"],
        waste_df=data["waste"],
        aqi_df=data["aqi"],
        asset_df=data["assets"],
        facility_type=facility_type
    )

    if domain and domain.lower() != "all":
        filtered = [i for i in all_insights if i["domain"].lower() == domain.lower()]
    else:
        filtered = all_insights

    return {
        "facility_type": facility_type,
        "selected_domain": domain,
        "total_insights": len(filtered),
        "insights": filtered
    }


# -------------------------------------------------------------
# 6. ASSETS & OPERATIONS
# -------------------------------------------------------------
@app.get("/api/v1/assets/operations")
def get_asset_operations(facility_type: str = Query(DEFAULT_FACILITY)):
    data = _get_sector_data(facility_type)
    df_as = data["assets"].groupby("asset_id").last().reset_index()

    pdm_model = MODELS["pdm"]
    assessed = pdm_model.assess_assets(df_as)

    crit_count = int((assessed['health_status'] == 'Critical').sum())
    maint_count = int((assessed['health_status'] == 'Warning').sum())
    norm_count = len(assessed) - crit_count - maint_count

    recent_alerts = [
        {
            "asset_name": "AC Unit - Block B",
            "severity": "Critical",
            "issue": "Performance drop detected (thermal efficiency degraded 24%)",
            "timestamp": "Today, 05:45 AM"
        },
        {
            "asset_name": "Water Pump - Hostel A",
            "severity": "Warning",
            "issue": "Vibration levels higher than normal (4.6 mm/s)",
            "timestamp": "Today, 08:20 AM"
        },
        {
            "asset_name": "Generator - Admin Block",
            "severity": "Info",
            "issue": "Scheduled maintenance due in 5 days",
            "timestamp": "Today, 07:10 AM"
        },
        {
            "asset_name": "Lift - Library",
            "severity": "Info",
            "issue": "Operating normally",
            "timestamp": "Today, 06:30 AM"
        }
    ]

    return {
        "facility_type": facility_type,
        "summary": {
            "total_assets": len(assessed),
            "active": norm_count,
            "under_maintenance": maint_count,
            "critical": crit_count
        },
        "equipment_status_chart": {
            "operational_pct": 95,
            "maintenance_pct": 3,
            "faulty_pct": 2
        },
        "maintenance_alerts": recent_alerts
    }


# -------------------------------------------------------------
# 7. SCENARIO SIMULATION
# -------------------------------------------------------------
class SimulationRequest(BaseModel):
    scenario_id: str = Field(..., example="reduce_hvac")
    parameter_pct: float = Field(..., example=25.0)
    target_buildings: List[str] = Field(..., example=["academic_block", "admin_block"])
    simulation_period: str = Field("Next 4 weeks", example="Next 4 weeks")

@app.post("/api/v1/simulation/run")
def run_simulation(req: SimulationRequest):
    weeks_map = {"Next 1 week": 1, "Next 2 weeks": 2, "Next 4 weeks": 4, "Next 3 months": 12}
    weeks = weeks_map.get(req.simulation_period, 4)

    simulator = MODELS["scenario_simulator"]
    result = simulator.simulate(
        scenario_id=req.scenario_id,
        parameter_pct=req.parameter_pct,
        target_buildings=req.target_buildings,
        simulation_weeks=weeks
    )
    return result


# -------------------------------------------------------------
# 8. REPORTS & SUSTAINABILITY SCORECARD
# -------------------------------------------------------------
@app.get("/api/v1/reports/sustainability")
def get_sustainability_reports(facility_type: str = Query(DEFAULT_FACILITY)):
    scorer = MODELS["sustainability_scorer"]
    scorecard = scorer.calculate_scorecard(
        energy_kwh_total=24850,
        solar_generation_kwh=4200,
        water_kl_total=124,
        rainwater_harvested_kl=32,
        waste_total_kg=680,
        waste_recycled_kg=480,
        avg_aqi=42.0,
        safety_incidents_resolved_pct=95.0,
        asset_maintenance_compliance_pct=92.0
    )

    # Dynamic rolling 5 months
    now = datetime.now()
    month_names = [(now.replace(day=1) - timedelta(days=30 * (4 - i))).strftime("%b") for i in range(5)]

    monthly_trends = {
        "months": month_names,
        "energy": [3100, 3600, 3450, 3350, 2600],
        "water": [2050, 2580, 2300, 2010, 1580],
        "waste": [1520, 1600, 1510, 1390, 1050]
    }

    return {
        "facility_type": facility_type,
        "scorecard": scorecard,
        "monthly_trends": monthly_trends,
        "deltas_vs_previous_month": {
            "energy_pct": 12,
            "water_pct": 8,
            "waste_pct": 5,
            "carbon_emissions_pct": -15
        }
    }


# -------------------------------------------------------------
# 9. SAFETY DASHBOARD
# -------------------------------------------------------------
@app.get("/api/v1/safety/overview")
def get_safety_overview(facility_type: str = Query(DEFAULT_FACILITY)):
    data = _get_sector_data(facility_type)
    safety_model = MODELS["safety_model"]
    analysis = safety_model.analyze_zones(data["safety"])
    return {
        "facility_type": facility_type,
        "safety_analytics": analysis
    }


# -------------------------------------------------------------
# 10. CONTINUOUS LEARNING & ACTIVE ANOMALY FEEDBACK
# -------------------------------------------------------------
class AnomalyFeedbackRequest(BaseModel):
    domain: str = Field(..., example="Energy")
    entity_id: str = Field(..., example="academic_block")
    timestamp: str = Field(..., example="2026-10-04T10:00:00")
    is_true_anomaly: bool = Field(..., example=True)
    operator_notes: str = Field("", example="Chiller timer malfunction confirmed by technician.")
    feature_vector: dict = Field(default_factory=dict)

@app.post("/api/v1/continuous-learning/feedback")
def submit_anomaly_feedback(req: AnomalyFeedbackRequest):
    if not CL_PIPELINE:
        raise HTTPException(status_code=500, detail="Continuous learning engine uninitialized.")

    res = CL_PIPELINE.log_anomaly_feedback(
        domain=req.domain,
        entity_id=req.entity_id,
        timestamp=req.timestamp,
        feature_vector=req.feature_vector,
        is_true_anomaly=req.is_true_anomaly,
        operator_notes=req.operator_notes
    )
    return res

@app.post("/api/v1/continuous-learning/retrain")
def trigger_continuous_retrain():
    if not CL_PIPELINE:
        raise HTTPException(status_code=500, detail="Continuous learning engine uninitialized.")

    current_data = DATASETS.get(DEFAULT_FACILITY, {})
    res = CL_PIPELINE.trigger_retraining(MODELS, current_data)
    return res


class SyncAndLearnRequest(BaseModel):
    model_config = {"extra": "forbid"}
    facility_type: StrictStr = Field(DEFAULT_FACILITY, min_length=1, max_length=64, example="engineering_college")
    domain: StrictStr = Field("energy", min_length=1, max_length=32, example="energy")
    csv_data: Optional[StrictStr] = Field(None)
    records: Optional[List[Any]] = Field(None)
    operator_note: Optional[StrictStr] = Field("Telemetry upload", max_length=256)


@app.exception_handler(RequestValidationError)
async def telemetry_request_validation_errors(request: Request, exc: RequestValidationError):
    if request.url.path == "/api/v1/continuous-learning/sync-and-learn":
        errors = []
        for item in exc.errors()[:100]:
            location = item.get("loc", ())
            row_index = next((location[index + 1] for index, part in enumerate(location[:-1]) if part == "records" and isinstance(location[index + 1], int)), None)
            field_parts = [part for part in location if isinstance(part, str) and part != "body"]
            field = (field_parts[-1] if field_parts else "request")[:64]
            errors.append({"row": row_index + 1 if row_index is not None else None, "field": field, "message": "Value has the wrong type or is outside the request schema."})
        return JSONResponse(status_code=422, content={"detail": {
            "message": "Telemetry request rejected; no records were applied.",
            "errors": errors, "accepted": 0, "rejected": max(1, len(errors)), "duplicates": 0,
        }})
    return await request_validation_exception_handler(request, exc)


@app.post("/api/v1/continuous-learning/sync-and-learn")
def sync_and_learn_telemetry(req: SyncAndLearnRequest):
    """
    Ingests live telemetry stream / CSV records, updates active datasets,
    triggers model retraining across Prophet, XGBoost, and Isolation Forest,
    and returns newly converged ML metrics.
    """
    if req.facility_type not in FACILITY_TYPES:
        raise HTTPException(status_code=422, detail={"message": "Unknown facility_type.", "errors": [{"row": None, "field": "facility_type", "message": "Choose a supported facility."}], "accepted": 0, "rejected": 0, "duplicates": 0})
    if req.domain not in {"energy", "water", "waste", "aqi", "assets"}:
        raise HTTPException(status_code=422, detail={"message": "Unsupported telemetry domain.", "errors": [{"row": None, "field": "domain", "message": "Choose energy, water, waste, aqi, or assets."}], "accepted": 0, "rejected": 0, "duplicates": 0})
    if req.csv_data is not None and req.records is not None:
        raise HTTPException(status_code=422, detail={"message": "Provide either csv_data or records, not both.", "errors": [{"row": None, "field": "csv_data", "message": "Choose one upload format."}], "accepted": 0, "rejected": 0, "duplicates": 0})

    facility_type = req.facility_type
    data_store = DATASETS.get(facility_type)
    if data_store is None or req.domain not in data_store:
        raise HTTPException(status_code=422, detail={"message": "No telemetry store is available for this facility and domain.", "errors": [{"row": None, "field": "domain", "message": "Choose a supported telemetry store."}], "accepted": 0, "rejected": 0, "duplicates": 0})

    try:
        if req.csv_data is not None:
            parsed_records = parse_csv_batch(req.csv_data, req.domain)
            upload_source = "csv"
        elif req.records is not None:
            parsed_records = validate_records(req.records, req.domain)
            upload_source = "records"
        else:
            parsed_records = []
            upload_source = "existing"
    except TelemetryValidationError as exc:
        rejected = exc.rejected or (len(req.records) if req.records is not None else 1)
        raise HTTPException(status_code=422, detail={
            "message": "Telemetry batch rejected; no records were applied.",
            "errors": exc.errors[:100], "accepted": 0, "rejected": rejected, "duplicates": 0,
        }) from None

    counts = {"accepted": 0, "rejected": 0, "duplicates": 0}
    if parsed_records:
        with TELEMETRY_MERGE_LOCK:
            merged, counts = merge_batch(data_store[req.domain], parsed_records, facility_type, req.domain, upload_source)
            # Single assignment after the complete batch has passed validation.
            data_store[req.domain] = merged
    records_count = counts["accepted"]
    active_data = data_store[req.domain]
    metric = {"energy": "kwh", "water": "litres", "waste": "fill_level_kg", "aqi": "aqi_index", "assets": "vibration_mm_s"}[req.domain]
    values = pd.to_numeric(active_data[metric], errors="coerce").dropna() if metric in active_data else pd.Series(dtype=float)
    mean_val = round(float(values.mean()), 2) if not values.empty else None
    peak_val = round(float(values.max()), 2) if not values.empty else None

    # Trigger model retraining on updated stream
    retrained_modules = []
    retraining_errors = []
    try:
        if req.domain == "energy" and "energy_forecaster" in MODELS and "energy" in data_store:
            MODELS["energy_forecaster"].train(data_store["energy"].tail(200))
            retrained_modules.append("Energy forecaster")
    except Exception:
        retraining_errors.append("Energy forecaster")

    try:
        if req.domain == "energy" and "energy_anomaly" in MODELS and "energy" in data_store:
            MODELS["energy_anomaly"].train(data_store["energy"].tail(200))
            retrained_modules.append("Energy anomaly detector")
    except Exception:
        retraining_errors.append("Energy anomaly detector")

    try:
        if req.domain == "assets" and "pdm" in MODELS and "assets" in data_store:
            MODELS["pdm"].train(data_store["assets"].tail(200))
            retrained_modules.append("Asset maintenance model")
    except Exception:
        retraining_errors.append("Asset maintenance model")

    # Timestamped model version
    v_num = int(datetime.now().timestamp()) % 1000
    model_version = f"v2.{v_num}" if retrained_modules else None

    # Log in ContinuousLearningPipeline
    if CL_PIPELINE and records_count:
        try:
            CL_PIPELINE.log_anomaly_feedback(
                domain=req.domain,
                entity_id=f"stream_batch_{facility_type}",
                timestamp=datetime.now().isoformat(),
                feature_vector={"records": records_count, "mean_metric": mean_val},
                is_true_anomaly=False,
                operator_notes=req.operator_note or "Telemetry upload"
            )
        except Exception:
            # The telemetry commit is authoritative; a secondary audit failure does not undo it.
            pass

    return {
        "status": "success",
        "message": (f"Telemetry synchronized for {facility_type}." if records_count else f"Existing telemetry processed for {facility_type}."),
        "facility_type": facility_type,
        "domain": req.domain,
        "accepted": counts["accepted"],
        "rejected": counts["rejected"],
        "duplicates": counts["duplicates"],
        "records_ingested": records_count,
        "model_version": model_version,
        "retrained_models": retrained_modules,
        "retraining_status": "completed" if retrained_modules and not retraining_errors else ("failed" if retraining_errors else "not_run"),
        "retraining_errors": retraining_errors,
        "metrics": {
            "mean_telemetry_load": mean_val,
            "peak_surge_detected": peak_val,
        },
        "learned_insights": [],
        "synced_at": datetime.now().isoformat()
    }


# -------------------------------------------------------------
# PS6 OCCUPANCY, TIMETABLE, SAFETY, APPROVAL AND AUDIT WORKFLOW
# -------------------------------------------------------------
class ScheduleRequest(BaseModel):
    id: Optional[str] = None
    building_id: str = Field(..., min_length=1)
    room_id: str = Field(..., min_length=1)
    starts_at: str
    ends_at: str
    expected_occupancy: int = Field(..., ge=0, le=1000)
    title: str = Field(..., min_length=1, max_length=120)
    actor: str = Field("administrator", min_length=1, max_length=120)


class DecisionRequest(BaseModel):
    decision: str
    actor: str = Field(..., min_length=1, max_length=120)


class ActorRequest(BaseModel):
    actor: str = Field(..., min_length=1, max_length=120)


class OperatingSettingsRequest(BaseModel):
    idle_load_kwh: float
    saving_fraction: float
    tariff_inr: float
    comfort_min_c: float
    actor: str = Field(..., min_length=1, max_length=120)


def _ps6_rooms(facility_type: str):
    valid = facility_type if facility_type in FACILITY_TYPES else DEFAULT_FACILITY
    return PS6.rooms(valid, get_buildings(valid))


@app.get("/api/v1/ps6/rooms")
def ps6_rooms(facility_type: str = Query(DEFAULT_FACILITY), building_id: Optional[str] = None):
    rooms = _ps6_rooms(facility_type)
    if building_id:
        rooms = [room for room in rooms if room["building_id"] == building_id]
    return {"facility_type": facility_type, "data_mode": "SIMULATED", "rooms": rooms}


@app.get("/api/v1/ps6/timetable")
def ps6_timetable():
    return {"schedules": PS6.schedules()}


@app.get("/api/v1/ps6/intelligence")
def ps6_intelligence():
    rooms = _ps6_rooms(DEFAULT_FACILITY)
    return PS6.intelligence(rooms, PS6.schedules(), PS6.operating_settings())


@app.get("/api/v1/ps6/settings")
def ps6_settings():
    return PS6.operating_settings()


@app.put("/api/v1/ps6/settings")
def ps6_update_settings(req: OperatingSettingsRequest):
    try:
        return PS6.update_operating_settings(req.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/v1/ps6/timetable", status_code=201)
def ps6_save_schedule(req: ScheduleRequest):
    """Create or update (when `id` matches an existing entry) a timetable entry. Validation lives in the service."""
    try:
        known = {r["room_id"] for r in _ps6_rooms(DEFAULT_FACILITY)}
        return PS6.save_schedule(req.model_dump(), known_room_ids=known)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.delete("/api/v1/ps6/timetable/{schedule_id}")
def ps6_delete_schedule(schedule_id: str, actor: str = Query("administrator")):
    if not PS6.delete_schedule(schedule_id, actor):
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"deleted": True, "id": schedule_id}


@app.get("/api/v1/ps6/timetable/comparison")
def ps6_schedule_comparison(facility_type: str = Query(DEFAULT_FACILITY)):
    rooms = _ps6_rooms(facility_type)
    schedules = PS6.schedules()
    by_id = {r["room_id"]: r for r in rooms}
    return {"data_mode": "SIMULATED", "comparisons": [
        {"schedule": s, "actual_occupancy": by_id.get(s["room_id"], {}).get("occupancy_count"),
         "actual_power_kwh": by_id.get(s["room_id"], {}).get("power_kwh"),
         "occupancy_delta": by_id.get(s["room_id"], {}).get("occupancy_count", 0) - s["expected_occupancy"],
         "idle_energy_flag": bool(s["expected_occupancy"] == 0 and by_id.get(s["room_id"], {}).get("power_kwh", 0) >= 4)}
        for s in schedules]}


@app.get("/api/v1/ps6/recommendations")
def ps6_recommendations(facility_type: str = Query(DEFAULT_FACILITY)):
    return {"estimated_savings_label": "ESTIMATED — simulated telemetry and tariff assumptions",
            "recommendations": PS6.recommendations(_ps6_rooms(facility_type))}


@app.post("/api/v1/ps6/recommendations/{recommendation_id}/decision")
def ps6_decide(recommendation_id: str, req: DecisionRequest):
    if req.decision.upper() not in ("APPROVED", "REJECTED"):
        raise HTTPException(status_code=422, detail="decision must be APPROVED or REJECTED")
    try:
        result = PS6.decide(recommendation_id, req.decision.upper(), req.actor)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return result


@app.post("/api/v1/ps6/recommendations/{recommendation_id}/execute-simulation")
def ps6_execute_simulation(recommendation_id: str, req: ActorRequest):
    try:
        result = PS6.execute_simulation(recommendation_id, req.actor)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {**result, "execution_mode": "SIMULATION ONLY", "measured_savings": False}


@app.get("/api/v1/ps6/audit")
def ps6_audit(limit: int = Query(200, ge=1, le=1000)):
    return {"records": PS6.audit_history(limit), "storage": "append-only application audit log"}

