"use client";

import React, { useState, useEffect } from "react";
import { Zap, Gauge, IndianRupee, Leaf, Lightbulb, ArrowUpRight, Sparkles, UploadCloud, CheckCircle2, Factory, Hospital, GraduationCap, Landmark, Flame, BrainCircuit, Loader2 } from "lucide-react";
import { syncAndLearnTelemetry } from "../lib/api";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { ChartTooltipContent } from "./ui/chart";
import DataUploadStudioModal, { UploadedTelemetryDataset } from "./DataUploadStudioModal";
import type { LucideIcon } from "lucide-react";
import { isValidTelemetryDataset, safelyRemoveStoredTelemetry } from "../lib/telemetryCsv";

interface EnergyAnalyticsViewProps {
  facilityType?: string;
  facilityName?: string;
}

// Sector-specific baseline energy intelligence and load distributions
const SECTOR_ENERGY_PROFILES: Record<
  string,
  {
    sectorTitle: string;
    icon: LucideIcon;
    kpis: {
      total_consumption_kwh: number;
      total_delta_pct: number;
      peak_demand_kw: number;
      peak_delta_pct: number;
      estimated_cost_inr: number;
      tariff_per_kwh: number;
      carbon_emissions_tco2: number;
      carbon_delta_pct: number;
    };
    buildingLoads: { building: string; kwh: number; color: string }[];
    forecastTimeline: { time: string; actual: number | null; forecast: number; isAnomaly?: boolean }[];
    recommendations: { title: string; impact: string; description: string; priority: string }[];
  }
