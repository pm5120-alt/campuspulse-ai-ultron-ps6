"""
Safety Incident Data Generator
Generates safety incident records with zone, severity, type, and trend patterns.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from ML.config.facility_config import get_facility_config


def generate_safety_data(
    facility_type: str = "engineering_college",
    days: int = 365,
    seed: int = 47,
) -> pd.DataFrame:
    np.random.seed(seed)
    config = get_facility_config(facility_type)
    safety_cfg = config["safety"]
    buildings = config["buildings"]

    zones = safety_cfg["zones"]
    incident_types = safety_cfg["incident_types"]

    start_date = datetime.now() - timedelta(days=days)
    records = []

    # Average incidents per day varies by facility
    base_rate = {"engineering_college": 0.8, "hospital": 1.5, "industrial_estate": 2.0, "municipal_campus": 0.5}
    avg_per_day = base_rate.get(facility_type, 1.0)

    for d in range(days):
        date = start_date + timedelta(days=d)
        dow = date.weekday()
        month = date.month

        # More incidents on weekdays (more people around)
        day_mult = 1.0 if dow < 5 else 0.4
        # Seasonal: monsoon (slips), winter (fire/electrical)
        season_mult = {6: 1.3, 7: 1.4, 8: 1.3, 12: 1.2, 1: 1.2}.get(month, 1.0)

        n_incidents = np.random.poisson(avg_per_day * day_mult * season_mult)

        for _ in range(n_incidents):
            zone = np.random.choice(zones)
            inc_type = np.random.choice(incident_types)
            hour = np.random.choice(range(6, 22), p=np.array(
                [0.03, 0.05, 0.08, 0.1, 0.1, 0.1, 0.1, 0.1, 0.08, 0.07, 0.06, 0.04, 0.03, 0.02, 0.02, 0.02]
            ))

            # Severity based on type
            severity_weights = {
                "Fire": [0.1, 0.3, 0.4, 0.2],
                "Chemical": [0.1, 0.3, 0.4, 0.2],
                "Gas Leak": [0.1, 0.2, 0.4, 0.3],
                "Machine Injury": [0.1, 0.3, 0.4, 0.2],
                "Electrical": [0.15, 0.35, 0.35, 0.15],
                "Slip/Fall": [0.3, 0.4, 0.25, 0.05],
                "Equipment": [0.2, 0.4, 0.3, 0.1],
                "Structural": [0.1, 0.3, 0.4, 0.2],
                "Needle-stick": [0.3, 0.4, 0.25, 0.05],
                "Biohazard": [0.1, 0.3, 0.4, 0.2],
                "Crowd": [0.3, 0.4, 0.2, 0.1],
                "Fall from Height": [0.05, 0.2, 0.4, 0.35],
                "Chemical Spill": [0.1, 0.3, 0.4, 0.2],
            }
            weights = severity_weights.get(inc_type, [0.2, 0.35, 0.3, 0.15])
            severity = np.random.choice(["Low", "Medium", "High", "Critical"], p=weights)

            building = np.random.choice(buildings)

            # Response time (minutes)
            response_time = {
                "Low": np.random.uniform(15, 60),
                "Medium": np.random.uniform(5, 30),
                "High": np.random.uniform(2, 15),
                "Critical": np.random.uniform(1, 8),
            }[severity]

            resolved = np.random.random() > 0.05  # 95% resolution rate

            records.append({
                "date": date,
                "timestamp": date.replace(hour=hour, minute=np.random.randint(0, 60)),
                "zone": zone,
                "building_id": building["id"],
                "building_name": building["name"],
                "incident_type": inc_type,
                "severity": severity,
                "severity_score": {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}[severity],
                "hour": hour,
                "day_of_week": dow,
                "month": month,
                "response_time_min": round(response_time, 1),
                "is_resolved": resolved,
                "description": f"{inc_type} incident in {zone} zone at {building['name']}",
            })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    for ft in ["engineering_college", "hospital", "industrial_estate", "municipal_campus"]:
        df = generate_safety_data(facility_type=ft, days=365)
        os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'generated'), exist_ok=True)
        df.to_csv(os.path.join(os.path.dirname(__file__), '..', 'generated', f'safety_{ft}.csv'), index=False)
        print(f"[{ft}] Safety: {len(df)} incidents, critical: {(df['severity']=='Critical').sum()}")
