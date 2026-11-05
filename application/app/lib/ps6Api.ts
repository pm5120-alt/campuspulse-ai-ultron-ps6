/**
 * Typed client for the PS6 (CAMPUSPULSE AI) simulated workflow endpoints.
 * All data returned by these endpoints is SIMULATED; savings are ESTIMATED.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Ps6Equipment {
  id: string;
  name: string;
  class: "standard" | "essential" | "safety_critical";
  protected: boolean;
}

export interface Ps6Room {
  facility_type: string;
  building_id: string;
  building_name: string;
  floor: number;
  room_id: string;
  capacity: number;
  occupancy_count: number;
  occupancy_pct: number;
  power_kwh: number;
  temperature_c: number;
  equipment: Ps6Equipment[];
  data_mode: "SIMULATED";
  updated_at: string;
}

export interface Ps6RoomsResponse {
  facility_type: string;
  data_mode: "SIMULATED";
  rooms: Ps6Room[];
}

export interface Ps6Schedule {
  id: string;
  building_id: string;
  room_id: string;
  starts_at: string;
  ends_at: string;
  expected_occupancy: number;
  title: string;
  updated_at: string;
}

export interface Ps6ScheduleInput {
  building_id: string;
  room_id: string;
  starts_at: string;
  ends_at: string;
  expected_occupancy: number;
  title: string;
  actor: string;
}

export interface Ps6Comparison {
  schedule: Ps6Schedule;
  actual_occupancy: number | null;
  actual_power_kwh: number | null;
  occupancy_delta: number;
  idle_energy_flag: boolean;
}

export type Ps6Status = "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED IN SIMULATION";

export interface Ps6Recommendation {
  id: string;
  building_id: string;
  room_id: string;
  baseline_kwh: number;
  proposed_kwh: number;
  savings_kwh: number;
  savings_inr: number;
  assumptions: {
    basis: string;
    tariff_inr_per_kwh: number;
    occupancy: number;
    measurement: string;
  };
  affected_equipment: string[];
  safety_validation: {
    valid: boolean;
    action: string;
    excluded_protected_equipment: string[];
    comfort_min_c: number;
    requires_manual_approval: boolean;
    execution_mode: string;
  };
  status: Ps6Status;
  actor: string | null;
  created_at: string;
  updated_at: string;
  simulated_after_kwh: number | null;
}

export interface Ps6RecommendationsResponse {
  estimated_savings_label: string;
  recommendations: Ps6Recommendation[];
}

export type Ps6ExecutionResult = Ps6Recommendation & {
  execution_mode: string;
  measured_savings: boolean;
};

export interface Ps6AuditRecord {
  id: number;
  entity_type: string;
  entity_id: string;
  action: string;
  actor: string;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown>;
  timestamp: string;
}

export interface Ps6Settings {
  idle_load_kwh: number; saving_fraction: number; tariff_inr: number;
  comfort_min_c: number; actor?: string;
}
export interface Ps6Intelligence {
  data_mode: string; method: string; estimated_peak_kwh_per_hour: number | null;
  anomalies: { room_id: string; building_name: string; kind: string; load_kwh_per_hour: number; message: string }[];
  scheduled_load_estimates: { event: string; room_id: string; starts_at: string; ends_at: string; expected_occupancy: number; estimated_load_kwh_per_hour: number }[];
}

interface ApiErrorBody {
  detail?: string | Array<{ msg?: string }>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as ApiErrorBody;
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) message = body.detail.map((d) => d.msg ?? "invalid value").join("; ");
    } catch {
      // Response had no JSON body; keep the status text.
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const ps6Api = {
  rooms: () => request<Ps6RoomsResponse>("/api/v1/ps6/rooms"),
  timetable: () => request<{ schedules: Ps6Schedule[] }>("/api/v1/ps6/timetable"),
  saveSchedule: (input: Ps6ScheduleInput) =>
    request<Ps6Schedule>("/api/v1/ps6/timetable", { method: "POST", body: JSON.stringify(input) }),
  deleteSchedule: (id: string, actor: string) =>
    request<{ deleted: boolean; id: string }>(
      `/api/v1/ps6/timetable/${encodeURIComponent(id)}?actor=${encodeURIComponent(actor)}`,
      { method: "DELETE" },
    ),
  comparison: () =>
    request<{ data_mode: string; comparisons: Ps6Comparison[] }>("/api/v1/ps6/timetable/comparison"),
  recommendations: () => request<Ps6RecommendationsResponse>("/api/v1/ps6/recommendations"),
  decide: (id: string, decision: "APPROVED" | "REJECTED", actor: string) =>
    request<Ps6Recommendation>(`/api/v1/ps6/recommendations/${encodeURIComponent(id)}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, actor }),
    }),
  executeSimulation: (id: string, actor: string) =>
    request<Ps6ExecutionResult>(`/api/v1/ps6/recommendations/${encodeURIComponent(id)}/execute-simulation`, {
      method: "POST",
      body: JSON.stringify({ actor }),
    }),
  audit: () => request<{ records: Ps6AuditRecord[]; storage: string }>("/api/v1/ps6/audit"),
  settings: () => request<Ps6Settings>("/api/v1/ps6/settings"),
  updateSettings: (input: Ps6Settings) => request<Ps6Settings>("/api/v1/ps6/settings", { method: "PUT", body: JSON.stringify(input) }),
  intelligence: () => request<Ps6Intelligence>("/api/v1/ps6/intelligence"),
};
