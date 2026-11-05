"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, Clock, CheckCircle2, Flame, Droplets, Zap } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { ChartTooltipContent } from "./ui/chart";
import type { SafetyOverviewData } from "../lib/dataTypes";

interface SafetyViewProps {
  data: SafetyOverviewData | null;
}

export default function SafetyView({ data }: SafetyViewProps) {
  const analytics = data?.safety_analytics || {
    hotspots: [
      { zone: "Heavy Workshop", total_incidents: 14, critical_count: 2, avg_response_min: 4.5, risk_level: "High", fill: "#ef4444" },
      { zone: "Chemistry Lab", total_incidents: 9, critical_count: 1, avg_response_min: 6.2, risk_level: "Medium", fill: "#f59e0b" },
      { zone: "Hostel Complex", total_incidents: 7, critical_count: 0, avg_response_min: 8.1, risk_level: "Low", fill: "#10b981" },
      { zone: "Visitor Parking", total_incidents: 5, critical_count: 0, avg_response_min: 9.0, risk_level: "Low", fill: "#0ea5e9" },
    ],
    top_risk_zone: "Heavy Workshop",
    overall_safety_status: "Secure",
  };

  const incidentTrend = [
    { week: "W1", Incidents: 8, Resolved: 8 },
    { week: "W2", Incidents: 6, Resolved: 6 },
    { week: "W3", Incidents: 11, Resolved: 10 },
    { week: "W4", Incidents: 5, Resolved: 5 },
    { week: "W5", Incidents: 9, Resolved: 8 },
    { week: "W6", Incidents: 4, Resolved: 4 },
  ];

  return (
    <div className="space-y-7">
      {/* 4 Large Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-5 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs shrink-0 border border-purple-200/60 dark:border-purple-800/60">
            <ShieldAlert className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Incidents (YTD)</p>
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-1">35</h3>
          </div>
        </div>

        <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-5 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 dark:text-rose-400 flex items-center justify-center shadow-xs shrink-0 border border-rose-200/60 dark:border-rose-800/60">
            <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Critical Risks</p>
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-1">1</h3>
          </div>
        </div>

        <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-5 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 dark:text-sky-400 flex items-center justify-center shadow-xs shrink-0 border border-sky-200/60 dark:border-sky-800/60">
            <Clock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mean Response Time</p>
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-1">
              5.4 <span className="text-sm font-bold text-slate-400 dark:text-slate-500">min</span>
            </h3>
          </div>
        </div>

        <div className="dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-5 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Incident Resolution</p>
            <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white mt-1">97.1%</h3>
          </div>
        </div>
      </div>

      {/* Recharts Safety Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Incidents by Zone BarChart */}
        <div className="lg:col-span-6 dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Incidents by Zone</h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">Spatial risk frequency breakdown</p>
            </div>
            <span className="text-xs font-black text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
              Hotspot Engine
            </span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.hotspots}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="zone"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={800}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total_incidents" name="Total Incidents" radius={[0, 8, 8, 0]}>
                  {(analytics.hotspots || []).map((entry, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || "#f97316"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
            Priority inspection advisory: <span className="font-black text-slate-800 dark:text-slate-200">{analytics.top_risk_zone}</span> requires electrical panel insulation & ventilation audit.
          </p>
        </div>

        {/* Weekly Incident Trend LineChart */}
        <div className="lg:col-span-6 dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Weekly Incident Velocity</h3>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">Reported vs Closed safety tickets</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-extrabold">
              <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <span className="w-3 h-3 rounded-full bg-purple-500" /> Reported
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Resolved
              </span>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={incidentTrend} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="Incidents"
                  stroke="#a855f7"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#ffffff", stroke: "#a855f7", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="Resolved"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#ffffff", stroke: "#10b981", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">
            <span>Overall Facility Status</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">95.2% Resolution Under SLA</span>
          </div>
        </div>
      </div>

      {/* Live Safety Protocol Status Checklist */}
      <div className="dashboard-card p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Live Safety Protocol Checklist</h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">IoT Telemetry Hardware Compliance Status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs my-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/90 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700/80">
            <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2.5 text-sm">
              <Flame className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Fire Suppression
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
              6.2 Bar (Nominal)
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/90 dark:bg-slate-800/80 border border-emerald-200/80 dark:border-slate-700/80">
            <span className="font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2.5 text-sm">
              <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Transformer Grounding
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
              &lt; 1.0 Ω Compliant
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/90 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700/80">
            <span className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-2.5 text-sm">
              <Droplets className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Spill Neutralization Kit
            </span>
            <span className="font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
              Replenish Due (3d)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
