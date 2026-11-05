"""
AQI Data Generator
Generates hourly air quality data with PM2.5, PM10, NO2, SO2, CO, O3.
Includes seasonal patterns, weather effects, and pollution spike anomalies.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from ML.config.facility_config import get_facility_config


def calculate_aqi_from_pm25(pm25: float) -> int:
    """Calculate sub-index AQI from PM2.5 using Indian NAQI breakpoints."""
    breakpoints = [
        (0, 30, 0, 50),
        (31, 60, 51, 100),
        (61, 90, 101, 200),
        (91, 120, 201, 300),
        (121, 250, 301, 400),
        (250, 500, 401, 500),
    ]
    for bp_lo, bp_hi, i_lo, i_hi in breakpoints:
        if bp_lo <= pm25 <= bp_hi:
            aqi = ((i_hi - i_lo) / (bp_hi - bp_lo)) * (pm25 - bp_lo) + i_lo
            return int(round(aqi))
    return 500 if pm25 > 250 else 0


def get_aqi_category(aqi: int) -> str:
    if aqi <= 50: return "Good"
    elif aqi <= 100: return "Satisfactory"
    elif aqi <= 200: return "Moderate"
    elif aqi <= 300: return "Poor"
    elif aqi <= 400: return "Very Poor"
    else: return "Severe"


def generate_aqi_data(
    facility_type: str = "engineering_college",
    days: int = 180,
    anomaly_ratio: float = 0.02,
    seed: int = 45,
) -> pd.DataFrame:
    np.random.seed(seed)
    config = get_facility_config(facility_type)
    aqi_cfg = config["aqi"]

    start_date = datetime.now() - timedelta(days=days)
    hours = days * 24
    timestamps = [start_date + timedelta(hours=h) for h in range(hours)]

    records = []
    for ts in timestamps:
        hour = ts.hour
        month = ts.month

        # Seasonal factor
        if month in [12, 1, 2]:
            season = "winter"
        elif month in [3, 4, 5]:
            season = "summer"
        elif month in [6, 7, 8, 9]:
            season = "monsoon"
        else:
            season = "autumn"
        season_mult = aqi_cfg["seasonal_variation"][season]

        # Diurnal pattern (traffic hours worse)
        if 7 <= hour <= 10 or 17 <= hour <= 20:
            diurnal = 1.3
        elif 11 <= hour <= 16:
            diurnal = 1.1
        elif 0 <= hour <= 5:
            diurnal = 0.7
        else:
            diurnal = 0.9

        # Wind speed (lower wind → worse AQI)
        wind_speed = max(0, 8 + 5 * np.sin(2 * np.pi * hour / 24) + np.random.normal(0, 3))
        wind_factor = max(0.5, 1.0 - wind_speed * 0.03)

        # Temperature & humidity
        temp = 25 + 10 * np.sin(2 * np.pi * (month - 4) / 12) + 5 * np.sin(2 * np.pi * hour / 24) + np.random.normal(0, 2)
        humidity = 60 + 20 * np.sin(2 * np.pi * (month - 7) / 12) + np.random.normal(0, 8)
        humidity = np.clip(humidity, 20, 100)

        # PM2.5 and PM10
        pm25 = aqi_cfg["baseline_pm25"] * season_mult * diurnal * wind_factor
        pm25 += np.random.normal(0, pm25 * 0.15)
        pm25 = max(2, pm25)

        pm10 = aqi_cfg["baseline_pm10"] * season_mult * diurnal * wind_factor
        pm10 += np.random.normal(0, pm10 * 0.12)
        pm10 = max(5, pm10)

        # Other pollutants
        no2 = 20 * season_mult * diurnal + np.random.normal(0, 5)
        so2 = 8 * season_mult + np.random.normal(0, 2)
        co = 0.8 * season_mult * diurnal + np.random.normal(0, 0.2)
        o3 = 30 + 20 * np.sin(2 * np.pi * (hour - 14) / 24) + np.random.normal(0, 5)

        # Anomaly injection
        is_anomaly = False
        if np.random.random() < anomaly_ratio:
            spike = np.random.choice(["pollution_spike", "sudden_drop"])
            if spike == "pollution_spike":
                pm25 *= np.random.uniform(2.0, 4.0)
                pm10 *= np.random.uniform(1.8, 3.5)
            else:
                pm25 *= 0.2
                pm10 *= 0.3
            is_anomaly = True

        aqi = calculate_aqi_from_pm25(pm25)
        category = get_aqi_category(aqi)

        records.append({
            "timestamp": ts,
            "pm25": round(max(0, pm25), 1),
            "pm10": round(max(0, pm10), 1),
            "no2": round(max(0, no2), 1),
            "so2": round(max(0, so2), 1),
            "co": round(max(0, co), 2),
            "o3": round(max(0, o3), 1),
            "aqi": aqi,
            "aqi_category": category,
            "temperature": round(temp, 1),
            "humidity": round(humidity, 1),
            "wind_speed": round(max(0, wind_speed), 1),
            "hour": hour,
            "month": month,
            "is_anomaly": is_anomaly,
        })

    return pd.DataFrame(records)


if __name__ == "__main__":
    for ft in ["engineering_college", "hospital", "industrial_estate", "municipal_campus"]:
        df = generate_aqi_data(facility_type=ft, days=180)
        os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'generated'), exist_ok=True)
        df.to_csv(os.path.join(os.path.dirname(__file__), '..', 'generated', f'aqi_{ft}.csv'), index=False)
        print(f"[{ft}] AQI: {len(df)} rows, anomalies: {df['is_anomaly'].sum()}, mean AQI: {df['aqi'].mean():.0f}")
