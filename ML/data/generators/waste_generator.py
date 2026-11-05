"""
Waste Data Generator
Generates waste bin fill-level data with overflow prediction labels.
Simulates fill rates, collection events, and overflow anomalies.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from ML.config.facility_config import get_facility_config


def generate_waste_data(
    facility_type: str = "engineering_college",
    days: int = 180,
    anomaly_ratio: float = 0.02,
    seed: int = 44,
) -> pd.DataFrame:
    np.random.seed(seed)
    config = get_facility_config(facility_type)
    buildings = config["buildings"]
    waste_cfg = config["waste"]

    start_date = datetime.now() - timedelta(days=days)
    hours = days * 24
    timestamps = [start_date + timedelta(hours=h) for h in range(hours)]

    records = []
    for building in buildings:
        bid = building["id"]
        occupancy = building["occupancy"]
        num_bins = waste_cfg["bins_per_building"]
        capacity = waste_cfg["bin_capacity_kg"]
        collection_freq = waste_cfg["collection_frequency_hours"]

        for bin_idx in range(num_bins):
            bin_id = f"{bid}_bin_{bin_idx}"
            waste_type = waste_cfg["types"][bin_idx % len(waste_cfg["types"])]
            fill_level = np.random.uniform(0, 20)  # start partially filled

            for i, ts in enumerate(timestamps):
                hour = ts.hour
                dow = ts.weekday()

                # Fill rate depends on time of day and occupancy
                if 8 <= hour <= 18:
                    fill_rate = (occupancy / 500) * np.random.uniform(0.3, 0.8)
                elif 6 <= hour < 8 or 18 < hour <= 21:
                    fill_rate = (occupancy / 500) * np.random.uniform(0.1, 0.3)
                else:
                    fill_rate = np.random.uniform(0, 0.05)

                # Weekend effect
                if dow >= 5 and facility_type not in ["hospital"]:
                    fill_rate *= 0.3

                fill_level += fill_rate
                fill_level = min(fill_level, capacity * 1.1)  # slight overflow possible

                # Collection event (reset)
                if i > 0 and i % collection_freq == 0 and np.random.random() > 0.1:
                    fill_level = np.random.uniform(0, 5)

                # Missed collection anomaly
                is_anomaly = False
                if np.random.random() < anomaly_ratio:
                    fill_level = min(capacity * 1.1, fill_level + np.random.uniform(10, 25))
                    is_anomaly = True

                fill_pct = round((fill_level / capacity) * 100, 1)
                hours_to_full = max(0, round((capacity - fill_level) / max(fill_rate, 0.01), 1))

                records.append({
                    "timestamp": ts,
                    "building_id": bid,
                    "building_name": building["name"],
                    "bin_id": bin_id,
                    "waste_type": waste_type,
                    "fill_level_kg": round(fill_level, 2),
                    "fill_percentage": min(110, fill_pct),
                    "capacity_kg": capacity,
                    "hours_to_full": hours_to_full,
                    "hour": hour,
                    "day_of_week": dow,
                    "is_overflow": fill_pct >= 90,
                    "is_anomaly": is_anomaly,
                })

    return pd.DataFrame(records)


if __name__ == "__main__":
    for ft in ["engineering_college", "hospital", "industrial_estate", "municipal_campus"]:
        df = generate_waste_data(facility_type=ft, days=180)
        os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'generated'), exist_ok=True)
        df.to_csv(os.path.join(os.path.dirname(__file__), '..', 'generated', f'waste_{ft}.csv'), index=False)
        print(f"[{ft}] Waste: {len(df)} rows, overflows: {df['is_overflow'].sum()}")
