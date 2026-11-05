"use client";

import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { CustomCampus } from "./CampusPlaceManagerModal";
import { Layers, LocateFixed, Navigation, Crosshair, Building, Zap, Droplets, Wind, ShieldCheck, X, MapPin } from "lucide-react";

// Fix standard Leaflet default icon path issue in Webpack/Turbopack
const defaultIconPrototype = L.Icon.Default.prototype as typeof L.Icon.Default.prototype & { _getIconUrl?: unknown };
delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface BuildingLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  live_status: string;
  status_label: string;
  kwh: number;
  water_kl?: number;
  occupancy: number;
  sensors_count: number;
  aqi?: number;
}

interface SatelliteMapLeafletProps {
  sector: string;
  onSelectBuilding: (building: BuildingLocation | null) => void;
  selectedBuilding: BuildingLocation | null;
  onOpenPlaceManager?: () => void;
}

// Campus center is an approximate fit; only the University Building and Tech Park coordinates
// are tied to published SRMIST geotagged references. Remaining landmark pins are approximate.
const SECTOR_COORDINATES: Record<string, { center: [number, number]; zoom: number; campus_title: string; buildings: BuildingLocation[] }> = {
  engineering_college: {
    center: [12.82415, 80.04405],
    zoom: 16,
    campus_title: "SRM Institute of Science and Technology · Kattankulathur",
    buildings: [
      { id: "university_building", name: "University Administrative Building (Library)", lat: 12.823643, lng: 80.042703, live_status: "Normal", status_label: "Illustrative demo status", kwh: 4320, water_kl: 45.2, occupancy: 400, sensors_count: 10, aqi: 39 },
      { id: "tech_park", name: "Tech Park", lat: 12.825067, lng: 80.045419, live_status: "Warning", status_label: "Illustrative demo status", kwh: 4450, water_kl: 46.8, occupancy: 420, sensors_count: 10, aqi: 39 },
      { id: "hi_tech_block", name: "Hi-Tech Block", lat: 12.8248, lng: 80.0440, live_status: "Normal", status_label: "Illustrative demo status", kwh: 4120, water_kl: 42.5, occupancy: 380, sensors_count: 10, aqi: 38 },
      { id: "crc_block", name: "Class Room Complex (CRC Block)", lat: 12.8239, lng: 80.0447, live_status: "Normal", status_label: "Illustrative demo status", kwh: 3650, water_kl: 35.0, occupancy: 200, sensors_count: 8, aqi: 37 },
      { id: "main_block", name: "Main Block", lat: 12.8242, lng: 80.0436, live_status: "Normal", status_label: "Illustrative demo status", kwh: 420, water_kl: 12.0, occupancy: 250, sensors_count: 4, aqi: 36 },
      { id: "es_block", name: "ES Block", lat: 12.8236, lng: 80.0445, live_status: "Normal", status_label: "Illustrative demo status", kwh: 2860, water_kl: 18.4, occupancy: 300, sensors_count: 8, aqi: 41 },
      { id: "automobile_block", name: "Automobile Block", lat: 12.8251, lng: 80.0434, live_status: "Normal", status_label: "Illustrative demo status", kwh: 980, water_kl: 6.2, occupancy: 400, sensors_count: 4, aqi: 40 },
      { id: "civil_block", name: "Old Library Block · Civil Engineering", lat: 12.8244, lng: 80.0440, live_status: "Warning", status_label: "Illustrative demo status", kwh: 8240, water_kl: 28.4, occupancy: 850, sensors_count: 18, aqi: 42 },
      { id: "tp_ganesan_auditorium", name: "Dr. T. P. Ganesan Auditorium", lat: 12.8245, lng: 80.0449, live_status: "Normal", status_label: "Illustrative demo status", kwh: 6120, water_kl: 19.2, occupancy: 420, sensors_count: 14, aqi: 44 },
      { id: "main_gate", name: "SRMIST Main Campus Gate · GST Road", lat: 12.8237, lng: 80.0418, live_status: "Normal", status_label: "Illustrative demo status", kwh: 520, water_kl: 4.0, occupancy: 50, sensors_count: 6, aqi: 42 },
    ]
  },  hospital: {
    center: [20.2312, 85.7760], // AIIMS / Medical zone
    zoom: 17,
    campus_title: "District Hospital & Trauma Complex",
    buildings: [
      { id: "opd_block", name: "OPD Block", lat: 20.2318, lng: 85.7765, live_status: "Normal", status_label: "Normal", kwh: 9400, water_kl: 65, occupancy: 600, sensors_count: 12, aqi: 35 },
      { id: "ipd_block", name: "IPD Block", lat: 20.2308, lng: 85.7758, live_status: "Normal", status_label: "Normal", kwh: 14200, water_kl: 120, occupancy: 500, sensors_count: 16, aqi: 34 },
      { id: "emergency", name: "Emergency Wing", lat: 20.2315, lng: 85.7772, live_status: "Warning", status_label: "Critical HVAC Load", kwh: 8900, water_kl: 45, occupancy: 200, sensors_count: 10, aqi: 36 },
      { id: "pharmacy", name: "Pharmacy & Labs", lat: 20.2322, lng: 85.7755, live_status: "Normal", status_label: "Normal", kwh: 3400, water_kl: 22, occupancy: 80, sensors_count: 8, aqi: 33 }
    ]
  },
  industrial_estate: {
    center: [21.8550, 84.0080], // Industrial Estate Corridor
    zoom: 17,
    campus_title: "Industrial Estate Zone",
    buildings: [
      { id: "plant_a", name: "Manufacturing Plant A", lat: 21.8558, lng: 84.0088, live_status: "Warning", status_label: "High Peak Load", kwh: 24500, water_kl: 15, occupancy: 500, sensors_count: 24, aqi: 62 },
      { id: "plant_b", name: "Manufacturing Plant B", lat: 21.8542, lng: 84.0075, live_status: "Normal", status_label: "Normal", kwh: 19800, water_kl: 12, occupancy: 400, sensors_count: 18, aqi: 58 },
      { id: "etp", name: "ETP Utility Block", lat: 21.8562, lng: 84.0068, live_status: "Normal", status_label: "Normal", kwh: 6400, water_kl: 180, occupancy: 30, sensors_count: 14, aqi: 55 }
    ]
  },
  municipal_campus: {
    center: [20.2961, 85.8245], // Bhubaneswar Municipal Zone
    zoom: 17,
    campus_title: "Municipal Corporation Center",
    buildings: [
      { id: "main_office", name: "Main Corporation Office", lat: 20.2968, lng: 85.8252, live_status: "Normal", status_label: "Normal", kwh: 4800, water_kl: 18, occupancy: 400, sensors_count: 10, aqi: 48 },
      { id: "public_hall", name: "Public Grievance Hall", lat: 20.2955, lng: 85.8240, live_status: "Normal", status_label: "Normal", kwh: 2900, water_kl: 14, occupancy: 500, sensors_count: 6, aqi: 50 },
      { id: "water_supply", name: "Water Supply Works", lat: 20.2965, lng: 85.8235, live_status: "Warning", status_label: "Pump Vibration Alert", kwh: 7100, water_kl: 450, occupancy: 80, sensors_count: 12, aqi: 44 }
    ]
  }
};

