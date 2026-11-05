"""
Waste Overflow Predictor & Route Optimizer
Predicts hours to overflow, overflow probability, and recommends optimal collection priority.
"""
import numpy as np
import pandas as pd
from xgboost import XGBRegressor, XGBClassifier
import joblib
import os

class WastePredictor:
    """Predicts waste bin fill trajectory, time to overflow, and optimal collection sequences."""

    def __init__(self):
        self.regressor = None
        self.classifier = None
        self.feature_cols = [
            'fill_percentage', 'fill_level_kg', 'capacity_kg',
            'hour', 'day_of_week', 'fill_rate_estimate'
        ]
        self.is_trained = False

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df = df.sort_values(['bin_id', 'timestamp']).reset_index(drop=True)
        # Estimate fill rate kg/hr from last 3 readings
        df['fill_diff'] = df.groupby('bin_id')['fill_level_kg'].diff().fillna(0.2)
        df['fill_rate_estimate'] = df['fill_diff'].clip(lower=0.01)
        return df

    def train(self, df: pd.DataFrame):
        df_feat = self._engineer_features(df)
        X = df_feat[self.feature_cols].values
        y_hours = df_feat['hours_to_full'].clip(upper=72.0).values
        y_overflow = (df_feat['fill_percentage'] >= 85).astype(int).values

        self.regressor = XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.08,
            random_state=42
        )
        self.regressor.fit(X, y_hours)

        self.classifier = XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            random_state=42
        )
        self.classifier.fit(X, y_overflow)
        self.is_trained = True
        return {"status": "trained", "samples": len(X)}

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self.is_trained:
            raise RuntimeError("Waste Predictor is not trained.")

        df_feat = self._engineer_features(df)
        X = df_feat[self.feature_cols].values

        predicted_hours = self.regressor.predict(X)
        overflow_probs = self.classifier.predict_proba(X)[:, 1]

        res = df_feat.copy()
        res['predicted_hours_to_overflow'] = np.maximum(0.5, predicted_hours).round(1)
        res['overflow_probability'] = overflow_probs.round(3)

        # Severity & action
        res['overflow_risk'] = np.where(
            res['fill_percentage'] >= 85, 'Critical',
            np.where(res['fill_percentage'] >= 70, 'Warning', 'Normal')
        )
        res['recommended_action'] = np.where(
            res['fill_percentage'] >= 85, 'Dispatch urgent collection crew within 2 hours',
            np.where(res['fill_percentage'] >= 70, 'Schedule for next planned collection cycle', 'Monitor standard schedule')
        )
        return res

    def get_optimized_collection_route(self, current_bins_df: pd.DataFrame) -> list:
        """Ranks waste bins by collection priority (highest fill % and shortest time to overflow)."""
        pred_df = self.predict(current_bins_df)
        latest = pred_df.sort_values('timestamp').groupby('bin_id').last().reset_index()
        ranked = latest.sort_values(
            by=['fill_percentage', 'predicted_hours_to_overflow'],
            ascending=[False, True]
        )
        route = []
        for rank, (_, row) in enumerate(ranked.iterrows(), start=1):
            route.append({
                "stop_number": rank,
                "bin_id": row["bin_id"],
                "building_name": row["building_name"],
                "waste_type": row["waste_type"],
                "fill_percentage": float(row["fill_percentage"]),
                "predicted_hours_to_overflow": float(row["predicted_hours_to_overflow"]),
                "risk": row["overflow_risk"],
                "action": row["recommended_action"]
            })
        return route

    def save(self, path: str):
        os.makedirs(path, exist_ok=True)
        joblib.dump(self.regressor, os.path.join(path, 'waste_regressor.joblib'))
        joblib.dump(self.classifier, os.path.join(path, 'waste_classifier.joblib'))

    def load(self, path: str):
        self.regressor = joblib.load(os.path.join(path, 'waste_regressor.joblib'))
        self.classifier = joblib.load(os.path.join(path, 'waste_classifier.joblib'))
        self.is_trained = True
