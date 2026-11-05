"""
Predictive Maintenance & Asset Health Engine
Predicts equipment breakdown probability, remaining useful life (RUL), and automated work order priorities.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
import joblib
import os

class PredictiveMaintenanceModel:
    """Estimates asset failure risk, degradation trajectories, and optimal maintenance intervals."""

    def __init__(self):
        self.classifier = None
        self.rul_regressor = None
        self.feature_cols = [
            'install_age_years', 'vibration_mm_s', 'operating_temp_c',
            'runtime_hours', 'power_draw_kw', 'efficiency',
            'vibration_spike_ratio', 'temp_delta'
        ]
        self.is_trained = False

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df = df.sort_values(['asset_id', 'date']).reset_index(drop=True)

        # Baseline deviation features
        vibe_mean = df.groupby('asset_category')['vibration_mm_s'].transform('mean')
        df['vibration_spike_ratio'] = df['vibration_mm_s'] / (vibe_mean + 1e-4)

        temp_mean = df.groupby('asset_category')['operating_temp_c'].transform('mean')
        df['temp_delta'] = df['operating_temp_c'] - temp_mean

        return df

    def train(self, df: pd.DataFrame):
        df_feat = self._engineer_features(df)
        X = df_feat[self.feature_cols].values
        y_fail = (df_feat['needs_maintenance']).astype(int).values

        # Synthesize Remaining Useful Life (RUL in days) from health score & failure prob
        y_rul = np.maximum(1, (df_feat['health_score'] / 100.0) * 90 - (df_fail_prob := df_feat['failure_probability'] * 30)).values

        self.classifier = RandomForestClassifier(
            n_estimators=100, max_depth=6, random_state=42, class_weight='balanced'
        )
        self.classifier.fit(X, y_fail)

        self.rul_regressor = RandomForestRegressor(
            n_estimators=80, max_depth=6, random_state=42
        )
        self.rul_regressor.fit(X, y_rul)

        self.is_trained = True
        return {"status": "trained", "samples": len(X)}

    def assess_assets(self, latest_telemetry_df: pd.DataFrame) -> pd.DataFrame:
        if not self.is_trained:
            raise RuntimeError("Predictive Maintenance model is not trained.")

        df_feat = self._engineer_features(latest_telemetry_df)
        X = df_feat[self.feature_cols].values

        fail_probs = self.classifier.predict_proba(X)[:, 1]
        ruls = np.maximum(1.0, self.rul_regressor.predict(X)).round(1)

        res = df_feat.copy()
        res['predicted_failure_probability'] = fail_probs.round(3)
        res['estimated_rul_days'] = ruls

        # Health index composite (0-100)
        res['ai_health_index'] = np.clip(100.0 - (fail_probs * 70.0) - np.maximum(0, df_feat['vibration_mm_s'] - 4.5) * 5.0, 0, 100).round(1)

        # Operational status and urgency
        conditions = [
            (res['ai_health_index'] < 35) | (res['predicted_failure_probability'] > 0.7),
            (res['ai_health_index'] < 65) | (res['predicted_failure_probability'] > 0.35),
            (res['ai_health_index'] >= 65)
        ]
        statuses = ['Critical', 'Warning', 'Healthy']
        actions = [
            'Immediate shutdown/inspection required. Bearing/Thermal threshold exceeded.',
            'Schedule preventive maintenance within 5-7 days. Lubrication/load check.',
            'Normal operation. Telemetry within standard tolerances.'
        ]
        res['health_status'] = np.select(conditions, statuses, default='Healthy')
        res['recommended_work_order'] = np.select(conditions, actions, default='Normal operation.')

        return res

    def save(self, path: str):
        os.makedirs(path, exist_ok=True)
        joblib.dump(self.classifier, os.path.join(path, 'pdm_classifier.joblib'))
        joblib.dump(self.rul_regressor, os.path.join(path, 'pdm_rul.joblib'))

    def load(self, path: str):
        self.classifier = joblib.load(os.path.join(path, 'pdm_classifier.joblib'))
        self.rul_regressor = joblib.load(os.path.join(path, 'pdm_rul.joblib'))
        self.is_trained = True