// Custom Marker HTML generator
function createCustomPin(b: BuildingLocation) {
  const isWarning = b.live_status === "Warning" || b.status_label.includes("High") || b.status_label.includes("Waste") || b.status_label.includes("Alert");
  const isCritical = b.live_status === "Critical";

  const dotColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#10b981";
  const html = `<div role="img" aria-label="${dotColor === "#ef4444" ? "Critical" : isWarning ? "Warning" : "Normal"} demo status" style="width:18px;height:18px;border:3px solid white;border-radius:50%;background:${dotColor};box-shadow:0 2px 8px #0009;transform:translate(-50%,-50%);"></div>`;

  return L.divIcon({
    html,
    className: "!bg-transparent !border-0 custom-campus-marker",
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

// Map Controller for Center / Zoom / Cursor Tracker
function MapController({
  center,
  zoom,
  onMouseMove
}: {
  center: [number, number];
  zoom: number;
  onMouseMove: (coords: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);

  useMapEvents({
    mousemove(e) {
      onMouseMove({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });

  return null;
}

export default function SatelliteMapLeaflet({
  sector,
  onSelectBuilding,
  selectedBuilding,
  onOpenPlaceManager,
}: SatelliteMapLeafletProps) {
  const [mapType, setMapType] = useState<"satellite" | "streets">("satellite");
  const [customPlaces, setCustomPlaces] = useState<CustomCampus[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("campusiq_custom_places");
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Replace legacy engineering-campus pins with the verified SRM KTR landmark set.
          const migrated = parsed.filter((place): place is CustomCampus =>
            typeof place === "object" && place !== null && "id" in place && typeof place.id === "string" &&
            place.id !== "engineering_college"
          );
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate map markers from browser storage after client mount.
          setCustomPlaces(migrated);
        }
      } catch {}
    }
  }, [sector]);

  const customMatch = customPlaces.find((c) => c.id === sector);
  const activeSectorConfig = customMatch
    ? {
        center: customMatch.center,
        zoom: customMatch.zoom || 17,
        campus_title: customMatch.name,
        buildings: customMatch.buildings || [],
      }
    : SECTOR_COORDINATES[sector] || SECTOR_COORDINATES.engineering_college;

  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number }>({
    lat: activeSectorConfig.center[0],
    lng: activeSectorConfig.center[1]
  });
  const [mapKey, setMapKey] = useState(0);

  const buildings: BuildingLocation[] = activeSectorConfig.buildings || [];

  const tileLayers = {
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    },
    streets: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors"
    }
  };

  const normalCount = buildings.filter((b: BuildingLocation) => b.live_status === "Normal").length;
  const warningCount = buildings.filter((b: BuildingLocation) => b.live_status === "Warning").length;
  const criticalCount = buildings.filter((b: BuildingLocation) => b.live_status === "Critical").length;

  return (
    <div data-lenis-prevent="true" className="relative w-full h-[460px] sm:h-[620px] rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-lg bg-slate-950 select-none">
      {/* Live Map Leaflet Container */}
      <MapContainer
        key={mapKey}
        center={activeSectorConfig.center}
        zoom={activeSectorConfig.zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        zoomControl={false}
      >
        <MapController
          center={activeSectorConfig.center}
          zoom={activeSectorConfig.zoom}
          onMouseMove={setCursorCoords}
        />

        {/* Satellite or Street Tile Layer */}
        <TileLayer
          url={tileLayers[mapType].url}
          attribution={tileLayers[mapType].attribution}
          maxZoom={19}
        />

        {/* Optional overlay labels for satellite imagery */}
        {mapType === "satellite" && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            attribution=""
            maxZoom={19}
            opacity={0.85}
          />
        )}

        {/* Render GPS Building Markers */}
        {buildings.map((b: BuildingLocation) => (
          <Marker
            key={b.id}
            position={[b.lat, b.lng]}
            icon={createCustomPin(b)}
            eventHandlers={{
              click: () => onSelectBuilding(b)
            }}
          >
            {selectedBuilding?.id === b.id && <Tooltip direction="top" offset={[0, -8]} permanent>{b.name} · Approximate pin</Tooltip>}
          </Marker>
        ))}
      </MapContainer>

      {/* Top-Left GPS Coordinates & Campus Identification Badge */}
      <div className="absolute top-2.5 left-2.5 sm:top-5 sm:left-5 z-20 flex flex-col gap-1.5 sm:gap-2.5 max-w-[46%] sm:max-w-md pointer-events-none">
        {/* Campus Header Pill */}
        <div className="bg-slate-950/90 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 sm:px-4.5 sm:py-3 text-white border border-white/15 shadow-xl flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Building className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs font-black tracking-tight text-white truncate">
                {activeSectorConfig.campus_title}
              </div>
              <div className="text-[9px] sm:text-[11px] text-slate-400 font-semibold flex items-center gap-1 truncate">
                <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-orange-400 shrink-0" />
                <span className="truncate">Kattankulathur, Tamil Nadu</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMapKey((k) => k + 1)}
            title="Recenter Map View"
            className="p-1 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer shrink-0"
          >
            <LocateFixed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400" />
          </button>
        </div>

        {/* Live GPS Telemetry HUD (Desktop & Tablet) */}
        <div className="hidden sm:flex bg-slate-950/80 backdrop-blur-md rounded-full px-3.5 py-1.5 text-white border border-white/10 shadow-lg items-center gap-2.5 text-[10px] sm:text-[11px] font-mono pointer-events-auto w-fit">
          <div className="flex items-center gap-1 text-orange-400 font-black">
            <Crosshair className="w-3 h-3 animate-spin" style={{ animationDuration: "8s" }} />
            <span>GIS HUD</span>
          </div>
          <div className="text-slate-300">
            LAT: <span className="text-white font-black">{cursorCoords.lat.toFixed(5)}°N</span>
          </div>
          <div className="text-slate-300">
            LNG: <span className="text-white font-black">{cursorCoords.lng.toFixed(5)}°E</span>
          </div>
        </div>
      </div>

      {/* Top-Right Map Controls & Legend Box */}
      <div className="absolute top-2.5 right-2.5 sm:top-5 sm:right-5 flex flex-col gap-1.5 sm:gap-3 z-20 items-end">
        {/* Layer Switcher & Manage Places (Stacked vertically on mobile, side-by-side on desktop) */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2">
          {/* Layer Toggle Pill */}
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full p-1 sm:p-1.5 shadow-xl border border-slate-200/90 dark:border-slate-700/80 flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={() => setMapType("satellite")}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-black transition cursor-pointer ${
                mapType === "satellite"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Layers className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>Satellite</span>
            </button>
            <button
              onClick={() => setMapType("streets")}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-black transition cursor-pointer ${
                mapType === "streets"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Navigation className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Street View</span>
              <span className="sm:hidden">Street</span>
            </button>
          </div>

          {/* Manage Places Button */}
          {onOpenPlaceManager && (
            <button
              onClick={onOpenPlaceManager}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-black bg-slate-900/90 dark:bg-slate-800/95 text-white border border-slate-700/80 shadow-xl hover:bg-orange-500 transition cursor-pointer backdrop-blur-md shrink-0"
              title="Add or configure custom campuses, sectors, and building nodes"
            >
              <Building className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400 shrink-0" />
              <span className="hidden sm:inline">+ Manage Places & Nodes</span>
              <span className="sm:hidden">+ Places</span>
            </button>
          )}
        </div>

        {/* Mobile Mini Legend Strip (< sm screens) */}
        <div className="sm:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full px-2.5 py-1 shadow-lg border border-slate-200/90 dark:border-slate-700/80 flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {normalCount}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {warningCount}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {criticalCount}
          </span>
        </div>

        {/* Desktop / Tablet Rich Legend Box (>= sm screens) */}
        <div className="hidden sm:block bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-200/90 dark:border-slate-700/80 min-w-[170px] sm:min-w-[190px]">
          <h4 className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white mb-2.5 sm:mb-3 uppercase tracking-wider">Facility Nodes</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" /> Normal
              </span>
              <span className="font-black text-slate-900 dark:text-white">{normalCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" /> Warning
              </span>
              <span className="font-black text-slate-900 dark:text-white">{warningCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" /> Critical
              </span>
              <span className="font-black text-slate-900 dark:text-white">{criticalCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Building Telemetry Popover Modal */}
      {selectedBuilding && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-6 z-30 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 relative text-slate-800 dark:text-slate-100">
            <button
              onClick={() => onSelectBuilding(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="w-13 h-13 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0 border border-orange-200/60 dark:border-orange-800/60">
                <Building className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight">{selectedBuilding.name}</h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  GPS: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{selectedBuilding.lat.toFixed(5)}°N, {selectedBuilding.lng.toFixed(5)}°E</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs mb-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold mb-1.5">
                  <Zap className="w-4 h-4 fill-amber-500 text-amber-500" /> Energy Load
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{selectedBuilding.kwh.toLocaleString()} kWh</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold mb-1.5">
                  <Droplets className="w-4 h-4 fill-sky-500 text-sky-500" /> Water Flow
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{selectedBuilding.water_kl || 24.5} kL</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold mb-1.5">
                  <Wind className="w-4 h-4 text-indigo-500 stroke-[2.5]" /> Air Quality
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{selectedBuilding.aqi || 42} AQI (Good)</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 stroke-[2.5]" /> Active Sensors
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{selectedBuilding.sensors_count} Sensors</span>
              </div>
            </div>

            <button
              onClick={() => onSelectBuilding(null)}
              className="w-full py-3.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition shadow-md shadow-orange-500/30 cursor-pointer"
            >
              Close Building Telemetry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
