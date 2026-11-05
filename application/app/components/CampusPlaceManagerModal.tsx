"use client";

import React, { useState, useEffect } from "react";
import { Building, Plus, Trash2, MapPin, Save, X, Factory, Hospital, GraduationCap, Landmark, CheckCircle2, RotateCcw, Compass, Layers, Sparkles, Search, Shield, ShieldAlert, ShieldCheck, Edit3, Lock, ArrowRight, Filter } from "lucide-react";
import { useAuth, DEMO_PERSONAS } from "../context/AuthContext";
import type { FacilitySector } from "../lib/dataTypes";

interface BuildingPreset { name: string; kwh: number; water: number; occupancy: number; sensors: number; status: CustomBuilding["live_status"]; label: string }

export interface CustomBuilding {
  id: string;
  name: string;
  lat: number;
  lng: number;
  live_status: "Normal" | "Warning" | "Critical";
  status_label: string;
  kwh: number;
  water_kl: number;
  occupancy: number;
  sensors_count: number;
  aqi?: number;
}

export interface CustomCampus {
  id: string;
  name: string;
  sector: "engineering_college" | "industrial_estate" | "hospital" | "municipal_campus";
  city: string;
  center: [number, number];
  zoom: number;
  buildings: CustomBuilding[];
}

export const DEFAULT_CAMPUSES: CustomCampus[] = [
  {
    id: "engineering_college",
    name: "SRM Institute of Science and Technology, Kattankulathur",
    sector: "engineering_college",
    city: "SRM Nagar, Kattankulathur, Chengalpattu, Tamil Nadu",
    center: [12.82415, 80.04405],
    zoom: 16,
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
  },
  {
    id: "industrial_estate",
    name: "Vedanta Aluminum & Captive Power Plant Complex",
    sector: "industrial_estate",
    city: "Jharsuguda, Odisha",
    center: [21.8250, 84.0350],
    zoom: 16,
    buildings: [
      { id: "smelter_1", name: "Potline Smelter Unit #1", lat: 21.8262, lng: 84.0365, live_status: "Warning", status_label: "High Peak Load 28 MW", kwh: 68000, water_kl: 85.0, occupancy: 320, sensors_count: 42, aqi: 58 },
      { id: "smelter_2", name: "Potline Smelter Unit #2", lat: 21.8245, lng: 84.0358, live_status: "Normal", status_label: "0.98 Power Factor", kwh: 62000, water_kl: 80.0, occupancy: 300, sensors_count: 38, aqi: 55 },
      { id: "cpp_turbines", name: "Captive Power Plant (Turbines 1-4)", lat: 21.8275, lng: 84.0340, live_status: "Normal", status_label: "12.4 Bar Steam", kwh: 125000, water_kl: 340.0, occupancy: 150, sensors_count: 56, aqi: 62 },
      { id: "etp_plant", name: "Effluent Treatment Plant (ETP)", lat: 21.8235, lng: 84.0375, live_status: "Normal", status_label: "BOD 18ppm • pH 7.2", kwh: 12400, water_kl: 650.0, occupancy: 45, sensors_count: 24, aqi: 48 },
      { id: "raw_material", name: "Bauxite Silo & Conveyor Feed", lat: 21.8282, lng: 84.0380, live_status: "Normal", status_label: "Vibration 1.8 mm/s", kwh: 18500, water_kl: 22.0, occupancy: 80, sensors_count: 18, aqi: 64 },
    ]
  },
  {
    id: "hospital",
    name: "AIIMS Bhubaneswar Healthcare & Trauma Super-Speciality",
    sector: "hospital",
    city: "Bhubaneswar, Odisha",
    center: [20.2312, 85.7760],
    zoom: 17,
    buildings: [
      { id: "trauma_icu", name: "Super-Speciality Trauma & ICU Wing", lat: 20.2318, lng: 85.7768, live_status: "Normal", status_label: "100% Online UPS • O₂ 4.2 bar", kwh: 18400, water_kl: 95.0, occupancy: 650, sensors_count: 36, aqi: 32 },
      { id: "ot_complex", name: "Operation Theatre Complex (OT 1-12)", lat: 20.2325, lng: 85.7758, live_status: "Normal", status_label: "ISO Class 5 • +25 Pa", kwh: 22100, water_kl: 68.0, occupancy: 400, sensors_count: 44, aqi: 28 },
      { id: "lmo_plant", name: "Liquid Medical Oxygen (LMO) Cryo Station", lat: 20.2305, lng: 85.7775, live_status: "Normal", status_label: "Tank Level 84%", kwh: 4800, water_kl: 12.0, occupancy: 20, sensors_count: 16, aqi: 30 },
      { id: "bmw_unit", name: "Bio-Medical Waste Autoclave Yard", lat: 20.2298, lng: 85.7762, live_status: "Normal", status_label: "BMW 2016 Compliant", kwh: 6400, water_kl: 45.0, occupancy: 35, sensors_count: 12, aqi: 38 },
      { id: "ipd_block", name: "In-Patient Department (IPD 750 Beds)", lat: 20.2312, lng: 85.7748, live_status: "Warning", status_label: "HVAC Filter 88%", kwh: 26500, water_kl: 180.0, occupancy: 950, sensors_count: 30, aqi: 34 }
    ]
  },
  {
    id: "municipal_campus",
    name: "Bhubaneswar Smart City Central Command Center",
    sector: "municipal_campus",
    city: "Bhubaneswar, Odisha",
    center: [20.2961, 85.8245],
    zoom: 16,
    buildings: [
      { id: "iccc_hq", name: "Integrated Command & Control Center (ICCC)", lat: 20.2968, lng: 85.8252, live_status: "Normal", status_label: "Smart Grid Active", kwh: 8400, water_kl: 22.0, occupancy: 450, sensors_count: 28, aqi: 45 },
      { id: "pumping_stn", name: "Kuakhai Water Works & Pumping Station", lat: 20.2982, lng: 85.8270, live_status: "Normal", status_label: "450 MLD Flow", kwh: 34000, water_kl: 1200.0, occupancy: 60, sensors_count: 32, aqi: 42 },
      { id: "msw_transfer", name: "Solid Waste Material Recovery Facility (MRF)", lat: 20.2945, lng: 85.8230, live_status: "Warning", status_label: "Bin Overflow 92%", kwh: 12500, water_kl: 38.0, occupancy: 120, sensors_count: 18, aqi: 52 }
    ]
  }
];

