"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Zap, Droplets, Trash2, Lightbulb, Building, IndianRupee, Leaf, Info, ArrowRight, Sparkles, Loader2, TrendingDown, Copy, Check, Download, FileText, CheckCircle2, Send, Settings, ShieldCheck, TrendingUp, BarChart3, Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { runSimulation, fetchAiLlmChat, buildSimulationPrompt } from "../lib/api";
import type { SimulationImpact } from "../lib/dataTypes";

interface SimulationViewProps {
  facilityName?: string;
  facilityType?: string;
}

export default function SimulationView({
  facilityName = "SRM KTR Campus",
  facilityType = "engineering_college",
}: SimulationViewProps) {
  const [selectedScenario, setSelectedScenario] = useState("reduce_hvac");
  const [sliderValue, setSliderValue] = useState(25);
  const [chartType, setChartType] = useState<"bar" | "area" | "delta">("bar");

  // Sector-tailored building/zone options
  const getSectorBuildingOptions = () => {
    switch (facilityType) {
      case "industrial_estate":
        return [
          { id: "potline_1", label: "Smelter Potline 1 (Electrolysis)", baseline: 24500 },
          { id: "substation_220kv", label: "220kV Captive Substation", baseline: 18200 },
          { id: "furnace_b", label: "Heavy Induction Furnace B", baseline: 14800 },
          { id: "etp_plant", label: "Effluent Treatment Plant (ETP)", baseline: 7600 },
          { id: "compressor_station", label: "High-Pressure Compressor Hub", baseline: 5900 },
          { id: "bauxite_conveyor", label: "Bauxite Conveyor Drive 04", baseline: 4100 },
        ];
      case "hospital":
        return [
          { id: "trauma_icu", label: "Trauma ICU & Emergency Wing", baseline: 8900 },
          { id: "ot_complex", label: "Operation Theatre Suite (OT-04)", baseline: 7200 },
          { id: "hvac_cleanroom", label: "Sterile Cleanroom & HVAC", baseline: 6400 },
          { id: "radiology_mri", label: "Diagnostic Radiology & MRI", baseline: 5100 },
          { id: "inpatient_ward", label: "Inpatient Ward Block B", baseline: 3800 },
          { id: "biomed_hub", label: "Cryogenic LMO & Biomedical Hub", baseline: 2700 },
        ];
      case "municipal_campus":
        return [
          { id: "bulk_pumping", label: "Kuakhai River Intake Pumping", baseline: 16500 },
          { id: "sewage_lift", label: "Central Sewage Treatment Lift", baseline: 9800 },
          { id: "mrf_balers", label: "Swachh MRF Baler Hydraulics", baseline: 6200 },
          { id: "streetlighting_z4", label: "Zone-4 LoRaWAN Streetlighting", baseline: 5400 },
          { id: "iccc_command", label: "ICCC Command Center & Server", baseline: 4100 },
          { id: "ev_hub", label: "Public EV Fast-Charging Hub", baseline: 3600 },
        ];
      case "engineering_college":
      default:
        return [
          { id: "admin_academic_block", label: "Main Academic & Admin Block", baseline: 8240 },
          { id: "mech_civil_block", label: "Mechanical & Civil Workshops", baseline: 6120 },
          { id: "cse_ee_block", label: "CSE & Electrical IoT Center", baseline: 5490 },
          { id: "mbh_hostel", label: "Mahanadi Boys Hostel (MBH)", baseline: 4320 },
          { id: "ibh_hostel", label: "Indravati Boys Hostel (IBH)", baseline: 3980 },
          { id: "tgh_hostel", label: "Tel Girls Hostel (TGH)", baseline: 3650 },
          { id: "central_library", label: "Central Library & Digital Hub", baseline: 1850 },
          { id: "canteen_sac", label: "Student Activity Center & Canteen", baseline: 2860 },
        ];
    }
  };

  const buildingOptions = getSectorBuildingOptions();

  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([
    buildingOptions[0]?.id || "admin_academic_block",
    buildingOptions[1]?.id || "cse_ee_block",
    buildingOptions[2]?.id || "mech_civil_block",
  ]);
  const simulationPeriod = "Next 4 weeks";
  const [loading, setLoading] = useState(false);

  // AI Simulation Summary State
  const [simSummaryText, setSimSummaryText] = useState<string | null>(null);
  const [simSummaryLoading, setSimSummaryLoading] = useState(false);
  const [simQuery, setSimQuery] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const [impact, setImpact] = useState<SimulationImpact>({
    energy_reduction_pct: -18,
    energy_saved_kwh: 1250,
    cost_savings_monthly_inr: 38400,
    carbon_emission_reduction_tco2: -4.2,
    comfort_impact_advisory: "Negligible impact on classroom comfort; 2°C adaptive setpoint shift verified by ASHRAE 55.",
  });

  const scenarios = [
    {
      id: "reduce_hvac",
      title: "Reduce HVAC Schedule",
      subtitle: "Decrease chiller & ventilation runtime",
      icon: Zap,
      sliderLabel: "Reduction in HVAC operating hours",
      unit: "%",
    },
    {
      id: "adjust_water_irrigation",
      title: "Adjust Water Irrigation",
      subtitle: "Optimize landscape irrigation schedules",
      icon: Droplets,
      sliderLabel: "Reduction in irrigation volume",
      unit: "%",
    },
    {
      id: "optimize_waste_route",
      title: "Change Waste Collection Route",
      subtitle: "AI vehicle dispatch routing frequency",
      icon: Trash2,
      sliderLabel: "Route optimization efficiency",
      unit: "%",
    },
    {
      id: "switch_to_led",
      title: "Switch to LED Smart Lighting",
      subtitle: "Upgrade fixtures with daylight harvesting",
      icon: Lightbulb,
      sliderLabel: "Fixture conversion ratio",
      unit: "%",
    },
    {
      id: "hybrid_wfh",
      title: "Smart Occupancy Scheduling",
      subtitle: "Dynamic zone load-shedding during low traffic",
      icon: Building,
      sliderLabel: "Zone load-shed ratio",
      unit: "%",
    },
  ];

  const toggleBuilding = (id: string) => {
    setSelectedBuildings((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((b) => b !== id) : prev) : [...prev, id]
    );
  };

  const handleRunSimulation = async () => {
    setLoading(true);
    try {
      const res = await runSimulation({
        scenario_id: selectedScenario,
        parameter_pct: sliderValue,
        target_buildings: selectedBuildings,
        simulation_period: simulationPeriod,
      });
      if (res && res.predicted_impact) {
        setImpact(res.predicted_impact);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeScenarioObj = scenarios.find((s) => s.id === selectedScenario) || scenarios[0];

  // Generate AI Simulation Summary via LLM
  const handleGenerateSimulationSummary = async (promptOverride?: string) => {
    setSimSummaryLoading(true);
    const targetBuildingLabels = buildingOptions
      .filter((b) => selectedBuildings.includes(b.id))
      .map((b) => b.label);

    const prompt =
      promptOverride ||
      simQuery.trim() ||
      buildSimulationPrompt({
        facilityName,
        scenarioTitle: activeScenarioObj.title,
        sliderLabel: activeScenarioObj.sliderLabel,
        parameterValue: sliderValue,
        unit: activeScenarioObj.unit,
        targetBuildings: targetBuildingLabels,
        simulationPeriod,
        energyReductionPct: Math.abs(impact.energy_reduction_pct || 18),
        energySavedKwh: impact.energy_saved_kwh || 1250,
        costSavingsMonthlyInr: impact.cost_savings_monthly_inr || 38400,
        carbonReductionTco2: Math.abs(impact.carbon_emission_reduction_tco2 || 4.2),
        comfortImpactAdvisory: impact.comfort_impact_advisory || "Compliant with comfort limits.",
      });

    try {
      const reply = await fetchAiLlmChat(prompt);
      setSimSummaryText(reply);
      setSimQuery("");
    } catch (err) {
      console.error(err);
      setSimSummaryText("Could not reach neural LLM engine. Please verify network connectivity or try again.");
    } finally {
      setSimSummaryLoading(false);
    }
  };

  const handleCopySimSummary = () => {
    if (!simSummaryText) return;
    navigator.clipboard.writeText(simSummaryText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExportSimSummary = () => {
    if (!simSummaryText) return;
    const blob = new Blob([simSummaryText], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CampusIQ_Simulation_${selectedScenario}_Summary.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const quickSimPrompts = [
    {
      icon: TrendingUp,
      label: "4-Week Phased Rollout Plan",
      prompt: `Detail a 4-week step-by-step rollout schedule for the "${activeScenarioObj.title}" policy (${sliderValue}%) across selected ${facilityName} nodes.`,
    },
    {
      icon: IndianRupee,
      label: "Tariff Payback & Financial Analysis",
      prompt: `Provide an executive payback analysis, demand charge reduction matrix, and utility tariff ROI breakdown for saving ₹${impact.cost_savings_monthly_inr?.toLocaleString()}/month.`,
    },
    {
      icon: Settings,
      label: "BMS Control Code & Setpoint Automation",
      prompt: `Provide exact BMS control logic and thermostat staging scripts to enforce this ${activeScenarioObj.title} setpoint without human operator latency.`,
    },
    {
      icon: ShieldCheck,
      label: "Comfort & Risk Safeguards",
      prompt: `Evaluate potential occupant comfort impact or lab disruption during peak hours and prescribe automated fallback safeguards.`,
    },
  ];

  // Dynamic simulation comparison chart data based on selected buildings and slider value
  const simChartData = buildingOptions
    .filter((b) => selectedBuildings.includes(b.id))
    .map((b) => {
      const reductionFactor = 1 - (sliderValue * 0.7) / 100;
      const simulated = Math.round(b.baseline * reductionFactor);
      const saved = b.baseline - simulated;
      const pctReduction = Math.round(((b.baseline - simulated) / b.baseline) * 100);
      return {
        building: b.label,
        shortLabel: b.label.length > 22 ? `${b.label.slice(0, 20)}...` : b.label,
        Baseline: b.baseline,
        Simulated: simulated,
        Saved: saved,
        Pct: pctReduction,
      };
    });

  const totalBaselineKwh = simChartData.reduce((acc, curr) => acc + curr.Baseline, 0);
  const totalSimulatedKwh = simChartData.reduce((acc, curr) => acc + curr.Simulated, 0);
  const totalSavedKwh = totalBaselineKwh - totalSimulatedKwh;

  return (
    <div className="space-y-7">
      {/* 3 Step Large Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Step 1: Choose a Scenario */}
        <div className="lg:col-span-4 dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-3.5 mb-6">
              <span className="w-9 h-9 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm font-black shadow-xs">
                1
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Choose a Scenario</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Select an operational What-If policy</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {scenarios.map((sc) => {
                const isSelected = selectedScenario === sc.id;
                const Icon = sc.icon;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc.id)}
                    className={`flex items-start gap-4.5 p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/70 dark:bg-orange-950/40 shadow-xs ring-2 ring-orange-500/20 scale-101"
                        : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? "bg-orange-500 text-white shadow-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      <Icon className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-black leading-tight ${
                          isSelected ? "text-orange-950 dark:text-orange-300 font-black" : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {sc.title}
                      </p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{sc.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Configure Parameters */}
        <div className="lg:col-span-4 dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-3.5 mb-6">
              <span className="w-9 h-9 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm font-black shadow-xs">
                2
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Configure Parameters</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Tune policy slider and targeted zones</p>
              </div>
            </div>

            {/* Slider Control */}
            <div className="mb-7">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {activeScenarioObj.sliderLabel}
                </span>
                <span className="text-lg font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-3.5 py-1 rounded-full border border-orange-200 dark:border-orange-800 shadow-xs">
                  {sliderValue} {activeScenarioObj.unit}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full accent-orange-500 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2">
                <span>Conservative (5%)</span>
                <span>Moderate (30%)</span>
                <span>Aggressive (60%)</span>
              </div>
            </div>

            {/* Building Selector */}
            <div className="mb-7">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide block mb-3">
                Targeted Campus Structures (SRM KTR)
              </label>
              <div className="space-y-2 max-h-56 custom-scrollbar overflow-y-auto overscroll-contain pr-1">
                {buildingOptions.map((b) => {
                  const checked = selectedBuildings.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      onClick={() => toggleBuilding(b.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer text-xs font-bold ${
                        checked
                          ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700"
                          : "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{b.label}</span>
                      <span className="text-[11px] opacity-75">{b.baseline} kWh/d</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Predicted Outcomes */}
        <div className="lg:col-span-4 dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-3.5 mb-6">
              <span className="w-9 h-9 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center text-sm font-black shadow-xs">
                3
              </span>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Predicted ML Impact</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Live projected ROI and carbon cut</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Impact 1: Energy */}
              <div className="p-4.5 rounded-2xl bg-orange-50/90 dark:bg-slate-800/80 border border-orange-200/80 dark:border-slate-700/80 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Zap className="w-6 h-6 fill-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {impact.energy_reduction_pct}%
                  </p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                    Energy cut (~{impact.energy_saved_kwh?.toLocaleString()} kWh)
                  </p>
                </div>
              </div>

              {/* Impact 2: Cost */}
              <div className="p-4.5 rounded-2xl bg-emerald-50/90 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700/80 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    ₹{impact.cost_savings_monthly_inr?.toLocaleString()}
                  </p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">Monthly bill savings</p>
                </div>
              </div>

              {/* Impact 3: Carbon */}
              <div className="p-4.5 rounded-2xl bg-emerald-50/90 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700/80 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-xs">
                  <Leaf className="w-6 h-6 fill-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {impact.carbon_emission_reduction_tco2} tCO₂
                  </p>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-0.5">Carbon reduction</p>
                </div>
              </div>

              {/* Comfort Advisory */}
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-900/60 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <p className="text-xs text-sky-950 dark:text-sky-200 font-bold leading-relaxed">
                  {impact.comfort_impact_advisory}
                </p>
              </div>

              {/* Run Simulation Button */}
              <button
                onClick={handleRunSimulation}
                disabled={loading}
                className="w-full py-4 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-orange-500/30 transition-all transform active:scale-98 cursor-pointer disabled:opacity-75"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Calculating Simulation...</span>
                  </>
                ) : (
                  <>
                    <span>Run Policy Simulation</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Baseline vs Simulated Comparison Chart */}
      <div className="dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Baseline vs Simulated Facility Load
              </h3>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 shadow-2xs">
                <TrendingDown className="w-3.5 h-3.5" /> Projected -{Math.round(sliderValue * 0.7)}% Peak Shave
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Building &amp; node level load breakdown comparing baseline against simulated policy for {facilityName}
            </p>
          </div>

          {/* Segmented Controls & Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* View Mode Segmented Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  chartType === "bar"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
                <span>Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  chartType === "area"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>Load Trend</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("delta")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  chartType === "delta"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                <span>Savings Delta</span>
              </button>
            </div>

            {/* Visual Legend */}
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-indigo-400 dark:text-indigo-300">
                <span className="w-3 h-3 rounded-md bg-gradient-to-b from-indigo-400 to-indigo-600 border border-indigo-300 shadow-xs" /> Baseline (kWh)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400 dark:text-emerald-300">
                <span className="w-3 h-3 rounded-md bg-gradient-to-b from-emerald-400 to-emerald-600 border border-emerald-300 shadow-xs" /> Simulated (kWh)
              </span>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip inside chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Total Baseline</span>
            <p className="text-base font-black text-indigo-500 dark:text-indigo-300 mt-0.5">
              {totalBaselineKwh.toLocaleString()} <span className="text-xs font-semibold text-slate-400">kWh</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Simulated Target</span>
            <p className="text-base font-black text-emerald-500 dark:text-emerald-400 mt-0.5">
              {totalSimulatedKwh.toLocaleString()} <span className="text-xs font-semibold text-slate-400">kWh</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Net Energy Saved</span>
            <p className="text-base font-black text-teal-500 dark:text-teal-300 mt-0.5">
              -{totalSavedKwh.toLocaleString()} <span className="text-xs font-semibold text-slate-400">kWh</span>
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Est. Cost Shave</span>
            <p className="text-base font-black text-amber-500 dark:text-amber-400 mt-0.5">
              ₹{Math.round(totalSavedKwh * 8.2).toLocaleString()} <span className="text-xs font-semibold text-slate-400">/mo</span>
            </p>
          </div>
        </div>

        {/* Chart View Area */}
        <div className="w-full h-80 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={simChartData} margin={{ top: 15, right: 25, left: 0, bottom: 25 }}>
                <defs>
                  <linearGradient id="simBaselineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.65} />
                    <stop offset="60%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#312e81" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="simTargetAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.75} />
                    <stop offset="60%" stopColor="#059669" stopOpacity={0.30} />
                    <stop offset="100%" stopColor="#064e3b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  unit=" kWh"
                />
                <Tooltip
                  cursor={{ stroke: "rgba(99, 102, 241, 0.3)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-2xl shadow-xl text-xs space-y-2 min-w-[210px]">
                          <p className="font-black text-white">{data.building}</p>
                          <div className="flex items-center justify-between text-indigo-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs" />
                              Baseline Load:
                            </span>
                            <span className="font-bold">{data.Baseline.toLocaleString()} kWh</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                              Simulated Load:
                            </span>
                            <span className="font-bold">{data.Simulated.toLocaleString()} kWh</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-700/80 flex items-center justify-between text-teal-300 font-extrabold">
                            <span>Projected Shave:</span>
                            <span>-{data.Saved.toLocaleString()} kWh (-{data.Pct}%)</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Baseline"
                  name="Baseline (kWh)"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#simBaselineAreaGrad)"
                  dot={{ r: 4, fill: "#1e1b4b", stroke: "#818cf8", strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="Simulated"
                  name="Simulated (kWh)"
                  stroke="#34d399"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#simTargetAreaGrad)"
                  dot={{ r: 4.5, fill: "#022c22", stroke: "#34d399", strokeWidth: 2.5 }}
                />
              </AreaChart>
            ) : chartType === "delta" ? (
              <BarChart
                data={simChartData}
                margin={{ top: 15, right: 25, left: 0, bottom: 25 }}
                barCategoryGap="25%"
                maxBarSize={38}
              >
                <defs>
                  <linearGradient id="simDeltaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                    <stop offset="40%" stopColor="#f59e0b" stopOpacity={0.70} />
                    <stop offset="85%" stopColor="#d97706" stopOpacity={0.30} />
                    <stop offset="100%" stopColor="#78350f" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  unit=" kWh"
                />
                <Tooltip
                  cursor={{ fill: "rgba(245, 158, 11, 0.05)", stroke: "rgba(245, 158, 11, 0.2)", strokeWidth: 1, strokeDasharray: "4 4", rx: 12 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-2xl shadow-xl text-xs space-y-2 min-w-[200px]">
                          <p className="font-black text-white">{data.building}</p>
                          <div className="flex items-center justify-between text-amber-400">
                            <span>Energy Saved:</span>
                            <span className="font-bold">{data.Saved.toLocaleString()} kWh</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-400">
                            <span>Reduction:</span>
                            <span className="font-bold">-{data.Pct}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="Saved"
                  name="Energy Saved (kWh)"
                  fill="url(#simDeltaGrad)"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  radius={[8, 8, 2, 2]}
                />
              </BarChart>
            ) : (
              <BarChart
                data={simChartData}
                margin={{ top: 15, right: 25, left: 0, bottom: 25 }}
                barGap={8}
                barCategoryGap="22%"
                maxBarSize={36}
              >
                <defs>
                  {/* Baseline: Vibrant Electric Indigo Top Depth -> Transparent Bottom Fade */}
                  <linearGradient id="simBaselineBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.95} />
                    <stop offset="35%" stopColor="#6366f1" stopOpacity={0.70} />
                    <stop offset="80%" stopColor="#4338ca" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#312e81" stopOpacity={0.08} />
                  </linearGradient>

                  {/* Simulated: Vibrant Mint-Emerald Top Depth -> Transparent Bottom Fade */}
                  <linearGradient id="simTargetBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                    <stop offset="35%" stopColor="#10b981" stopOpacity={0.70} />
                    <stop offset="80%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#064e3b" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={700}
                  axisLine={false}
                  tickLine={false}
                  unit=" kWh"
                />
                <Tooltip
                  cursor={{ fill: "rgba(99, 102, 241, 0.04)", stroke: "rgba(99, 102, 241, 0.2)", strokeWidth: 1, strokeDasharray: "4 4", rx: 12 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-2xl shadow-xl text-xs space-y-2 min-w-[210px]">
                          <p className="font-black text-white">{data.building}</p>
                          <div className="flex items-center justify-between text-indigo-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 border border-indigo-400" />
                              Baseline Load:
                            </span>
                            <span className="font-bold">{data.Baseline.toLocaleString()} kWh</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400" />
                              Simulated Load:
                            </span>
                            <span className="font-bold">{data.Simulated.toLocaleString()} kWh</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-700/80 flex items-center justify-between text-teal-300 font-extrabold">
                            <span>Projected Shave:</span>
                            <span>-{data.Saved.toLocaleString()} kWh (-{data.Pct}%)</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="Baseline"
                  name="Baseline (kWh)"
                  fill="url(#simBaselineBarGrad)"
                  stroke="#818cf8"
                  strokeWidth={1.5}
                  radius={[8, 8, 2, 2]}
                />
                <Bar
                  dataKey="Simulated"
                  name="Simulated (kWh)"
                  fill="url(#simTargetBarGrad)"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  radius={[8, 8, 2, 2]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Simulation Scenario Summarizer & Implementation Roadmap Section */}
      <div className="dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  AI Simulation Scenario Summarizer &amp; Implementation Roadmap
                </h3>
                <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-300/80 dark:border-orange-800">
                  Policy LLM Engine
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Generates a phased rollout plan, financial matrix, BMS control rules, and risk assessment for {facilityName}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleGenerateSimulationSummary()}
              disabled={simSummaryLoading}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25 transition cursor-pointer disabled:opacity-50"
            >
              {simSummaryLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Simulation Impact...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{simSummaryText ? "Regenerate Scenario Report" : "Generate AI Simulation Summary"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Scenario Question Prompt Chips with Lucide Icons */}
        <div className="pt-4 flex items-center gap-2 overflow-x-auto pb-2">
          {quickSimPrompts.map((qp, idx) => {
            const Icon = qp.icon;
            return (
              <button
                key={idx}
                onClick={() => handleGenerateSimulationSummary(qp.prompt)}
                disabled={simSummaryLoading}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Formatted Markdown Output Container */}
        {simSummaryText && (
          <div className="mt-5 p-6 rounded-3xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200/80 dark:border-slate-700/80 text-xs">
              <span className="font-extrabold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Policy Simulation Briefing &bull; {activeScenarioObj.title} ({sliderValue}%)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySimSummary}
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
                  onClick={handleExportSimSummary}
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
                {simSummaryText}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Diagnostic Query Input Bar for Simulation */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={simQuery}
              onChange={(e) => setSimQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateSimulationSummary()}
              placeholder="Ask AI Engineer about this simulation (e.g., 'What is the payback period for LED conversion?')..."
              disabled={simSummaryLoading}
              className="w-full pl-5 pr-12 py-3 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 transition disabled:opacity-50"
            />
            <button
              onClick={() => handleGenerateSimulationSummary()}
              disabled={!simQuery.trim() || simSummaryLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
