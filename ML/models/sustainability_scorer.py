"""
Sustainability Scorer & ESG Scorecard Engine
Computes multi-dimensional sustainability scorecard (0-100 radar scores)
and monthly comparison metrics for executive reporting.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any

class SustainabilityScorer:
    """Generates 6-axis sustainability radar scores and benchmark comparisons."""

    def calculate_scorecard(
        self,
        energy_kwh_total: float,
        solar_generation_kwh: float,
        water_kl_total: float,
        rainwater_harvested_kl: float,
        waste_total_kg: float,
        waste_recycled_kg: float,
        avg_aqi: float,
        safety_incidents_resolved_pct: float,
        asset_maintenance_compliance_pct: float
    ) -> Dict[str, Any]:
        """Calculates 0-100 scores for Energy, Water, Waste, Air Quality, Safety, and Assets."""

        # 1. Energy Score: penalizes excessive consumption, rewards renewable share
        renewable_share = solar_generation_kwh / max(1.0, energy_kwh_total)
        energy_score = min(100.0, max(20.0, 70.0 + (renewable_share * 100.0 * 0.3)))

        # 2. Water Score: rewards recycling & rainwater harvesting ratio
        harvest_ratio = rainwater_harvested_kl / max(1.0, water_kl_total)
        water_score = min(100.0, max(25.0, 65.0 + (harvest_ratio * 100.0 * 0.35)))

        # 3. Waste Diversion Score: percentage of waste diverted from landfill
        diversion_rate = (waste_recycled_kg / max(1.0, waste_total_kg)) * 100.0
        waste_score = min(100.0, max(30.0, 50.0 + (diversion_rate * 0.5)))

        # 4. Air Quality Score: inverse of NAQI
        if avg_aqi <= 50:
            aqi_score = 95.0
        elif avg_aqi <= 100:
            aqi_score = 80.0
        elif avg_aqi <= 200:
            aqi_score = 60.0
        else:
            aqi_score = 40.0

        # 5. Safety Score
        safety_score = min(100.0, max(40.0, safety_incidents_resolved_pct * 0.95))

        # 6. Assets Reliability Score
        asset_score = min(100.0, max(35.0, asset_maintenance_compliance_pct * 0.9))

        overall_esg = (energy_score + water_score + waste_score + aqi_score + safety_score + asset_score) / 6.0

        return {
            "overall_sustainability_index": int(round(overall_esg)),
            "rating": "Platinum" if overall_esg >= 85 else ("Gold" if overall_esg >= 70 else "Silver"),
            "radar_scores": {
                "Energy": int(round(energy_score)),
                "Water": int(round(water_score)),
                "Waste": int(round(waste_score)),
                "Air Quality": int(round(aqi_score)),
                "Safety": int(round(safety_score)),
                "Assets": int(round(asset_score))
            },
            "kpis": {
                "renewable_energy_share_pct": round(renewable_share * 100, 1),
                "rainwater_harvest_pct": round(harvest_ratio * 100, 1),
                "waste_diversion_rate_pct": round(diversion_rate, 1),
                "carbon_intensity_kg_per_sqm": round((energy_kwh_total * 0.82) / 18000.0, 2)
            }
        }
