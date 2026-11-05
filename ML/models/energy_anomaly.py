"""
Energy Anomaly Detector
Uses Isolation Forest combined with statistical z-score thresholds and rolling statistics.
Features continuous learning support by saving feedback and retraining with adaptive contamination.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os
import sys

class EnergyAnomalyDetector:
    """Detects energy consumption anomalies (spikes, sustained abnormal loads, drops)."""

    def __init__(self, contamination: float = 0.03):
        self.contamination = contamination
        self.models = {}  # per-building or global model
        self.feature_cols = [
            'kwh', 'hour', 'day_of_week', 'is_weekend', 'is_peak_hour',
            'temp_diff', 'kwh_rolling_mean_6h', 'kwh_rolling_std_6h', 'z_score'
        ]
        self.is_trained = False
        self.confirmed_anomalies = []

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp').reset_index(drop=True)

        if 'temperature' in df.columns:
            df['temp_diff'] = df['temperature'] - 25.0
        else:
            df['temp_diff'] = 0.0

        # Rolling statistics per building
        df['kwh_rolling_mean_6h'] = df.groupby('building_id')['kwh'].transform(lambda x: x.rolling(6, min_periods=1).mean())
        df['kwh_rolling_std_6h'] = df.groupby('building_id')['kwh'].transform(lambda x: x.rolling(6, min_periods=1).std().fillna(0.1))

        # Z-score per hour and building group
        group_stats = df.groupby(['building_id', 'hour'])['kwh'].agg(['mean', 'std']).reset_index()
        group_stats.columns = ['building_id', 'hour', 'hourly_mean', 'hourly_std']
        group_stats['hourly_std'] = group_stats['hourly_std'].replace(0, 0.1)

        df = df.merge(group_stats, on=['building_id', 'hour'], how='left')
        df['z_score'] = (df['kwh'] - df['hourly_mean']) / df['hourly_std']
        df['z_score'] = df['z_score'].fillna(0.0)

        return df

    def train(self, df: pd.DataFrame):
        df_feat = self._engineer_features(df)
        building_ids = df_feat['building_id'].unique()

        for bid in building_ids:
            bdf = df_feat[df_feat['building_id'] == bid]
            if len(bdf) < 20:
                continue

            X = bdf[self.feature_cols].values
            iso = IsolationForest(
                n_estimators=150,
                contamination=self.contamination,
                random_state=42,
                max_samples='auto'
            )
            iso.fit(X)
            self.models[bid] = iso

        self.is_trained = True
        return {"status": "trained", "buildings": list(self.models.keys())}

    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self.is_trained:
            raise RuntimeError("Energy Anomaly Detector is not trained.")

        df_feat = self._engineer_features(df)
        results = []

        for bid, bdf in df_feat.groupby('building_id'):
            if bid not in self.models:
                # Fallback to general threshold if building unseen
                bdf = bdf.copy()
                bdf['anomaly_score'] = bdf['z_score'].abs() / 3.0
                bdf['is_anomaly_pred'] = bdf['z_score'].abs() > 2.5
                bdf['anomaly_type'] = np.where(bdf['z_score'] > 2.5, 'spike', np.where(bdf['z_score'] < -2.5, 'drop', 'normal'))
                bdf['severity'] = np.where(bdf['z_score'].abs() > 3.5, 'Critical', np.where(bdf['z_score'].abs() > 2.5, 'Warning', 'Normal'))
                results.append(bdf)
                continue

            model = self.models[bid]
            X = bdf[self.feature_cols].values
            scores = model.decision_function(X) # lower score = more anomalous
            preds = model.predict(X) # -1 is anomaly

            bdf = bdf.copy()
            # Normalize anomaly score from 0 (normal) to 1 (most anomalous)
            norm_score = np.clip(1.0 - (scores - scores.min()) / (scores.max() - scores.min() + 1e-6), 0, 1)
            bdf['anomaly_score'] = norm_score.round(3)
            bdf['is_anomaly_pred'] = (preds == -1) | (bdf['z_score'].abs() > 2.8)

            # Classify anomaly type & severity
            conditions = [
                (bdf['is_anomaly_pred'] & (bdf['kwh'] > bdf['kwh_rolling_mean_6h'] * 1.3)),
                (bdf['is_anomaly_pred'] & (bdf['kwh'] < bdf['kwh_rolling_mean_6h'] * 0.5)),
                (bdf['is_anomaly_pred'])
            ]
            choices = ['spike', 'drop', 'pattern_shift']
            bdf['anomaly_type'] = np.select(conditions, choices, default='normal')

            sev_conditions = [
                (bdf['is_anomaly_pred'] & ((bdf['z_score'] > 3.5) | (bdf['anomaly_score'] > 0.85))),
                (bdf['is_anomaly_pred'] & ((bdf['z_score'] > 2.2) | (bdf['anomaly_score'] > 0.65))),
                (bdf['is_anomaly_pred'])
            ]
            sev_choices = ['Critical', 'Warning', 'Info']
            bdf['severity'] = np.select(sev_conditions, sev_choices, default='Normal')

            results.append(bdf)

        return pd.concat(results, ignore_index=True)

    def feedback_and_retrain(self, df_new: pd.DataFrame, confirmed_anomalies_df: pd.DataFrame):
        """Continuous learning mechanism: incorporates validated anomaly records & tunes sensitivity."""
        if not confirmed_anomalies_df.empty:
            self.confirmed_anomalies.append(confirmed_anomalies_df)
        combined = pd.concat([df_new] + self.confirmed_anomalies, ignore_index=True).drop_duplicates(
            subset=['timestamp', 'building_id'], keep='last'
        )
        return self.train(combined)

    def save(self, path: str):
        os.makedirs(path, exist_ok=True)
        joblib.dump(self.models, os.path.join(path, 'energy_anomaly_models.joblib'))

    def load(self, path: str):
        self.models = joblib.load(os.path.join(path, 'energy_anomaly_models.joblib'))
        self.is_trained = True
