"""
Energy Forecaster
Uses Prophet for time-series decomposition + XGBoost for residual learning.
Supports continuous learning by retraining on new data with anomaly feedback.
"""
import numpy as np
import pandas as pd
try:
    from prophet import Prophet
except ImportError:
    Prophet = None

try:
    from xgboost import XGBRegressor
except ImportError:
    from sklearn.ensemble import GradientBoostingRegressor as XGBRegressor

from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
import joblib
import os
import logging
import warnings

warnings.filterwarnings('ignore')
logging.getLogger('prophet').setLevel(logging.WARNING)
logging.getLogger('cmdstanpy').setLevel(logging.WARNING)


class EnergyForecaster:
    """Hybrid Prophet + XGBoost energy forecaster with continuous learning."""

    def __init__(self):
        self.prophet_models = {}  # per-building prophet models
        self.xgb_model = None
        self.is_trained = False
        self.training_history = []  # for continuous learning tracking
        self.feature_cols = [
            'hour', 'day_of_week', 'month', 'is_weekend', 'is_peak_hour',
            'temperature', 'humidity', 'prophet_pred', 'prophet_trend',
        ]

    def _prepare_prophet_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare data for Prophet: requires 'ds' and 'y' columns."""
        pdf = df[['timestamp', 'kwh']].copy()
        pdf.columns = ['ds', 'y']
        pdf['ds'] = pd.to_datetime(pdf['ds'])
        return pdf

    def train(self, df: pd.DataFrame, building_ids: list = None):
        """Train forecaster on historical data."""
        if building_ids is None:
            building_ids = df['building_id'].unique()

        all_features = []
        all_targets = []

        for bid in building_ids:
            bdf = df[df['building_id'] == bid].copy()
            bdf = bdf.sort_values('timestamp').reset_index(drop=True)

            # Filter out known anomalies for initial training
            clean_df = bdf[~bdf['is_anomaly']].copy()

            if len(clean_df) < 48:
                continue

            # Train Prophet per building
            prophet_df = self._prepare_prophet_data(clean_df)
            model = Prophet(
                daily_seasonality=True,
                weekly_seasonality=True,
                yearly_seasonality=False,
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10,
            )
            model.fit(prophet_df)
            self.prophet_models[bid] = model

            # Get prophet predictions for the training set
            full_prophet_df = self._prepare_prophet_data(bdf)
            forecast = model.predict(full_prophet_df)

            bdf = bdf.copy()
            bdf['prophet_pred'] = forecast['yhat'].values
            bdf['prophet_trend'] = forecast['trend'].values

            features = bdf[self.feature_cols].values
            targets = bdf['kwh'].values

            all_features.append(features)
            all_targets.append(targets)

        if not all_features:
            raise ValueError("No valid building data for training")

        X = np.vstack(all_features)
        y = np.concatenate(all_targets)

        # Train XGBoost on residuals + features
        self.xgb_model = XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=42,
        )
        self.xgb_model.fit(X, y)
        self.is_trained = True

        # Evaluate
        y_pred = self.xgb_model.predict(X)
        mae = mean_absolute_error(y, y_pred)
        mape = mean_absolute_percentage_error(y, y_pred) * 100

        self.training_history.append({
            'timestamp': pd.Timestamp.now().isoformat(),
            'n_samples': len(y),
            'mae': round(mae, 2),
            'mape': round(mape, 2),
            'n_buildings': len(self.prophet_models),
        })

        return {'mae': mae, 'mape': mape, 'n_buildings': len(self.prophet_models)}

    def retrain_with_anomalies(self, df: pd.DataFrame, confirmed_anomalies: pd.DataFrame):
        """
        Continuous learning: retrain including confirmed anomaly patterns.
        This teaches the model to recognize edge cases it previously missed.
        """
        # Merge confirmed anomalies back into training data with correct labels
        combined = pd.concat([df, confirmed_anomalies], ignore_index=True)
        combined = combined.drop_duplicates(subset=['timestamp', 'building_id'], keep='last')
        return self.train(combined)

    def predict(self, df: pd.DataFrame, building_id: str, horizon_hours: int = 168) -> pd.DataFrame:
        """Forecast energy consumption for next `horizon_hours` hours."""
        if not self.is_trained:
            raise RuntimeError("Model not trained yet")

        if building_id not in self.prophet_models:
            raise ValueError(f"No model for building: {building_id}")

        # Create future timestamps
        last_ts = pd.to_datetime(df['timestamp'].max())
        future_dates = [last_ts + pd.Timedelta(hours=h+1) for h in range(horizon_hours)]
        future_df = pd.DataFrame({'ds': future_dates})

        # Prophet forecast
        prophet_model = self.prophet_models[building_id]
        prophet_forecast = prophet_model.predict(future_df)

        # Build feature matrix for XGBoost
        # Use last known weather as proxy
        last_row = df[df['building_id'] == building_id].iloc[-1]

        features = []
        for i, ts in enumerate(future_dates):
            features.append({
                'hour': ts.hour,
                'day_of_week': ts.weekday(),
                'month': ts.month,
                'is_weekend': int(ts.weekday() >= 5),
                'is_peak_hour': int(any(s <= ts.hour < e for s, e in [(9, 12), (14, 17)])),
                'temperature': last_row['temperature'] + np.random.normal(0, 2),
                'humidity': last_row['humidity'] + np.random.normal(0, 5),
                'prophet_pred': prophet_forecast.iloc[i]['yhat'],
                'prophet_trend': prophet_forecast.iloc[i]['trend'],
            })

        feature_df = pd.DataFrame(features)
        X = feature_df[self.feature_cols].values

        predictions = self.xgb_model.predict(X)

        result = pd.DataFrame({
            'timestamp': future_dates,
            'predicted_kwh': np.maximum(0, predictions).round(2),
            'prophet_lower': prophet_forecast['yhat_lower'].values.round(2),
            'prophet_upper': prophet_forecast['yhat_upper'].values.round(2),
            'building_id': building_id,
        })

        return result

    def save(self, path: str):
        """Save trained models."""
        os.makedirs(path, exist_ok=True)
        if self.xgb_model:
            joblib.dump(self.xgb_model, os.path.join(path, 'energy_xgb.joblib'))
        for bid, model in self.prophet_models.items():
            joblib.dump(model, os.path.join(path, f'energy_prophet_{bid}.joblib'))
        joblib.dump(self.training_history, os.path.join(path, 'energy_history.joblib'))

    def load(self, path: str, building_ids: list = None):
        """Load trained models."""
        self.xgb_model = joblib.load(os.path.join(path, 'energy_xgb.joblib'))
        for f in os.listdir(path):
            if f.startswith('energy_prophet_') and f.endswith('.joblib'):
                bid = f.replace('energy_prophet_', '').replace('.joblib', '')
                if building_ids is None or bid in building_ids:
                    self.prophet_models[bid] = joblib.load(os.path.join(path, f))
        history_path = os.path.join(path, 'energy_history.joblib')
        if os.path.exists(history_path):
            self.training_history = joblib.load(history_path)
        self.is_trained = True
