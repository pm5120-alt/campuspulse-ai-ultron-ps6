"""
AQI Forecaster & Environmental Risk Engine
Forecasts 24h-48h ahead PM2.5, PM10, and NAQI with weather features.
Generates health advisories for campus occupants.
"""
import numpy as np
import pandas as pd
from xgboost import XGBRegressor
import joblib
import os

class AQIForecaster:
    """Predicts upcoming Air Quality Index trends and triggers ventilation/health alerts."""

    def __init__(self):
        self.pm25_model = None
        self.pm10_model = None
        self.feature_cols = [
            'hour', 'month', 'temperature', 'humidity', 'wind_speed',
            'pm25_lag1', 'pm25_lag24', 'pm10_lag1'
        ]
        self.is_trained = False

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df = df.sort_values('timestamp').reset_index(drop=True)
        df['pm25_lag1'] = df['pm25'].shift(1).fillna(df['pm25'].mean())
        df['pm25_lag24'] = df['pm25'].shift(24).fillna(df['pm25'].mean())
        df['pm10_lag1'] = df['pm10'].shift(1).fillna(df['pm10'].mean())
        return df

    def train(self, df: pd.DataFrame):
        df_feat = self._engineer_features(df)
        X = df_feat[self.feature_cols].values
        y_pm25 = df_feat['pm25'].values
        y_pm10 = df_feat['pm10'].values

        self.pm25_model = XGBRegressor(n_estimators=120, max_depth=5, learning_rate=0.07, random_state=42)
        self.pm25_model.fit(X, y_pm25)

        self.pm10_model = XGBRegressor(n_estimators=120, max_depth=5, learning_rate=0.07, random_state=42)
        self.pm10_model.fit(X, y_pm10)

        self.is_trained = True
        return {"status": "trained", "samples": len(X)}

    def predict_forecast(self, recent_df: pd.DataFrame, horizon_hours: int = 48) -> pd.DataFrame:
        if not self.is_trained:
            raise RuntimeError("AQI Forecaster is not trained.")

        last_row = recent_df.sort_values('timestamp').iloc[-1]
        last_ts = pd.to_datetime(last_row['timestamp'])

        forecast_rows = []
        curr_pm25 = float(last_row['pm25'])
        curr_pm10 = float(last_row['pm10'])

        for h in range(1, horizon_hours + 1):
            future_ts = last_ts + pd.Timedelta(hours=h)
            hour = future_ts.hour
            month = future_ts.month

            # Weather estimations
            temp = 25.0 + 5 * np.sin(2 * np.pi * (hour - 9) / 24)
            humidity = 60.0 + 15 * np.sin(2 * np.pi * (hour - 3) / 24)
            wind = max(2.0, 7.0 + 4 * np.sin(2 * np.pi * hour / 24))

            feat = np.array([[hour, month, temp, humidity, wind, curr_pm25, curr_pm25, curr_pm10]])
            pred_pm25 = float(max(5.0, self.pm25_model.predict(feat)[0]))
            pred_pm10 = float(max(10.0, self.pm10_model.predict(feat)[0]))

            # Calculate NAQI
            aqi_val = self._calc_naqi(pred_pm25)
            cat = self._get_category(aqi_val)

            forecast_rows.append({
                "timestamp": future_ts,
                "pm25": round(pred_pm25, 1),
                "pm10": round(pred_pm10, 1),
                "predicted_aqi": aqi_val,
                "category": cat,
                "advisory": self._get_advisory(cat)
            })

            curr_pm25 = pred_pm25
            curr_pm10 = pred_pm10

        return pd.DataFrame(forecast_rows)

    def _calc_naqi(self, pm25: float) -> int:
        breakpoints = [
            (0, 30, 0, 50),
            (31, 60, 51, 100),
            (61, 90, 101, 200),
            (91, 120, 201, 300),
            (121, 250, 301, 400),
            (250, 500, 401, 500)
        ]
        for bp_lo, bp_hi, i_lo, i_hi in breakpoints:
            if bp_lo <= pm25 <= bp_hi:
                return int(round(((i_hi - i_lo) / (bp_hi - bp_lo)) * (pm25 - bp_lo) + i_lo))
        return 500 if pm25 > 250 else 0

    def _get_category(self, aqi: int) -> str:
        if aqi <= 50: return "Good"
        elif aqi <= 100: return "Satisfactory"
        elif aqi <= 200: return "Moderate"
        elif aqi <= 300: return "Poor"
        elif aqi <= 400: return "Very Poor"
        else: return "Severe"

    def _get_advisory(self, cat: str) -> str:
        advisories = {
            "Good": "Air quality is ideal for all outdoor activities and natural ventilation.",
            "Satisfactory": "Minor breathing discomfort for extremely sensitive individuals; normal ventilation.",
            "Moderate": "Breathing discomfort to sensitive groups; activate indoor HEPA filtration filters.",
            "Poor": "Breathing discomfort on prolonged exposure; close windows and run HVAC air recirculation.",
            "Very Poor": "Respiratory illness risk; restrict outdoor sports and schedule indoor shifts.",
            "Severe": "High health emergency; mandatory N95 indoors, seal air intakes, alert medical center."
        }
        return advisories.get(cat, "Monitor sensor readings.")

    def save(self, path: str):
        os.makedirs(path, exist_ok=True)
        joblib.dump(self.pm25_model, os.path.join(path, 'aqi_pm25.joblib'))
        joblib.dump(self.pm10_model, os.path.join(path, 'aqi_pm10.joblib'))

    def load(self, path: str):
        self.pm25_model = joblib.load(os.path.join(path, 'aqi_pm25.joblib'))
        self.pm10_model = joblib.load(os.path.join(path, 'aqi_pm10.joblib'))
        self.is_trained = True
