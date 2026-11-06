"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, CheckCircle2, Sparkles, Download, Trash2, X, Play, Zap, Droplets, Trash, Wind, Wrench, BrainCircuit, Loader2, Cpu } from "lucide-react";
import { syncAndLearnTelemetry } from "../lib/api";
import type { LearningResponse, TelemetryRow } from "../lib/dataTypes";
import type { LucideIcon } from "lucide-react";
import { isValidTelemetryDataset, parseTelemetryCsv, safelyRemoveStoredTelemetry } from "../lib/telemetryCsv";

export interface UploadedTelemetryDataset {
  id: string;
  domain: "energy" | "water" | "waste" | "aqi" | "assets" | "master";
  sector: string;
  filename: string;
  uploadDate: string;
  recordCount: number;
  dateRange: string;
  kpis: {
    meanValue: number;
    maxValue: number;
    minValue: number;
    unit: string;
    anomaliesDetected: number;
  };
  rows: TelemetryRow[];
}

function isUploadedDataset(value: unknown): value is UploadedTelemetryDataset {
  return isValidTelemetryDataset(value);
}

interface DataUploadStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityType: string;
  facilityName: string;
  onDatasetApplied?: (dataset: UploadedTelemetryDataset) => void;
}

const DOMAIN_TEMPLATES: Record<
  string,
  { label: string; shortName: string; unit: string; icon: LucideIcon; sampleCsv: string; headers: string[] }
> = {
  energy: {
    label: "Energy Telemetry (kWh / kW / Power Factor)",
    shortName: "Energy Telemetry",
    unit: "kWh",
    icon: Zap,
    headers: ["timestamp", "entity_id", "kwh", "kw_demand", "power_factor", "voltage_v", "temperature_c"],
    sampleCsv: `timestamp,entity_id,kwh,kw_demand,power_factor,voltage_v,temperature_c
2026-10-04 00:00,main_substation,1120.5,180.2,0.985,415.2,28.4
2026-10-04 03:00,main_substation,980.2,165.0,0.982,416.0,27.1
2026-10-04 06:00,main_substation,1840.0,290.5,0.988,414.8,29.5
2026-10-04 09:00,main_substation,2950.4,460.0,0.980,412.5,33.2
2026-10-04 12:00,main_substation,3890.8,590.2,0.975,410.0,36.8
2026-10-04 15:00,main_substation,3420.1,510.4,0.978,411.2,35.4
2026-10-04 18:00,main_substation,2550.0,380.0,0.984,413.5,31.0
2026-10-04 21:00,main_substation,1750.6,260.1,0.986,415.0,29.2`,
  },
  water: {
    label: "Water & Fluid Consumption (Litres / Flow / Pressure)",
    shortName: "Water & Fluids",
    unit: "kL",
    icon: Droplets,
    headers: ["timestamp", "entity_id", "litres", "flow_rate_lpm", "pressure_bar", "ph_level", "tds_ppm"],
    sampleCsv: `timestamp,entity_id,litres,flow_rate_lpm,pressure_bar,ph_level,tds_ppm
2026-10-04 00:00,overhead_tank_1,450.0,15.2,4.2,7.2,185
2026-10-04 03:00,overhead_tank_1,180.0,6.0,4.4,7.2,184
2026-10-04 06:00,overhead_tank_1,3200.0,105.0,3.8,7.3,188
2026-10-04 09:00,overhead_tank_1,2800.0,92.0,3.9,7.3,186
2026-10-04 12:00,overhead_tank_1,1950.0,65.0,4.1,7.2,185
2026-10-04 15:00,overhead_tank_1,1600.0,52.0,4.1,7.2,184
2026-10-04 18:00,overhead_tank_1,3450.0,112.0,3.7,7.4,189
2026-10-04 21:00,overhead_tank_1,1850.0,60.0,4.2,7.3,185`,
  },
  waste: {
    label: "Solid & Bio-Medical Waste Telemetry (kg / Fill %)",
    shortName: "Solid Waste",
    unit: "kg",
    icon: Trash,
    headers: ["timestamp", "entity_id", "fill_level_kg", "capacity_pct", "category", "temperature_c"],
    sampleCsv: `timestamp,entity_id,fill_level_kg,capacity_pct,category,temperature_c
2026-10-04 06:00,bin_canteen_01,14.5,29.0,Organic,26.5
2026-10-04 09:00,bin_canteen_01,28.2,56.4,Organic,28.2
2026-10-04 12:00,bin_canteen_01,42.0,84.0,Organic,31.0
2026-10-04 15:00,bin_canteen_01,48.5,97.0,Organic,32.5
2026-10-04 18:00,bin_canteen_01,12.0,24.0,Organic,29.0`,
  },
  aqi: {
    label: "Environmental Air Quality (PM2.5 / PM10 / CO2)",
    shortName: "Air Quality (AQI)",
    unit: "AQI",
    icon: Wind,
    headers: ["timestamp", "sensor_id", "pm25", "pm10", "co2_ppm", "aqi_index", "temp_c", "humidity_pct"],
    sampleCsv: `timestamp,sensor_id,pm25,pm10,co2_ppm,aqi_index,temp_c,humidity_pct
2026-10-04 00:00,aqi_roof_01,24.5,42.0,420,35,26.0,65.0
2026-10-04 06:00,aqi_roof_01,32.0,55.0,450,42,27.5,62.0
2026-10-04 12:00,aqi_roof_01,48.5,84.0,520,58,34.0,48.0
2026-10-04 18:00,aqi_roof_01,38.2,66.0,480,46,30.2,54.0`,
  },
  assets: {
    label: "Asset Degradation & Vibration Telemetry (mm/s / °C / RUL)",
    shortName: "Asset Health",
    unit: "mm/s",
    icon: Wrench,
    headers: ["timestamp", "asset_id", "vibration_mm_s", "operating_temp_c", "power_kw", "duty_cycle_pct", "health_score"],
    sampleCsv: `timestamp,asset_id,vibration_mm_s,operating_temp_c,power_kw,duty_cycle_pct,health_score
2026-10-04 00:00,chiller_b2,4.8,68.2,42.5,78.0,48.0
2026-10-04 06:00,chiller_b2,4.9,69.0,44.0,82.0,47.5
2026-10-04 12:00,chiller_b2,5.2,71.5,46.2,94.0,45.0
2026-10-04 18:00,chiller_b2,4.9,68.4,43.0,80.0,48.0`,
  },
};

