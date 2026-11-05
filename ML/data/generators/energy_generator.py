"""
Energy Data Generator
Generates realistic hourly energy consumption data per building with:
- Time-of-day patterns (peak/off-peak)
- Day-of-week patterns (weekday/weekend)
- Seasonal variation
- Weather influence
- Random anomalies injected for anomaly detection training
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from ML.config.facility_config import get_facility_config


def generate_energy_data(
    facility_type: str = "engineering_college",
    days: int = 180,
    anomaly_ratio: float = 0.03,
    seed: int = 42,
) -> pd.DataFrame:
    """Generate hourly energy consumption data for all buildings in a facility."""
    np.random.seed(seed)
    config = get_facility_config(facility_type)
    buildings = config["buildings"]
    energy_cfg = config["energy"]

    start_date = datetime.now() - timedelta(days=days)
    hours = days * 24
    timestamps = [start_date + timedelta(hours=h) for h in range(hours)]

    records = []
    for building in buildings:
        bid = building["id"]
        area = building["area_sqm"]
        base_kwh = energy_cfg["base_kwh_per_sqm"] * area

        for i, ts in enumerate(timestamps):
            hour = ts.hour
            dow = ts.weekday()
            month = ts.month

            # Time-of-day multiplier
            is_peak = any(start <= hour < end for start, end in energy_cfg["peak_hours"])
            time_mult = 1.0 if is_peak else energy_cfg["off_peak_multiplier"]

            # Day-of-week (weekend = lower for offices/colleges, constant for hospitals)
            if facility_type in ["hospital", "industrial_estate"]:
                dow_mult = 0.9 if dow >= 5 else 1.0
            else:
                dow_mult = 0.5 if dow >= 5 else 1.0

            # Seasonal (summer → more AC)
            seasonal = {12: 0.8, 1: 0.8, 2: 0.85, 3: 0.95, 4: 1.15, 5: 1.35,
                        6: 1.4, 7: 1.2, 8: 1.15, 9: 1.1, 10: 1.0, 11: 0.9}
            season_mult = seasonal.get(month, 1.0)

            # Weather noise (temperature proxy)
            temp_base = 25 + 10 * np.sin(2 * np.pi * (month - 4) / 12)
            temperature = temp_base + np.random.normal(0, 3)
            humidity = 60 + 20 * np.sin(2 * np.pi * (month - 7) / 12) + np.random.normal(0, 10)
            humidity = np.clip(humidity, 20, 100)

            # Calculate consumption
            kwh = base_kwh * time_mult * dow_mult * season_mult
            kwh *= (1 + 0.01 * (temperature - 25))  # temperature effect
            kwh += np.random.normal(0, kwh * 0.08)  # noise
            kwh = max(kwh * 0.1, kwh)  # floor

            # Anomaly injection
            is_anomaly = False
            if np.random.random() < anomaly_ratio:
                anomaly_type = np.random.choice(["spike", "drop", "sustained"])
                if anomaly_type == "spike":
                    kwh *= np.random.uniform(1.5, 2.5)
                elif anomaly_type == "drop":
                    kwh *= np.random.uniform(0.1, 0.4)
                else:
                    kwh *= np.random.uniform(1.3, 1.8)
                is_anomaly = True

            records.append({
                "timestamp": ts,
                "building_id": bid,
                "building_name": building["name"],
                "kwh": round(max(0, kwh), 2),
                "temperature": round(temperature, 1),
                "humidity": round(humidity, 1),
                "hour": hour,
                "day_of_week": dow,
                "month": month,
                "is_weekend": dow >= 5,
                "is_peak_hour": is_peak,
                "is_anomaly": is_anomaly,
            })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    for ft in ["engineering_college", "hospital", "industrial_estate", "municipal_campus"]:
        df = generate_energy_data(facility_type=ft, days=180)
        os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'generated'), exist_ok=True)
        df.to_csv(os.path.join(os.path.dirname(__file__), '..', 'generated', f'energy_{ft}.csv'), index=False)
        print(f"[{ft}] Energy: {len(df)} rows, {df['is_anomaly'].sum()} anomalies, buildings: {df['building_id'].nunique()}")
