"""
Water Data Generator
Generates hourly water consumption data per building with:
- Usage patterns (morning/evening peaks)
- Building-type dependent consumption
- Leak anomalies, burst anomalies
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from ML.config.facility_config import get_facility_config


def generate_water_data(
    facility_type: str = "engineering_college",
    days: int = 180,
    anomaly_ratio: float = 0.025,
    seed: int = 43,
) -> pd.DataFrame:
    np.random.seed(seed)
    config = get_facility_config(facility_type)
    buildings = config["buildings"]
    water_cfg = config["water"]

    start_date = datetime.now() - timedelta(days=days)
    hours = days * 24
    timestamps = [start_date + timedelta(hours=h) for h in range(hours)]

    records = []
    for building in buildings:
        bid = building["id"]
        occupancy = building["occupancy"]
        base_litres = water_cfg["base_litres_per_person"] * occupancy / 24  # per hour

        for i, ts in enumerate(timestamps):
            hour = ts.hour
            dow = ts.weekday()
            month = ts.month

            # Time-of-day pattern
            is_peak = any(start <= hour < end for start, end in water_cfg["peak_hours"])
            if is_peak:
                time_mult = np.random.uniform(1.5, 2.0)
            elif 0 <= hour < 5:
                time_mult = np.random.uniform(0.05, 0.15)
            else:
                time_mult = np.random.uniform(0.4, 0.8)

            # Weekend effect
            dow_mult = 0.6 if (dow >= 5 and facility_type not in ["hospital"]) else 1.0

            # Seasonal (summer = more water)
            seasonal = {4: 1.2, 5: 1.4, 6: 1.3, 7: 1.0, 8: 0.9, 9: 0.95,
                        10: 1.0, 11: 0.9, 12: 0.85, 1: 0.85, 2: 0.9, 3: 1.05}
            season_mult = seasonal.get(month, 1.0)

            litres = base_litres * time_mult * dow_mult * season_mult
            litres += np.random.normal(0, litres * 0.1)
            litres = max(0, litres)

            # Anomaly injection
            is_anomaly = False
            anomaly_type_str = "none"
            if np.random.random() < anomaly_ratio:
                atype = np.random.choice(["leak", "burst", "zero"])
                if atype == "leak":
                    litres *= np.random.uniform(1.4, 2.0)
                    anomaly_type_str = "leak"
                elif atype == "burst":
                    litres *= np.random.uniform(2.5, 5.0)
                    anomaly_type_str = "burst"
                else:
                    litres = np.random.uniform(0, 5)
                    anomaly_type_str = "zero_flow"
                is_anomaly = True

            records.append({
                "timestamp": ts,
                "building_id": bid,
                "building_name": building["name"],
                "litres": round(max(0, litres), 2),
                "hour": hour,
                "day_of_week": dow,
                "month": month,
                "is_weekend": dow >= 5,
                "is_peak_hour": is_peak,
                "is_anomaly": is_anomaly,
                "anomaly_type": anomaly_type_str,
            })

    return pd.DataFrame(records)


if __name__ == "__main__":
    for ft in ["engineering_college", "hospital", "industrial_estate", "municipal_campus"]:
        df = generate_water_data(facility_type=ft, days=180)
        os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'generated'), exist_ok=True)
        df.to_csv(os.path.join(os.path.dirname(__file__), '..', 'generated', f'water_{ft}.csv'), index=False)
        print(f"[{ft}] Water: {len(df)} rows, {df['is_anomaly'].sum()} anomalies")