> = {
  engineering_college: {
    sectorTitle: "Academic Campus Energy Telemetry",
    icon: GraduationCap,
    kpis: {
      total_consumption_kwh: 24850,
      total_delta_pct: 12,
      peak_demand_kw: 320,
      peak_delta_pct: 5,
      estimated_cost_inr: 186375,
      tariff_per_kwh: 7.5,
      carbon_emissions_tco2: 18.2,
      carbon_delta_pct: 12,
    },
    buildingLoads: [
      { building: "Academic Block", kwh: 8240, color: "#f97316" },
      { building: "Hostel A (VHR)", kwh: 5420, color: "#fb923c" },
      { building: "Hostel B (APJ)", kwh: 4120, color: "#fdba74" },
      { building: "Admin & Labs", kwh: 3210, color: "#0ea5e9" },
      { building: "Canteen / Mess", kwh: 2860, color: "#10b981" },
      { building: "Sports Arena", kwh: 1140, color: "#8b5cf6" },
    ],
    forecastTimeline: [
      { time: "Mon 00:00", actual: 1120, forecast: 1100, isAnomaly: false },
      { time: "Mon 06:00", actual: 1840, forecast: 1790, isAnomaly: false },
      { time: "Mon 12:00", actual: 2950, forecast: 2800, isAnomaly: false },
      { time: "Mon 18:00", actual: 2410, forecast: 2380, isAnomaly: false },
      { time: "Tue 00:00", actual: 1080, forecast: 1120, isAnomaly: false },
      { time: "Tue 06:00", actual: 1920, forecast: 1810, isAnomaly: false },
      { time: "Tue 12:00", actual: 3890, forecast: 2920, isAnomaly: true },
      { time: "Tue 18:00", actual: 2550, forecast: 2400, isAnomaly: false },
      { time: "Wed 00:00", actual: 1140, forecast: 1110, isAnomaly: false },
      { time: "Wed 06:00", actual: 1880, forecast: 1830, isAnomaly: false },
      { time: "Wed 12:00", actual: null, forecast: 3010, isAnomaly: false },
      { time: "Wed 18:00", actual: null, forecast: 2450, isAnomaly: false },
      { time: "Thu 00:00", actual: null, forecast: 1150, isAnomaly: false },
      { time: "Thu 06:00", actual: null, forecast: 1890, isAnomaly: false },
    ],
    recommendations: [
      {
        title: "HVAC Night-Setback Optimization",
        impact: "Save ₹38,000 / month",
        description: "Academic block chillers run past lecture occupancy. Automating BMS setpoint baseline to 24°C saves 24% baseline night load.",
        priority: "High Priority",
      },
      {
        title: "Peak Demand Tariff Shifting",
        impact: "Reduce 42 kW Peak Surcharge",
        description: "Stagger hostel water heating cycles between 05:00 - 07:00 to avoid coinciding with kitchen cold-storage compressor spikes.",
        priority: "Medium Priority",
      },
      {
        title: "Rooftop Solar PV Generation Match",
        impact: "Clean Offset 8.4 tCO2 / mo",
        description: "Shift computer center batch training and lab autoclave sterilization to 11:30 - 14:30 solar peak generation window.",
        priority: "Sustainability",
      },
    ],
  },
  industrial_estate: {
    sectorTitle: "Heavy Industry SCADA Energy Telemetry",
    icon: Factory,
    kpis: {
      total_consumption_kwh: 148000,
      total_delta_pct: 6,
      peak_demand_kw: 2400,
      peak_delta_pct: 3,
      estimated_cost_inr: 1332000,
      tariff_per_kwh: 9.0,
      carbon_emissions_tco2: 118.5,
      carbon_delta_pct: 6,
    },
    buildingLoads: [
      { building: "Potline Smelter #1", kwh: 68000, color: "#f97316" },
      { building: "Potline Smelter #2", kwh: 45000, color: "#fb923c" },
      { building: "Captive Power Plant", kwh: 18500, color: "#fdba74" },
      { building: "Bauxite Silo Feed", kwh: 8900, color: "#0ea5e9" },
      { building: "ETP Treatment Plant", kwh: 5200, color: "#10b981" },
      { building: "Admin & Logistics", kwh: 2400, color: "#8b5cf6" },
    ],
    forecastTimeline: [
      { time: "Shift 1 (00:00)", actual: 17800, forecast: 17500, isAnomaly: false },
      { time: "Shift 1 (04:00)", actual: 18200, forecast: 17900, isAnomaly: false },
      { time: "Shift 2 (08:00)", actual: 21400, forecast: 20800, isAnomaly: false },
      { time: "Shift 2 (12:00)", actual: 26800, forecast: 21500, isAnomaly: true }, // Industrial TOD Peak Anomaly
      { time: "Shift 3 (16:00)", actual: 20200, forecast: 19800, isAnomaly: false },
      { time: "Shift 3 (20:00)", actual: 18900, forecast: 18400, isAnomaly: false },
      { time: "Shift 1 (00:00)", actual: 17600, forecast: 17500, isAnomaly: false },
      { time: "Shift 2 (08:00)", actual: null, forecast: 21200, isAnomaly: false },
      { time: "Shift 2 (12:00)", actual: null, forecast: 22000, isAnomaly: false },
      { time: "Shift 3 (16:00)", actual: null, forecast: 20100, isAnomaly: false },
    ],
    recommendations: [
      {
        title: "Active Power Factor (APFC) Correction",
        impact: "Avoid ₹1,45,000 / mo Discom Penalty",
        description: "Maintain 3-phase power factor at 0.985 across Substation 2 to stay above 0.85 state tariff penalty threshold.",
        priority: "Critical Priority",
      },
      {
        title: "TOD (Time-of-Day) Shift Load Balancing",
        impact: "Save ₹2,10,000 / mo on Peak Surcharge",
        description: "Schedule secondary induction melting furnaces and CNC tooling during off-peak night tariff window (22:00 - 06:00).",
        priority: "High Priority",
      },
      {
        title: "Boiler Waste Heat Economizer Recovery",
        impact: "Recover 480 MWh Thermal / yr",
        description: "Pre-heat boiler feedwater using flue gas heat exchanger to cut thermic oil fuel burn by 8.5%.",
        priority: "Efficiency",
      },
    ],
  },
  hospital: {
    sectorTitle: "Clinical Life-Support Energy Telemetry",
    icon: Hospital,
    kpis: {
      total_consumption_kwh: 54200,
      total_delta_pct: 4,
      peak_demand_kw: 850,
      peak_delta_pct: 2,
      estimated_cost_inr: 433600,
      tariff_per_kwh: 8.0,
      carbon_emissions_tco2: 42.4,
      carbon_delta_pct: 4,
    },
    buildingLoads: [
      { building: "In-Patient (IPD)", kwh: 18400, color: "#f97316" },
      { building: "OT Complex (OT 1-12)", kwh: 15200, color: "#fb923c" },
      { building: "Trauma & ICU Wing", kwh: 11800, color: "#fdba74" },
      { building: "Diagnostic MRI/CT", kwh: 5400, color: "#0ea5e9" },
      { building: "LMO & Central Labs", kwh: 3400, color: "#10b981" },
    ],
    forecastTimeline: [
      { time: "Mon 00:00", actual: 2100, forecast: 2050, isAnomaly: false },
      { time: "Mon 06:00", actual: 2850, forecast: 2780, isAnomaly: false },
      { time: "Mon 12:00", actual: 3950, forecast: 3820, isAnomaly: false },
      { time: "Mon 18:00", actual: 3200, forecast: 3150, isAnomaly: false },
      { time: "Tue 00:00", actual: 2080, forecast: 2040, isAnomaly: false },
      { time: "Tue 06:00", actual: 2920, forecast: 2800, isAnomaly: false },
      { time: "Tue 12:00", actual: 4850, forecast: 3900, isAnomaly: true }, // Chillers + Emergency MRI Surge
      { time: "Tue 18:00", actual: 3250, forecast: 3180, isAnomaly: false },
      { time: "Wed 00:00", actual: null, forecast: 2060, isAnomaly: false },
      { time: "Wed 06:00", actual: null, forecast: 2840, isAnomaly: false },
      { time: "Wed 12:00", actual: null, forecast: 3920, isAnomaly: false },
    ],
    recommendations: [
      {
        title: "Cleanroom AHU Air Volume Optimization",
        impact: "Save ₹84,000 / mo Without Sterility Loss",
        description: "Deploy automated night-setback air changes in non-active elective Operation Theaters maintaining +25 Pa positive pressure.",
        priority: "High Priority",
      },
      {
        title: "Diagnostic Imaging Chillers Pre-Cooling",
        impact: "Clip 65 kW Demand Spike",
        description: "Pre-cool MRI liquid helium cooling loops during morning low-tariff hours ahead of heavy outpatient scan queues.",
        priority: "Medium Priority",
      },
      {
        title: "Heat Pump Sanitization Hot Water",
        impact: "Save 12.5 tCO2 / mo",
        description: "Replace resistive electrical water heaters in laundry & CSSD autoclave with high-COP air-source heat pumps.",
        priority: "Sustainability",
      },
    ],
  },
  municipal_campus: {
    sectorTitle: "Smart City Municipal Energy Telemetry",
    icon: Landmark,
    kpis: {
      total_consumption_kwh: 42500,
      total_delta_pct: 8,
      peak_demand_kw: 620,
      peak_delta_pct: 4,
      estimated_cost_inr: 289000,
      tariff_per_kwh: 6.8,
      carbon_emissions_tco2: 34.0,
      carbon_delta_pct: 8,
    },
    buildingLoads: [
      { building: "Water Works Pumping", kwh: 18500, color: "#f97316" },
      { building: "STP & Waste MRF", kwh: 12200, color: "#fb923c" },
      { building: "Smart High-Mast Lighting", kwh: 6400, color: "#fdba74" },
      { building: "ICCC Command Center", kwh: 3200, color: "#0ea5e9" },
      { building: "Public EV Fast Hubs", kwh: 2200, color: "#10b981" },
    ],
    forecastTimeline: [
      { time: "00:00", actual: 1650, forecast: 1600, isAnomaly: false },
      { time: "05:00", actual: 3450, forecast: 3200, isAnomaly: false }, // Morning Pumping Surge
      { time: "09:00", actual: 2100, forecast: 2050, isAnomaly: false },
      { time: "14:00", actual: 1950, forecast: 1900, isAnomaly: false },
      { time: "18:30", actual: 4100, forecast: 2800, isAnomaly: true }, // Dusk High-Mast Lighting + EV Spike
      { time: "22:00", actual: 2200, forecast: 2150, isAnomaly: false },
    ],
    recommendations: [
      {
        title: "Smart High-Mast Astronomical Dimming",
        impact: "Save ₹65,000 / mo (42% Energy Cut)",
        description: "Automate smart LED light dimming from 100% to 50% between 01:00 - 05:00 based on vehicular traffic radar density.",
        priority: "High Priority",
      },
      {
        title: "Off-Peak Water Reservoir Filling",
        impact: "Save ₹1,12,000 / mo on Tariffs",
        description: "Pump bulk city drinking water to overhead reservoirs between 02:00 - 05:00 off-peak tariff window.",
        priority: "High Priority",
      },
      {
        title: "Dynamic EV Charging Load Throttling",
        impact: "Clip 80 kW City Grid Peak",
        description: "Integrate Smart Grid OCPP load throttling for fast chargers during city-wide dusk peak lighting spike.",
        priority: "Smart Grid",
      },
    ],
  },
};