interface CampusPlaceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCampus: (campusId: string) => void;
  activeCampusId: string;
}

export default function CampusPlaceManagerModal({
  isOpen,
  onClose,
  onSelectCampus,
  activeCampusId,
}: CampusPlaceManagerModalProps) {
  const { user, quickDemoLogin } = useAuth();

  const [campuses, setCampuses] = useState<CustomCampus[]>(DEFAULT_CAMPUSES);
  const [selectedCampusId, setSelectedCampusId] = useState<string>(activeCampusId);
  const [activeTab, setActiveTab] = useState<"campuses" | "buildings" | "new_campus" | "new_building" | "edit_campus">("campuses");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllSectorsFilter, setShowAllSectorsFilter] = useState(false);

  // Editing state for building
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);

  // Form State: New Campus / Edit Campus
  const [newCampusName, setNewCampusName] = useState("");
  const [newCampusSector, setNewCampusSector] = useState<CustomCampus["sector"]>("engineering_college");
  const [newCampusCity, setNewCampusCity] = useState("");
  const [newCampusLat, setNewCampusLat] = useState<number>(12.82415);
  const [newCampusLng, setNewCampusLng] = useState<number>(80.04405);
  const [newCampusZoom, setNewCampusZoom] = useState<number>(17);

  // Form State: New Building / Edit Building
  const [newBldgName, setNewBldgName] = useState("");
  const [newBldgLat, setNewBldgLat] = useState<number>(12.82415);
  const [newBldgLng, setNewBldgLng] = useState<number>(80.04420);
  const [newBldgKwh, setNewBldgKwh] = useState<number>(4500);
  const [newBldgWater, setNewBldgWater] = useState<number>(30);
  const [newBldgOccupancy, setNewBldgOccupancy] = useState<number>(250);
  const [newBldgSensors, setNewBldgSensors] = useState<number>(8);
  const [newBldgStatus, setNewBldgStatus] = useState<CustomBuilding["live_status"]>("Normal");
  const [newBldgStatusLabel, setNewBldgStatusLabel] = useState("Normal Operations");

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("campusiq_custom_places");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const migrated = parsed.map((campus) => campus?.id === "engineering_college" ? DEFAULT_CAMPUSES[0] : campus);
          if (!migrated.some((campus) => campus?.id === "engineering_college")) migrated.unshift(DEFAULT_CAMPUSES[0]);
          if (JSON.stringify(migrated) !== JSON.stringify(parsed)) localStorage.setItem("campusiq_custom_places", JSON.stringify(migrated));
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrate browser-persisted campuses after client mount to avoid SSR storage access.
          setCampuses(migrated);
        }
      } catch (e) {
        console.error("Error loading stored places:", e);
      }
    }
  }, []);

  // Update selected campus when activeCampusId changes
  useEffect(() => {
    if (activeCampusId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Keep the modal selection aligned with the map marker that opened it.
      setSelectedCampusId(activeCampusId);
    }
  }, [activeCampusId]);

  // Set default sector based on user role when tab changes to new_campus
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Apply the authenticated role's default when the new-campus form opens.
      if (user.role === "maintenance_tech") setNewCampusSector("industrial_estate");
      else if (user.role === "safety_officer") setNewCampusSector("hospital");
      else if (user.role === "operator") setNewCampusSector("municipal_campus");
      else setNewCampusSector("engineering_college");
    }
  }, [user, activeTab]);

  // Save to LocalStorage and broadcast
  const saveCampuses = (updated: CustomCampus[]) => {
    setCampuses(updated);
    localStorage.setItem("campusiq_custom_places", JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const currentCampus = campuses.find((c) => c.id === selectedCampusId) || campuses[0];

  const isSuper = user?.isSuperAdmin || user?.sector === "all" || user?.role === "super_admin" || user?.role === "director" || user?.permissions?.includes("*");

  // Role-Based Authorization Check
  // Super Admin has universal access
  // Sector-specific roles manage only their own sector (e.g. hospital for healthcare roles)
  const checkRoleAuthorization = (sector: string) => {
    if (!user) return false;
    if (isSuper) return true;
    return user.sector === sector || user.defaultSector === sector;
  };

  const isCurrentSectorAuthorized = checkRoleAuthorization(currentCampus.sector);

  // Generate role-specific sector classification options
  const getRoleBasedSectorOptions = () => {
    if (!user) return [];

    if (isSuper) {
      // Super Admin has universal access to all sectors
      return [
        { value: "engineering_college", label: "🎓 Engineering College & Technical University" },
        { value: "industrial_estate", label: "🏭 Heavy Industry, Smelter & Power Plant" },
        { value: "hospital", label: "🏥 Super-Speciality Hospital & Healthcare Center" },
        { value: "municipal_campus", label: "🏛️ Municipal Smart City Command Center (ICCC)" },
      ];
    }

    if (user.sector === "industrial_estate") {
      // Industry / Plant Lead only sees Industry related options
      return [
        { value: "industrial_estate", label: "🏭 Heavy Industry & Smelter Complex" },
        { value: "industrial_estate", label: "⚙️ Manufacturing & Assembly Plant" },
        { value: "industrial_estate", label: "⚡ Captive Power Plant (Thermal / Gas)" },
        { value: "industrial_estate", label: "🛢️ Petrochemical & Chemical Refinery" },
        { value: "industrial_estate", label: "⛏️ Mining & Mineral Processing Unit" },
      ];
    }

    if (user.sector === "hospital") {
      // Hospital / Clinical Lead only sees Hospital options
      return [
        { value: "hospital", label: "🏥 Super-Speciality Hospital & Healthcare Complex" },
        { value: "hospital", label: "🚑 Emergency & Multi-Speciality Trauma Care" },
        { value: "hospital", label: "🧬 Clinical Diagnostics & Medical Research Wing" },
        { value: "hospital", label: "🩺 Community Health & Outpatient Center" },
      ];
    }

    if (user.sector === "municipal_campus") {
      // Municipal / Smart City Operator only sees Municipal options
      return [
        { value: "municipal_campus", label: "🏛️ Municipal Smart City Command Center (ICCC)" },
        { value: "municipal_campus", label: "💧 Public Water Works & Pumping Station" },
        { value: "municipal_campus", label: "♻️ Solid Waste Recovery & Composting MRF" },
        { value: "municipal_campus", label: "🚌 Transit Terminal & EV Charging Hub" },
      ];
    }

    // College / BMS Engineer only sees College related options
    return [
      { value: "engineering_college", label: "🎓 Engineering College / University Campus" },
      { value: "engineering_college", label: "📐 Polytechnic & Technical Training Institute" },
      { value: "engineering_college", label: "🔬 Science & Research Innovation Park" },
      { value: "engineering_college", label: "🏫 Residential Academic & Hostel Campus" },
    ];
  };

  const roleBasedOptions = getRoleBasedSectorOptions();

  // Presets for Quick Pinning Structures based on Sector
  const getSectorBuildingPresets = (): BuildingPreset[] => {
    if (currentCampus.sector === "industrial_estate") {
      return [
        { name: "Potline Smelter Unit #3", kwh: 64000, water: 82, occupancy: 310, sensors: 40, status: "Normal", label: "0.98 Power Factor" },
        { name: "Captive Turbine Bay (Turbine #5)", kwh: 110000, water: 290, occupancy: 120, sensors: 48, status: "Normal", label: "12.2 Bar Steam" },
        { name: "Effluent Treatment Plant (ETP Unit B)", kwh: 14200, water: 720, occupancy: 40, sensors: 26, status: "Normal", label: "BOD 16ppm • pH 7.4" },
        { name: "High-Voltage 220kV Switchyard", kwh: 8500, water: 10, occupancy: 25, sensors: 32, status: "Normal", label: "Grid Synchronized" },
        { name: "Bauxite Silo & Conveyor Bay #3", kwh: 19400, water: 25, occupancy: 70, sensors: 20, status: "Normal", label: "Vibration 1.6 mm/s" },
      ];
    }
    if (currentCampus.sector === "hospital") {
      return [
        { name: "Emergency Trauma & ICU Resuscitation", kwh: 19200, water: 90, occupancy: 580, sensors: 38, status: "Normal", label: "100% Online UPS • O₂ 4.3 bar" },
        { name: "Operation Theatre Suite (OT 13-18)", kwh: 24500, water: 70, occupancy: 350, sensors: 42, status: "Normal", label: "ISO Class 5 • +28 Pa" },
        { name: "Liquid Medical Oxygen (LMO) Cryo Bay #2", kwh: 5200, water: 15, occupancy: 25, sensors: 18, status: "Normal", label: "Tank Level 90%" },
        { name: "Bio-Medical Waste (BMW) Autoclave Unit", kwh: 7100, water: 50, occupancy: 30, sensors: 14, status: "Normal", label: "BMW 2016 Compliant" },
        { name: "In-Patient Department (IPD Wing C)", kwh: 28000, water: 195, occupancy: 820, sensors: 34, status: "Normal", label: "HEPA Filter 98%" },
      ];
    }
    if (currentCampus.sector === "municipal_campus") {
      return [
        { name: "Integrated Command & Control Center (ICCC)", kwh: 8900, water: 24, occupancy: 420, sensors: 30, status: "Normal", label: "Smart Grid Active" },
        { name: "Kuakhai Water Treatment & Pumping Works", kwh: 36000, water: 1350, occupancy: 65, sensors: 36, status: "Normal", label: "480 MLD Flow" },
        { name: "Solid Waste Recovery Facility (MRF North)", kwh: 13200, water: 42, occupancy: 110, sensors: 22, status: "Normal", label: "Daily Baling 95 Tons" },
        { name: "Electric Bus Terminal & DC Fast Chargers", kwh: 22000, water: 30, occupancy: 90, sensors: 28, status: "Normal", label: "18 Chargers Active" },
      ];
    }
    // Default: College
    return [
      { name: "University Administrative Building", kwh: 4320, water: 45, occupancy: 400, sensors: 10, status: "Normal", label: "Illustrative demo status" },
      { name: "Tech Park", kwh: 8240, water: 28, occupancy: 850, sensors: 18, status: "Normal", label: "Illustrative demo status" },
      { name: "Hi-Tech Block", kwh: 6120, water: 19, occupancy: 420, sensors: 14, status: "Normal", label: "Illustrative demo status" },
      { name: "Class Room Complex (CRC Block)", kwh: 2860, water: 18, occupancy: 300, sensors: 8, status: "Normal", label: "Illustrative demo status" },
      { name: "Dr. T. P. Ganesan Auditorium", kwh: 680, water: 8, occupancy: 120, sensors: 4, status: "Normal", label: "Illustrative demo status" },
    ];
  };

  const applyBuildingPreset = (preset: BuildingPreset) => {
    setNewBldgName(preset.name);
    setNewBldgKwh(preset.kwh);
    setNewBldgWater(preset.water);
    setNewBldgOccupancy(preset.occupancy);
    setNewBldgSensors(preset.sensors);
    setNewBldgStatus(preset.status);
    setNewBldgStatusLabel(preset.label);
    // Keep presets visually separated with a stable name-based offset.
    const seed = [...preset.name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const latOffset = ((seed % 101) - 50) / 50000;
    const lngOffset = (((seed * 37) % 101) - 50) / 50000;
    setNewBldgLat(parseFloat((currentCampus.center[0] + latOffset).toFixed(6)));
    setNewBldgLng(parseFloat((currentCampus.center[1] + lngOffset).toFixed(6)));
  };

  // Find recommended persona to switch to for managing this sector
  const getAuthorizedPersonaForSector = (sector: string) => {
    switch (sector) {
      case "engineering_college":
        return DEMO_PERSONAS.find((p) => p.id === "energy_engineer") || DEMO_PERSONAS[0];
      case "industrial_estate":
        return DEMO_PERSONAS.find((p) => p.id === "maintenance_tech") || DEMO_PERSONAS[0];
      case "hospital":
        return DEMO_PERSONAS.find((p) => p.id === "safety_officer") || DEMO_PERSONAS[0];
      case "municipal_campus":
        return DEMO_PERSONAS.find((p) => p.id === "operator") || DEMO_PERSONAS[0];
      default:
        return DEMO_PERSONAS.find((p) => p.id === "director") || DEMO_PERSONAS[0];
    }
  };

  const targetPersona = getAuthorizedPersonaForSector(currentCampus.sector);

  // Sector-tailored placeholders for new facility and building pins
  const getCampusNamePlaceholder = () => {
    if (newCampusSector === "industrial_estate") return "e.g. Tata Steel Industrial Complex / Vedanta Smelter 2";
    if (newCampusSector === "hospital") return "e.g. SCB Multi-Speciality Medical Hospital";
    if (newCampusSector === "municipal_campus") return "e.g. Cuttack Municipal Smart Command Center";
    return "e.g. VSSUT Burla Engineering Campus";
  };

  const getBuildingNamePlaceholder = () => {
    if (currentCampus.sector === "industrial_estate") return "e.g. Potline Smelter Unit #3 / Captive Turbine Bay #2";
    if (currentCampus.sector === "hospital") return "e.g. Emergency Trauma Resuscitation Wing / OT Suite 13";
    if (currentCampus.sector === "municipal_campus") return "e.g. Water Works Booster Pump #5 / STP Clarifier";
    return "e.g. Department of Computer Science & Engineering";
  };

  const handleAddCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampusName.trim()) return;

    const newId = `custom_campus_${Date.now()}`;
    const newCampus: CustomCampus = {
      id: newId,
      name: newCampusName.trim(),
      sector: newCampusSector,
      city: newCampusCity.trim() || "Odisha, India",
      center: [Number(newCampusLat), Number(newCampusLng)],
      zoom: Number(newCampusZoom) || 17,
      buildings: [
        {
          id: `${newId}_main`,
          name: `${newCampusName.trim()} Main Facility Node`,
          lat: Number(newCampusLat),
          lng: Number(newCampusLng),
          live_status: "Normal",
          status_label: "Operational",
          kwh: 5200,
          water_kl: 35,
          occupancy: 200,
          sensors_count: 12,
          aqi: 40,
        },
      ],
    };

    const updated = [...campuses, newCampus];
    saveCampuses(updated);
    setSelectedCampusId(newId);
    onSelectCampus(newId);
    setNewCampusName("");
    setNewCampusCity("");
    setActiveTab("buildings");
  };

  const handleUpdateCampusDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = campuses.map((c) => {
      if (c.id === selectedCampusId) {
        return {
          ...c,
          name: newCampusName.trim() || c.name,
          city: newCampusCity.trim() || c.city,
          sector: newCampusSector,
          center: [Number(newCampusLat), Number(newCampusLng)] as [number, number],
          zoom: Number(newCampusZoom) || c.zoom,
        };
      }
      return c;
    });

    saveCampuses(updated);
    setActiveTab("campuses");
  };

  const startEditCampus = (campus: CustomCampus) => {
    setSelectedCampusId(campus.id);
    setNewCampusName(campus.name);
    setNewCampusSector(campus.sector);
    setNewCampusCity(campus.city);
    setNewCampusLat(campus.center[0]);
    setNewCampusLng(campus.center[1]);
    setNewCampusZoom(campus.zoom || 17);
    setActiveTab("edit_campus");
  };

  const handleSaveBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBldgName.trim()) return;

    if (editingBuildingId) {
      // Update existing building
      const updated = campuses.map((c) => {
        if (c.id === selectedCampusId) {
          return {
            ...c,
            buildings: c.buildings.map((b) => {
              if (b.id === editingBuildingId) {
                return {
                  ...b,
                  name: newBldgName.trim(),
                  lat: Number(newBldgLat),
                  lng: Number(newBldgLng),
                  live_status: newBldgStatus,
                  status_label: newBldgStatusLabel || "Normal Operations",
                  kwh: Number(newBldgKwh) || 3000,
                  water_kl: Number(newBldgWater) || 25,
                  occupancy: Number(newBldgOccupancy) || 150,
                  sensors_count: Number(newBldgSensors) || 8,
                };
              }
              return b;
            }),
          };
        }
        return c;
      });

      saveCampuses(updated);
      setEditingBuildingId(null);
      setNewBldgName("");
      setActiveTab("buildings");
    } else {
      // Add new building
      const newBuilding: CustomBuilding = {
        id: `bldg_${Date.now()}`,
        name: newBldgName.trim(),
        lat: Number(newBldgLat),
        lng: Number(newBldgLng),
        live_status: newBldgStatus,
        status_label: newBldgStatusLabel || "Normal Operations",
        kwh: Number(newBldgKwh) || 3000,
        water_kl: Number(newBldgWater) || 25,
        occupancy: Number(newBldgOccupancy) || 150,
        sensors_count: Number(newBldgSensors) || 8,
        aqi: 38,
      };

      const updated = campuses.map((c) => {
        if (c.id === selectedCampusId) {
          return {
            ...c,
            buildings: [...c.buildings, newBuilding],
          };
        }
        return c;
      });

      saveCampuses(updated);
      setNewBldgName("");
      setActiveTab("buildings");
    }
  };

  const startEditBuilding = (b: CustomBuilding) => {
    setEditingBuildingId(b.id);
    setNewBldgName(b.name);
    setNewBldgLat(b.lat);
    setNewBldgLng(b.lng);
    setNewBldgKwh(b.kwh);
    setNewBldgWater(b.water_kl);
    setNewBldgOccupancy(b.occupancy);
    setNewBldgSensors(b.sensors_count || 8);
    setNewBldgStatus(b.live_status);
    setNewBldgStatusLabel(b.status_label);
    setActiveTab("new_building");
  };

  const handleDeleteBuilding = (bldgId: string) => {
    if (!isCurrentSectorAuthorized) return;
    const updated = campuses.map((c) => {
      if (c.id === selectedCampusId) {
        return {
          ...c,
          buildings: c.buildings.filter((b) => b.id !== bldgId),
        };
      }
      return c;
    });
    saveCampuses(updated);
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all campuses & places to factory defaults?")) {
      saveCampuses(DEFAULT_CAMPUSES);
      setSelectedCampusId(DEFAULT_CAMPUSES[0].id);
      onSelectCampus(DEFAULT_CAMPUSES[0].id);
    }
  };

  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case "engineering_college":
        return <GraduationCap className="w-5 h-5 text-orange-500" />;
      case "industrial_estate":
        return <Factory className="w-5 h-5 text-amber-500" />;
      case "hospital":
        return <Hospital className="w-5 h-5 text-sky-500" />;
      case "municipal_campus":
        return <Landmark className="w-5 h-5 text-emerald-500" />;
      default:
        return <Building className="w-5 h-5 text-orange-500" />;
    }
  };

  // Filter campuses based on search and role
  const filteredCampuses = campuses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase());

    if (user?.role === "director" || showAllSectorsFilter) {
      return matchesSearch;
    }

    // Role-scoped filter: only show matching sector unless user toggled "Show All"
    const isMatchingSector = checkRoleAuthorization(c.sector);
    return matchesSearch && isMatchingSector;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        data-lenis-prevent="true"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
      >
        {/* Header Bar */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Campus, Places &amp; Multi-Sector Entry Manager
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800/80">
                  {user?.role === "director" ? "👑 Super Admin Access" : "Role-Scoped GIS"}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                Role-gated structure coordinate pinning and sector classification management.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              title="Reset to factory default sectors"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role-Based Authorization Banner */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0 text-xs">
          <div className="flex items-center gap-2.5">
            {isCurrentSectorAuthorized ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  Authorized Editor: {user?.name} ({user?.roleTitle}) &bull;{" "}
                  {user?.role === "director" ? "All Sector Options Unlocked" : "Sector-Tailored Options Active"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>
                  Read-Only Mode: Logged in as <strong>{user?.roleTitle}</strong>. Switch to authorized sector lead account to add or edit structures.
                </span>
              </div>
            )}
          </div>

          {!isCurrentSectorAuthorized && targetPersona && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => quickDemoLogin(targetPersona.id)}
                className="px-3 py-1 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] shadow-xs cursor-pointer transition flex items-center gap-1.5"
              >
                <span>Switch to {targetPersona.title.split(" ")[0]} ({targetPersona.name})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => quickDemoLogin("director")}
                className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-[11px] cursor-pointer transition flex items-center gap-1"
              >
                <Shield className="w-3 h-3 text-orange-400" />
                <span>Super Admin</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Tabs Bar */}
        <div className="px-6 py-3 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("campuses")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === "campuses"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Campuses &amp; Sectors ({filteredCampuses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("buildings")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === "buildings"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{currentCampus.name.split(" ")[0]} Buildings ({currentCampus.buildings.length})</span>
            </button>

            <button
              onClick={() => {
                setEditingBuildingId(null);
                setNewBldgName("");
                setNewBldgLat(currentCampus.center[0]);
                setNewBldgLng(currentCampus.center[1]);
                setActiveTab("new_building");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === "new_building"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Pin New Structure</span>
            </button>

            <button
              onClick={() => {
                setNewCampusName("");
                setNewCampusCity("");
                setNewCampusLat(currentCampus.center[0]);
                setNewCampusLng(currentCampus.center[1]);
                setActiveTab("new_campus");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 shrink-0 ${
                activeTab === "new_campus"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Place / Sector</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {user?.role !== "director" && (
              <button
                onClick={() => setShowAllSectorsFilter((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                  showAllSectorsFilter
                    ? "bg-slate-900 text-white border-slate-700"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>{showAllSectorsFilter ? "All Sectors" : "My Sector Only"}</span>
              </button>
            )}

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search campuses / cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain p-6">
          {/* 1. Campuses List Tab */}
          {activeTab === "campuses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Configured Campuses &amp; Enterprise Facilities
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Select a campus to switch telemetry, or edit its center GPS coordinates.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("new_campus")}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-orange-500 text-white hover:bg-orange-600 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Place</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCampuses.map((c) => {
                  const isActive = c.id === selectedCampusId;
                  const canEdit = checkRoleAuthorization(c.sector);

                  return (
                    <div
                      key={c.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isActive
                          ? "border-orange-500 bg-orange-500/5 dark:bg-orange-950/20 ring-2 ring-orange-500/30 shadow-md"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div
                            onClick={() => {
                              setSelectedCampusId(c.id);
                              onSelectCampus(c.id);
                            }}
                            className="flex items-start gap-3 cursor-pointer flex-1"
                          >
                            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center shrink-0 border border-orange-200 dark:border-orange-800">
                              {getSectorIcon(c.sector)}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                                {c.name}
                              </h4>
                              <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                <span>{c.city}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isActive && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => startEditCampus(c)}
                                title="Edit Sector Details & Coordinates"
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-orange-500 hover:text-white transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span>Center GPS: {c.center[0].toFixed(4)}°N, {c.center[1].toFixed(4)}°E</span>
                        <button
                          onClick={() => {
                            setSelectedCampusId(c.id);
                            setActiveTab("buildings");
                          }}
                          className="text-orange-600 dark:text-orange-400 font-black hover:underline cursor-pointer"
                        >
                          {c.buildings.length} Pinned Structures &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Buildings under Current Campus Tab */}
          {activeTab === "buildings" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>{currentCampus.name}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {currentCampus.buildings.length} Structures Pinpointed
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Live pinpointed structures visible on the Satellite Leaflet Map HUD with coordinates &amp; telemetry.
                  </p>
                </div>

                {isCurrentSectorAuthorized && (
                  <button
                    onClick={() => {
                      setEditingBuildingId(null);
                      setNewBldgName("");
                      setNewBldgLat(currentCampus.center[0]);
                      setNewBldgLng(currentCampus.center[1]);
                      setActiveTab("new_building");
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-orange-500 text-white hover:bg-orange-600 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pin New Structure</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {currentCampus.buildings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-2">
                          {b.name}
                        </span>

                        {isCurrentSectorAuthorized && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEditBuilding(b)}
                              title="Edit GPS coordinates and telemetry"
                              className="p-1 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/50 transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBuilding(b.id)}
                              title="Delete pin"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            b.live_status === "Critical"
                              ? "bg-rose-500"
                              : b.live_status === "Warning"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
                          {b.status_label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-400 font-semibold space-y-1">
                      <div className="flex justify-between">
                        <span>GPS Coordinates:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">
                          {b.lat.toFixed(5)}°N, {b.lng.toFixed(5)}°E
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Baseline Load:</span>
                        <span className="text-orange-600 dark:text-orange-400 font-bold">
                          {b.kwh.toLocaleString()} kWh &bull; {b.water_kl} kL
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Occupancy / Sensors:</span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">
                          {b.occupancy} Pers &bull; {b.sensors_count || 8} Nodes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Add New Building Pin Form / Edit Building Pin Form */}
          {activeTab === "new_building" && (
            <form onSubmit={handleSaveBuilding} className="max-w-2xl mx-auto space-y-5">
              {!isCurrentSectorAuthorized ? (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-2">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Role Authorization Required</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    You do not have write permissions to pin or edit structures on <strong>{currentCampus.name}</strong>. Switch to the <strong>{targetPersona?.title}</strong> role to proceed.
                  </p>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin(targetPersona.id)}
                    className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-black text-xs shadow-xs cursor-pointer"
                  >
                    Switch to {targetPersona.title}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      {editingBuildingId ? `Edit Structure Coordinates & Telemetry` : `Pin New Structure to ${currentCampus.name}`}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      Adds an interactive structure marker onto the satellite map layer with telemetry.
                    </p>
                  </div>

                  {/* 1-Click Role/Sector Preset Templates */}
                  {!editingBuildingId && (
                    <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> 1-Click Sector Presets ({currentCampus.sector.replace('_', ' ')})
                        </span>
                        <span className="text-[10px] text-slate-400">Click to auto-fill</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {getSectorBuildingPresets().map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => applyBuildingPreset(preset)}
                            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-2xs"
                          >
                            + {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                        Structure / Department Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={getBuildingNamePlaceholder()}
                        value={newBldgName}
                        onChange={(e) => setNewBldgName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          GPS Latitude (°N) *
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={newBldgLat}
                          onChange={(e) => setNewBldgLat(parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          GPS Longitude (°E) *
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={newBldgLng}
                          onChange={(e) => setNewBldgLng(parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          Daily Energy (kWh)
                        </label>
                        <input
                          type="number"
                          value={newBldgKwh}
                          onChange={(e) => setNewBldgKwh(parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          Water (kL)
                        </label>
                        <input
                          type="number"
                          value={newBldgWater}
                          onChange={(e) => setNewBldgWater(parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          Occupancy / Capacity
                        </label>
                        <input
                          type="number"
                          value={newBldgOccupancy}
                          onChange={(e) => setNewBldgOccupancy(parseInt(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          Live Status Indicator
                        </label>
                        <select
                          value={newBldgStatus}
                          onChange={(e) => setNewBldgStatus(e.target.value as CustomBuilding["live_status"])}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        >
                          <option value="Normal">🟢 Normal (Nominal Telemetry)</option>
                          <option value="Warning">🟡 Warning (Attention / Waste Alert)</option>
                          <option value="Critical">🔴 Critical (Immediate Anomaly)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          Status Badge Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. High Energy Usage • 0.98 PF"
                          value={newBldgStatusLabel}
                          onChange={(e) => setNewBldgStatusLabel(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25 transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingBuildingId ? "Save Changes" : "Save & Pin Structure"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("buildings")}
                      className="px-5 py-3 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* 4. Add New Campus / Sector Form */}
          {activeTab === "new_campus" && (
            <form onSubmit={handleAddCampus} className="max-w-2xl mx-auto space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Register a New Institutional Campus or Industrial Sector
                  </h4>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {user?.role === "director" ? "Super Admin: All Sectors" : `Scoped to ${user?.roleTitle.split(" ")[0]}`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Add custom universities, heavy industrial smelters, multi-speciality hospital complexes, or smart cities.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                    Facility / Campus Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getCampusNamePlaceholder()}
                    value={newCampusName}
                    onChange={(e) => setNewCampusName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                      Sector Classification *
                    </label>
                    <select
                      value={newCampusSector}
                      onChange={(e) => setNewCampusSector(e.target.value as FacilitySector)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
                    >
                      {roleBasedOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                      City / District *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kattankulathur, Tamil Nadu"
                      value={newCampusCity}
                      onChange={(e) => setNewCampusCity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                      Center Latitude (°N) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newCampusLat}
                      onChange={(e) => setNewCampusLat(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                      Center Longitude (°E) *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newCampusLng}
                      onChange={(e) => setNewCampusLng(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25 transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Register &amp; Activate Place</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("campuses")}
                  className="px-5 py-3 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* 5. Edit Sector Details Form */}
          {activeTab === "edit_campus" && (
            <form onSubmit={handleUpdateCampusDetails} className="max-w-2xl mx-auto space-y-5">
              {!isCurrentSectorAuthorized ? (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-2">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Role Authorization Required</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    You do not have write permissions to alter sector details on <strong>{currentCampus.name}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin(targetPersona.id)}
                    className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-black text-xs shadow-xs cursor-pointer"
                  >
                    Switch to {targetPersona.title}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                      Edit Sector Details &amp; Center Coordinates
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      Update the facility name, sector classification, and focal center coordinates.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                        Facility / Campus Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCampusName}
                        onChange={(e) => setNewCampusName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          Sector Classification *
                        </label>
                        <select
                          value={newCampusSector}
                          onChange={(e) => setNewCampusSector(e.target.value as FacilitySector)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
                        >
                          {roleBasedOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          City / District *
                        </label>
                        <input
                          type="text"
                          required
                          value={newCampusCity}
                          onChange={(e) => setNewCampusCity(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          Center Latitude (°N) *
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={newCampusLat}
                          onChange={(e) => setNewCampusLat(parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                          Center Longitude (°E) *
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          required
                          value={newCampusLng}
                          onChange={(e) => setNewCampusLng(parseFloat(e.target.value))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/25 transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Sector Updates</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("campuses")}
                      className="px-5 py-3 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
