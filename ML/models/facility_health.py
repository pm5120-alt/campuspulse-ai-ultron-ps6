"""
Facility Health Engine
Calculates overall campus/facility composite health score (0-100%)
and domain sub-scores (Energy, Water, Waste, Air Quality, Assets, Safety).
Integrates across multiple facility types (College, Hospital, Industrial, Municipal).
"""
import numpy as np
import pandas as pd

class FacilityHealthEngine:
    """Computes real-time and historical multi-domain facility health scores."""

    def __init__(self, facility_type: str = "engineering_college"):
        self.facility_type = facility_type

        # Domain weighting can be customized per facility type
        self.weights = {
            "engineering_college": {"energy": 0.25, "water": 0.20, "waste": 0.15, "aqi": 0.15, "assets": 0.15, "safety": 0.10},
            "hospital": {"energy": 0.20, "water": 0.20, "waste": 0.20, "aqi": 0.15, "assets": 0.15, "safety": 0.10},
            "industrial_estate": {"energy": 0.30, "water": 0.15, "waste": 0.15, "aqi": 0.15, "assets": 0.15, "safety": 0.10},
            "municipal_campus": {"energy": 0.20, "water": 0.25, "waste": 0.20, "aqi": 0.15, "assets": 0.10, "safety": 0.10},
        }.get(facility_type, {"energy": 0.25, "water": 0.20, "waste": 0.15, "aqi": 0.15, "assets": 0.15, "safety": 0.10})

    def calculate_health(
        self,
        energy_anomalies_count: int,
        energy_total_buildings: int,
        water_anomalies_count: int,
        waste_overflows_count: int,
        waste_total_bins: int,
        avg_aqi: float,
        assets_critical_count: int,
        assets_total_count: int,
        safety_incidents_active: int,
    ) -> dict:
        """Calculates normalized sub-domain scores (0-100) and composite overall facility health."""

        # 1. Energy Health
        e_ratio = energy_anomalies_count / max(1, energy_total_buildings)
        energy_score = max(20.0, 100.0 - (e_ratio * 60.0))

        # 2. Water Health
        w_penalty = min(80.0, water_anomalies_count * 25.0)
        water_score = max(20.0, 100.0 - w_penalty)

        # 3. Waste Health
        waste_ratio = waste_overflows_count / max(1, waste_total_bins)
        waste_score = max(20.0, 100.0 - (waste_ratio * 80.0))

        # 4. Air Quality Health
        if avg_aqi <= 50:
            aqi_score = 100.0
        elif avg_aqi <= 100:
            aqi_score = 85.0
        elif avg_aqi <= 200:
            aqi_score = 65.0
        elif avg_aqi <= 300:
            aqi_score = 40.0
        else:
            aqi_score = 20.0

        # 5. Assets Health
        asset_crit_ratio = assets_critical_count / max(1, assets_total_count)
        assets_score = max(20.0, 100.0 - (asset_crit_ratio * 100.0))

        # 6. Safety Health
        safety_score = max(30.0, 100.0 - (safety_incidents_active * 15.0))

        # Overall weighted composite
        overall = (
            energy_score * self.weights["energy"] +
            water_score * self.weights["water"] +
            waste_score * self.weights["waste"] +
            aqi_score * self.weights["aqi"] +
            assets_score * self.weights["assets"] +
            safety_score * self.weights["safety"]
        )

        overall_rounded = int(round(overall))

        status_text = "Good" if overall_rounded >= 80 else ("Moderate" if overall_rounded >= 60 else "Critical")

        def _sub_status(s):
            return "Good" if s >= 80 else ("Moderate" if s >= 60 else "Critical")

        return {
            "overall_health_pct": overall_rounded,
            "status": status_text,
            "domain_scores": {
                "energy": {"score": int(round(energy_score)), "status": _sub_status(energy_score)},
                "water": {"score": int(round(water_score)), "status": _sub_status(water_score)},
                "waste": {"score": int(round(waste_score)), "status": _sub_status(waste_score)},
                "air_quality": {"score": int(round(aqi_score)), "status": _sub_status(aqi_score)},
                "assets": {"score": int(round(assets_score)), "status": _sub_status(assets_score)},
                "safety": {"score": int(round(safety_score)), "status": _sub_status(safety_score)},
            }
        }
