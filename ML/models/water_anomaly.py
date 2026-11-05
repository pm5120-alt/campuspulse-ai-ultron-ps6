"""
Water Anomaly Detector
Detects leaks, burst pipes, and abnormal zero-flow conditions using Isolation Forest + rolling z-score.
Supports continuous feedback training loop.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import os

class WaterAnomalyDetector:
    """Detects water leaks, supply anomalies, and excessive usage."""

    def __init__(self, contamination: float = 0.025):
        self.contamination = contamination
        self.models = {}
        self.feature_cols = [
            'litres', 'hour', 'day_of_week', 'is_weekend', 'is_peak_hour',
            'litres_rolling_mean_6h', 'litres_rolling_std_6h', 'z_score', 'night_leak_ratio'
        ]
        self.is_trained = False
        self.confirmed_feedback = []

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp').reset_index(drop=True)

        df['litres_rolling_mean_6h'] = df.groupby('building_id')['litres'].transform(lambda x: x.rolling(6, min_periods=1).mean())
        df['litres_rolling_std_6h'] = df.groupby('building_id')['litres'].transform(lambda x: x.rolling(6, min_periods=1).std().fillna(1.0))

        # Night flow leak indicator: high consumption between 1 AM and 4 AM is suspicious
        is_night = df['hour'].between(1, 4)
        night_mean = df[is_night].groupby('building_id')['litres'].transform('mean')
        df['night_leak_ratio'] = np.where(is_night, df['litres'] / (night_mean + 1.0), 0.0)

        group_stats = df.groupby(['building_id', 'hour'])['litres'].agg(['mean', 'std']).reset_index()
        group_stats.columns = ['building_id', 'hour', 'hourly_mean', 'hourly_std']
        group_stats['hourly_std'] = group_stats['hourly_std'].replace(0, 1.0)

        df = df.merge(group_stats, on=['building_id', 'hour'], how='left')
        df['z_score'] = (df['litres'] - df['hourly_mean']) / df['hourly_std']
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
                n_estimators=120,
                contamination=self.contamination,
                random_state=42
            )
            iso.fit(X)
            self.models[bid] = iso

        self.is_trained = True
        return {"status": "trained", "buildings": list(self.models.keys())}

    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self.is_trained:
            raise RuntimeError("Water Anomaly Detector is not trained.")

        df_feat = self._engineer_features(df)
        results = []

        for bid, bdf in df_feat.groupby('building_id'):
            if bid not in self.models:
                bdf = bdf.copy()
                bdf['anomaly_score'] = (bdf['z_score'].abs() / 3.0).clip(0, 1)
                bdf['is_anomaly_pred'] = bdf['z_score'].abs() > 2.5
                bdf['anomaly_type'] = np.where(bdf['z_score'] > 2.5, 'leak', np.where(bdf['z_score'] < -2.5, 'zero_flow', 'normal'))
                bdf['severity'] = np.where(bdf['z_score'] > 3.5, 'Critical', np.where(bdf['z_score'] > 2.2, 'Warning', 'Normal'))
                results.append(bdf)
                continue

            model = self.models[bid]
            X = bdf[self.feature_cols].values
            scores = model.decision_function(X)
            preds = model.predict(X)

            bdf = bdf.copy()
            norm_score = np.clip(1.0 - (scores - scores.min()) / (scores.max() - scores.min() + 1e-6), 0, 1)
            bdf['anomaly_score'] = norm_score.round(3)
            bdf['is_anomaly_pred'] = (preds == -1) | (bdf['z_score'].abs() > 2.8) | (bdf['night_leak_ratio'] > 2.5)

            conditions = [
                (bdf['is_anomaly_pred'] & (bdf['litres'] > bdf['litres_rolling_mean_6h'] * 2.5)),
                (bdf['is_anomaly_pred'] & (bdf['litres'] > bdf['litres_rolling_mean_6h'] * 1.3)),
                (bdf['is_anomaly_pred'] & (bdf['litres'] < 5.0)),
                (bdf['is_anomaly_pred'])
            ]
            choices = ['burst_pipe', 'continuous_leak', 'zero_flow', 'abnormal_usage']
            bdf['anomaly_type'] = np.select(conditions, choices, default='normal')

            sev_conditions = [
                (bdf['anomaly_type'] == 'burst_pipe') | (bdf['z_score'] > 3.5),
                (bdf['anomaly_type'].isin(['continuous_leak', 'abnormal_usage'])) | (bdf['z_score'] > 2.2),
                (bdf['is_anomaly_pred'])
            ]
            sev_choices = ['Critical', 'Warning', 'Info']
            bdf['severity'] = np.select(sev_conditions, sev_choices, default='Normal')

            results.append(bdf)

        return pd.concat(results, ignore_index=True)

    def feedback_and_retrain(self, df_new: pd.DataFrame, confirmed_df: pd.DataFrame):
        if not confirmed_df.empty:
            self.confirmed_feedback.append(confirmed_df)
        combined = pd.concat([df_new] + self.confirmed_feedback, ignore_index=True).drop_duplicates(
            subset=['timestamp', 'building_id'], keep='last'
        )
        return self.train(combined)

    def save(self, path: str):
        os.makedirs(path, exist_ok=True)
        joblib.dump(self.models, os.path.join(path, 'water_anomaly_models.joblib'))

    def load(self, path: str):
        self.models = joblib.load(os.path.join(path, 'water_anomaly_models.joblib'))
        self.is_trained = True
