"use client";

import React, { useState, useMemo } from "react";
import { Download, ChevronDown, Zap, Droplets, Trash2, Leaf, ArrowUpRight, ArrowDownRight, Calendar, Clock, CheckCircle2, TrendingUp, BarChart3, ShieldCheck, Wind, FileText, FileSpreadsheet, Layers, Award, Globe } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { ChartTooltipContent } from "./ui/chart";
import type { SustainabilityReportData } from "../lib/dataTypes";

type TimeRange = "7d" | "30d" | "3m" | "ytd";
type ReportTab = "Overview" | "Sustainability" | "Energy" | "Water" | "Waste" | "Air Quality" | "Safety";

interface ReportsViewProps {
  data: SustainabilityReportData | null;
  facilityType?: string;
  facilityName?: string;
}

export default function ReportsView({
  data,
  facilityType = "engineering_college",
  facilityName = "SRM KTR Campus",
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("Overview");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [isTimeRangeOpen, setIsTimeRangeOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const timeRangeRef = React.useRef<HTMLDivElement>(null);
  const exportMenuRef = React.useRef<HTMLDivElement>(null);

  // Close menus on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeRangeRef.current && !timeRangeRef.current.contains(event.target as Node)) {
        setIsTimeRangeOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeRangeOptions = [
    {
      id: "7d" as TimeRange,
      label: "Last 7 days",
      badge: "Daily",
      desc: "7-day rolling window with daily variance",
      icon: Clock,
      color: "text-sky-500",
      bg: "bg-sky-50 dark:bg-sky-950/50",
    },
    {
      id: "30d" as TimeRange,
      label: "Last 30 days",
      badge: "Monthly",
      desc: "4-week breakdown with monthly deltas",
      icon: Calendar,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/50",
    },
    {
      id: "3m" as TimeRange,
      label: "Last 3 months",
      badge: "Quarterly",
      desc: "90-day trajectory & seasonal shifts",
      icon: BarChart3,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/50",
    },
    {
      id: "ytd" as TimeRange,
      label: "Year to Date (YTD)",
      badge: "Annual",
      desc: "Cumulative tracking since Jan baseline",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
  ];

  const currentOption = timeRangeOptions.find((o) => o.id === timeRange) || timeRangeOptions[1];

  // Sector labels & contextual terms
  const sectorInfo = useMemo(() => {
    switch (facilityType) {
      case "hospital":
        return {
          title: "Healthcare Compliance & Carbon Audit",
          wasteLabel: "Bio-Medical & General Waste",
          waterLabel: "RO & Dialysis Grade Water",
          energyLabel: "Critical ICU & HVAC Loads",
          normStandard: "NABH / Biomedical Waste Rules 2016",
        };
      case "industrial_estate":
        return {
          title: "Industrial ESG & Effluent Audit",
          wasteLabel: "Hazardous & ETP Sludge",
          waterLabel: "Process & Cooling Water",
          energyLabel: "HT Feeder & Motor Drives",
          normStandard: "CPCB / Factory Act / ISO 50001",
        };
      case "municipal_campus":
        return {
          title: "Municipal ESG & Public Asset Audit",
          wasteLabel: "Municipal Solid Waste (MSW)",
          waterLabel: "City Water Distribution",
          energyLabel: "Streetlighting & Pumping Load",
          normStandard: "SWM Rules 2016 / Swachh Bharat Norms",
        };
      case "engineering_college":
      default:
        return {
          title: "Campus Green Audit & ESG Report",
          wasteLabel: "Campus Solid & E-Waste",
          waterLabel: "Hostel & Academic Water Balance",
          energyLabel: "Solar Rooftop & Lab Loads",
          normStandard: "NAAC Criteria 7 / Green Campus Protocol",
        };
    }
  }, [facilityType]);

  // Dynamic calculations based on timeRange
  const timeFilteredData = useMemo(() => {
    const now = new Date();

    if (timeRange === "7d") {
      // 7 Daily data points
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        days.push(d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" }));
      }
      return {
        rangeLabel: "Last 7 days",
        comparisonLabel: "vs previous 7 days",
        deltas: {
          energy_pct: 3.1,
          water_pct: -2.4,
          waste_pct: -1.2,
          carbon_emissions_pct: -8.5,
        },
        totals: {
          energy: "5,720 kWh",
          water: "98 kL",
          waste: "165 kg",
          carbon: "4.1 tCO₂",
          costSaved: "₹18,400",
        },
        scorecard: {
          overall_sustainability_index: 84,
          rating: "Gold",
          radar_scores: {
            Energy: 86,
            Water: 80,
            Waste: 89,
            "Air Quality": 93,
            Safety: 85,
            Assets: 82,
          },
        },
        chartData: [
          { label: days[0], Energy: 780, Water: 14, Waste: 24, Carbon: 0.58 },
          { label: days[1], Energy: 820, Water: 15, Waste: 26, Carbon: 0.61 },
          { label: days[2], Energy: 860, Water: 16, Waste: 25, Carbon: 0.64 },
          { label: days[3], Energy: 840, Water: 13, Waste: 22, Carbon: 0.62 },
          { label: days[4], Energy: 790, Water: 12, Waste: 20, Carbon: 0.59 },
          { label: days[5], Energy: 810, Water: 14, Waste: 23, Carbon: 0.60 },
          { label: days[6], Energy: 820, Water: 14, Waste: 25, Carbon: 0.61 },
        ],
      };
    }

    if (timeRange === "3m") {
      // 3 Months rolling
      const months = [];
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
      }
      return {
        rangeLabel: "Last 3 months",
        comparisonLabel: "vs previous 3 months",
        deltas: {
          energy_pct: 8.4,
          water_pct: -3.2,
          waste_pct: 2.1,
          carbon_emissions_pct: -21.4,
        },
        totals: {
          energy: "68,400 kWh",
          water: "1,180 kL",
          waste: "2,010 kg",
          carbon: "49.6 tCO₂",
          costSaved: "₹142,000",
        },
        scorecard: {
          overall_sustainability_index: 86,
          rating: "Platinum",
          radar_scores: {
            Energy: 88,
            Water: 84,
            Waste: 91,
            "Air Quality": 94,
            Safety: 87,
            Assets: 83,
          },
        },
        chartData: [
          { label: months[0], Energy: 22100, Water: 390, Waste: 670, Carbon: 16.2 },
          { label: months[1], Energy: 23400, Water: 410, Waste: 690, Carbon: 17.1 },
          { label: months[2], Energy: 24850, Water: 430, Waste: 710, Carbon: 18.2 },
        ],
      };
    }

    if (timeRange === "ytd") {
      // Year to Date (e.g. 6-8 months)
      const months = [];
      const currentMonthIndex = now.getMonth();
      const count = Math.max(currentMonthIndex + 1, 6);
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleDateString("en-US", { month: "short" }));
      }
      return {
        rangeLabel: "Year to Date (YTD)",
        comparisonLabel: "vs previous year baseline",
        deltas: {
          energy_pct: -4.8,
          water_pct: -9.5,
          waste_pct: -6.2,
          carbon_emissions_pct: -28.7,
        },
        totals: {
          energy: "184,200 kWh",
          water: "3,240 kL",
          waste: "5,420 kg",
          carbon: "134.8 tCO₂",
          costSaved: "₹486,000",
        },
        scorecard: {
          overall_sustainability_index: 89,
          rating: "Platinum",
          radar_scores: {
            Energy: 91,
            Water: 87,
            Waste: 93,
            "Air Quality": 95,
            Safety: 90,
            Assets: 88,
          },
        },
        chartData: months.map((m, idx) => ({
          label: m,
          Energy: Math.round(18000 + idx * 950 + Math.sin(idx) * 800),
          Water: Math.round(320 + idx * 16 + Math.cos(idx) * 15),
          Waste: Math.round(590 + idx * 18 - Math.sin(idx) * 20),
          Carbon: Number((13.5 + idx * 0.7).toFixed(1)),
        })),
      };
    }

    // Default: "30d" (Last 30 days / 4 weeks)
    return {
      rangeLabel: "Last 30 days",
      comparisonLabel: "vs previous period",
      deltas: data?.deltas_vs_previous_month || {
        energy_pct: 12,
        water_pct: 8,
        waste_pct: 5,
        carbon_emissions_pct: -15,
      },
      totals: {
        energy: "24,850 kWh",
        water: "430 kL",
        waste: "710 kg",
        carbon: "18.2 tCO₂",
        costSaved: "₹52,800",
      },
      scorecard: data?.scorecard || {
        overall_sustainability_index: 82,
        rating: "Gold",
        radar_scores: {
          Energy: 85,
          Water: 78,
          Waste: 88,
          "Air Quality": 92,
          Safety: 84,
          Assets: 80,
        },
      },
      chartData: [
        { label: "Week 1", Energy: 5850, Water: 102, Waste: 170, Carbon: 4.2 },
        { label: "Week 2", Energy: 6150, Water: 108, Waste: 175, Carbon: 4.5 },
        { label: "Week 3", Energy: 6300, Water: 112, Waste: 180, Carbon: 4.7 },
        { label: "Week 4", Energy: 6550, Water: 118, Waste: 185, Carbon: 4.8 },
      ],
    };
  }, [timeRange, data]);

  // Convert radar scores to Recharts format
  const radarData = useMemo(() => {
    const scores = timeFilteredData.scorecard.radar_scores;
    return [
      { subject: "Energy", score: scores?.Energy || 85, fullMark: 100 },
      { subject: "Water", score: scores?.Water || 78, fullMark: 100 },
      { subject: "Waste", score: scores?.Waste || 88, fullMark: 100 },
      { subject: "Air Quality", score: scores?.["Air Quality"] || 92, fullMark: 100 },
      { subject: "Safety", score: scores?.Safety || 84, fullMark: 100 },
      { subject: "Assets", score: scores?.Assets || 80, fullMark: 100 },
    ];
  }, [timeFilteredData]);

  // Scope 1, 2, 3 Carbon Emissions Breakdown
  const carbonBreakdown = [
    { name: "Scope 2 (Grid Electricity)", value: 68, color: "#f97316" },
    { name: "Scope 1 (DG Gensets & Direct Gas)", value: 18, color: "#ef4444" },
    { name: "Scope 3 (Commuting & Logistics)", value: 14, color: "#0ea5e9" },
  ];

  // Energy Sub-system Breakdown
  const energyBreakdown = [
    { name: "HVAC & Chillers", value: 46, color: "#f97316" },
    { name: "Motor Pumps & Drives", value: 22, color: "#eab308" },
    { name: "Internal & High-Mast Lighting", value: 16, color: "#3b82f6" },
    { name: "IT, UPS & Server Infrastructure", value: 16, color: "#10b981" },
  ];

  // Water Balance Breakdown
  const waterBalanceData = [
    { name: "Recycled STP Water", value: 44, color: "#10b981" },
    { name: "Municipal Fresh Supply", value: 36, color: "#0ea5e9" },
    { name: "Rainwater Harvesting Yield", value: 20, color: "#6366f1" },
  ];

  // Export handlers
  const handleExport = (format: "markdown" | "csv") => {
    const dateStr = new Date().toISOString().split("T")[0];
    let content = "";
    let filename = "";
    let mimeType = "";

    if (format === "markdown") {
      filename = `CampusIQ_ESG_Report_${facilityType}_${timeRange}_${dateStr}.md`;
      mimeType = "text/markdown;charset=utf-8;";
      content = `# CampusIQ ESG & Sustainability Executive Report
**Facility:** ${facilityName}
**Sector:** ${facilityType.replace(/_/g, " ").toUpperCase()}
**Time Window Filter:** ${timeFilteredData.rangeLabel}
**Standard / Framework:** ${sectorInfo.normStandard}
**Generated Date:** ${new Date().toLocaleString()}

---

## 1. Executive ESG Scorecard
- **Composite Sustainability Index:** ${timeFilteredData.scorecard.overall_sustainability_index} / 100
- **ESG Tier Rating:** ${timeFilteredData.scorecard.rating} Tier
- **Overall Trajectory:** ${timeFilteredData.deltas.carbon_emissions_pct < 0 ? "Progressing towards Decarbonization Target" : "Requires Load Mitigation"}
- **Estimated Net Financial Savings:** ${timeFilteredData.totals.costSaved}

### 6-Axis Domain Health Scores
| Domain | Score (/100) | Status | Action Plan |
| :--- | :--- | :--- | :--- |
| Energy | ${timeFilteredData.scorecard.radar_scores.Energy} | High Performance | Solar PV rooftop synchronization |
| Water | ${timeFilteredData.scorecard.radar_scores.Water} | Managed | Acoustic leak sensors active |
| Waste | ${timeFilteredData.scorecard.radar_scores.Waste} | High Compliance | On-site composting & 74% diversion |
| Air Quality | ${timeFilteredData.scorecard.radar_scores["Air Quality"]} | Excellent | MERV-13 air filtration verified |
| Safety | ${timeFilteredData.scorecard.radar_scores.Safety} | SLA Compliant | Automated incident triage active |
| Assets | ${timeFilteredData.scorecard.radar_scores.Assets} | Proactive | ML Predictive RUL maintenance |

---

## 2. Resource Consumption Summary (${timeFilteredData.rangeLabel})
- **Total Energy Consumed:** ${timeFilteredData.totals.energy} (Delta: ${timeFilteredData.deltas.energy_pct > 0 ? "+" : ""}${timeFilteredData.deltas.energy_pct}%)
- **Total Water Consumed:** ${timeFilteredData.totals.water} (Delta: ${timeFilteredData.deltas.water_pct > 0 ? "+" : ""}${timeFilteredData.deltas.water_pct}%)
- **Total Waste Generated:** ${timeFilteredData.totals.waste} (Delta: ${timeFilteredData.deltas.waste_pct > 0 ? "+" : ""}${timeFilteredData.deltas.waste_pct}%)
- **Carbon Footprint:** ${timeFilteredData.totals.carbon} (Delta: ${timeFilteredData.deltas.carbon_emissions_pct}%)

---

## 3. Detailed Time-Series Breakdown
| Interval | Energy (kWh) | Water (kL) | Waste (kg) | Carbon (tCO₂) |
| :--- | :--- | :--- | :--- | :--- |
${timeFilteredData.chartData.map((r) => `| ${r.label} | ${r.Energy} | ${r.Water} | ${r.Waste} | ${r.Carbon} |`).join("\n")}

---

## 4. Sector-Specific Compliance Matrix (${sectorInfo.normStandard})
1. **Scope 1 & 2 Emissions:** Continuous real-time smart meter verification logged with 15-minute granularity.
2. **Resource Diversion:** 74% municipal/solid waste diverted from landfills via circular lifecycle practices.
3. **Safety & Environmental Health:** Zero uncontained hazardous chemical or high-severity spills recorded.
`;
    } else {
      // CSV Format
      filename = `CampusIQ_ESG_Data_${facilityType}_${timeRange}_${dateStr}.csv`;
      mimeType = "text/csv;charset=utf-8;";
      const headers = ["Time_Interval", "Energy_kWh", "Water_kL", "Waste_kg", "Carbon_tCO2", "Facility", "Sector"];
      const rows = timeFilteredData.chartData.map((r) => [
        `"${r.label}"`,
        r.Energy,
        r.Water,
        r.Waste,
        r.Carbon,
        `"${facilityName}"`,
        `"${facilityType}"`,
      ]);
      content = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  return (
    <div className="space-y-7">
      {/* Sub Tabs & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/90 pb-4">
        {/* Domain Subtabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar">
          {(["Overview", "Sustainability", "Energy", "Water", "Waste", "Air Quality", "Safety"] as ReportTab[]).map(
            (tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4.5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-102"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs"
                  }`}
                >
                  {tab === "Overview" && <Layers className="w-3.5 h-3.5" />}
                  {tab === "Sustainability" && <Leaf className="w-3.5 h-3.5" />}
                  {tab === "Energy" && <Zap className="w-3.5 h-3.5" />}
                  {tab === "Water" && <Droplets className="w-3.5 h-3.5" />}
                  {tab === "Waste" && <Trash2 className="w-3.5 h-3.5" />}
                  {tab === "Air Quality" && <Wind className="w-3.5 h-3.5" />}
                  {tab === "Safety" && <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>{tab}</span>
                </button>
              );
            }
          )}
        </div>

        {/* Time Range Filter & Export Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Custom Time Range Dropdown */}
          <div className="relative" ref={timeRangeRef}>
            <button
              onClick={() => setIsTimeRangeOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-full shadow-xs transition-all duration-200 cursor-pointer text-xs font-black text-slate-900 dark:text-white"
            >
              <div className={`w-5 h-5 rounded-full ${currentOption.bg} ${currentOption.color} flex items-center justify-center`}>
                <currentOption.icon className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span>{currentOption.label}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold hidden sm:inline-block">
                {currentOption.badge}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isTimeRangeOpen ? "rotate-180 text-orange-500" : ""
                }`}
              />
            </button>

            {isTimeRangeOpen && (
              <div className="absolute right-0 mt-2.5 w-76 sm:w-84 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                      Time Range Horizon
                    </p>
                    <p className="text-[11px] font-bold text-slate-400">
                      Telemetry & audit aggregation period
                    </p>
                  </div>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>

                <div className="space-y-1 mt-1.5">
                  {timeRangeOptions.map((opt) => {
                    const isSelected = opt.id === timeRange;
                    const IconComponent = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setTimeRange(opt.id);
                          setIsTimeRangeOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                            : "hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : `${opt.bg} ${opt.color}`
                            }`}
                          >
                            <IconComponent className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black ${isSelected ? "text-white" : "text-slate-900 dark:text-white"}`}>
                                {opt.label}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                }`}
                              >
                                {opt.badge}
                              </span>
                            </div>
                            <p
                              className={`text-[11px] font-medium leading-tight mt-0.5 ${
                                isSelected ? "text-white/80" : "text-slate-400"
                              }`}
                            >
                              {opt.desc}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Export ESG Report Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/30 transition cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Export ESG Report</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200">Export Filtered Report</p>
                  <p className="text-[11px] text-slate-400">{timeFilteredData.rangeLabel} • {facilityName}</p>
                </div>
                <button
                  onClick={() => handleExport("markdown")}
                  className="w-full text-left px-3 py-2.5 mt-1 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-orange-500" />
                  <div>
                    <div>Executive Report (.md)</div>
                    <div className="text-[10px] text-slate-400">Full audit text, tables & ESG rating</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 hover:text-orange-600 flex items-center gap-2.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div>Telemetry Data (.csv)</div>
                    <div className="text-[10px] text-slate-400">Energy, water, waste & carbon metrics</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Sector Badge Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-slate-900/60 dark:to-slate-800/60 border border-orange-200/60 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-orange-500 shrink-0" />
          <div>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              {sectorInfo.title}
            </span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-2">
              • Norm: {sectorInfo.normStandard}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span>Active Window: <strong className="text-orange-600 dark:text-orange-400">{timeFilteredData.rangeLabel}</strong></span>
          <span>Net Cost Savings: <strong className="text-emerald-600">{timeFilteredData.totals.costSaved}</strong></span>
        </div>
      </div>

      {/* 4 Large Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Energy Index Card */}
        <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shadow-xs shrink-0 border border-amber-200/60 dark:border-amber-900/50">
              <Zap className="w-7 h-7 fill-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Energy Index</p>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{timeFilteredData.totals.energy}</div>
              <h4 className={`text-xs font-black mt-1 flex items-center gap-1 ${
                timeFilteredData.deltas.energy_pct >= 0 ? "text-rose-500" : "text-emerald-500"
              }`}>
                {timeFilteredData.deltas.energy_pct >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                )}
                {timeFilteredData.deltas.energy_pct >= 0 ? `+${timeFilteredData.deltas.energy_pct}%` : `${timeFilteredData.deltas.energy_pct}%`}
                <span className="text-[10px] font-bold text-slate-400 font-normal ml-0.5">{timeFilteredData.comparisonLabel}</span>
              </h4>
            </div>
          </div>
        </div>

        {/* Water Index Card */}
        <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center shadow-xs shrink-0 border border-sky-200/60 dark:border-sky-900/50">
              <Droplets className="w-7 h-7 fill-sky-500" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Water Index</p>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{timeFilteredData.totals.water}</div>
              <h4 className={`text-xs font-black mt-1 flex items-center gap-1 ${
                timeFilteredData.deltas.water_pct >= 0 ? "text-rose-500" : "text-emerald-500"
              }`}>
                {timeFilteredData.deltas.water_pct >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                )}
                {timeFilteredData.deltas.water_pct >= 0 ? `+${timeFilteredData.deltas.water_pct}%` : `${timeFilteredData.deltas.water_pct}%`}
                <span className="text-[10px] font-bold text-slate-400 font-normal ml-0.5">{timeFilteredData.comparisonLabel}</span>
              </h4>
            </div>
          </div>
        </div>

        {/* Waste Output Card */}
        <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shadow-xs shrink-0 border border-rose-200/60 dark:border-rose-900/50">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Waste Output</p>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{timeFilteredData.totals.waste}</div>
              <h4 className={`text-xs font-black mt-1 flex items-center gap-1 ${
                timeFilteredData.deltas.waste_pct >= 0 ? "text-rose-500" : "text-emerald-500"
              }`}>
                {timeFilteredData.deltas.waste_pct >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                )}
                {timeFilteredData.deltas.waste_pct >= 0 ? `+${timeFilteredData.deltas.waste_pct}%` : `${timeFilteredData.deltas.waste_pct}%`}
                <span className="text-[10px] font-bold text-slate-400 font-normal ml-0.5">{timeFilteredData.comparisonLabel}</span>
              </h4>
            </div>
          </div>
        </div>

        {/* Carbon Footprint Card */}
        <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center shadow-xs shrink-0 border border-teal-200/60 dark:border-teal-900/50">
              <Leaf className="w-7 h-7 fill-teal-600" />
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Carbon Footprint</p>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{timeFilteredData.totals.carbon}</div>
              <h4 className={`text-xs font-black mt-1 flex items-center gap-1 ${
                timeFilteredData.deltas.carbon_emissions_pct <= 0 ? "text-emerald-600" : "text-rose-500"
              }`}>
                {timeFilteredData.deltas.carbon_emissions_pct <= 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                )}
                {timeFilteredData.deltas.carbon_emissions_pct}%
                <span className="text-[10px] font-bold text-slate-400 font-normal ml-0.5">{timeFilteredData.comparisonLabel}</span>
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dynamic View Area based on Active Subtab */}
      {activeTab === "Overview" && (
        <div className="space-y-7">
          {/* Radar Scorecard & Multi-Utility Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Radar Chart */}
            <div className="lg:col-span-5 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">ESG Scorecard</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">6-Axis Compliance Radar ({timeFilteredData.rangeLabel})</p>
                </div>
                <span className="text-xs font-black px-3.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800">
                  {timeFilteredData.scorecard.rating} Tier
                </span>
              </div>

              <div className="w-full h-80 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: 800 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.45}
                      dot={{ r: 4, fill: "#f97316" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500">
                <span>Composite ESG Index</span>
                <span className="font-black text-slate-900 dark:text-white text-base">
                  {timeFilteredData.scorecard.overall_sustainability_index} / 100
                </span>
              </div>
            </div>

            {/* Monthly / Time-Range Consumption Trend */}
            <div className="lg:col-span-7 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Resource Consumption Trajectory
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">
                    Multi-utility telemetry for {timeFilteredData.rangeLabel}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-extrabold">
                  <span className="flex items-center gap-1.5 text-orange-600">
                    <span className="w-3 h-3 rounded-full bg-orange-500" /> Energy (kWh)
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-600">
                    <span className="w-3 h-3 rounded-full bg-sky-500" /> Water (kL)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" /> Waste (kg)
                  </span>
                </div>
              </div>

              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeFilteredData.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="Energy" name="Energy (kWh)" fill="#f97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Water" name="Water (kL x10)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Waste" name="Waste (kg x10)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-bold">
                <span>Filter active: {timeFilteredData.rangeLabel}</span>
                <span className="text-emerald-600 dark:text-emerald-400">Avoided Emissions: ~{(parseFloat(timeFilteredData.totals.carbon) * 0.22).toFixed(1)} tCO₂</span>
              </div>
            </div>
          </div>

          {/* Executive Compliance & Audit Matrix Table */}
          <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Executive ESG Compliance & Certification Matrix
                </h4>
                <p className="text-xs text-slate-400 font-bold">
                  Sector Benchmark: {sectorInfo.normStandard} • Evaluation Interval: {timeFilteredData.rangeLabel}
                </p>
              </div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Audit Readiness
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase">
                    <th className="pb-3 px-3">Compliance Domain</th>
                    <th className="pb-3 px-3">Target Standard</th>
                    <th className="pb-3 px-3">Measured Telemetry</th>
                    <th className="pb-3 px-3">Variance</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Action Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-3 px-3 flex items-center gap-2 font-black text-slate-900 dark:text-white">
                      <Zap className="w-4 h-4 text-amber-500" /> Renewable Energy Fraction
                    </td>
                    <td className="py-3 px-3 text-slate-500">Min 15.0% Solar Mix</td>
                    <td className="py-3 px-3">18.5% (Solar PV Rooftop)</td>
                    <td className="py-3 px-3 text-emerald-600">+3.5% Ahead</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">Compliant</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">Chief Energy Officer</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 flex items-center gap-2 font-black text-slate-900 dark:text-white">
                      <Droplets className="w-4 h-4 text-sky-500" /> Water Recycling & STP
                    </td>
                    <td className="py-3 px-3 text-slate-500">Min 35.0% Greywater Recycled</td>
                    <td className="py-3 px-3">44.0% Treated Effluent</td>
                    <td className="py-3 px-3 text-emerald-600">+9.0% Ahead</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">Compliant</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">Public Health Dept / BMS</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 flex items-center gap-2 font-black text-slate-900 dark:text-white">
                      <Trash2 className="w-4 h-4 text-rose-500" /> Landfill Diversion Rate
                    </td>
                    <td className="py-3 px-3 text-slate-500">Min 65.0% Segregation</td>
                    <td className="py-3 px-3">74.2% Diverted</td>
                    <td className="py-3 px-3 text-emerald-600">+9.2% Ahead</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">Compliant</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">Waste Management Officer</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 flex items-center gap-2 font-black text-slate-900 dark:text-white">
                      <Wind className="w-4 h-4 text-teal-500" /> Indoor AQI & Fresh Air
                    </td>
                    <td className="py-3 px-3 text-slate-500">AQI &lt; 50 (Good)</td>
                    <td className="py-3 px-3">42 AQI (PM2.5: 12 µg/m³)</td>
                    <td className="py-3 px-3 text-emerald-600">Optimal Air Quality</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">Compliant</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">HVAC Operations Team</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sustainability / Carbon Tab */}
      {activeTab === "Sustainability" && (
        <div className="space-y-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Scope 1, 2, 3 Donut Chart */}
            <div className="lg:col-span-6 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">GHG Emissions by Scope</h3>
                  <p className="text-xs text-slate-400 font-bold">GHG Protocol Standard • Total: {timeFilteredData.totals.carbon}</p>
                </div>
                <Leaf className="w-5 h-5 text-teal-600" />
              </div>

              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={carbonBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {carbonBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="font-bold text-slate-400">Scope 1 (Direct)</div>
                  <div className="font-black text-rose-500 text-sm mt-0.5">18%</div>
                </div>
                <div>
                  <div className="font-bold text-slate-400">Scope 2 (Grid)</div>
                  <div className="font-black text-orange-500 text-sm mt-0.5">68%</div>
                </div>
                <div>
                  <div className="font-bold text-slate-400">Scope 3 (Supply)</div>
                  <div className="font-black text-sky-500 text-sm mt-0.5">14%</div>
                </div>
              </div>
            </div>

            {/* Net Zero Trajectory Tracker */}
            <div className="lg:col-span-6 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Net-Zero 2030 Milestones</h3>
                    <p className="text-xs text-slate-400 font-bold">Decarbonization Roadmap for {facilityName}</p>
                  </div>
                  <Globe className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="space-y-4 my-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Solar PV Rooftop Expansion (18.5% / 30% Target)</span>
                      <span className="text-orange-600 font-black">62% Complete</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full" style={{ width: "62%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>STP Greywater Recirculation (44% / 50% Target)</span>
                      <span className="text-sky-600 font-black">88% Complete</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: "88%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Zero Waste to Landfill (74% / 85% Target)</span>
                      <span className="text-emerald-600 font-black">87% Complete</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "87%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300">
                🌱 Active carbon avoidance in {timeFilteredData.rangeLabel}: ~12.4 tCO₂ saved through automated load-shifting and chiller optimization.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Energy Tab */}
      {activeTab === "Energy" && (
        <div className="space-y-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Energy Breakdown */}
            <div className="lg:col-span-6 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Sub-System Energy Distribution</h3>
                  <p className="text-xs text-slate-400 font-bold">Total Load: {timeFilteredData.totals.energy}</p>
                </div>
                <Zap className="w-5 h-5 text-amber-500" />
              </div>

              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={energyBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {energyBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Time-of-Day Tariff & Peak Shaving */}
            <div className="lg:col-span-6 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                  Time-of-Day (TOD) Tariff Optimization
                </h3>
                <p className="text-xs text-slate-400 font-bold mb-4">
                  Peak demand management and tariff billing bands
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white">Off-Peak Hours (22:00 - 06:00)</div>
                      <div className="text-slate-400 font-bold text-[11px]">Tariff: ₹4.80 / kWh • DG set off</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded-md text-[10px]">Optimal</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <div className="font-black text-slate-900 dark:text-white">Normal Hours (06:00 - 18:00)</div>
                      <div className="text-slate-400 font-bold text-[11px]">Tariff: ₹7.20 / kWh • Solar PV active</div>
                    </div>
                    <span className="px-2.5 py-1 bg-sky-100 text-sky-800 font-black rounded-md text-[10px]">Solar Shifted</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs">
                    <div>
                      <div className="font-black text-rose-900 dark:text-rose-200">Peak Demand Window (18:00 - 22:00)</div>
                      <div className="text-rose-600 dark:text-rose-300 font-bold text-[11px]">Tariff: ₹9.60 / kWh • Smart HVAC stage-down active</div>
                    </div>
                    <span className="px-2.5 py-1 bg-rose-200 text-rose-800 font-black rounded-md text-[10px]">Peak Shaved</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                <span>Power Factor (PF): <strong className="text-slate-900 dark:text-white">0.98 Lagoon</strong></span>
                <span className="text-emerald-600">Zero Max Demand Penalty</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Water Tab */}
      {activeTab === "Water" && (
        <div className="space-y-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* Water Balance */}
            <div className="lg:col-span-6 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Water Balance & Circularity</h3>
                  <p className="text-xs text-slate-400 font-bold">Total Inflow: {timeFilteredData.totals.water}</p>
                </div>
                <Droplets className="w-5 h-5 text-sky-500" />
              </div>

              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={waterBalanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {waterBalanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Acoustic Leak Detection Log */}
            <div className="lg:col-span-6 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
                  Acoustic Leak Detection & STP Health
                </h3>
                <p className="text-xs text-slate-400 font-bold mb-4">
                  Underground pipe pressure telemetry & flow sensors
                </p>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex justify-between font-black text-slate-900 dark:text-white">
                      <span>Sewage Treatment Plant (STP)</span>
                      <span className="text-emerald-600">BOD &lt; 10 mg/L (Pass)</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">Yield: 180 kL/day treated greywater for horticulture and flushing.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex justify-between font-black text-slate-900 dark:text-white">
                      <span>Rainwater Recharge Well #1-4</span>
                      <span className="text-sky-600">92% Capacity</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">Groundwater table recharge sensors stable across campus perimeter.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                    <div className="flex justify-between font-black text-emerald-900 dark:text-emerald-200">
                      <span>Distribution Pressure</span>
                      <span className="text-emerald-600">Normal (2.4 Bar)</span>
                    </div>
                    <p className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-0.5">No continuous night micro-leaks detected in active monitoring window.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-bold">
                Water Loss Prevention: <strong className="text-emerald-600">~4,500 L/day saved</strong> via automated valve throttling.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waste Tab */}
      {activeTab === "Waste" && (
        <div className="space-y-7">
          <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Waste Stream Segregation & Circular Economy
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  {sectorInfo.wasteLabel} • Measured Interval: {timeFilteredData.rangeLabel}
                </p>
              </div>
              <Trash2 className="w-5 h-5 text-rose-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase">Organic & Compost</div>
                <div className="text-2xl font-black text-emerald-900 dark:text-white mt-1">420 kg</div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-bold">Processed in on-site vermi-compost pits for landscaping.</p>
              </div>

              <div className="p-5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                <div className="text-xs font-black text-sky-800 dark:text-sky-300 uppercase">Recyclable (Paper/Plastic)</div>
                <div className="text-2xl font-black text-sky-900 dark:text-white mt-1">190 kg</div>
                <p className="text-[11px] text-sky-700 dark:text-sky-400 mt-1 font-bold">Handed over to authorized circular recycling contractors.</p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                <div className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase">Hazardous & E-Waste</div>
                <div className="text-2xl font-black text-rose-900 dark:text-white mt-1">100 kg</div>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-1 font-bold">Manifested under CPCB/State Pollution Control Board guidelines.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Air Quality Tab */}
      {activeTab === "Air Quality" && (
        <div className="space-y-7">
          <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Indoor Air Quality & Ventilation Compliance (ASHRAE 62.1)
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  Sensor nodes calibrated for {timeFilteredData.rangeLabel}
                </p>
              </div>
              <Wind className="w-5 h-5 text-teal-600" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-black text-slate-400 uppercase">Composite AQI</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">42</div>
                <div className="text-[10px] text-emerald-600 font-black mt-0.5">Good Air Quality</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-black text-slate-400 uppercase">PM2.5 Level</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">12.4 µg/m³</div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">WHO Limit: 15 µg/m³</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-black text-slate-400 uppercase">CO₂ Concentration</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">540 ppm</div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">Threshold: 800 ppm</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-[11px] font-black text-slate-400 uppercase">Filter Status</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">MERV-13</div>
                <div className="text-[10px] text-emerald-600 font-black mt-0.5">99.2% Efficiency</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safety Tab */}
      {activeTab === "Safety" && (
        <div className="space-y-7">
          <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Occupational Safety & SLA Resolution Audit
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  Target: Zero High-Severity Incidents • Filter: {timeFilteredData.rangeLabel}
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-black text-slate-400 uppercase">SLA Resolution Rate</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">97.8%</div>
                <p className="text-[11px] text-slate-400 mt-1 font-bold">All priority tickets resolved within mandated window.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-black text-slate-400 uppercase">Fire & Emergency Readiness</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">100% Pass</div>
                <p className="text-[11px] text-slate-400 mt-1 font-bold">Hydrants, extinguishers & panic systems audited.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-black text-slate-400 uppercase">Avg Response Time</div>
                <div className="text-2xl font-black text-sky-600 mt-1">4.2 min</div>
                <p className="text-[11px] text-slate-400 mt-1 font-bold">Automated security & dispatch alert system.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
