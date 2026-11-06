"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Zap, Droplets, Trash2, Wind, Wrench, ShieldAlert, ChevronDown, ChevronUp, Check, X, Sparkles, Lightbulb, CheckCircle2, AlertTriangle, Send, Loader2, Copy, Download, FileText, Building, GraduationCap, Factory, Building2, Landmark, Search, Filter, SlidersHorizontal, Activity, Layers } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";
import { sendAnomalyFeedback, fetchAiLlmChat, buildFacilityPrompt } from "../lib/api";
import type { AiInsightsData } from "../lib/dataTypes";

interface AiInsightsViewProps {
  data: AiInsightsData | null;
  facilityName?: string;
  facilityType?: string;
}

export interface AnomalyInsightItem {
  id: string;
  sector: "engineering_college" | "industrial_estate" | "hospital" | "municipal_campus";
  domain: "Energy" | "Water" | "Waste" | "Air Quality" | "Assets" | "Safety";
  title: string;
  severity: "Critical" | "Warning" | "Info";
  anomaly_type: "Load Spike" | "Leakage" | "Degradation" | "Threshold Breach" | "Efficiency" | "Compliance";
  description: string;
  timestamp: string;
  building_or_node: string;
  sparkline_data: number[];
  root_cause: string;
  recommended_actions: string[];
  estimated_monthly_savings_inr: number;
}

