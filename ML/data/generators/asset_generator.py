"""
Asset/Equipment Data Generator
Generates sensor telemetry data for equipment (HVAC, pumps, generators, etc.)
with degradation patterns and failure labels for predictive maintenance.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from ML.config.facility_config import get_facility_config


def generate_asset_data(
    facility_type: str = "engineering_college",
    days: int = 180,
    seed: int = 46,
) -> pd.DataFrame:
    np.random.seed(seed)
    config = get_facility_config(facility_type)
    buildings = config["buildings"]
    asset_cfg = config["assets"]

    start_date = datetime.now() - timedelta(days=days)
    # Generate daily readings (not hourly — assets don't need hourly granularity)
    dates = [start_date + timedelta(days=d) for d in range(days)]

    records = []
    asset_counter = 0

    for asset_category, info in asset_cfg.items():
        count = info["count"]
        types = info["types"]

        for idx in range(count):
            asset_counter += 1
            asset_id = f"{asset_category}_{idx:03d}"
            asset_type = types[idx % len(types)]
            building = buildings[idx % len(buildings)]
            install_age_years = np.random.uniform(0.5, 12)

            # Degradation curve: older equipment degrades faster
            degradation_rate = 0.0005 * install_age_years

            # Failure schedule: some assets will fail during the period
            will_fail = np.random.random() < (0.05 + 0.02 * install_age_years)
            failure_day = np.random.randint(days // 2, days) if will_fail else None

            for d_idx, date in enumerate(dates):
                age_factor = install_age_years + (d_idx / 365)
                degradation = degradation_rate * d_idx

                # Vibration (mm/s) - increases near failure
                base_vibration = 2.0 + 0.3 * age_factor
                if will_fail and d_idx > failure_day - 30:
                    days_to_fail = max(1, failure_day - d_idx)
                    base_vibration += 8.0 / days_to_fail
                vibration = base_vibration + np.random.normal(0, 0.5)

                # Temperature (°C) - equipment operating temp
                base_temp = 45 + 2 * age_factor
                if will_fail and d_idx > failure_day - 14:
                    base_temp += 15 * (1 - (failure_day - d_idx) / 14)
                operating_temp = base_temp + np.random.normal(0, 3)

                # Runtime hours (cumulative)
                daily_runtime = np.random.uniform(6, 18)
                runtime_total = install_age_years * 365 * 10 + d_idx * daily_runtime

                # Power consumption (kW)
                rated_power = np.random.uniform(2, 50)
                efficiency = max(0.5, 1.0 - degradation - 0.01 * age_factor)
                power_draw = rated_power / efficiency + np.random.normal(0, rated_power * 0.05)

                # Health score (0-100)
                health = 100 - (age_factor * 3) - (degradation * 100) - max(0, vibration - 5) * 5
                if will_fail and d_idx > failure_day - 7:
                    health -= 30 * (1 - (failure_day - d_idx) / 7)
                health = np.clip(health + np.random.normal(0, 3), 0, 100)

                # Status
                if will_fail and d_idx >= failure_day:
                    status = "faulty"
                    health = np.random.uniform(0, 15)
                elif health < 30:
                    status = "critical"
                elif health < 60:
                    status = "maintenance_needed"
                else:
                    status = "operational"

                # Failure probability (ground truth for training)
                if will_fail:
                    days_until = max(0, failure_day - d_idx)
                    failure_prob = max(0, min(1, 1 - days_until / 60))
                else:
                    failure_prob = max(0, min(0.15, degradation + 0.01 * max(0, vibration - 5)))

                records.append({
                    "date": date,
                    "asset_id": asset_id,
                    "asset_category": asset_category,
                    "asset_type": asset_type,
                    "building_id": building["id"],
                    "building_name": building["name"],
                    "install_age_years": round(age_factor, 2),
                    "vibration_mm_s": round(max(0, vibration), 2),
                    "operating_temp_c": round(operating_temp, 1),
                    "runtime_hours": round(runtime_total, 0),
                    "daily_runtime_hours": round(daily_runtime, 1),
                    "power_draw_kw": round(max(0, power_draw), 2),
                    "efficiency": round(efficiency, 3),
                    "health_score": round(health, 1),
                    "status": status,
                    "failure_probability": round(failure_prob, 3),
                    "needs_maintenance": status in ["critical", "maintenance_needed", "faulty"],
                })

    return pd.DataFrame(records)


if __name__ == "__main__":
    for ft in ["engineering_college", "hospital", "industrial_estate", "municipal_campus"]:
        df = generate_asset_data(facility_type=ft, days=180)
        os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'generated'), exist_ok=True)
        df.to_csv(os.path.join(os.path.dirname(__file__), '..', 'generated', f'assets_{ft}.csv'), index=False)
        faulty = (df['status'] == 'faulty').sum()
        print(f"[{ft}] Assets: {len(df)} rows, unique assets: {df['asset_id'].nunique()}, faulty events: {faulty}")
