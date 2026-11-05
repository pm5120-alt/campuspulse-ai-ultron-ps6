"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Building, Activity, AlertTriangle, Shield, Loader2 } from "lucide-react";
import type { CampusMapData } from "../lib/dataTypes";
import type { BuildingLocation } from "./SatelliteMapLeaflet";

// Dynamically import Leaflet Satellite component to disable SSR
const SatelliteMapLeaflet = dynamic(() => import("./SatelliteMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[620px] rounded-3xl bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3.5 border border-slate-800">
      <Loader2 className="w-9 h-9 animate-spin text-orange-500" />
      <p className="text-sm font-bold tracking-wider text-slate-300">Loading Satellite GIS Telemetry Map...</p>
    </div>
  ),
});

interface CampusMapViewProps {
  data: CampusMapData | null;
  facilityType?: string;
  onOpenPlaceManager?: () => void;
}

export default function CampusMapView({
  data,
  facilityType = "engineering_college",
  onOpenPlaceManager,
}: CampusMapViewProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingLocation | null>(null);

  return (
    <div className="space-y-7">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Select a marker to see its campus landmark name. University Building and Tech Park use published SRMIST location references; other pin positions and all facility readings are illustrative demo data, not surveyed building coordinates or live sensors.
      </p>
      {/* High-Resolution Satellite GIS Map Engine */}
      <SatelliteMapLeaflet
        sector={facilityType || data?.facility_type || "engineering_college"}
        onSelectBuilding={setSelectedBuilding}
        selectedBuilding={selectedBuilding}
        onOpenPlaceManager={onOpenPlaceManager}
      />

        {/* Bottom Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
          <div className="dashboard-card p-3.5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shadow-xs shrink-0 border border-amber-200/60 dark:border-amber-800/60">
              <Building className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">Illustrative campus landmarks</p>
              <h4 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 truncate">10 Map Pins</h4>
            </div>
          </div>

          <div className="dashboard-card p-3.5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center shadow-xs shrink-0 border border-sky-200/60 dark:border-sky-800/60">
              <Activity className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">Synthetic sensor values</p>
              <h4 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 truncate">Demo data</h4>
            </div>
          </div>

          <div className="dashboard-card p-3.5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center shadow-xs shrink-0 border border-rose-200/60 dark:border-rose-800/60">
              <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">Illustrative demo alerts</p>
              <h4 className="text-lg sm:text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 mt-0.5 sm:mt-1 truncate">2 Examples</h4>
            </div>
          </div>

          <div className="dashboard-card p-3.5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
              <Shield className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">Illustrative map score</p>
              <h4 className="text-lg sm:text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 truncate">Demo</h4>
            </div>
          </div>
        </div>
    </div>
  );
}