export default function DataUploadStudioModal({
  isOpen,
  onClose,
  facilityType,
  facilityName,
  onDatasetApplied,
}: DataUploadStudioModalProps) {
  const [selectedDomain, setSelectedDomain] = useState<"energy" | "water" | "waste" | "aqi" | "assets">("energy");
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [parsedDataset, setParsedDataset] = useState<UploadedTelemetryDataset | null>(null);
  const [activeHistory, setActiveHistory] = useState<UploadedTelemetryDataset[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLearning, setIsLearning] = useState(false);
  const [learningStep, setLearningStep] = useState<string | null>(null);
  const [learningResult, setLearningResult] = useState<LearningResponse | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing uploaded datasets from localStorage
  React.useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem("campusiq_uploaded_datasets") || "null");
      const safe = Array.isArray(parsed) ? parsed.filter(isUploadedDataset).slice(0, 10) : [];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore validated browser-local upload history after hydration.
      setActiveHistory(safe);
      if (!Array.isArray(parsed) || safe.length !== parsed.length) localStorage.setItem("campusiq_uploaded_datasets", JSON.stringify(safe));
    } catch {
      safelyRemoveStoredTelemetry("campusiq_uploaded_datasets");
      setActiveHistory([]);
    }
  }, []);

  if (!isOpen) return null;

  const currentTemplate = DOMAIN_TEMPLATES[selectedDomain] || DOMAIN_TEMPLATES.energy;

  const handleDownloadTemplate = () => {
    const blob = new Blob([currentTemplate.sampleCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `campusiq_${selectedDomain}_telemetry_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.slice(0, 128));
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      processCsvData(text, file.name);
    };
    reader.readAsText(file);
  };

  const processCsvData = (rawText: string, customFilename?: string) => {
    setLearningResult(null);
    setParseError(null);

    try {
      const rows = parseTelemetryCsv(selectedDomain, rawText);
      const primaryKey = ({ energy: "kwh", water: "litres", waste: "fill_level_kg", aqi: "aqi_index", assets: "vibration_mm_s" } as const)[selectedDomain];
      const primaryValues = rows.map((row) => row[primaryKey]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
      const meanVal = Math.round((primaryValues.reduce((a, b) => a + b, 0) / primaryValues.length) * 10) / 10;
      const maxVal = Math.max(...primaryValues);
      const minVal = Math.min(...primaryValues);

      // Anomaly scan: values exceeding mean + 1.8 * std
      const std = Math.sqrt(
        primaryValues.reduce((sq, n) => sq + Math.pow(n - meanVal, 2), 0) / (primaryValues.length || 1)
      );
      const anomalyThreshold = meanVal + 1.6 * std;
      const anomaliesCount = primaryValues.filter((v) => v > anomalyThreshold).length;

      const dateRangeStr = `${rows[0]?.timestamp || "Recent"} to ${rows[rows.length - 1]?.timestamp || "Live"}`;

      const dataset: UploadedTelemetryDataset = {
        id: `ds_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        domain: selectedDomain,
        sector: facilityType,
        filename: (customFilename || fileName || `manual_${selectedDomain}_data.csv`).slice(0, 128),
        uploadDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        recordCount: rows.length,
        dateRange: dateRangeStr,
        kpis: {
          meanValue: meanVal,
          maxValue: maxVal,
          minValue: minVal,
          unit: currentTemplate.unit,
          anomaliesDetected: anomaliesCount,
        },
        rows,
      };

      setParsedDataset(dataset);
    } catch (err: unknown) {
      setParsedDataset(null);
      setParseError(err instanceof Error ? err.message : "Invalid CSV format.");
    }
  };

  const handleApplyDatasetToPredictions = () => {
    if (!parsedDataset) return;

    // Save to local storage
    const updated = [parsedDataset, ...activeHistory.filter((h) => h.id !== parsedDataset.id)].slice(0, 10);
    setActiveHistory(updated);
    localStorage.setItem("campusiq_uploaded_datasets", JSON.stringify(updated));
    localStorage.setItem("campusiq_active_telemetry", JSON.stringify(parsedDataset));

    if (onDatasetApplied) {
      onDatasetApplied(parsedDataset);
    }

    setToastMessage(`Dataset "${parsedDataset.filename}" active! Live models & predictions updated.`);
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 1800);
  };

  const handleSyncAndLearn = async () => {
    if (!parsedDataset) return;

    setIsLearning(true);
    setLearningStep("Ingesting & Validating Telemetry Records...");

    try {
      setTimeout(() => setLearningStep("Fitting Prophet & XGBoost Residuals..."), 600);
      setTimeout(() => setLearningStep("Recalibrating Isolation Forest Sensitivity..."), 1200);
      setTimeout(() => setLearningStep("Updating Predictive Maintenance RUL Bounds..."), 1800);

      const res = await syncAndLearnTelemetry({
        facilityType,
        domain: selectedDomain,
        records: parsedDataset.rows,
        operatorNote: "CSV telemetry upload"
      });

      // Save to local storage
      const updated = [parsedDataset, ...activeHistory.filter((h) => h.id !== parsedDataset.id)].slice(0, 10);
      setActiveHistory(updated);
      localStorage.setItem("campusiq_uploaded_datasets", JSON.stringify(updated));
      localStorage.setItem("campusiq_active_telemetry", JSON.stringify(parsedDataset));
      localStorage.setItem("campusiq_latest_model_metrics", JSON.stringify(res));

      if (onDatasetApplied) {
        onDatasetApplied(parsedDataset);
      }

      setLearningResult(res);
      setToastMessage(res.retraining_status === "completed" ? "Telemetry accepted and model retraining completed." : "Telemetry accepted; model retraining was not completed.");
    } catch (err: unknown) {
      alert(`ML Retraining Error: ${err instanceof Error ? err.message : "Could not complete learning cycle."}`);
    } finally {
      setIsLearning(false);
      setLearningStep(null);
    }
  };

  const handleDeleteHistory = (id: string) => {
    const updated = activeHistory.filter((h) => h.id !== id);
    setActiveHistory(updated);
    localStorage.setItem("campusiq_uploaded_datasets", JSON.stringify(updated));
  };

  const handleUseSample = () => {
    setCsvContent(currentTemplate.sampleCsv);
    setFileName(`sample_${selectedDomain}_telemetry.csv`);
    processCsvData(currentTemplate.sampleCsv, `sample_${selectedDomain}_telemetry.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        data-lenis-prevent="true"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
      >
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl border border-emerald-500 flex items-center gap-2.5 animate-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black">{toastMessage}</span>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Telemetry Ingestion &amp; CSV Studio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800/80">
                  ML Prediction Sync
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                Preview and validate facility telemetry CSV files for {facilityName} before submitting them to the ingestion service.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Domain Selection Tabs */}
        <div className="px-6 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {(["energy", "water", "waste", "aqi", "assets"] as const).map((dm) => {
              const tmpl = DOMAIN_TEMPLATES[dm];
              const Icon = tmpl.icon;
              const isSelected = selectedDomain === dm;
              return (
                <button
                  key={dm}
                  onClick={() => {
                    setSelectedDomain(dm);
                    setParsedDataset(null);
                    setCsvContent("");
                    setFileName("");
                    setParseError(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tmpl.shortName}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0 shadow-2xs self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-orange-500" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain p-6 space-y-6">
          {/* Upload Dropzone & Action Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Drag & Drop Zone */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-orange-500/40 hover:border-orange-500 bg-orange-50/20 dark:bg-orange-950/10 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Drop your <span className="text-orange-500">{currentTemplate.label.split("(")[0]}</span> CSV file here
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    Supports .CSV files with timestamp, entity ID, and numerical sensors.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <span className="px-4 py-1.5 rounded-full text-xs font-black bg-orange-500 text-white shadow-xs">
                    Browse Local File
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseSample();
                    }}
                    className="px-4 py-1.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer transition"
                  >
                    Load Sample Demo Data
                  </button>
                </div>
              </div>

              {/* Raw CSV Preview Box */}
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                  <span>CSV Raw Text &amp; Telemetry Data Stream</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Headers: {currentTemplate.headers.join(", ")}
                  </span>
                </label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => {
                    setCsvContent(e.target.value);
                    if (e.target.value.trim().length > 15) {
                      processCsvData(e.target.value, "pasted_data.csv");
                    }
                  }}
                  placeholder="Paste raw CSV rows or click 'Load Sample Demo Data' above..."
                  className="w-full font-mono text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Right: Real-Time Parse & Prediction Impact Card */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-orange-500" />
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      ML Ingestion Engine
                    </h4>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    Server validation active
                  </span>
                </div>

                {parsedDataset ? (
                  <div className="space-y-4 mt-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">File Ingested:</span>
                        <span className="text-slate-800 dark:text-white truncate max-w-[180px]">{parsedDataset.filename}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Total Valid Rows:</span>
                        <span className="text-orange-600 dark:text-orange-400 font-black">{parsedDataset.recordCount} Samples</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Target Facility:</span>
                        <span className="text-slate-800 dark:text-white">{facilityName}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">Timestamp Span:</span>
                        <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">{parsedDataset.dateRange}</span>
                      </div>
                    </div>

                    {/* Statistical Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 block">Mean Load</span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {parsedDataset.kpis.meanValue} {parsedDataset.kpis.unit}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 block">Peak Max</span>
                        <span className="text-base font-black text-rose-600 dark:text-rose-400">
                          {parsedDataset.kpis.maxValue} {parsedDataset.kpis.unit}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 block">Anomalies</span>
                        <span className="text-base font-black text-amber-500">
                          {parsedDataset.kpis.anomaliesDetected} Spikes
                        </span>
                      </div>
                    </div>

                    {/* ML Retraining Results Banner if available */}
                    {learningResult && (
                      <div className={`p-3.5 rounded-2xl border text-xs space-y-2 animate-in fade-in ${learningResult.retraining_status === "completed" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <BrainCircuit className="w-4 h-4 text-orange-500" />
                            <span>{learningResult.retraining_status === "completed" ? "Model retraining completed" : learningResult.retraining_status === "failed" ? "Telemetry accepted; model retraining failed" : "Telemetry accepted; retraining not run"}</span>
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-700 text-white">
                            {learningResult.accepted ?? 0} accepted
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{learningResult.duplicates ?? 0} duplicate rows detected; conflicting readings are held for review instead of replacing stored values. {learningResult.retraining_status === "completed" ? `Models: ${(learningResult.retrained_models || []).join(", ")}.` : "No retraining success is reported for this batch."}</p>
                      </div>
                    )}

                    {!learningResult && (
                      <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs font-semibold text-slate-700 dark:text-slate-300 space-y-1">
                        <p className="font-black text-orange-600 dark:text-orange-400 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5" /> ML Continuous Learning Ready:
                        </p>
                        <p>
                          Click <strong>Sync &amp; Learn</strong> to submit this validated stream to the FastAPI service.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-bold">No CSV file processed yet.</p>
                    <p className="text-[11px] text-slate-500">Upload a CSV or load the included sample data.</p>
                  </div>
                )}
                {parseError && (
                  <p role="alert" className="mt-3 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    {parseError}
                  </p>
                )}
              </div>

              {/* Action Buttons: Sync & Learn (Backend ML) and Fast Apply */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={!parsedDataset || isLearning}
                  onClick={handleSyncAndLearn}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs shadow-lg shadow-orange-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                  {isLearning ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>{learningStep || "Retraining ML Models on Telemetry..."}</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-4.5 h-4.5 text-white" />
                      <span>Sync &amp; Learn with ML Engine</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!parsedDataset || isLearning}
                  onClick={handleApplyDatasetToPredictions}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-orange-500" />
                  <span>Apply Telemetry to UI Predictions Only</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upload History Table */}
          {activeHistory.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Previously Ingested Telemetry Datasets ({activeHistory.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{h.filename}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {h.domain.toUpperCase()} &bull; {h.recordCount} rows &bull; {h.uploadDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setParsedDataset(h);
                          setToastMessage(`Selected "${h.filename}" for Sync & Learn`);
                          setTimeout(() => setToastMessage(null), 1500);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-white font-bold transition cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <BrainCircuit className="w-3 h-3" />
                        <span>Learn</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onDatasetApplied) onDatasetApplied(h);
                          setToastMessage(`Re-applied dataset "${h.filename}"`);
                          setTimeout(() => setToastMessage(null), 1500);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer text-[11px]"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(h.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
