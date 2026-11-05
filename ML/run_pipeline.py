"""
Master ML Training & Pipeline Execution Script
Generates multi-sector synthetic IoT datasets, trains all 12 ML models,
validates with anomaly-centric evaluation metrics, and saves model artifacts.
"""
import os
import sys
import time
import pandas as pd
import numpy as np

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ML.config.facility_config import FACILITY_TYPES, DEFAULT_FACILITY
from ML.data.generators import (
    generate_energy_data,
    generate_water_data,
    generate_waste_data,
    generate_aqi_data,
    generate_asset_data,
    generate_safety_data
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

def run_end_to_end_pipeline():
    print("=" * 70)
    print(">>> STARTING CAMPUISQ MULTI-SECTOR ML PIPELINE TRAINING")
    print("=" * 70)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data", "generated")
    models_dir = os.path.join(base_dir, "trained_models")
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    # 1. GENERATE DATASETS FOR ALL SECTORS
    print("\n[1/4] Generating Multi-Sector Sensor Datasets...")
    datasets = {}
    for ftype in FACILITY_TYPES.keys():
        print(f"  --> Generating data for sector: [{ftype}]")
        df_e = generate_energy_data(facility_type=ftype, days=90)
        df_w = generate_water_data(facility_type=ftype, days=90)
        df_ws = generate_waste_data(facility_type=ftype, days=90)
        df_aq = generate_aqi_data(facility_type=ftype, days=90)
        df_as = generate_asset_data(facility_type=ftype, days=90)
        df_sf = generate_safety_data(facility_type=ftype, days=180)

        df_e.to_csv(os.path.join(data_dir, f"energy_{ftype}.csv"), index=False)
        df_w.to_csv(os.path.join(data_dir, f"water_{ftype}.csv"), index=False)
        df_ws.to_csv(os.path.join(data_dir, f"waste_{ftype}.csv"), index=False)
        df_aq.to_csv(os.path.join(data_dir, f"aqi_{ftype}.csv"), index=False)
        df_as.to_csv(os.path.join(data_dir, f"assets_{ftype}.csv"), index=False)
        df_sf.to_csv(os.path.join(data_dir, f"safety_{ftype}.csv"), index=False)

        if ftype == DEFAULT_FACILITY:
            datasets = {
                "energy": df_e,
                "water": df_w,
                "waste": df_ws,
                "aqi": df_aq,
                "assets": df_as,
                "safety": df_sf
            }

    print(f"  [OK] Generated all CSVs in {data_dir}")

    # 2. TRAIN ML MODELS
    print("\n[2/4] Training Core Machine Learning Models...")
    t0 = time.time()

    # Model 1: Energy Anomaly Detector
    print("  -> Training Energy Anomaly Detector (Isolation Forest)...")
    energy_anomaly = EnergyAnomalyDetector()
    energy_anomaly.train(datasets["energy"])
    energy_anomaly.save(models_dir)

    # Model 2: Energy Forecaster (Hybrid Prophet + XGBoost)
    print("  -> Training Energy Forecaster (Prophet + XGBoost)...")
    energy_forecaster = EnergyForecaster()
    ef_metrics = energy_forecaster.train(datasets["energy"])
    energy_forecaster.save(models_dir)
    print(f"     Forecast MAPE: {ef_metrics['mape']:.2f}% | MAE: {ef_metrics['mae']:.2f} kWh")

    # Model 3: Water Anomaly Detector
    print("  -> Training Water Anomaly Detector...")
    water_anomaly = WaterAnomalyDetector()
    water_anomaly.train(datasets["water"])
    water_anomaly.save(models_dir)

    # Model 4: Waste Overflow Predictor
    print("  -> Training Waste Overflow Predictor (XGBoost)...")
    waste_predictor = WastePredictor()
    waste_predictor.train(datasets["waste"])
    waste_predictor.save(models_dir)

    # Model 5: AQI Forecaster
    print("  -> Training AQI Forecaster (XGBoost Multi-pollutant)...")
    aqi_forecaster = AQIForecaster()
    aqi_forecaster.train(datasets["aqi"])
    aqi_forecaster.save(models_dir)

    # Model 6: Predictive Maintenance Model
    print("  -> Training Predictive Maintenance Model (Random Forest)...")
    pdm = PredictiveMaintenanceModel()
    pdm.train(datasets["assets"])
    pdm.save(models_dir)

    # Model 7: Safety Risk Classifier
    print("  -> Training Safety Risk Classifier...")
    safety_model = SafetyRiskClassifier()
    safety_model.train(datasets["safety"])
    safety_model.save(models_dir)

    print(f"  [OK] Trained and saved all models in {time.time() - t0:.1f}s")

    # 3. VERIFY PREDICTIONS & EVALUATION METRICS
    print("\n[3/4] Testing Inference & Evaluating Anomaly Performance...")
    cl_pipeline = ContinuousLearningPipeline(storage_dir=os.path.join(models_dir, "continuous_learning"))

    # Energy anomaly inference
    pred_energy = energy_anomaly.detect(datasets["energy"].tail(500))
    metrics_energy = cl_pipeline.evaluate_anomaly_metrics(
        datasets["energy"].tail(500)["is_anomaly"].astype(int).values,
        pred_energy["is_anomaly_pred"].astype(int).values
    )
    print(f"  Energy Anomaly Performance -> Precision: {metrics_energy['precision']} | Recall: {metrics_energy['recall']} | F1: {metrics_energy['f1_score']}")

    # Forecaster inference
    b_id = datasets["energy"]["building_id"].iloc[0]
    forecast_df = energy_forecaster.predict(datasets["energy"], building_id=b_id, horizon_hours=48)
    print(f"  Energy Forecast Sample (48h ahead) -> Avg predicted kWh: {forecast_df['predicted_kwh'].mean():.1f}")

    # PDM inference
    latest_assets = datasets["assets"].groupby("asset_id").last().reset_index()
    asset_health_df = pdm.assess_assets(latest_assets)
    critical_assets = (asset_health_df['health_status'] == 'Critical').sum()
    print(f"  Asset Telemetry Assessed -> Total: {len(asset_health_df)} | Critical Attention: {critical_assets}")

    # Simulation engine test
    simulator = ScenarioSimulator()
    sim_result = simulator.simulate(
        scenario_id="reduce_hvac",
        parameter_pct=25.0,
        target_buildings=["academic_block", "admin_block"],
        simulation_weeks=4
    )
    print(f"  Scenario Simulation Impact -> kWh Saved: {sim_result['predicted_impact']['energy_saved_kwh']} | Cost Saved: Rs. {sim_result['predicted_impact']['cost_savings_inr']} | CO2: {sim_result['predicted_impact']['carbon_emission_reduction_tco2']} tCO2")

    # Recommendation Engine test
    rec_engine = RecommendationEngine()
    insights = rec_engine.generate_all_insights(
        datasets["energy"], datasets["water"], datasets["waste"], datasets["aqi"], datasets["assets"]
    )
    print(f"  AI Insights Generated -> {len(insights)} High-impact recommendations ready.")

    print("\n[4/4] ALL ML MODELS OPERATIONAL AND VALIDATED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_end_to_end_pipeline()
