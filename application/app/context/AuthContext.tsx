"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type FacilitySector =
  | "engineering_college"
  | "industrial_estate"
  | "hospital"
  | "municipal_campus"
  | "all";

export type UserRole =
  | "super_admin"
  // College roles
  | "college_dean"
  | "college_energy_eng"
  | "college_estate_officer"
  | "college_student_lead"
  // Industry roles
  | "industry_gm"
  | "industry_scada_chief"
  | "industry_etp_officer"
  | "industry_reliability_eng"
  // Hospital roles
  | "hospital_superintendent"
  | "hospital_biomed_lead"
  | "hospital_infection_officer"
  | "hospital_utility_eng"
  // Smart City roles
  | "city_commissioner"
  | "city_water_chief"
  | "city_waste_sanitation_head"
  | "city_grid_traffic_controller"
  // Legacy aliases
  | "director"
  | "energy_engineer"
  | "maintenance_tech"
  | "safety_officer"
  | "operator";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  sector: FacilitySector;
  sectorBadge?: string;
  defaultSector?: string;
  avatar: string;
  permissions: string[];
  authorizations: string[];
  isSuperAdmin?: boolean;
}

export interface DemoPersona {
  id: UserRole;
  sector: FacilitySector;
  title: string;
  name: string;
  email: string;
  password: string;
  department: string;
  badge: string;
  sectorBadge: string;
  defaultSector: string;
  color: string;
  description: string;
  permissions: string[];
  authorizations: string[];
  isSuperAdmin?: boolean;
}

