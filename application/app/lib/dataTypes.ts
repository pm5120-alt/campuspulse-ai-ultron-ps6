export type FacilitySector = "engineering_college" | "hospital" | "industrial_estate" | "municipal_campus";

export interface FacilityAlert {
  domain?: string;
  severity: string;
  message: string;
  location?: string;
  timestamp?: string;
}

export interface DashboardData {
  [key: string]: unknown;
  facility_type?: string;
  sustainability_score?: number;
  kpi_cards?: {
    energy_usage_kwh: number; energy_change_pct: number;
    water_usage_kl: number; water_change_pct: number;
    waste_collected_kg: number; waste_change_pct: number;
    air_quality_aqi: number; air_quality_status: string;
  };
  facility_health?: { overall_health_pct: number; status?: string; domain_scores?: Record<string, { score?: number; status?: string }> };
  alerts?: FacilityAlert[];
  recent_alerts?: FacilityAlert[];
  trends_7days?: { dates?: string[]; energy_kwh?: number[]; water_kl?: number[]; waste_kg?: number[] };
}

export interface CampusMapData {
  [key: string]: unknown;
  facility_type?: string;
  buildings?: Array<{ id: string; name: string; live_status?: string; status_label?: string; top?: string; left?: string }>;
  total_buildings?: number; active_sensors?: number; live_alerts?: number; facility_health_pct?: number;
}

export interface EnergyAnalyticsData {
  [key: string]: unknown;
  kpis?: { peak_demand_kw?: number; peak_demand_delta_pct?: number; total_consumption_kwh?: number; total_consumption_delta_pct?: number; estimated_cost_inr?: number; estimated_cost_delta_pct?: number; carbon_emissions_tco2?: number; carbon_emissions_delta_pct?: number };
}

export interface AiInsightData {
  [key: string]: unknown;
  id: string; sector?: string; domain: string; severity: string; title: string;
  description: string; root_cause?: string;
}
export interface AiInsightsData {
  [key: string]: unknown;
  facility_health_pct?: number; total_energy_kwh?: number;
  insights?: AiInsightData[];
}

export interface AssetOperationsData {
  [key: string]: unknown;
  priority_maintenance?: Array<{ asset_name: string; action_required: string }>;
}

export interface SustainabilityReportData {
  [key: string]: unknown;
  deltas_vs_previous_month?: { energy_pct: number; water_pct: number; waste_pct: number; carbon_emissions_pct: number };
  scorecard?: { overall_sustainability_index: number; rating: string; radar_scores: Record<string, number>; kpis?: Record<string, number> };
  sustainability_score?: number;
}

export interface SafetyOverviewData {
  [key: string]: unknown;
  safety_analytics?: {
    hotspots?: Array<{ zone: string; total_incidents: number; critical_count: number; avg_response_min: number; risk_level: string; fill?: string }>;
    top_risk_zone?: string; overall_safety_status?: string;
  };
}

export interface SimulationImpact {
  energy_reduction_pct: number; energy_saved_kwh: number; cost_savings_monthly_inr: number;
  carbon_emission_reduction_tco2: number; comfort_impact_advisory: string;
  cost_savings_inr?: number; water_saved_kl?: number;
}
export interface SimulationResponse { predicted_impact?: SimulationImpact; [key: string]: unknown }

export interface LearningResponse {
  status?: string;
  accepted?: number;
  rejected?: number;
  duplicates?: number;
  retraining_status?: "completed" | "failed" | "not_run";
  retraining_errors?: string[];
  retrained_models?: string[];
  message?: string;
  model_version?: string;
  metrics?: { forecast_rmse_improvement_pct?: number; anomaly_f1_score?: number };
  learned_insights?: string[];
  [key: string]: unknown;
}

export type TelemetryRow = Record<string, string | number>;
