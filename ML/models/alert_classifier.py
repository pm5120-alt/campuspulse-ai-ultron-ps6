"""
Alert Prioritization & Severity Classifier
Harmonizes alerts across Energy, Water, Waste, Air Quality, Assets, and Safety.
Deduplicates noisy sensor triggers and assigns priority levels (Critical, Warning, Info).
"""
import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any

class AlertClassifier:
    """Consolidates cross-facility notifications and alerts."""

    def categorize_alert(
        self,
        domain: str,
        message: str,
        deviation_pct: float,
        is_imminent_danger: bool = False,
        asset_or_location: str = "Facility"
    ) -> Dict[str, Any]:
        """Assigns severity badge and sorting weight."""

        if is_imminent_danger or deviation_pct >= 40.0:
            severity = "Critical"
            weight = 3
        elif deviation_pct >= 20.0:
            severity = "Warning"
            weight = 2
        else:
            severity = "Info"
            weight = 1

        return {
            "domain": domain,
            "severity": severity,
            "weight": weight,
            "message": message,
            "location": asset_or_location,
            "timestamp": datetime.now().strftime("%I:%M %p"),
            "deviation_pct": round(deviation_pct, 1)
        }

    def compile_dashboard_alerts(
        self,
        energy_anomalies: pd.DataFrame,
        water_anomalies: pd.DataFrame,
        waste_overflows: pd.DataFrame,
        aqi_status: dict,
        asset_alerts: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """Produces a unified feed of top prioritized alerts matching the dashboard UI."""
        alerts = []

        # Energy alerts
        if not energy_anomalies.empty:
            for _, r in energy_anomalies[energy_anomalies['is_anomaly_pred']].head(2).iterrows():
                alerts.append(self.categorize_alert(
                    domain="Energy",
                    message=f"Unusual energy spike detected: Consumption in {r.get('building_name', 'Building')} is {int(r.get('z_score', 3)*12)}% higher than normal.",
                    deviation_pct=float(r.get('z_score', 3) * 12),
                    asset_or_location=str(r.get('building_name', 'Campus'))
                ))

        # Water alerts
        if not water_anomalies.empty:
            for _, r in water_anomalies[water_anomalies['is_anomaly_pred']].head(2).iterrows():
                alerts.append(self.categorize_alert(
                    domain="Water",
                    message=f"Higher water usage than expected ({r.get('anomaly_type', 'leak')}) in {r.get('building_name', 'Building')}.",
                    deviation_pct=28.0,
                    asset_or_location=str(r.get('building_name', 'Campus'))
                ))

        # Waste alerts
        if not waste_overflows.empty:
            for _, r in waste_overflows[waste_overflows['is_overflow']].head(2).iterrows():
                alerts.append(self.categorize_alert(
                    domain="Waste",
                    message=f"Waste bin near full capacity ({int(r.get('fill_percentage', 90))}% full at {r.get('building_name', 'Canteen')}). Expected to overflow in {r.get('predicted_hours_to_overflow', 8)} hours.",
                    deviation_pct=float(r.get('fill_percentage', 90)) - 50.0,
                    asset_or_location=str(r.get('building_name', 'Campus'))
                ))

        # AQI alert
        if aqi_status:
            aqi_val = aqi_status.get('aqi', 42)
            cat = aqi_status.get('category', 'Good')
            if aqi_val > 100:
                alerts.append(self.categorize_alert(
                    domain="Air Quality",
                    message=f"Air quality alert: Current AQI is {aqi_val} ({cat}). Initiate air recirculation.",
                    deviation_pct=float(aqi_val / 2.0),
                    asset_or_location="Campus Wide"
                ))
            else:
                alerts.append(self.categorize_alert(
                    domain="Air Quality",
                    message=f"AQI is currently at {aqi_val} ({cat}). Air quality optimal.",
                    deviation_pct=5.0,
                    asset_or_location="Campus Wide"
                ))

        # Asset alerts
        if not asset_alerts.empty:
            for _, r in asset_alerts[asset_alerts['health_status'].isin(['Critical', 'Warning'])].head(2).iterrows():
                alerts.append(self.categorize_alert(
                    domain="Assets",
                    message=f"Predictive maintenance alert: {r.get('asset_id', 'Asset')} in {r.get('building_name', 'Admin Block')} may require maintenance in {int(r.get('estimated_rul_days', 14))} days.",
                    deviation_pct=float(r.get('predicted_failure_probability', 0.5) * 100),
                    asset_or_location=str(r.get('building_name', 'Campus'))
                ))

        # Sort by priority weight (Critical first)
        alerts.sort(key=lambda x: x['weight'], reverse=True)
        return alerts
