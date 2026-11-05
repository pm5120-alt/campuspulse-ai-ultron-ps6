"""
Safety Incident & Zone Risk Classifier
Predicts zone risk hotspots, high-incident recurrence hours, and response time metrics.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

class SafetyRiskClassifier:
    """Classifies campus risk zones and anticipates incident clusters."""

    def __init__(self):
        self.model = None
        self.feature_cols = ['hour', 'day_of_week', 'month', 'severity_score']
        self.is_trained = False

    def train(self, df: pd.DataFrame):
        df = df.copy()
        X = df[self.feature_cols].values
        y = df['severity'].values

        self.model = RandomForestClassifier(n_estimators=80, max_depth=5, random_state=42)
        self.model.fit(X, y)
        self.is_trained = True
        return {"status": "trained", "incidents_count": len(df)}

    def analyze_zones(self, incidents_df: pd.DataFrame) -> dict:
        """Aggregates zone risk ranking, critical hotspots, and incident frequency."""
        zone_summary = incidents_df.groupby('zone').agg(
            total_incidents=('incident_type', 'count'),
            critical_count=('severity', lambda x: (x == 'Critical').sum()),
            avg_response_min=('response_time_min', 'mean'),
            resolution_rate=('is_resolved', lambda x: (x.sum() / max(1, len(x))) * 100)
        ).reset_index()

        zone_summary['risk_score'] = (
            zone_summary['total_incidents'] * 1.5 +
            zone_summary['critical_count'] * 5.0 -
            zone_summary['resolution_rate'] * 0.2
        ).clip(lower=0)

        zone_summary = zone_summary.sort_values('risk_score', ascending=False)

        hotspots = []
        for _, r in zone_summary.iterrows():
            level = "High" if r['risk_score'] > 20 else ("Medium" if r['risk_score'] > 8 else "Low")
            hotspots.append({
                "zone": r['zone'],
                "total_incidents": int(r['total_incidents']),
                "critical_count": int(r['critical_count']),
                "avg_response_min": round(float(r['avg_response_min']), 1),
                "risk_level": level
            })

        return {
            "hotspots": hotspots,
            "top_risk_zone": hotspots[0]["zone"] if hotspots else "None",
            "overall_safety_status": "Secure" if sum(h["critical_count"] for h in hotspots) < 3 else "Attention Required"
        }

    def save(self, path: str):
        os.makedirs(path, exist_ok=True)
        joblib.dump(self.model, os.path.join(path, 'safety_model.joblib'))

    def load(self, path: str):
        self.model = joblib.load(os.path.join(path, 'safety_model.joblib'))
        self.is_trained = True