export const DEMO_PERSONAS: DemoPersona[] = [
  // 0. Universal Super Administrator
  {
    id: "super_admin",
    sector: "all",
    title: "Universal Cross-Sector Super Admin",
    name: "Dr. Rajeshwar Patnaik",
    email: "superadmin@campusiq.ai",
    password: "demo-password-123",
    department: "Autonomous Operations & Central Governance",
    badge: "Master Admin",
    sectorBadge: "All Sectors Master",
    defaultSector: "engineering_college",
    color: "from-amber-500 to-orange-600",
    description: "Full cross-sector root control across College, Industry, Hospital & Smart City with global ML training permissions.",
    permissions: ["*"],
    authorizations: [
      "Cross-Sector Root Governance",
      "Global Telemetry & ML Continuous Learning Model Training",
      "Budget & Financial Signoff",
      "Emergency Inter-Agency Override",
    ],
    isSuperAdmin: true,
  },

  // 1. College Campus & University Roles (engineering_college)
  {
    id: "college_dean",
    sector: "engineering_college",
    title: "Institutional Director & Dean",
    name: "Priyanshu Mishra (Demo)",
    email: "dean@campuspulse.local",
    password: "demo-password-123",
    department: "Campus Executive Governance & Senate",
    badge: "Campus Dean",
    sectorBadge: "College Campus",
    defaultSector: "engineering_college",
    color: "from-orange-500 to-amber-500",
    description: "Academic campus governance, energy & sustainability policy, budget approvals, and estate asset signoff.",
    permissions: ["view_all", "energy_control", "esg_export", "audit_signoff", "work_orders"],
    authorizations: [
      "Campus Estate & Energy Budget Signoff",
      "Academic Block Scheduling & BMS Baseline Policies",
      "ESG Sustainability Disclosure Approval",
      "Campus Emergency Lockdown",
    ],
    isSuperAdmin: false,
  },
  {
    id: "college_energy_eng",
    sector: "engineering_college",
    title: "Campus Energy & BMS Engineer",
    name: "Argha Atta (Demo)",
    email: "engineer@campuspulse.local",
    password: "demo-password-123",
    department: "Electrical Works & Building Automation (BMS)",
    badge: "Energy & BMS Chief",
    sectorBadge: "College Campus",
    defaultSector: "engineering_college",
    color: "from-amber-500 to-yellow-500",
    description: "11kV substation load shifting, central chiller stage-down, solar rooftop synchronization, and telemetry data upload.",
    permissions: ["view_all", "view_energy", "energy_control", "telemetry_upload", "retrain_models", "simulation_run", "work_orders"],
    authorizations: [
      "11kV Substation & Transformer Feeder Switching",
      "HVAC Chiller Setpoint & VFD Frequency Controls",
      "Smart Meter CSV Ingestion & Sync-and-Learn ML Retrain",
      "Solar Inverter Peak-Clipping Mitigation",
    ],
    isSuperAdmin: false,
  },
  {
    id: "college_estate_officer",
    sector: "engineering_college",
    title: "Estate Officer & Hostel Superintendent",
    name: "Priyanshu Mishra (Demo)",
    email: "estate@campuspulse.local",
    password: "demo-password-123",
    department: "Campus Infrastructure & Water Sanitation",
    badge: "Estate & Hostels",
    sectorBadge: "College Campus",
    defaultSector: "engineering_college",
    color: "from-sky-500 to-blue-500",
    description: "Hostel water pumping schedule, night-leak acoustic sensing, cafeteria organic waste routing, and civil maintenance.",
    permissions: ["view_overview", "view_map", "view_insights", "water_control", "waste_dispatch", "work_orders", "asset_diagnostics", "feedback_submit"],
    authorizations: [
      "Hostel Overhead Tank Pump Automation & Night Cutoff",
      "Underground Acoustic Leakage Work Orders",
      "Cafeteria Food Waste Segregation & Compost Dispatch",
      "Campus Security & Fire Hydrant Readiness",
    ],
    isSuperAdmin: false,
  },
  {
    id: "college_student_lead",
    sector: "engineering_college",
    title: "Student Sustainability Lead & Researcher",
    name: "Argha Atta (Demo)",
    email: "student@campuspulse.local",
    password: "demo-password-123",
    department: "Green Campus Student Council",
    badge: "Eco-Club Lead",
    sectorBadge: "College Campus",
    defaultSector: "engineering_college",
    color: "from-emerald-500 to-green-600",
    description: "Student sustainability awareness, renewable carbon tracking, energy saving campaigns, and read-only telemetry research.",
    permissions: ["view_overview", "view_map", "view_insights", "view_energy", "esg_view"],
    authorizations: [
      "Campus Energy & Carbon Analytics Research Access",
      "Green Campus Gamification & Hackathon Submissions",
      "Hostel Energy Conservation Leaderboard Reporting",
    ],
    isSuperAdmin: false,
  },

  // 2. Heavy Industrial Smelter & Power Complex (industrial_estate)
  {
    id: "industry_gm",
    sector: "industrial_estate",
    title: "Plant General Manager & VP Operations",
    name: "Vikram Singhania",
    email: "gm.operations@vedanta-smelter.in",
    password: "demo-password-123",
    department: "Industrial Smelter Executive Command",
    badge: "Plant GM & VP",
    sectorBadge: "Heavy Industry",
    defaultSector: "industrial_estate",
    color: "from-amber-600 to-red-600",
    description: "Potline smelting continuous output, 220kV captive power grid balance, OHS safety compliance, and PCB regulatory signoff.",
    permissions: ["view_all", "energy_control", "high_voltage_control", "audit_signoff", "safety_dispatch", "esg_export"],
    authorizations: [
      "Potline Electrolysis 28 MW Emergency Shedding",
      "Captive Power Plant (CPP) Grid Synchronization Signoff",
      "State Pollution Control Board (OSPCB) Regulatory Mandates",
      "Plant Emergency High-Risk Isolation Lockout",
    ],
    isSuperAdmin: false,
  },
  {
    id: "industry_scada_chief",
    sector: "industrial_estate",
    title: "SCADA & 220kV Switchyard Chief",
    name: "Tushar Kanti Ray",
    email: "scada.chief@vedanta-smelter.in",
    password: "demo-password-123",
    department: "High Voltage Electrical Distribution & SCADA",
    badge: "SCADA Chief",
    sectorBadge: "Heavy Industry",
    defaultSector: "industrial_estate",
    color: "from-orange-600 to-amber-600",
    description: "220kV substation telemetry, 5th harmonic filtering, power factor capacitor banks, and high-frequency SCADA telemetry ingestion.",
    permissions: ["view_all", "view_energy", "energy_control", "high_voltage_control", "telemetry_upload", "retrain_models", "simulation_run", "work_orders"],
    authorizations: [
      "220kV Switchyard Busbar Switching & Harmonic Filters",
      "Active Power Factor (0.84 to 0.99) Capacitor Bank Control",
      "SCADA High-Speed Modbus/OPC-UA Telemetry Ingestion",
      "Continuous Learning Model Sync for Industrial Peak Demand",
    ],
    isSuperAdmin: false,
  },
  {
    id: "industry_etp_officer",
    sector: "industrial_estate",
    title: "ETP & Pollution Control Superintendent",
    name: "Debashree Mohapatra",
    email: "etp.safety@vedanta-smelter.in",
    password: "demo-password-123",
    department: "Effluent Treatment Plant (ETP) & Environment",
    badge: "ETP & Compliance",
    sectorBadge: "Heavy Industry",
    defaultSector: "industrial_estate",
    color: "from-teal-600 to-emerald-700",
    description: "Effluent treatment plant acid wash neutralization (pH 6.5-8.5), Zero Liquid Discharge (ZLD) RO loops, and CEMS stack monitors.",
    permissions: ["view_all", "water_control", "waste_dispatch", "audit_signoff", "incident_resolve", "feedback_submit"],
    authorizations: [
      "ETP Neutralization Chemical Dosing Automation",
      "Continuous Emission Monitoring (CEMS) SOx/NOx Stack Logs",
      "Hazardous Sludge Incineration & Manifest Signing",
      "Zero Liquid Discharge (ZLD) Multi-Effect Evaporator Override",
    ],
    isSuperAdmin: false,
  },
  {
    id: "industry_reliability_eng",
    sector: "industrial_estate",
    title: "Predictive Maintenance & Reliability Lead",
    name: "Capt. Arindam Sen",
    email: "cbm.reliability@vedanta-smelter.in",
    password: "demo-password-123",
    department: "Condition-Based Asset Health (CBM)",
    badge: "Reliability Lead",
    sectorBadge: "Heavy Industry",
    defaultSector: "industrial_estate",
    color: "from-slate-700 to-slate-900",
    description: "Turbine vibration FFT spectra (6.8 mm/s RUL 48h), bauxite conveyor thermal imaging, and predictive overhaul work orders.",
    permissions: ["view_all", "asset_diagnostics", "work_orders", "feedback_submit", "simulation_run"],
    authorizations: [
      "Captive Steam Turbine Vibration Trip Threshold Calibration",
      "Bauxite Conveyor Motor Thermographic Diagnostics",
      "Preventive Overhaul Work Order Dispatch (#WO-IND)",
      "Vibration Anomaly Ground-Truth Labeling & Training",
    ],
    isSuperAdmin: false,
  },

  // 3. Super-Speciality Hospital Complex (hospital)
  {
    id: "hospital_superintendent",
    sector: "hospital",
    title: "Medical Superintendent & Clinical CEO",
    name: "Dr. Sunita Mohanty",
    email: "superintendent@aiims-bbsr.gov.in",
    password: "demo-password-123",
    department: "Executive Clinical & Healthcare Administration",
    badge: "Medical Director",
    sectorBadge: "Super-Speciality",
    defaultSector: "hospital",
    color: "from-rose-500 to-red-600",
    description: "100% life-support electrical uptime, NABH/JCI clinical safety accreditation, ICU redundancy, and crisis disaster command.",
    permissions: ["view_all", "safety_dispatch", "incident_resolve", "audit_signoff", "asset_diagnostics", "esg_export"],
    authorizations: [
      "Hospital Disaster Emergency Red Code Declaration",
      "NABH/JCI Life-Support Infrastructure Certification",
      "Clinical Gas Pipeline & Cryogenic Storage Emergency Audit",
      "ICU Backup Power Failure Response Protocol",
    ],
    isSuperAdmin: false,
  },
  {
    id: "hospital_biomed_lead",
    sector: "hospital",
    title: "Biomedical & Critical Care Infrastructure Lead",
    name: "Er. Sourav Banerjee",
    email: "biomed.lead@aiims-bbsr.gov.in",
    password: "demo-password-123",
    department: "Biomedical Engineering & Medical Gas Pipeline",
    badge: "Biomedical Lead",
    sectorBadge: "Super-Speciality",
    defaultSector: "hospital",
    color: "from-sky-500 to-indigo-600",
    description: "Trauma ICU Online UPS battery cell impedance, Cryogenic Liquid Oxygen (LMO) tank pressure, and OT-04 positive pressure laminar airflow.",
    permissions: ["view_all", "view_energy", "energy_control", "telemetry_upload", "safety_dispatch", "asset_diagnostics", "work_orders", "feedback_submit"],
    authorizations: [
      "Trauma ICU N+2 Online UPS Battery Bank Auto-Test",
      "Cryogenic LMO Tank Pressure Boil-Off Relief Protocol",
      "Operation Theatre (OT) Laminar Airflow & HEPA Pressure Balancing",
      "Biomedical Telemetry CSV Ingestion & Predictive RUL Model Sync",
    ],
    isSuperAdmin: false,
  },
  {
    id: "hospital_infection_officer",
    sector: "hospital",
    title: "Infection Control & Bio-Medical Waste Officer",
    name: "Dr. Meenakshi Sahoo",
    email: "infection.control@aiims-bbsr.gov.in",
    password: "demo-password-123",
    department: "Hospital Hygiene & Bio-Medical Waste (BMW)",
    badge: "Bio-Medical Waste",
    sectorBadge: "Super-Speciality",
    defaultSector: "hospital",
    color: "from-purple-600 to-rose-600",
    description: "Color-coded Bio-Medical Waste barcode manifests, high-pressure autoclave sterilization logs (121°C), and pathogen containment.",
    permissions: ["view_overview", "view_map", "view_insights", "waste_dispatch", "safety_dispatch", "audit_signoff", "incident_resolve", "feedback_submit"],
    authorizations: [
      "Yellow/Red Bag Hazardous Autoclave Sterilization Signoff",
      "Barcoded Bio-Medical Waste Dispatch to Common Facility",
      "Hospital Cleanroom Airborne Particulate (ISO Class 5) Clearance",
      "Sharps Waste & Chemical Disinfection Compliance Audits",
    ],
    isSuperAdmin: false,
  },
  {
    id: "hospital_utility_eng",
    sector: "hospital",
    title: "Hospital Utilities & Emergency DG Engineer",
    name: "Manas Ranjan Sahu",
    email: "utilities.eng@aiims-bbsr.gov.in",
    password: "demo-password-123",
    department: "Hospital Utilities & Standby Power",
    badge: "Hospital Utilities",
    sectorBadge: "Super-Speciality",
    defaultSector: "hospital",
    color: "from-blue-600 to-cyan-600",
    description: "Dual grid feeder ATS auto-transfer switches, 1500 kVA emergency DG synchronizer, and central RO hemodialysis water quality.",
    permissions: ["view_all", "energy_control", "water_control", "work_orders", "asset_diagnostics"],
    authorizations: [
      "Dual Feeder Auto-Transfer Switch (ATS) 10-second Transfer Test",
      "1500 kVA Standby Diesel Generator Synchronizer Load Bank",
      "Dialysis Central RO Pure Water Conductivity Monitoring",
      "Hospital HVAC Isolation Ward Negative Pressure Adjustment",
    ],
    isSuperAdmin: false,
  },

  // 4. Smart City Command & Municipal Grid (municipal_campus)
  {
    id: "city_commissioner",
    sector: "municipal_campus",
    title: "Municipal Commissioner & ICCC Director",
    name: "Debasis Rout, IAS",
    email: "commissioner@smartcity-bbsr.gov.in",
    password: "demo-password-123",
    department: "Integrated Command & Control Centre (ICCC)",
    badge: "Commissioner & ICCC",
    sectorBadge: "Smart City",
    defaultSector: "municipal_campus",
    color: "from-cyan-600 to-blue-700",
    description: "City-wide urban utility SLA, multi-agency municipal coordination, citizen grievance analytics, and municipal tariff policies.",
    permissions: ["view_all", "energy_control", "water_control", "waste_dispatch", "audit_signoff", "esg_export"],
    authorizations: [
      "City-Wide Urban Infrastructure Emergency Protocol Activation",
      "Municipal Water Distribution & Power Quota Allocation",
      "Smart City Open-Data API & Citizen Dashboard Approval",
      "Inter-Agency Police, Fire & Municipal Grid Synchronization",
    ],
    isSuperAdmin: false,
  },
  {
    id: "city_water_chief",
    sector: "municipal_campus",
    title: "Water Works & Bulk Pumping Utilities Chief",
    name: "Er. Ramesh Chandra Hota",
    email: "water.works@smartcity-bbsr.gov.in",
    password: "demo-password-123",
    department: "Municipal Public Health Engineering (Water Supply)",
    badge: "Water Works Chief",
    sectorBadge: "Smart City",
    defaultSector: "municipal_campus",
    color: "from-sky-600 to-teal-600",
    description: "40 MLD Kuakhai river intake pump station, acoustic underground DMA leakage detection, and elevated service reservoir telemetry.",
    permissions: ["view_all", "view_insights", "water_control", "telemetry_upload", "work_orders", "asset_diagnostics", "feedback_submit"],
    authorizations: [
      "1200 kW Bulk River Pumping Intake Automation & Standby Switching",
      "District Metered Area (DMA) Acoustic Leak Isolation Orders",
      "Municipal Chlorination & Turbidity Telemetry Compliance",
      "Water Supply CSV Telemetry Ingest & Pump Cavitation Detection",
    ],
    isSuperAdmin: false,
  },
  {
    id: "city_waste_sanitation_head",
    sector: "municipal_campus",
    title: "Solid Waste & MRF Operations Head",
    name: "Sunil Kumar Behera",
    email: "sanitation.mrf@smartcity-bbsr.gov.in",
    password: "demo-password-123",
    department: "Solid Waste Management & Material Recovery (MRF)",
    badge: "Solid Waste & MRF",
    sectorBadge: "Smart City",
    defaultSector: "municipal_campus",
    color: "from-emerald-600 to-teal-700",
    description: "Material Recovery Facility (MRF) baler hydraulics, GPS smart fleet dynamic collection route dispatch, and composting telemetry.",
    permissions: ["view_all", "waste_dispatch", "work_orders", "audit_signoff", "incident_resolve", "feedback_submit"],
    authorizations: [
      "MRF High-Density Hydraulic Baler Preventive Overhauls",
      "Dynamic Dispatch of 85+ GPS Smart Garbage Compactors",
      "Decentralized Micro-Composting Bio-Methanation Monitoring",
      "Swachh City Compliance Reporting & Landfill Diversion Tracking",
    ],
    isSuperAdmin: false,
  },
  {
    id: "city_grid_traffic_controller",
    sector: "municipal_campus",
    title: "Smart Streetlighting & Grid Feeder Controller",
    name: "Priyabrata Mohanty",
    email: "smartgrid@smartcity-bbsr.gov.in",
    password: "demo-password-123",
    department: "Smart Lighting & Public EV Infrastructure",
    badge: "Smart Grid Controller",
    sectorBadge: "Smart City",
    defaultSector: "municipal_campus",
    color: "from-indigo-600 to-cyan-600",
    description: "LoRaWAN high-mast streetlighting astronomical timers, public EV fast-charging grid harmonic balancing, and feeder load shedding.",
    permissions: ["view_all", "view_energy", "energy_control", "telemetry_upload", "work_orders", "simulation_run"],
    authorizations: [
      "Zone-4 Smart Streetlight LoRaWAN Astronomical Timer Remote Override",
      "Public EV Fast-Charger Grid Harmonics Feeder Balancing",
      "Central Command Solar High-Mast Energy Optimization",
      "Lighting Telemetry Ingestion & Photocell Calibration",
    ],
    isSuperAdmin: false,
  },
];