export const SECTOR_INSIGHTS_DATABASE: AnomalyInsightItem[] = [
  // 1. Engineering College & University Campus
  {
    id: "insight_col_energy_01",
    sector: "engineering_college",
    domain: "Energy",
    title: "Academic Block B: 35% HVAC Chiller Load Spike",
    severity: "Critical",
    anomaly_type: "Load Spike",
    building_or_node: "SRM KTR Academic Block",
    description: "Energy consumption in Academic Block B is 35% higher than predicted baseline between 2:00 PM - 5:00 PM.",
    timestamp: "Today, 10:24 AM",
    sparkline_data: [950, 1100, 1050, 980, 1680, 1200, 1350],
    root_cause: "HVAC chillers and laboratory exhaust fans operating simultaneously during non-peak lecture hours.",
    recommended_actions: [
      "Audit HVAC schedules in Academic Block & set thermostat baseline to 24°C.",
      "Implement automated chiller stage-down during 2:00 PM - 3:30 PM window.",
      "Potential estimated savings: ~₹12,000 / month and 1.2 tCO₂.",
    ],
    estimated_monthly_savings_inr: 12000,
  },
  {
    id: "insight_col_water_01",
    sector: "engineering_college",
    domain: "Water",
    title: "Hostel A: Abnormal Continuous Night Flow (>300 L/hr)",
    severity: "Warning",
    anomaly_type: "Leakage",
    building_or_node: "APJ Abdul Kalam Hall (APJ HR)",
    description: "Water distribution sensor indicates night flow ratio exceeding threshold (300 L/hr continuous between 1 AM - 4 AM).",
    timestamp: "Today, 08:12 AM",
    sparkline_data: [80, 95, 110, 105, 145, 135, 160],
    root_cause: "Underground distribution pipe fracture or stuck overhead flush valve in APJ Hostel wing.",
    recommended_actions: [
      "Inspect main overhead line valve and ground acoustic sensor telemetry in Hostel A.",
      "Enable automated pump cutoff during 00:00 - 05:00 window.",
      "Estimated water loss prevention: ~4,500 Litres / day.",
    ],
    estimated_monthly_savings_inr: 6500,
  },
  {
    id: "insight_col_waste_01",
    sector: "engineering_college",
    domain: "Waste",
    title: "Cafeteria Smart Bin: 82% Capacity Ahead of Lunch",
    severity: "Info",
    anomaly_type: "Threshold Breach",
    building_or_node: "Central Activity & Seminar Hub",
    description: "Smart bin ultrasonic sensor at Cafeteria is 82% full. Predicted to breach 95% within 3 hours.",
    timestamp: "Today, 07:45 AM",
    sparkline_data: [30, 45, 55, 68, 75, 82, 90],
    root_cause: "High food preparation volume ahead of campus midday rush.",
    recommended_actions: [
      "Dynamic dispatch waste route vehicle #3 to Cafeteria by 11:30 AM.",
      "Deploy secondary organic compost segregation bin.",
    ],
    estimated_monthly_savings_inr: 2000,
  },
  {
    id: "insight_col_aqi_01",
    sector: "engineering_college",
    domain: "Air Quality",
    title: "Outdoor AQI 38 (Good) - 100% Fresh Air Opportunity",
    severity: "Info",
    anomaly_type: "Efficiency",
    building_or_node: "SRM KTR Campus Entrance & Sports Ground",
    description: "Outdoor AQI improved to 38 (Good). Ambient temperature and particulate density allow natural ventilation economizer mode.",
    timestamp: "Today, 06:30 AM",
    sparkline_data: [88, 76, 68, 54, 46, 38],
    root_cause: "Favorable wind dispersion (9.4 km/h) and minimal vehicular emission on NH-26 corridor.",
    recommended_actions: [
      "Switch AHU dampers to 100% fresh ambient air intake mode to reduce chiller load.",
      "Permit open outdoor sports and campus gatherings.",
    ],
    estimated_monthly_savings_inr: 4000,
  },
  {
    id: "insight_col_asset_01",
    sector: "engineering_college",
    domain: "Assets",
    title: "Central Chiller-01: Harmonic Vibration Fatigue (RUL 14 Days)",
    severity: "Warning",
    anomaly_type: "Degradation",
    building_or_node: "Mechanical & Civil Engineering Labs",
    description: "Vibration telemetry on Chiller-01 increased from 2.1 mm/s to 4.8 mm/s. RUL estimated at 14 days.",
    timestamp: "Yesterday, 09:15 PM",
    sparkline_data: [95, 88, 80, 68, 62, 54],
    root_cause: "Motor bearing lubricant degradation leading to early mechanical harmonic fatigue.",
    recommended_actions: [
      "Issue preventive work order #WO-418 for bearing lubrication & balancing.",
      "Prevents sudden equipment breakdown and ₹45,000 emergency replacement expense.",
    ],
    estimated_monthly_savings_inr: 15000,
  },
  {
    id: "insight_col_safety_01",
    sector: "engineering_college",
    domain: "Safety",
    title: "Chemistry Lab Fume Hood Exhaust Velocity Low (<0.5 m/s)",
    severity: "Critical",
    anomaly_type: "Compliance",
    building_or_node: "Mechanical & Civil Engineering Labs",
    description: "Fume hood exhaust sensor #FH-03 reports face velocity of 0.38 m/s, below OSHA standard of 0.5 m/s.",
    timestamp: "Today, 11:05 AM",
    sparkline_data: [0.55, 0.52, 0.48, 0.44, 0.40, 0.38],
    root_cause: "Exhaust duct damper actuator jammed at 40% open position.",
    recommended_actions: [
      "Dispatch mechanical technician to recalibrate duct damper actuator.",
      "Issue temporary hazard warning banner in Organic Chemistry Lab 2.",
    ],
    estimated_monthly_savings_inr: 3500,
  },

  // 2. Heavy Industry & Captive Power Plant Complex
  {
    id: "insight_ind_energy_01",
    sector: "industrial_estate",
    domain: "Energy",
    title: "Potline Smelter #1: 28 MW Harmonic Surge Detected",
    severity: "Critical",
    anomaly_type: "Load Spike",
    building_or_node: "Potline Smelter Unit #1",
    description: "Potline #1 active draw peaked at 28.4 MW with 3rd-harmonic distortion exceeding IEEE 519 standards.",
    timestamp: "Today, 10:45 AM",
    sparkline_data: [22.4, 23.1, 24.0, 25.2, 28.4, 27.8, 28.1],
    root_cause: "Rectifier transformer phase-shift thyristor bridge firing delay imbalance in Potline Section C.",
    recommended_actions: [
      "Activate dynamic passive harmonic filter bank #HF-02.",
      "Rebalance thyristor gate firing pulse controllers on Transformer 3.",
      "Prevents ₹1,80,000 / day penalty on peak grid KVA demand.",
    ],
    estimated_monthly_savings_inr: 180000,
  },
  {
    id: "insight_ind_water_01",
    sector: "industrial_estate",
    domain: "Water",
    title: "Effluent Treatment Plant (ETP): Acid pH Shock (pH 5.2)",
    severity: "Critical",
    anomaly_type: "Threshold Breach",
    building_or_node: "Effluent Treatment Plant (ETP)",
    description: "Inlet effluent telemetry registered sudden pH drop from 7.2 to 5.2 (BOD spike at 48 ppm).",
    timestamp: "Today, 09:18 AM",
    sparkline_data: [7.2, 7.1, 6.8, 6.2, 5.5, 5.2, 5.4],
    root_cause: "Unneutralized acid wash discharge from Anode Cleaning Bay bypass drain valve.",
    recommended_actions: [
      "Auto-divert inflow to Equalization Sump Tank #2.",
      "Inject sodium hydroxide (NaOH) dosing pump at 45 L/hr to buffer neutralization chamber.",
      "Maintains 100% zero-liquid-discharge (ZLD) pollution control board compliance.",
    ],
    estimated_monthly_savings_inr: 45000,
  },
  {
    id: "insight_ind_asset_01",
    sector: "industrial_estate",
    domain: "Assets",
    title: "Captive Turbine #2: Bearing Vibration Spike (6.8 mm/s - RUL 48h)",
    severity: "Critical",
    anomaly_type: "Degradation",
    building_or_node: "Captive Power Plant (Turbines 1-4)",
    description: "Radial vibration on Turbine #2 front bearing surged beyond ISO 10816 Zone C alert limits.",
    timestamp: "Today, 08:30 AM",
    sparkline_data: [2.8, 3.2, 3.9, 4.8, 5.9, 6.8],
    root_cause: "Lube oil filter partial clogging resulting in hydrodynamic film breakdown at 3000 RPM.",
    recommended_actions: [
      "Switch over to standby duplex lube oil filter bank #OF-02 immediately.",
      "Dispatch mechanical squad for laser shaft alignment check during scheduled 18:00 shift.",
      "Avoids ₹12,50,000 catastrophic turbine rotor trip.",
    ],
    estimated_monthly_savings_inr: 250000,
  },
  {
    id: "insight_ind_energy_02",
    sector: "industrial_estate",
    domain: "Energy",
    title: "220kV Grid Substation: Power Factor Dip to 0.91",
    severity: "Warning",
    anomaly_type: "Efficiency",
    building_or_node: "High-Voltage 220kV Switchyard",
    description: "Plant power factor degraded from 0.985 to 0.912 following inductive arc furnace startup.",
    timestamp: "Today, 07:10 AM",
    sparkline_data: [0.98, 0.97, 0.95, 0.93, 0.91, 0.92],
    root_cause: "Automatic Capacitor Bank (APFC) Step #4 vacuum contactor coil failure.",
    recommended_actions: [
      "Step in manual 5 MVAR shunt capacitor bank on 33kV bus.",
      "Replace faulty 110V DC contactor coil on APFC Panel B.",
    ],
    estimated_monthly_savings_inr: 95000,
  },
  {
    id: "insight_ind_asset_02",
    sector: "industrial_estate",
    domain: "Assets",
    title: "Bauxite Silo Conveyor #3: Motor Overheating (84°C vs 65°C)",
    severity: "Warning",
    anomaly_type: "Degradation",
    building_or_node: "Bauxite Silo & Conveyor Feed",
    description: "Thermal sensor on 250 kW conveyor drive motor indicates continuous temperature rise.",
    timestamp: "Yesterday, 11:20 PM",
    sparkline_data: [64, 68, 72, 78, 81, 84],
    root_cause: "Heavy ore buildup on idler rollers causing excessive belt drag friction.",
    recommended_actions: [
      "Initiate conveyor belt wash cycle during next batch changeover.",
      "Check motor cooling fan cowl for alumina dust clogging.",
    ],
    estimated_monthly_savings_inr: 32000,
  },

  // 3. Super-Speciality Hospital & Healthcare Complex
  {
    id: "insight_hosp_energy_01",
    sector: "hospital",
    domain: "Energy",
    title: "Trauma ICU: Online UPS #2 Cell Impedance Alert",
    severity: "Critical",
    anomaly_type: "Compliance",
    building_or_node: "Super-Speciality Trauma & ICU Wing",
    description: "Battery cell #28 in Trauma ICU online UPS bank registered internal resistance jump from 0.8 mΩ to 3.4 mΩ.",
    timestamp: "Today, 10:15 AM",
    sparkline_data: [0.8, 0.9, 1.2, 1.8, 2.6, 3.4],
    root_cause: "Electrolyte dry-out in lead-acid string causing thermal runaway risk during emergency utility outage.",
    recommended_actions: [
      "Isolate battery string #2 and engage redundant N+1 static bypass bus.",
      "Dispatch biomedical engineering squad for rapid module hot-swap.",
      "Guarantees 100% uninterrupted power supply to 48 ICU ventilators.",
    ],
    estimated_monthly_savings_inr: 60000,
  },
  {
    id: "insight_hosp_safety_01",
    sector: "hospital",
    domain: "Safety",
    title: "Liquid Medical Oxygen (LMO): Cryo Tank Pressure Surge (4.8 Bar)",
    severity: "Critical",
    anomaly_type: "Threshold Breach",
    building_or_node: "Liquid Medical Oxygen (LMO) Cryo Station",
    description: "Main 20 KL vacuum insulated cryo vessel pressure increased to 4.8 bar (Normal threshold: 3.8 - 4.2 bar).",
    timestamp: "Today, 09:40 AM",
    sparkline_data: [3.9, 4.0, 4.2, 4.4, 4.6, 4.8],
    root_cause: "Ambient thermal gain on economizer vaporizing coil due to restricted atmospheric air circulation.",
    recommended_actions: [
      "Open economizer manual trim valve to vent gas to pipeline header.",
      "Clear thermal frost shroud on ambient finned vaporizers #1 and #2.",
      "Maintains safe clinical supply pressure to OT and NICU manifolds.",
    ],
    estimated_monthly_savings_inr: 40000,
  },
  {
    id: "insight_hosp_aqi_01",
    sector: "hospital",
    domain: "Air Quality",
    title: "Operation Theatre OT-04: Positive Pressure Loss (+12 Pa vs +25 Pa)",
    severity: "Critical",
    anomaly_type: "Compliance",
    building_or_node: "Operation Theatre Complex (OT 1-12)",
    description: "Cleanroom differential pressure sensor in OT-04 dropped below ISO Class 5 sterility threshold (+25 Pa).",
    timestamp: "Today, 08:50 AM",
    sparkline_data: [26, 25, 23, 19, 15, 12],
    root_cause: "Air handling unit supply fan VFD speed hunting caused by dirty pre-filter pressure drop.",
    recommended_actions: [
      "Ramp up AHU-OT04 supply fan to 55 Hz to restore +25 Pa positive barrier.",
      "Schedule HEPA pre-filter replacement during 14:00 OT sterilization window.",
      "Prevents surgical site pathogen contamination.",
    ],
    estimated_monthly_savings_inr: 25000,
  },
  {
    id: "insight_hosp_waste_01",
    sector: "hospital",
    domain: "Waste",
    title: "Bio-Medical Waste Autoclave Yard: Sterilization Temp Dip (114°C)",
    severity: "Critical",
    anomaly_type: "Compliance",
    building_or_node: "Bio-Medical Waste Autoclave Yard",
    description: "Red-bag infectious waste autoclave chamber reached only 114°C (CPCB standard requires 121°C for 30 min).",
    timestamp: "Today, 07:35 AM",
    sparkline_data: [122, 121, 118, 116, 114],
    root_cause: "Steam trap condensate accumulation causing thermal drop in lower vessel chamber.",
    recommended_actions: [
      "Purge thermostatic steam trap valve and rerun 30-minute validation cycle with biological indicator spore ampoules.",
      "Enforces strict CPCB Biomedical Waste Management 2016 compliance.",
    ],
    estimated_monthly_savings_inr: 18000,
  },

  // 4. Smart City & Municipal Utilities
  {
    id: "insight_mun_water_01",
    sector: "municipal_campus",
    domain: "Water",
    title: "Kuakhai Water Works: Pump #3 Cavitation & 40 MLD Flow Drop",
    severity: "Critical",
    anomaly_type: "Leakage",
    building_or_node: "Kuakhai Water Works & Pumping Station",
    description: "Main 1200 kW intake pump #3 telemetry indicates acoustic cavitation noise and discharge drop.",
    timestamp: "Today, 10:05 AM",
    sparkline_data: [120, 118, 112, 100, 88, 80],
    root_cause: "River intake screen choked by floating monsoon river hyacinth debris.",
    recommended_actions: [
      "Engage automated hydraulic rake trash screen cleaner.",
      "Switch bulk transmission flow to Pump #4 standby line to prevent city supply rationing.",
    ],
    estimated_monthly_savings_inr: 75000,
  },
  {
    id: "insight_mun_energy_01",
    sector: "municipal_campus",
    domain: "Energy",
    title: "High-Mast Streetlighting: Dusk Astronomical Timer Mismatch",
    severity: "Warning",
    anomaly_type: "Load Spike",
    building_or_node: "Integrated Command & Control Center (ICCC)",
    description: "Zone 4 smart streetlight feeder activated 45 minutes prior to civil twilight (42 kW daytime waste).",
    timestamp: "Today, 05:45 PM",
    sparkline_data: [0, 0, 0, 42, 42, 42],
    root_cause: "Photocell ambient lux sensor coated in road dust, misreading twilight darkness.",
    recommended_actions: [
      "Remotely override feeder to GPS-based astronomical calendar via ICCC LoRaWAN gateway.",
      "Schedule lens cleaning for Sensor #LS-402.",
    ],
    estimated_monthly_savings_inr: 28000,
  },
  {
    id: "insight_mun_waste_01",
    sector: "municipal_campus",
    domain: "Waste",
    title: "Material Recovery Facility (MRF): Baler Hydraulic Temp (78°C)",
    severity: "Warning",
    anomaly_type: "Degradation",
    building_or_node: "Solid Waste Material Recovery Facility (MRF)",
    description: "Hydraulic power unit on high-density cardboard baler breached 70°C safe continuous operating threshold.",
    timestamp: "Today, 02:15 PM",
    sparkline_data: [58, 62, 66, 71, 75, 78],
    root_cause: "Hydraulic oil cooler radiator blocked by plastic film lint.",
    recommended_actions: [
      "Activate compressed air reverse-blow on oil cooler heat exchanger.",
      "Prevent hydraulic seal breakdown and ₹65,000 pump overhaul.",
    ],
    estimated_monthly_savings_inr: 22000,
  },
];
const SECTORS_LIST = [
  { id: "all", label: "All Sectors", icon: Layers, color: "text-slate-600 dark:text-slate-300" },
  { id: "engineering_college", label: "College Campus", icon: GraduationCap, color: "text-orange-600 dark:text-orange-400" },
  { id: "industrial_estate", label: "Heavy Smelter / Industry", icon: Factory, color: "text-amber-600 dark:text-amber-400" },
  { id: "hospital", label: "Super-Speciality Hospital", icon: Building2, color: "text-rose-600 dark:text-rose-400" },
  { id: "municipal_campus", label: "Smart City Command", icon: Landmark, color: "text-cyan-600 dark:text-cyan-400" },
];

