"""
Scenario Simulator Engine
Evaluates 'What-If' policy and operational decisions on energy, cost, emissions, and water.
Directly aligns with the Simulation Dashboard UI.
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Any

class ScenarioSimulator:
    """Simulates interventions and computes forecasted delta in kWh, INR, and tCO2."""

    def __init__(self, tariff_per_kwh: float = 7.5, emission_factor_co2: float = 0.82, tariff_per_kl: float = 45.0):
        self.tariff_per_kwh = tariff_per_kwh
        self.emission_factor_co2 = emission_factor_co2 # kg CO2 per kWh
        self.tariff_per_kl = tariff_per_kl

    def simulate(
        self,
        scenario_id: str,
        parameter_pct: float,
        target_buildings: List[str],
        simulation_weeks: int = 4,
        baseline_weekly_kwh_per_building: Dict[str, float] = None,
        baseline_weekly_water_kl_per_building: Dict[str, float] = None,
    ) -> Dict[str, Any]:
        """
        Executes what-if simulation for specified scenario and parameters.

        scenario_id options:
          - 'reduce_hvac'
          - 'adjust_water_irrigation'
          - 'optimize_waste_route'
          - 'switch_to_led'
          - 'hybrid_wfh'
        """
        if baseline_weekly_kwh_per_building is None:
            baseline_weekly_kwh_per_building = {b: 4000.0 for b in target_buildings}
        if baseline_weekly_water_kl_per_building is None:
            baseline_weekly_water_kl_per_building = {b: 25.0 for b in target_buildings}

        total_baseline_kwh = sum(baseline_weekly_kwh_per_building.get(b, 4000.0) for b in target_buildings) * simulation_weeks
        total_baseline_water = sum(baseline_weekly_water_kl_per_building.get(b, 25.0) for b in target_buildings) * simulation_weeks

        reduction_factor = max(0.0, min(parameter_pct / 100.0, 0.8))

        kwh_saved = 0.0
        water_saved_kl = 0.0
        cost_saved_inr = 0.0
        co2_saved_tonnes = 0.0
        comfort_impact = "No significant impact on indoor comfort levels expected."

        if scenario_id == "reduce_hvac":
            # HVAC is ~45% of total building electrical load
            hvac_share = 0.45
            kwh_saved = total_baseline_kwh * hvac_share * reduction_factor
            cost_saved_inr = kwh_saved * self.tariff_per_kwh
            co2_saved_tonnes = (kwh_saved * self.emission_factor_co2) / 1000.0

            if parameter_pct > 35:
                comfort_impact = "Slight thermal discomfort possible in peak afternoon hours (2-4 PM). Pre-cooling recommended."
            elif parameter_pct > 20:
                comfort_impact = "Moderate temperature delta (+1°C). Occupant satisfaction maintained with smart zoning."
            else:
                comfort_impact = "No noticeable impact on indoor thermal comfort. Ideal operational efficiency zone."

        elif scenario_id == "adjust_water_irrigation":
            # Irrigation is ~30% of campus water consumption
            irrigation_share = 0.30
            water_saved_kl = total_baseline_water * irrigation_share * reduction_factor
            # Energy saved from reduced pumping
            pumping_kwh_saved = water_saved_kl * 1.8  # ~1.8 kWh per kL pumped
            kwh_saved = pumping_kwh_saved
            cost_saved_inr = (water_saved_kl * self.tariff_per_kl) + (pumping_kwh_saved * self.tariff_per_kwh)
            co2_saved_tonnes = (pumping_kwh_saved * self.emission_factor_co2) / 1000.0
            comfort_impact = "Maintains landscape health while eliminating over-watering and deep seepage loss."

        elif scenario_id == "switch_to_led":
            # Lighting is ~25% of building electrical load; LED reduces lighting energy by ~50%
            lighting_share = 0.25
            led_efficiency_gain = 0.50
            kwh_saved = total_baseline_kwh * lighting_share * led_efficiency_gain * (parameter_pct / 100.0)
            cost_saved_inr = kwh_saved * self.tariff_per_kwh
            co2_saved_tonnes = (kwh_saved * self.emission_factor_co2) / 1000.0
            comfort_impact = "Improves lux distribution and reduces heat emissions from legacy ballast fixtures."

        elif scenario_id == "hybrid_wfh":
            # Occupancy drop reduces plug loads, lighting, and HVAC
            occupancy_impact_rate = 0.65
            kwh_saved = total_baseline_kwh * occupancy_impact_rate * (parameter_pct / 100.0)
            water_saved_kl = total_baseline_water * 0.70 * (parameter_pct / 100.0)
            cost_saved_inr = (kwh_saved * self.tariff_per_kwh) + (water_saved_kl * self.tariff_per_kl)
            co2_saved_tonnes = (kwh_saved * self.emission_factor_co2) / 1000.0
            comfort_impact = "Substantially lowers campus traffic congestion and peak facility wear & tear."

        elif scenario_id == "optimize_waste_route":
            # Route optimization saves fuel & diesel generator / fleet emissions
            trips_reduced = int(round(simulation_weeks * 7 * (parameter_pct / 100.0) * 0.4))
            diesel_saved_litres = trips_reduced * 12.0
            cost_saved_inr = diesel_saved_litres * 90.0 # ~90 INR per litre diesel
            co2_saved_tonnes = (diesel_saved_litres * 2.68) / 1000.0 # 2.68 kg CO2/L diesel
            kwh_saved = trips_reduced * 15.0 # equivalent energy
            comfort_impact = "Zero bin overflows; improves campus hygiene and minimizes vehicular noise."

        pct_energy_reduction = (kwh_saved / max(1.0, total_baseline_kwh)) * 100.0

        return {
            "scenario_id": scenario_id,
            "parameter_pct": parameter_pct,
            "simulation_period_weeks": simulation_weeks,
            "target_buildings": target_buildings,
            "predicted_impact": {
                "energy_reduction_pct": round(pct_energy_reduction, 1),
                "energy_saved_kwh": int(round(kwh_saved)),
                "cost_savings_inr": int(round(cost_saved_inr)),
                "cost_savings_monthly_inr": int(round(cost_saved_inr * (4.0 / max(1, simulation_weeks)))),
                "carbon_emission_reduction_tco2": round(co2_saved_tonnes, 2),
                "water_saved_kl": round(water_saved_kl, 1),
                "comfort_impact_advisory": comfort_impact
            }
        }