export default function EnergyAnalyticsView({
  facilityType = "engineering_college",
  facilityName = "SRM KTR Campus",
}: EnergyAnalyticsViewProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [simulatedSpikeActive, setSimulatedSpikeActive] = useState(false);
  const [activeDataset, setActiveDataset] = useState<UploadedTelemetryDataset | null>(null);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainToast, setRetrainToast] = useState<string | null>(null);
  const [modelVersion, setModelVersion] = useState<string>("v2.4");

  // Pick sector baseline profile with fallback
  const baseProfile =
    SECTOR_ENERGY_PROFILES[facilityType] ||
    SECTOR_ENERGY_PROFILES.engineering_college;

  const SectorIcon = baseProfile.icon;

  // Check localStorage for any actively applied real telemetry dataset
  useEffect(() => {
    const stored = localStorage.getItem("campusiq_active_telemetry");
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (isValidTelemetryDataset(parsed) && parsed.domain === "energy") {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore the user's browser-local telemetry selection after hydration.
          setActiveDataset(parsed);
        } else {
          safelyRemoveStoredTelemetry("campusiq_active_telemetry");
        }
      } catch {
        safelyRemoveStoredTelemetry("campusiq_active_telemetry");
      }
    }
  }, [facilityType]);

  const handleQuickSyncAndLearn = async () => {
    setIsRetraining(true);
    try {
      const res = await syncAndLearnTelemetry({
        facilityType,
        domain: "energy",
        operatorNote: "Direct Energy View Sync & Learn Trigger"
      });
      if (res.model_version) setModelVersion(res.model_version);
      setRetrainToast(res.retraining_status === "completed"
        ? `Model retraining completed${res.model_version ? ` (${res.model_version})` : ""}.`
        : res.retraining_status === "failed"
        ? "Telemetry processed, but model retraining failed."
        : "Telemetry processed; model retraining was not run.");
      setTimeout(() => setRetrainToast(null), 3000);
    } catch (e: unknown) {
      alert(`ML Retraining Error: ${e instanceof Error ? e.message : "Could not complete learning cycle."}`);
    } finally {
      setIsRetraining(false);
    }
  };

  // Merge live profile with active uploaded dataset and simulated spike
  const kpis = {
    ...baseProfile.kpis,
    total_consumption_kwh: activeDataset
      ? Math.round(activeDataset.kpis.meanValue * 10)
      : simulatedSpikeActive
      ? baseProfile.kpis.total_consumption_kwh + 1850
      : baseProfile.kpis.total_consumption_kwh,
    peak_demand_kw: activeDataset
      ? Math.round(activeDataset.kpis.maxValue / 4)
      : simulatedSpikeActive
      ? baseProfile.kpis.peak_demand_kw + 120
      : baseProfile.kpis.peak_demand_kw,
    estimated_cost_inr: activeDataset
      ? Math.round(activeDataset.kpis.meanValue * 10 * baseProfile.kpis.tariff_per_kwh)
      : simulatedSpikeActive
      ? Math.round((baseProfile.kpis.total_consumption_kwh + 1850) * baseProfile.kpis.tariff_per_kwh)
      : baseProfile.kpis.estimated_cost_inr,
  };

  const buildingLoads = baseProfile.buildingLoads;

  // Build chart timeline combining actuals + ML predictions + spike
  const forecastTimeline = baseProfile.forecastTimeline.map((pt, idx) => {
    if (simulatedSpikeActive && idx === 6) {
      return {
        ...pt,
        actual: (pt.actual || 2500) + 950,
        isAnomaly: true,
      };
    }
    return pt;
  });

  return (
    <div className="space-y-7 relative">
      {/* Toast Notification */}
      {retrainToast && (
        <div className="fixed top-6 right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-2xl border border-emerald-500 flex items-center gap-2.5 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-black">{retrainToast}</span>
        </div>
      )}

      {/* Top Banner with Sector Identification & CSV Ingestion Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0 border border-orange-200/60 dark:border-orange-800/60 shadow-xs">
            <SectorIcon className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {baseProfile.sectorTitle}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800">
                {facilityName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" /> ML Model {modelVersion}
              </span>
              {activeDataset && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Real CSV Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Tariff Model: <strong>₹{baseProfile.kpis.tariff_per_kwh}/kWh</strong> &bull; Prophet + XGBoost Hybrid Residual Load Forecasting.
            </p>
          </div>
        </div>

        {/* Action Buttons: Sync & Learn, CSV Ingestion Studio & Live Telemetry Spike Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleQuickSyncAndLearn}
            disabled={isRetraining}
            className="px-4 py-2.5 rounded-2xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            title="Trigger active model retraining across Prophet, XGBoost, and Isolation Forest"
          >
            {isRetraining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Learning...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>Sync &amp; Learn</span>
              </>
            )}
          </button>

          <button
            onClick={() => setSimulatedSpikeActive((prev) => !prev)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer flex items-center gap-2 border ${
              simulatedSpikeActive
                ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/25 animate-pulse"
                : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            }`}
            title="Inject simulated real-time +450 kW peak load anomaly"
          >
            <Flame className={`w-4 h-4 ${simulatedSpikeActive ? "text-white fill-white" : "text-rose-500"}`} />
            <span>{simulatedSpikeActive ? "Spike Active (+450 kW)" : "Simulate Load Spike"}</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl text-xs font-black bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/25 transition cursor-pointer flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>+ Ingest CSV Telemetry</span>
          </button>
        </div>
      </div>

      {/* 4 Large KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Consumption</p>
            <div className="w-11 h-11 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-500 flex items-center justify-center border border-orange-200/50 dark:border-orange-800/50">
              <Zap className="w-6 h-6 fill-orange-500" />
            </div>
          </div>
          <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {kpis.total_consumption_kwh.toLocaleString()}{" "}
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">kWh</span>
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-500 mt-2 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full inline-flex border border-rose-200/60 dark:border-rose-900/60">
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            <span>+{kpis.total_delta_pct}% vs last wk</span>
          </div>
        </div>

        <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Peak Demand</p>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center border border-amber-200/50 dark:border-amber-800/50">
              <Gauge className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {kpis.peak_demand_kw}{" "}
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">kW</span>
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-500 mt-2 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full inline-flex border border-rose-200/60 dark:border-rose-900/60">
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            <span>+{kpis.peak_delta_pct}% vs last wk</span>
          </div>
        </div>

        <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Estimated Cost</p>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/50 dark:border-emerald-800/50">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            ₹{kpis.estimated_cost_inr.toLocaleString()}
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-500 dark:text-slate-400 mt-2 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full inline-flex">
            <span>@ ₹{baseProfile.kpis.tariff_per_kwh}/kWh Base Tariff</span>
          </div>
        </div>

        <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Carbon Footprint</p>
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/50">
              <Leaf className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">
            {baseProfile.kpis.carbon_emissions_tco2}{" "}
            <span className="text-sm font-bold text-slate-400 dark:text-slate-500">tCO₂</span>
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full inline-flex border border-emerald-200/60 dark:border-emerald-900/60">
            <span>0.82 kg CO₂/kWh Grid Factor</span>
          </div>
        </div>
      </div>

      {/* Actual vs Forecast Energy Consumption Chart with Shadcn Recharts */}
      <div className="dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Energy Telemetry (Actual vs Prophet+XGBoost Forecast)
              </h3>
              <span className="px-3 py-1 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-xs font-black rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-orange-500" /> ML Hybrid Model
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
              Prophet seasonal time-series decomposition blended with XGBoost residual regressor for {facilityName}
            </p>
          </div>

          <div className="flex items-center gap-5 text-xs font-extrabold flex-wrap">
            <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <span className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-xs" /> Actual Load (kWh)
            </span>
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="w-5 h-1 border-t-2 border-dashed border-indigo-500" /> ML Forecast (kWh)
            </span>
            <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/60">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" /> Anomaly Peak
            </span>
          </div>
        </div>

        {/* High Performance Recharts Area + Line */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastTimeline} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="energyActualGradShadcn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                fontWeight={700}
                tickLine={false}
                axisLine={false}
                dx={-5}
              />
              <Tooltip content={<ChartTooltipContent />} />

              <ReferenceLine
                x={forecastTimeline[Math.floor(forecastTimeline.length / 2)]?.time}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: "Forecast Horizon →",
                  position: "top",
                  fill: "#64748b",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              />

              {/* Actual Load Area */}
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Load (kWh)"
                stroke="#f97316"
                strokeWidth={3.5}
                fillOpacity={1}
                fill="url(#energyActualGradShadcn)"
                dot={{ r: 4.5, fill: "#ffffff", stroke: "#f97316", strokeWidth: 3 }}
                activeDot={{ r: 8, fill: "#f97316", stroke: "#ffffff", strokeWidth: 3 }}
              />

              {/* ML Forecast Line */}
              <Line
                type="monotone"
                dataKey="forecast"
                name="AI Forecast (kWh)"
                stroke="#6366f1"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 3.5, fill: "#ffffff", stroke: "#6366f1", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-Column: Building Consumption Breakdown + Actionable Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Building Breakdown with Shadcn Recharts BarChart */}
        <div className="lg:col-span-6 dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Sector Node Load Allocation
              </h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
                Real-time submetered breakdown for {facilityName}
              </p>
            </div>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              Real-time Submetered
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={buildingLoads}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                maxBarSize={20}
                barCategoryGap="14%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  unit=" kWh"
                />
                <YAxis
                  dataKey="building"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={800}
                  axisLine={false}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-xl text-xs space-y-1.5 min-w-[180px]">
                          <p className="font-black text-white">{data.building}</p>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                              Submeter Load:
                            </span>
                            <span className="font-bold text-white">{data.kwh.toLocaleString()} kWh</span>
                          </div>
                          <div className="pt-1 border-t border-slate-700/80 flex items-center justify-between text-slate-400 text-[10px] font-bold">
                            <span>Status:</span>
                            <span className="text-emerald-400">Nominal Telemetry</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="kwh" name="Energy (kWh)" radius={[0, 8, 8, 0]}>
                  {buildingLoads.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Actionable Recommendations */}
        <div className="lg:col-span-6 dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AI Sector Optimization Advice</h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">Prescriptive efficiency interventions</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 fill-amber-500" />
            </div>
          </div>

          <div className="space-y-4">
            {baseProfile.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 hover:border-orange-200 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{rec.title}</h4>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {rec.impact}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CSV Ingestion & Real Telemetry Studio Modal */}
      <DataUploadStudioModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        facilityType={facilityType}
        facilityName={facilityName}
        onDatasetApplied={(ds) => {
          if (ds.domain === "energy") {
            setActiveDataset(ds);
          }
        }}
      />
    </div>
  );
}