const SEVERITY_LIST = [
  { id: "all", label: "All Severities" },
  { id: "Critical", label: "🔴 Critical Only", badge: "bg-rose-500 text-white" },
  { id: "Warning", label: "🟡 Warnings", badge: "bg-amber-500 text-white" },
  { id: "Info", label: "🔵 Info & Tuning", badge: "bg-sky-500 text-white" },
];

const ANOMALY_TYPES = [
  "All",
  "Load Spike",
  "Leakage",
  "Degradation",
  "Threshold Breach",
  "Efficiency",
  "Compliance",
];

const DOMAIN_TABS = ["All", "Energy", "Water", "Waste", "Air Quality", "Assets", "Safety"];

export default function AiInsightsView({
  data,
  facilityName = "SRM KTR",
  facilityType = "engineering_college",
}: AiInsightsViewProps) {
  const [selectedSector, setSelectedSector] = useState<string>(facilityType || "engineering_college");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [selectedAnomalyType, setSelectedAnomalyType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>("insight_col_energy_01");
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, "confirmed" | "false_alarm">>({});
  
  // Executive Briefing LLM state
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [briefingQuery, setBriefingQuery] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [uploadedInsight, setUploadedInsight] = useState<AnomalyInsightItem | null>(null);

  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem("campusiq_active_telemetry");
        if (!raw) { setUploadedInsight(null); return; }
        const ds = JSON.parse(raw) as { domain?: string; filename?: string; rows?: Record<string, unknown>[]; kpis?: { meanValue?: number; maxValue?: number; unit?: string } };
        const metric = ({ energy: "kwh", water: "litres", waste: "fill_level_kg", aqi: "aqi_index", assets: "vibration_mm_s" } as Record<string,string>)[ds.domain || ""];
        if (!metric || !Array.isArray(ds.rows) || !ds.rows.length) { setUploadedInsight(null); return; }
        const vals = ds.rows.map(r => Number(r[metric])).filter(Number.isFinite);
        const mean = vals.reduce((a,b)=>a+b,0) / Math.max(vals.length,1); const peak = Math.max(...vals);
        const ratio = mean > 0 ? peak / mean : 0; const isSpike = ratio >= 1.8;
        const domain = ({energy:"Energy",water:"Water",waste:"Waste","aqi":"Air Quality",assets:"Assets"} as Record<string, AnomalyInsightItem["domain"]>)[ds.domain || ""];
        const entity = String(ds.rows[0].entity_id || ds.rows[0].sensor_id || ds.rows[0].asset_id || "Imported facility");
        setUploadedInsight({ id:"uploaded-dataset-insight", sector:facilityType as AnomalyInsightItem["sector"], domain, title:`${entity}: ${isSpike ? "High telemetry spike" : "Imported telemetry summary"}`, severity:isSpike?"Critical":"Info", anomaly_type:isSpike?"Load Spike":"Efficiency", description:`${ds.filename || "Imported CSV"}: ${vals.length} readings; peak ${peak.toFixed(1)} ${ds.kpis?.unit || "units"}, mean ${mean.toFixed(1)}.`, timestamp:"Latest CSV import", building_or_node:entity, sparkline_data:vals.slice(-12), root_cause:`Imported dataset ${ds.filename || "CSV"} has peak-to-mean ratio ${ratio.toFixed(2)}.`, recommended_actions:[isSpike?"Review the peak timestamp and compare against the normal operating schedule.":"No high spike detected in the imported sample."], estimated_monthly_savings_inr:0 });
      } catch { setUploadedInsight(null); }
    };
    refresh(); window.addEventListener("campusiq-telemetry-updated", refresh); window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("campusiq-telemetry-updated", refresh); window.removeEventListener("storage", refresh); };
  }, [facilityType]);

  // Filtering Engine
  const baseInsights = uploadedInsight ? [...SECTOR_INSIGHTS_DATABASE.filter(item => item.domain !== uploadedInsight.domain), uploadedInsight] : SECTOR_INSIGHTS_DATABASE;
  const filteredInsights = baseInsights.filter((item) => {
    // 1. Sector filter
    if (selectedSector !== "all" && item.sector !== selectedSector) {
      return false;
    }
    // 2. Severity filter
    if (selectedSeverity !== "all" && item.severity !== selectedSeverity) {
      return false;
    }
    // 3. Domain tab filter
    if (selectedDomain !== "All" && item.domain.toLowerCase() !== selectedDomain.toLowerCase()) {
      return false;
    }
    // 4. Anomaly Type filter
    if (selectedAnomalyType !== "All" && item.anomaly_type !== selectedAnomalyType) {
      return false;
    }
    // 5. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchNode = item.building_or_node.toLowerCase().includes(q);
      const matchCause = item.root_cause.toLowerCase().includes(q);
      const matchDomain = item.domain.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchNode && !matchCause && !matchDomain) {
        return false;
      }
    }
    return true;
  });

  // KPI Calculations based on filtered results
  const totalFilteredCount = filteredInsights.length;
  const criticalCount = filteredInsights.filter((i) => i.severity === "Critical").length;
  const warningCount = filteredInsights.filter((i) => i.severity === "Warning").length;
  const totalPotentialSavings = filteredInsights.reduce(
    (acc, curr) => acc + (curr.estimated_monthly_savings_inr || 0),
    0
  );

  const getDomainIcon = (domain: string) => {
    switch (domain.toLowerCase()) {
      case "energy":
        return <Zap className="w-6 h-6 fill-amber-500 text-amber-500" />;
      case "water":
        return <Droplets className="w-6 h-6 fill-sky-500 text-sky-500" />;
      case "waste":
        return <Trash2 className="w-6 h-6 text-emerald-600 stroke-[2.5]" />;
      case "air quality":
        return <Wind className="w-6 h-6 text-indigo-500 stroke-[2.5]" />;
      case "assets":
        return <Wrench className="w-6 h-6 text-slate-700 stroke-[2.5]" />;
      case "safety":
        return <ShieldAlert className="w-6 h-6 text-purple-600 stroke-[2.5]" />;
      default:
        return <Sparkles className="w-6 h-6 text-orange-500" />;
    }
  };

  const getDomainBg = (domain: string) => {
    switch (domain.toLowerCase()) {
      case "energy":
        return "bg-gradient-to-tr from-amber-100 to-amber-50 dark:from-amber-950/60 dark:to-amber-900/40 border border-amber-200/60 dark:border-amber-800/60";
      case "water":
        return "bg-gradient-to-tr from-sky-100 to-sky-50 dark:from-sky-950/60 dark:to-sky-900/40 border border-sky-200/60 dark:border-sky-800/60";
      case "waste":
        return "bg-gradient-to-tr from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/60";
      case "air quality":
        return "bg-gradient-to-tr from-indigo-100 to-indigo-50 dark:from-indigo-950/60 dark:to-indigo-900/40 border border-indigo-200/60 dark:border-indigo-800/60";
      case "assets":
        return "bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700/60 border border-slate-300/60 dark:border-slate-700";
      case "safety":
        return "bg-gradient-to-tr from-purple-100 to-purple-50 dark:from-purple-950/60 dark:to-purple-900/40 border border-purple-200/60 dark:border-purple-800/60";
      default:
        return "bg-orange-50 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-800/60";
    }
  };

  const getSectorBadge = (sector: string) => {
    switch (sector) {
      case "engineering_college":
        return { label: "College Campus", icon: GraduationCap, color: "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800" };
      case "industrial_estate":
        return { label: "Heavy Smelter", icon: Factory, color: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
      case "hospital":
        return { label: "Super Hospital", icon: Building2, color: "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800" };
      case "municipal_campus":
        return { label: "Smart City", icon: Landmark, color: "bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800" };
      default:
        return { label: "General", icon: Building, color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700" };
    }
  };

  const handleFeedback = async (insightId: string, domain: string, isTrue: boolean) => {
    try {
      await sendAnomalyFeedback({
        domain: domain.toLowerCase(),
        entity_id: insightId,
        timestamp: new Date().toISOString(),
        is_true_anomaly: isTrue,
        operator_notes: isTrue ? "Confirmed by facility engineer" : "Marked as false alarm",
      });
      setFeedbackStatus((prev) => ({
        ...prev,
        [insightId]: isTrue ? "confirmed" : "false_alarm",
      }));
    } catch (e) {
      console.error("Feedback error:", e);
      setFeedbackStatus((prev) => ({
        ...prev,
        [insightId]: isTrue ? "confirmed" : "false_alarm",
      }));
    }
  };

  // Generate or Ask AI Briefing
  const handleGenerateBriefing = async (promptOverride?: string) => {
    setBriefingLoading(true);
    const anomaliesList = filteredInsights.map(
      (i: AnomalyInsightItem) => `[${i.sector} | ${i.domain} - ${i.severity}] ${i.title}: ${i.description} (Root Cause: ${i.root_cause})`
    );

    const prompt =
      promptOverride ||
      briefingQuery.trim() ||
      buildFacilityPrompt({
        facilityName,
        healthScore: data?.facility_health_pct || 94,
        energyKwh: data?.total_energy_kwh || 14280,
        peakKw: 480,
        anomalies: anomaliesList,
        maintenanceAlerts: [
          "Bearing lubrication work order #WO-418",
          "Acoustic sensor telemetry validation",
        ],
        safetyStatus: "97.8% SLA Compliant",
        sustainabilityScore: 91,
      });

    try {
      const reply = await fetchAiLlmChat(prompt);
      setBriefingText(reply);
      setBriefingQuery("");
    } catch (err) {
      console.error(err);
      setBriefingText("Could not reach neural LLM engine. Please verify network connectivity or backend ML service at port 8000.");
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleCopyBriefing = () => {
    if (!briefingText) return;
    navigator.clipboard.writeText(briefingText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportBriefing = () => {
    if (!briefingText) return;
    const blob = new Blob([briefingText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CampusIQ_${selectedSector}_AI_Insights_Briefing.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const quickBriefingPrompts = [
    {
      icon: Zap,
      label: "Synthesize Filtered Anomalies",
      prompt: `Synthesize all currently filtered anomalies (${totalFilteredCount} detected) across ${selectedSector} with an immediate 30-day corrective action matrix.`,
    },
    {
      icon: Building,
      label: "Energy Spike & Harmonic Surges",
      prompt: `Analyze root cause and mitigation steps for the critical electrical load anomalies and harmonic distortion in ${facilityName}.`,
    },
    {
      icon: Droplets,
      label: "Fluid Dynamics & Pressure Drops",
      prompt: `Provide an emergency troubleshooting protocol for continuous water flow breaches and booster pump cavitation.`,
    },
    {
      icon: Wrench,
      label: "Predictive Asset Overhauls (RUL < 72h)",
      prompt: `Formulate condition-based maintenance instructions for vibrating turbine bearings and compressor components.`,
    },
  ];

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* 1. SECTOR & MULTI-DIMENSIONAL ANOMALY FILTER BAR */}
      <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>AI Insights &amp; Anomaly Diagnostic Filtering</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                  Live Classifier
                </span>
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Filter root causes, telemetric signatures, and prescriptive ROI actions across facility sectors and anomaly severities.
              </p>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anomalies, nodes, causes..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Sector Pill Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-orange-500" /> Select Facility Sector
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {SECTORS_LIST.map((sec) => {
              const Icon = sec.icon;
              const isSelected = selectedSector === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSector(sec.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-slate-900 dark:bg-orange-500 text-white shadow-md scale-102"
                      : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : sec.color}`} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Anomaly Severity & Anomaly Type Filter Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          {/* Severity Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Anomaly Severity
            </label>
            <div className="flex items-center gap-2 overflow-x-auto">
              {SEVERITY_LIST.map((sev) => {
                const isSelected = selectedSeverity === sev.id;
                return (
                  <button
                    key={sev.id}
                    onClick={() => setSelectedSeverity(sev.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "bg-rose-600 text-white shadow-xs scale-102"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {sev.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anomaly Pattern Type Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-500" /> Anomaly Type Signature
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {ANOMALY_TYPES.map((type) => {
                const isSelected = selectedAnomalyType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedAnomalyType(type)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "bg-cyan-600 text-white shadow-xs scale-102"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Filter Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filtered Anomalies</span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{totalFilteredCount} Incidents</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60">
            <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wider">Critical Breaches</span>
            <div className="text-lg font-black text-rose-700 dark:text-rose-300 mt-0.5">{criticalCount} Urgent</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Early Warnings</span>
            <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">{warningCount} Active</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60">
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Potential Monthly Savings</span>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5">₹{totalPotentialSavings.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 2. AI MULTI-DOMAIN EXECUTIVE BRIEFING & DATA SUMMARIZER */}
      <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  AI Multi-Domain Executive Briefing &amp; Data Summarizer
                </h3>
                <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-300/80 dark:border-orange-800">
                  Neural LLM Live
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Real-time ML anomaly synthesis, root-cause diagnostics, and step-by-step engineering roadmap for {facilityName}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleGenerateBriefing()}
              disabled={briefingLoading}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25 transition cursor-pointer disabled:opacity-50"
            >
              {briefingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Telemetry...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{briefingText ? "Regenerate Live Briefing" : "Generate AI Executive Report"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Question Prompt Chips */}
        <div className="pt-4 flex items-center gap-2 overflow-x-auto pb-2">
          {quickBriefingPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                onClick={() => handleGenerateBriefing(qp.prompt)}
                disabled={briefingLoading}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Render Formatted Markdown Report */}
        {briefingText && (
          <div className="mt-5 p-6 rounded-3xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-700/80 text-xs">
              <span className="font-extrabold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Executive Operations Report &bull; {facilityName}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyBriefing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleExportBriefing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .md</span>
                </button>
              </div>
            </div>

            <div className="ai-markdown-content space-y-3">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-xl font-black text-slate-900 dark:text-white mt-4 mb-2 pb-2 border-b border-orange-500/30 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-500 shrink-0" />
                      <span>{children}</span>
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-black text-orange-600 dark:text-orange-400 mt-4 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 shrink-0" />
                      <span>{children}</span>
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{children}</span>
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed my-2 font-medium">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-slate-900 dark:text-white font-black">
                      {children}
                    </strong>
                  ),
                  table: ({ children }) => (
                    <div className="w-full my-3.5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                      <table className="w-full text-left border-collapse bg-white dark:bg-slate-900 text-xs">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black border-b border-slate-200 dark:border-slate-700">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="p-3 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="p-3 text-xs font-semibold leading-relaxed">
                      {children}
                    </td>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-1.5 my-2.5 pl-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="space-y-1.5 my-2.5 pl-4 list-decimal text-xs text-slate-700 dark:text-slate-200 font-bold">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                      <div className="flex-1">{children}</div>
                    </li>
                  ),
                  code: ({ children }) => (
                    <code className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-orange-600 dark:text-orange-400 font-mono text-[11px]">
                      {children}
                    </code>
                  ),
                }}
              >
                {briefingText}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Diagnostic Query Input Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={briefingQuery}
              onChange={(e) => setBriefingQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateBriefing()}
              placeholder="Ask AI Engineer a diagnostic question (e.g., 'How to resolve the harmonic surges on Smelter Potline #4?')..."
              disabled={briefingLoading}
              className="w-full pl-5 pr-12 py-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 transition disabled:opacity-50"
            />
            <button
              onClick={() => handleGenerateBriefing()}
              disabled={!briefingQuery.trim() || briefingLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. DOMAIN TABS BAR */}
      <div className="flex items-center gap-3 border-b border-slate-200/90 dark:border-slate-800 pb-3 overflow-x-auto">
        {DOMAIN_TABS.map((tab) => {
          const isActive = selectedDomain === tab;
          return (
            <button
              key={tab}
              onClick={() => setSelectedDomain(tab)}
              className={`px-6 py-2.5 rounded-full text-xs font-black tracking-wide whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-102"
                  : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* 4. ANOMALIES & INSIGHTS CARDS LIST */}
      {filteredInsights.length === 0 ? (
        <div className="dashboard-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
            <Filter className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-black text-slate-900 dark:text-white">No Matching Anomalies Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            No telemetry anomalies match the current filter criteria ({selectedSector}, {selectedSeverity}, {selectedDomain}, &quot;{searchQuery}&quot;). Try resetting your filters.
          </p>
          <button
            onClick={() => {
              setSelectedSector("all");
              setSelectedSeverity("all");
              setSelectedDomain("All");
              setSelectedAnomalyType("All");
              setSearchQuery("");
            }}
            className="px-5 py-2 rounded-full bg-orange-500 text-white font-black text-xs hover:bg-orange-600 transition cursor-pointer shadow-sm"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredInsights.map((item) => {
            const isCrit = item.severity === "Critical";
            const isWarn = item.severity === "Warning";
            const isExpanded = expandedId === item.id;
            const feedback = feedbackStatus[item.id];
            const sectorBadge = getSectorBadge(item.sector);
            const SectorIcon = sectorBadge.icon;

            // Formatted sparkline array for Recharts
            const sparkData = (item.sparkline_data || [50, 70, 60, 90, 80, 110]).map(
              (val: number, idx: number) => ({
                point: `T${idx + 1}`,
                value: val,
              })
            );

            const strokeColor = isCrit ? "#f43f5e" : isWarn ? "#f59e0b" : "#0ea5e9";

            return (
              <div
                key={item.id}
                className={`dashboard-card bg-white dark:bg-slate-900 border transition-all duration-200 p-7 shadow-xs ${
                  isCrit
                    ? "border-rose-300/80 dark:border-rose-900/60 hover:border-rose-400"
                    : isWarn
                    ? "border-amber-300/80 dark:border-amber-900/60 hover:border-amber-400"
                    : "border-slate-200/90 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-600"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left details */}
                  <div className="flex items-start gap-5 flex-1">
                    <div
                      className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-xs ${getDomainBg(
                        item.domain
                      )}`}
                    >
                      {getDomainIcon(item.domain)}
                    </div>
                    <div>
                      {/* Meta Tags: Sector + Severity + Anomaly Type + Building Node */}
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 border ${sectorBadge.color}`}>
                          <SectorIcon className="w-3 h-3" />
                          <span>{sectorBadge.label}</span>
                        </span>

                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                            isCrit
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60"
                              : isWarn
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60"
                              : "bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/60"
                          }`}
                        >
                          {item.severity}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.anomaly_type}
                        </span>

                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          &bull; {item.building_or_node}
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.timestamp}</p>
                        {item.estimated_monthly_savings_inr > 0 && (
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            Est. Loss Impact: ₹{item.estimated_monthly_savings_inr.toLocaleString()} / mo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Sparkline trend with Shadcn Recharts mini chart & expand action */}
                  <div className="flex items-center gap-5 shrink-0">
                    <div className="w-48 h-16 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700/80 flex items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData}>
                          <defs>
                            <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md">
                                    {payload[0].value}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={strokeColor}
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill={`url(#grad-${item.id})`}
                            dot={{ r: 2.5, fill: "#ffffff", stroke: strokeColor, strokeWidth: 1.5 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
                    >
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Diagnostics & Continuous Learning Action */}
                {isExpanded && (
                  <div className="mt-7 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-5 animate-in fade-in duration-200">
                    {item.root_cause && (
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                        <p className="text-xs font-black text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                          <AlertTriangle className="w-4.5 h-4.5 text-orange-500" /> AI Root Cause Diagnostics &amp; Signature Analysis
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold">{item.root_cause}</p>
                      </div>
                    )}

                    {item.recommended_actions && (
                      <div className="p-5 rounded-2xl bg-orange-50/90 dark:bg-orange-950/40 border border-orange-200/80 dark:border-orange-900/60">
                        <p className="text-xs font-black text-orange-950 dark:text-orange-300 mb-2.5 flex items-center gap-2">
                          <Lightbulb className="w-4.5 h-4.5 text-orange-600 dark:text-orange-400" /> Prescriptive Action Plan &amp; Financial ROI
                        </p>
                        <ul className="space-y-2 text-xs text-slate-800 dark:text-slate-200 font-bold">
                          {item.recommended_actions.map((act: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className="text-orange-500 font-black">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Active Anomaly Feedback Bar for Continuous Learning */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                        Active operator feedback loop (retrains Isolation Forest &amp; Classifiers):
                      </span>

                      <div className="flex items-center gap-3">
                        {feedback ? (
                          <span className="text-xs font-black px-5 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 shadow-xs">
                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                            <span>
                              Feedback Synced ({feedback === "confirmed" ? "Ground Truth Anomaly Logged" : "False Alarm Ignored"})
                            </span>
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleFeedback(item.id, item.domain, true)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 font-black text-xs transition border border-emerald-300 dark:border-emerald-800 cursor-pointer shadow-xs"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Confirm Anomaly</span>
                            </button>
                            <button
                              onClick={() => handleFeedback(item.id, item.domain, false)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-300 font-black text-xs transition border border-rose-300 dark:border-rose-800 cursor-pointer shadow-xs"
                            >
                              <X className="w-4 h-4 stroke-[3]" />
                              <span>False Alarm</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

