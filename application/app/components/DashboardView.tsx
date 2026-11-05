"use client";

import React, { useState } from "react";
import { Zap, Droplets, Trash2, Wind, AlertCircle, ArrowUpRight, ArrowDownRight, ChevronRight, Sparkles, Factory, Hospital, Gauge, Flame, Radio, HeartPulse, Stethoscope, Biohazard, Clock } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ChartTooltipContent } from "./ui/chart";
import type { DashboardData, FacilityAlert } from "../lib/dataTypes";

interface DashboardViewProps {
  data: DashboardData | null;
  onNavigate: (view: string) => void;
  facilityType?: string;
}

export default function DashboardView({
  data,
  onNavigate,
  facilityType = "engineering_college",
}: DashboardViewProps) {
  const [activeSeries, setActiveSeries] = useState<{
    energy: boolean;
    water: boolean;
    waste: boolean;
  }>({
    energy: true,
    water: true,
    waste: true,
  });

  const [timeRange, setTimeRange] = useState<"7D" | "14D" | "30D">("7D");

  const kpis = data?.kpi_cards || {
    energy_usage_kwh: 24850,
    energy_change_pct: 12,
    water_usage_kl: 124,
    water_change_pct: -8,
    waste_collected_kg: 680,
    waste_change_pct: 5,
    air_quality_aqi: 42,
    air_quality_status: "Good",
  };

  const health = data?.facility_health || {
    overall_health_pct: 86,
    status: "Good",
    domain_scores: {
      energy: { score: 88, status: "Good" },
      water: { score: 92, status: "Good" },
      waste: { score: 74, status: "Moderate" },
      air_quality: { score: 90, status: "Good" },
      assets: { score: 85, status: "Good" },
      safety: { score: 95, status: "Good" },
    },
  };

  const alerts = data?.alerts || [];

  const getDynamicDays = (count = 7) => {
    const result = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      result.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }
    return result;
  };

  const dayCount = timeRange === "30D" ? 30 : timeRange === "14D" ? 14 : 7;
  const dates = getDynamicDays(dayCount);

  // Baseline telemetry profiles with natural wave patterns
  const baseEnergy = [1240, 1320, 1450, 1520, 1380, 1290, 1610, 1480, 1530, 1390, 1420, 1580, 1640, 1490];
  const baseWater = [82, 78, 85, 88, 84, 91, 80, 86, 89, 79, 83, 92, 87, 85];
  const baseWaste = [12, 14, 18, 19, 11, 15, 8, 16, 17, 13, 14, 20, 18, 15];

  // Convert to Recharts array format with dual-axis normalized values
  const chartData = dates.map((date, idx) => {
    if (dayCount === 7 && data?.trends_7days?.energy_kwh?.[idx] != null) {
      return {
        date,
        Energy: data.trends_7days.energy_kwh[idx],
        Water: data.trends_7days.water_kl?.[idx] ?? (baseWater[idx % baseWater.length]),
        Waste: data.trends_7days.waste_kg?.[idx] ?? (baseWaste[idx % baseWaste.length]),
      };
    }
    const e = baseEnergy[idx % baseEnergy.length] + Math.sin(idx * 0.8) * 80;
    const w = baseWater[idx % baseWater.length] + Math.cos(idx * 0.7) * 5;
    const s = baseWaste[idx % baseWaste.length] + Math.sin(idx * 0.5) * 3;
    return {
      date,
      Energy: Math.round(e),
      Water: Math.round(Math.max(10, w)),
      Waste: Math.round(Math.max(5, s)),
    };
  });

  const toggleSeries = (key: "energy" | "water" | "waste") => {
    setActiveSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-7 mx-0">
      {/* Quick Navigation to AI Insights & Diagnostics Engine */}
      <div className="dashboard-card p-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent dark:from-orange-950/40 dark:via-amber-950/20 dark:to-transparent border border-orange-500/25 dark:border-orange-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Live AI Multi-Domain Diagnostics &amp; Telemetry Briefing
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white">
                Neural LLM
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
              Active anomaly learning, root-cause diagnostics, and step-by-step engineering roadmap.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("ai-insights")}
          className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-orange-500/25 transition cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Open AI Insights Section</span>
        </button>
      </div>

      {/* 4 Large Visual KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Energy Card */}
        <div className="dashboard-card p-7 bg-white border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-100 to-amber-50 dark:from-amber-950/50 dark:to-amber-900/40 text-amber-500 flex items-center justify-center shadow-xs shrink-0 border border-amber-200/50 dark:border-amber-800/50">
              <Zap className="w-8 h-8 fill-amber-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Energy Usage</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                {kpis.energy_usage_kwh.toLocaleString()}{" "}
                <span className="text-sm font-bold text-slate-400">kWh</span>
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-500 mt-1.5 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full inline-flex border border-rose-200/50 dark:border-rose-800/50">
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>+{kpis.energy_change_pct}% vs last wk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Water Card */}
        <div className="dashboard-card p-7 bg-white border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-100 to-sky-50 dark:from-sky-950/50 dark:to-sky-900/40 text-sky-500 flex items-center justify-center shadow-xs shrink-0 border border-sky-200/50 dark:border-sky-800/50">
              <Droplets className="w-8 h-8 fill-sky-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Water Usage</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                {kpis.water_usage_kl.toLocaleString()}{" "}
                <span className="text-sm font-bold text-slate-400">kL</span>
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1.5 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full inline-flex border border-emerald-200/50 dark:border-emerald-800/50">
                <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                <span>{kpis.water_change_pct}% vs last wk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Waste Card */}
        <div className="dashboard-card p-7 bg-white border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-100 to-emerald-50 dark:from-emerald-950/50 dark:to-emerald-900/40 text-emerald-600 flex items-center justify-center shadow-xs shrink-0 border border-emerald-200/50 dark:border-emerald-800/50">
              <Trash2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Waste Output</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                {kpis.waste_collected_kg.toLocaleString()}{" "}
                <span className="text-sm font-bold text-slate-400">kg</span>
              </h3>
              <div className="flex items-center gap-1.5 text-xs font-black text-rose-500 mt-1.5 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full inline-flex border border-rose-200/50 dark:border-rose-800/50">
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>+{kpis.waste_change_pct}% vs last wk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Air Quality Card */}
        <div className="dashboard-card p-7 bg-white border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-100 to-indigo-50 dark:from-indigo-950/50 dark:to-indigo-900/40 text-indigo-500 flex items-center justify-center shadow-xs shrink-0 border border-indigo-200/50 dark:border-indigo-800/50">
              <Wind className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Air Quality (AQI)</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{kpis.air_quality_aqi}</h3>
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1.5 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full inline-flex border border-emerald-200/50 dark:border-emerald-800/50">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{kpis.air_quality_status} Level</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SPECIALIZED INDUSTRIAL SECTOR PANEL (Rendered when Industrial Estate is active) */}
      {facilityType === "industrial_estate" && (
        <div className="dashboard-card p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-amber-500/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-md">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Heavy Industrial SCADA &amp; High-Voltage Operations Center
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                    Enterprise SCADA
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  Real-time power factor, high-pressure steam boilers, ETP effluent telemetry, and shift-wise TOD tariff balancing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-400" /> Max Demand: 2,840 kVA
              </span>
            </div>
          </div>

          {/* 4 Specialized Industrial Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Power Factor & Harmonics */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">3-Phase Power Factor</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">0.985</span>
                <span className="text-xs font-bold text-emerald-400">Lagging (Pass)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-2">
                Penalty threshold: &lt; 0.85 &bull; Incentive rebate: <span className="text-emerald-400 font-bold">+₹42,000/mo</span>
              </p>
            </div>

            {/* High Pressure Steam Boiler */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Boiler Steam Pressure</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">12.4</span>
                <span className="text-sm font-bold text-slate-400">bar</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-2">
                Steam Temp: <span className="text-amber-400 font-bold">340°C</span> &bull; Flue Gas O₂: 3.2%
              </p>
            </div>

            {/* Machine Harmonic Vibration (ISO 10816-3) */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Vibration Health</span>
                <Radio className="w-4 h-4 text-sky-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">1.8</span>
                <span className="text-sm font-bold text-slate-400">mm/s</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-2">
                Ball Mill Motor: <span className="text-emerald-400 font-bold">Class II Good</span> &bull; 64.2°C Bearing
              </p>
            </div>

            {/* ETP Effluent Continuous Telemetry */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">ETP Effluent BOD / COD</span>
                <Droplets className="w-4 h-4 text-teal-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">18</span>
                <span className="text-xs font-bold text-slate-400">mg/L BOD</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-2">
                COD: <span className="text-teal-400 font-bold">74 mg/L</span> &bull; pH: 7.24 (PCB Limit compliant)
              </p>
            </div>
          </div>

          {/* Shift-Wise TOD Production Load Balancing Matrix */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Time-of-Day (TOD) Shift Production Balancing
              </h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Automated load distribution across Shift A (Morning), Shift B (Peak Tariff Shave), and Night Shift C (Off-Peak Max).
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Shift A: 100% Load
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Shift B: 82% (TOD Peak Shave)
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Night Shift C: 115% Off-Peak
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SPECIALIZED HOSPITAL CLINICAL SECTOR PANEL (Rendered when Hospital is active) */}
      {facilityType === "hospital" && (
        <div className="dashboard-card p-8 bg-gradient-to-br from-slate-900 via-[#0a1526] to-slate-900 text-white border border-sky-500/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shadow-md">
                <Hospital className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-white">
                    Clinical Life-Support, MGPS &amp; Cleanroom Infrastructure Command
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500 text-slate-950">
                    Clinical Grade 1
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-400 mt-0.5">
                  Liquid Medical Oxygen (LMO), Operation Theatre cleanroom differential pressure, BMW segregation, and N+1 power redundancy.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-400" /> Life-Support Active: 100%
              </span>
            </div>
          </div>

          {/* 4 Specialized Healthcare Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* LMO Medical Oxygen Tank */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Medical Oxygen (LMO)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">84%</span>
                <span className="text-xs font-bold text-emerald-400">4.2 bar Pressure</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-2">
                Reserve Autonomy: <span className="text-emerald-400 font-bold">14 Days</span> &bull; Central Vacuum: -0.75 bar
              </p>
            </div>

            {/* OT Suite Cleanroom HVAC */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">OT Cleanroom HVAC</span>
                <Stethoscope className="w-4 h-4 text-sky-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">+25</span>
                <span className="text-sm font-bold text-slate-400">Pa Positive</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-2">
                ISO Class 5 &bull; <span className="text-sky-400 font-bold">26 ACH Air Changes</span> (Sterile Barrier)
              </p>
            </div>

            {/* N+1 Critical Life-Support Power */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Life-Support Power</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">100%</span>
                <span className="text-xs font-bold text-emerald-400">0ms UPS Sync</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-2">
                Dual 1,500 kVA DG Standby &bull; Battery Bank: <span className="text-emerald-400 font-bold">4.5 Hrs</span>
              </p>
            </div>

            {/* Bio-Medical Waste (BMW Rules 2016) */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Bio-Medical Waste Log</span>
                <Biohazard className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">152</span>
                <span className="text-sm font-bold text-slate-400">kg / day</span>
              </div>
              <p className="text-[11px] text-slate-400 font-semibold mt-2">
                Yellow: 48kg &bull; Red: 72kg &bull; Blue: 24kg &bull; White: 8kg (Barcoded)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Middle Grid: Large Facility Health Gauge & Prioritized Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Facility Health Gauge */}
        <div className="lg:col-span-5 dashboard-card p-8 bg-white border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Facility Health</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Composite Multi-Criteria AI Health Index</p>
            </div>
            <span className="text-xs font-black px-3.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-300">
              AI Real-Time
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 my-6">
            {/* Large Gauge */}
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="10" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-emerald-500 transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={`${(health.overall_health_pct / 100) * 238.7} 238.7`}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">
                  {health.overall_health_pct}%
                </span>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1.5 uppercase tracking-wider">{health.status}</p>
              </div>
            </div>

            {/* Sub-domain score breakdown */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 w-full text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2 font-bold">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> Energy
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {health.domain_scores?.energy?.status || "Good"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2 font-bold">
                  <span className="w-3 h-3 rounded-full bg-sky-500" /> Water
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {health.domain_scores?.water?.status || "Good"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2 font-bold">
                  <span className="w-3 h-3 rounded-full bg-amber-500" /> Waste
                </span>
                <span className="font-black text-amber-600 dark:text-amber-400">
                  {health.domain_scores?.waste?.status || "Moderate"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2 font-bold">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" /> Air Quality
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {health.domain_scores?.air_quality?.status || "Good"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2 font-bold">
                  <span className="w-3 h-3 rounded-full bg-slate-700 dark:bg-slate-400" /> Assets
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {health.domain_scores?.assets?.status || "Good"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                <span className="text-slate-700 dark:text-slate-200 flex items-center gap-2 font-bold">
                  <span className="w-3 h-3 rounded-full bg-purple-500" /> Safety
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {health.domain_scores?.safety?.status || "Good"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400">
            <span>Overall Facility Reliability</span>
            <span className="font-black text-slate-800 dark:text-slate-200">98.4% Normal Uptime</span>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="lg:col-span-7 dashboard-card p-8 bg-white border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Alerts & Notifications</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">Real-time prioritized anomaly events</p>
            </div>
            <button
              onClick={() => onNavigate("ai-insights")}
              className="flex items-center gap-1.5 text-xs font-extrabold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition cursor-pointer bg-orange-50 dark:bg-orange-950/40 px-3.5 py-1.5 rounded-full border border-orange-200/60 dark:border-orange-800"
            >
              <span>View all AI Insights</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5">
            {alerts.slice(0, 4).map((alert: FacilityAlert, idx: number) => {
              const isCrit = alert.severity === "Critical";
              const isWarn = alert.severity === "Warning";
              return (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${isCrit
                          ? "bg-rose-50 dark:bg-rose-950/50 text-rose-500 border border-rose-200 dark:border-rose-800"
                          : isWarn
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200 dark:border-amber-800"
                            : "bg-sky-50 dark:bg-sky-950/50 text-sky-500 border border-sky-200 dark:border-sky-800"
                        }`}
                    >
                      <AlertCircle className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{alert.message}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ${isCrit
                        ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                        : isWarn
                          ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                          : "bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800"
                      }`}
                  >
                    {alert.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Shadcn UI Recharts Trends Overview Area Chart */}
      <div className="dashboard-card p-8 bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Trends Overview</h3>
              <span className="px-3 py-1 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/70 text-orange-700 text-xs font-black rounded-full flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 fill-orange-500" /> Interactive Graph
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-1">Multi-modal telemetry telemetry curves over 7-day rolling window</p>
          </div>

          {/* Interactive Controls: Series Filter Pills + Range Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Energy Filter Pill */}
            <button
              onClick={() => toggleSeries("energy")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${activeSeries.energy
                  ? "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 opacity-60 line-through"
                }`}
            >
              <span className="w-3 h-3 rounded-full bg-orange-500 shadow-xs" />
              <span>Energy (kWh)</span>
            </button>

            {/* Water Filter Pill */}
            <button
              onClick={() => toggleSeries("water")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${activeSeries.water
                  ? "bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 opacity-60 line-through"
                }`}
            >
              <span className="w-3 h-3 rounded-full bg-sky-500 shadow-xs" />
              <span>Water (kL)</span>
            </button>

            {/* Waste Filter Pill */}
            <button
              onClick={() => toggleSeries("waste")}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${activeSeries.waste
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 opacity-60 line-through"
                }`}
            >
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
              <span>Waste (kg)</span>
            </button>

            {/* Timeframe pill selector */}
            <div className="bg-slate-100 dark:bg-slate-800/90 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/80 ml-2">
              {(["7D", "14D", "30D"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${timeRange === range
                      ? "bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* High-Performance Recharts Chart Container with Dual Y-Axes */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: (activeSeries.water || activeSeries.waste) && activeSeries.energy ? 35 : 15,
                left: activeSeries.energy ? 10 : 0,
                bottom: 0,
              }}
            >
              <defs>
                {/* Energy Gradient */}
                <linearGradient id="shadcnEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
                {/* Water Gradient */}
                <linearGradient id="shadcnWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
                {/* Waste Gradient */}
                <linearGradient id="shadcnWaste" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={12}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                dy={10}
              />

              {/* Primary Y-Axis for Energy (kWh) on Left */}
              <YAxis
                yAxisId="energy"
                orientation="left"
                stroke="#f97316"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                dx={-5}
                hide={!activeSeries.energy}
                tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} kWh`}
                domain={["auto", "auto"]}
              />

              {/* Secondary Y-Axis for Water (kL) & Waste (kg) on Right (or Left if Energy is disabled) */}
              <YAxis
                yAxisId="secondary"
                orientation={activeSeries.energy ? "right" : "left"}
                stroke="#0ea5e9"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                dx={activeSeries.energy ? 8 : -5}
                hide={!activeSeries.water && !activeSeries.waste}
                tickFormatter={(v) => `${v} ${activeSeries.water ? "kL" : "kg"}`}
                domain={["auto", "auto"]}
              />

              <Tooltip
                content={<ChartTooltipContent />}
                cursor={{ stroke: "#cbd5e1", strokeWidth: 1.5, strokeDasharray: "4 4" }}
              />

              {activeSeries.energy && (
                <Area
                  yAxisId="energy"
                  type="monotone"
                  dataKey="Energy"
                  name="Energy (kWh)"
                  stroke="#f97316"
                  strokeWidth={3.5}
                  fillOpacity={1}
                  fill="url(#shadcnEnergy)"
                  dot={{ r: 5, fill: "#ffffff", stroke: "#f97316", strokeWidth: 3 }}
                  activeDot={{ r: 8, fill: "#f97316", stroke: "#ffffff", strokeWidth: 3 }}
                />
              )}

              {activeSeries.water && (
                <Area
                  yAxisId="secondary"
                  type="monotone"
                  dataKey="Water"
                  name="Water (kL)"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#shadcnWater)"
                  dot={{ r: 4.5, fill: "#ffffff", stroke: "#0ea5e9", strokeWidth: 3 }}
                  activeDot={{ r: 7.5, fill: "#0ea5e9", stroke: "#ffffff", strokeWidth: 3 }}
                />
              )}

              {activeSeries.waste && (
                <Area
                  yAxisId="secondary"
                  type="monotone"
                  dataKey="Waste"
                  name="Waste (kg)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#shadcnWaste)"
                  dot={{ r: 4, fill: "#ffffff", stroke: "#10b981", strokeWidth: 2.5 }}
                  activeDot={{ r: 7, fill: "#10b981", stroke: "#ffffff", strokeWidth: 3 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