// Helper to filter personas based on active sector
export function getPersonasForSector(sectorId: string): DemoPersona[] {
  if (!sectorId || sectorId === "all") {
    return DEMO_PERSONAS;
  }
  // Return the super admin plus all personas matching the sector
  return DEMO_PERSONAS.filter(
    (p) => p.sector === "all" || p.sector === sectorId
  );
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: (personaId: UserRole) => Promise<void>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage for authenticated session
    const stored = localStorage.getItem("campusiq_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore a browser-persisted demo session after hydration.
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("campusiq_user");
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      // First visit: Do not auto-login, show the login page
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) return { success: false, error: "Email and password are required." };
    // Validate against demo personas
    const matched = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      const newUser: UserProfile = {
        id: `usr-${matched.id}`,
        name: matched.name,
        email: matched.email,
        role: matched.id,
        roleTitle: matched.title,
        department: matched.department,
        sector: matched.sector,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        permissions: matched.permissions,
        authorizations: matched.authorizations,
        sectorBadge: matched.sectorBadge,
        defaultSector: matched.defaultSector,
        isSuperAdmin: matched.isSuperAdmin,
      };
      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem("campusiq_user", JSON.stringify(newUser));
      return { success: true };
    }
    return { success: false, error: "Invalid credentials. Please select one of the Demo Personas." };
  };

  const quickDemoLogin = async (personaId: UserRole) => {
    // Match directly or fallback to legacy mapping
    let matched = DEMO_PERSONAS.find((p) => p.id === personaId);
    if (!matched) {
      if (personaId === "director") matched = DEMO_PERSONAS.find((p) => p.id === "college_dean");
      else if (personaId === "energy_engineer") matched = DEMO_PERSONAS.find((p) => p.id === "college_energy_eng");
      else if (personaId === "maintenance_tech") matched = DEMO_PERSONAS.find((p) => p.id === "industry_scada_chief");
      else if (personaId === "safety_officer") matched = DEMO_PERSONAS.find((p) => p.id === "hospital_superintendent");
      else if (personaId === "operator") matched = DEMO_PERSONAS.find((p) => p.id === "city_commissioner");
    }
    if (!matched) matched = DEMO_PERSONAS[0];

    const newUser: UserProfile = {
      id: `usr-${matched.id}`,
      name: matched.name,
      email: matched.email,
      role: matched.id,
      roleTitle: matched.title,
      department: matched.department,
      sector: matched.sector,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      permissions: matched.permissions,
      authorizations: matched.authorizations,
      sectorBadge: matched.sectorBadge,
      defaultSector: matched.defaultSector,
      isSuperAdmin: matched.isSuperAdmin,
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("campusiq_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("campusiq_user");
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.permissions.includes("*")) return true;
    if (user.permissions.includes("view_all") && perm.startsWith("view_")) return true;
    return user.permissions.includes(perm);
  };

  const switchRole = (newRole: UserRole) => {
    quickDemoLogin(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        quickDemoLogin,
        logout,
        hasPermission,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
