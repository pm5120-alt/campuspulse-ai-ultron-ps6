"use client";

import React, { useState } from "react";
import { Wrench, Building2, CheckCircle, AlertOctagon, Clock, Sparkles, Activity, Gauge, Cpu, Search, Filter, HardHat, Stethoscope, Factory, GraduationCap, X, Check } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartTooltipContent } from "./ui/chart";
import type { LucideIcon } from "lucide-react";

export interface AssetRecord {
  id: string;
  name: string;
  category: string;
  usageDomain: string;
  usageDescription: string;
  location: string;
  healthScore: number;
  status: "Optimal" | "Warning" | "Critical";
  rulDays: number;
  vibrationMmS: number;
  operatingTempC: number;
  powerKw: number;
  specificMetricLabel?: string;
  specificMetricValue?: string;
  dutyCyclePct: number;
  lastService: string;
  nextScheduled: string;
  recommendedAction: string;
}

interface AssetsOperationsViewProps {
  facilityType?: string;
  facilityName?: string;
}

// Sector-specific asset databases with real engineering usage domains and live telemetry
const SECTOR_ASSET_DATABASE: Record<
  string,
  {
    sectorTitle: string;
    icon: LucideIcon;
    summary: { total: number; active: number; maintenance: number; critical: number };
    usageCategories: string[];
    assets: AssetRecord[];
    rulChartData: { name: string; days: number; status: string; fill: string }[];
  }
> = {
  engineering_college: {
    sectorTitle: "Academic Campus & Institutional Assets",
    icon: GraduationCap,
    summary: { total: 124, active: 118, maintenance: 4, critical: 2 },
    usageCategories: [
      "All Usages",
      "Academic & Classrooms",
      "Hostels & Dormitories",
      "Research Laboratories",
      "Central Utilities & Green Solar",
      "Computing & Data Center",
    ],
    rulChartData: [
      { name: "Chiller B2", days: 14, status: "Critical", fill: "#ef4444" },
      { name: "Pump H1", days: 42, status: "Warning", fill: "#f59e0b" },
      { name: "HPC Cool Pack", days: 65, status: "Warning", fill: "#f59e0b" },
      { name: "DG Admin", days: 180, status: "Optimal", fill: "#10b981" },
      { name: "Library Lift", days: 320, status: "Optimal", fill: "#0ea5e9" },
      { name: "Solar Inverter 1", days: 410, status: "Optimal", fill: "#0ea5e9" },
    ],
    assets: [
      {
        id: "AST-ENG-001",
        name: "Central Chiller Unit #2 - Block B",
        category: "HVAC & Thermal",
        usageDomain: "Academic & Classrooms",
        usageDescription: "Supplies centralized chilled water to 24 lecture halls & seminar theater during academic peak hours (08:30 - 17:30).",
        location: "APJ Abdul Kalam Block (Roof Utility)",
        healthScore: 48,
        status: "Critical",
        rulDays: 14,
        vibrationMmS: 4.9,
        operatingTempC: 68.4,
        powerKw: 42.5,
        specificMetricLabel: "Thermal COP",
        specificMetricValue: "2.41 (Degraded from 3.8)",
        dutyCyclePct: 78,
        lastService: "45 days ago",
        nextScheduled: "Immediate Dispatch Required",
        recommendedAction: "Replace compressor thermal expansion valve & clean condenser coils to recover 24% lost COP efficiency.",
      },
      {
        id: "AST-ENG-002",
        name: "Submersible Borewell Pump #2",
        category: "Fluid & Pumping",
        usageDomain: "Hostels & Dormitories",
        usageDescription: "Pumps ground water to 40,000L overhead storage for 400 resident students; automated float-switch cycle.",
        location: "Visvesvaraya Hall (VHR) Utility Pit",
        healthScore: 68,
        status: "Warning",
        rulDays: 42,
        vibrationMmS: 3.8,
        operatingTempC: 54.0,
        powerKw: 15.0,
        specificMetricLabel: "Discharge Flow",
        specificMetricValue: "380 L/min",
        dutyCyclePct: 52,
        lastService: "60 days ago",
        nextScheduled: "In 7 days",
        recommendedAction: "Impeller dynamic balancing and replace worn shaft mechanical seal to curb abnormal cavitation vibration.",
      },
      {
        id: "AST-ENG-003",
        name: "500 kVA Cummins Diesel Generator",
        category: "Power & Backup",
        usageDomain: "Central Utilities & Green Solar",
        usageDescription: "Campus-wide auto-mains-failure (AMF) emergency grid failover supporting critical administrative & exam systems.",
        location: "Main Substation & Admin Block Yard",
        healthScore: 92,
        status: "Optimal",
        rulDays: 180,
        vibrationMmS: 1.6,
        operatingTempC: 44.5,
        powerKw: 0.0,
        specificMetricLabel: "Fuel Reserve",
        specificMetricValue: "88% (1,450 L)",
        dutyCyclePct: 6,
        lastService: "20 days ago",
        nextScheduled: "In 70 days",
        recommendedAction: "Standard quarterly battery electrolyte check and 15-minute scheduled zero-load dry run test.",
      },
      {
        id: "AST-ENG-004",
        name: "Traction Passenger Elevator #2",
        category: "Vertical Transport",
        usageDomain: "Academic & Classrooms",
        usageDescription: "8-Passenger 1.5 m/s elevator servicing 5-floor Central Academic Library for students and faculty.",
        location: "Central Library Core Shaft",
        healthScore: 95,
        status: "Optimal",
        rulDays: 320,
        vibrationMmS: 1.1,
        operatingTempC: 36.2,
        powerKw: 7.5,
        specificMetricLabel: "Trip Count / Day",
        specificMetricValue: "412 Trips (99.8% Uptime)",
        dutyCyclePct: 44,
        lastService: "15 days ago",
        nextScheduled: "In 75 days",
        recommendedAction: "Routine wire-rope lubrication and optical safety door-curtain calibration.",
      },
      {
        id: "AST-ENG-005",
        name: "100 kW Rooftop Solar PV Inverter #1",
        category: "Green Energy & Renewables",
        usageDomain: "Central Utilities & Green Solar",
        usageDescription: "Grid-tied solar inverter array exporting clean power to campus net-metering switchgear.",
        location: "Science & Technology Block Roof",
        healthScore: 96,
        status: "Optimal",
        rulDays: 410,
        vibrationMmS: 0.2,
        operatingTempC: 41.0,
        powerKw: 88.4,
        specificMetricLabel: "Daily Solar Yield",
        specificMetricValue: "492 kWh",
        dutyCyclePct: 92,
        lastService: "30 days ago",
        nextScheduled: "In 150 days",
        recommendedAction: "Schedule fortnightly dust-cleaning of south-facing polycrystalline PV modules.",
      },
      {
        id: "AST-ENG-006",
        name: "HPC Precision In-Row Air Conditioner",
        category: "HVAC & Thermal",
        usageDomain: "Computing & Data Center",
        usageDescription: "Maintains 21°C ± 1°C and 45% RH for AI research GPU clusters and campus cloud server blades 24/7/365.",
        location: "Computer Science HPC Center",
        healthScore: 72,
        status: "Warning",
        rulDays: 65,
        vibrationMmS: 2.9,
        operatingTempC: 48.0,
        powerKw: 18.2,
        specificMetricLabel: "Return Air Temp",
        specificMetricValue: "22.4°C (Target 20.5°C)",
        dutyCyclePct: 98,
        lastService: "40 days ago",
        nextScheduled: "In 12 days",
        recommendedAction: "Clean washable MERV-13 pre-filters and verify refrigerant R-410A suction pressure.",
      },
    ],
  },
  industrial_estate: {
    sectorTitle: "Heavy Industry & Manufacturing SCADA Assets",
    icon: Factory,
    summary: { total: 218, active: 196, maintenance: 14, critical: 8 },
    usageCategories: [
      "All Usages",
      "Heavy Continuous Production Line",
      "High-Pressure Steam & Thermal",
      "Pneumatics & Compressed Air",
      "Effluent & Environmental (ETP)",
      "High-Tension Primary Substation",
    ],
    rulChartData: [
      { name: "Boiler #1", days: 9, status: "Critical", fill: "#ef4444" },
      { name: "Atlas Screw Comp", days: 22, status: "Critical", fill: "#ef4444" },
      { name: "5-Axis CNC #04", days: 35, status: "Warning", fill: "#f59e0b" },
      { name: "ETP Blower #2", days: 88, status: "Warning", fill: "#f59e0b" },
      { name: "Conveyor Line A", days: 160, status: "Optimal", fill: "#10b981" },
      { name: "1500kVA Transf", days: 240, status: "Optimal", fill: "#0ea5e9" },
    ],
    assets: [
      {
        id: "AST-IND-101",
        name: "30-Ton Industrial Steam Boiler #1",
        category: "Thermal & Pressure Vessel",
        usageDomain: "High-Pressure Steam & Thermal",
        usageDescription: "Generates superheated steam (12.4 bar) continuously feeding process reactors and drying autoclaves across Plant A.",
        location: "Thermal Utilities Boiler House",
        healthScore: 36,
        status: "Critical",
        rulDays: 9,
        vibrationMmS: 5.8,
        operatingTempC: 218.0,
        powerKw: 110.0,
        specificMetricLabel: "Operating Steam Pressure",
        specificMetricValue: "14.8 bar (Warning Breached)",
        dutyCyclePct: 94,
        lastService: "75 days ago",
        nextScheduled: "URGENT OVERHAUL",
        recommendedAction: "Immediate safety relief valve testing, descaling burner tube soot deposits, and feedwater deaerator calibration.",
      },
      {
        id: "AST-IND-102",
        name: "Atlas Copco GA-90 Screw Air Compressor",
        category: "Pneumatics & Air",
        usageDomain: "Pneumatics & Compressed Air",
        usageDescription: "Powers pneumatic robotic actuators, automated valves, and sandblasting booths across 3 continuous manufacturing shifts.",
        location: "Compressor Utility Bay #2",
        healthScore: 42,
        status: "Critical",
        rulDays: 22,
        vibrationMmS: 6.2,
        operatingTempC: 88.5,
        powerKw: 92.0,
        specificMetricLabel: "Discharge Pressure",
        specificMetricValue: "7.8 bar (Air Leaks: 14%)",
        dutyCyclePct: 96,
        lastService: "90 days ago",
        nextScheduled: "Immediate Work Order",
        recommendedAction: "Replace oil separator element, flush synthetic coolant, and inspect air intake solenoid modulation valve.",
      },
      {
        id: "AST-IND-103",
        name: "5-Axis CNC Precision Milling Center #04",
        category: "Machining & Precision Tooling",
        usageDomain: "Heavy Continuous Production Line",
        usageDescription: "High-speed aerospace and automotive precision milling; spindle speed up to 18,000 RPM with coolant misting.",
        location: "Plant A Machining Cell",
        healthScore: 64,
        status: "Warning",
        rulDays: 35,
        vibrationMmS: 3.4,
        operatingTempC: 58.2,
        powerKw: 38.0,
        specificMetricLabel: "Spindle Runout",
        specificMetricValue: "0.012 mm (Target < 0.005)",
        dutyCyclePct: 86,
        lastService: "35 days ago",
        nextScheduled: "In 10 days",
        recommendedAction: "Recalibrate ceramic spindle bearings and re-align automatic tool changer (ATC) gripper arm.",
      },
      {
        id: "AST-IND-104",
        name: "ETP Aeration Multi-Stage Blower #2",
        category: "Environmental & Effluent",
        usageDomain: "Effluent & Environmental (ETP)",
        usageDescription: "Provides continuous dissolved oxygen aeration (4.5 mg/L) to biological effluent treatment tanks for pollution compliance.",
        location: "Effluent Treatment Plant (ETP)",
        healthScore: 74,
        status: "Warning",
        rulDays: 88,
        vibrationMmS: 2.8,
        operatingTempC: 62.0,
        powerKw: 45.0,
        specificMetricLabel: "Effluent BOD / COD",
        specificMetricValue: "BOD 22 ppm | COD 98 ppm",
        dutyCyclePct: 99,
        lastService: "45 days ago",
        nextScheduled: "In 20 days",
        recommendedAction: "Lubricate heavy-duty sleeve bearings and clean air diffuser aeration membranes.",
      },
      {
        id: "AST-IND-105",
        name: "1500 kVA Step-Down HT Transformer #2",
        category: "Power & Primary Substation",
        usageDomain: "High-Tension Primary Substation",
        usageDescription: "Steps down 33 kV industrial grid power to 415 V 3-phase plant distribution with active power factor correction (APFC).",
        location: "Main 33kV Substation Yard",
        healthScore: 94,
        status: "Optimal",
        rulDays: 240,
        vibrationMmS: 0.8,
        operatingTempC: 52.0,
        powerKw: 1120.0,
        specificMetricLabel: "Power Factor (PF)",
        specificMetricValue: "0.985 (Threshold > 0.85)",
        dutyCyclePct: 82,
        lastService: "25 days ago",
        nextScheduled: "In 95 days",
        recommendedAction: "Dissolved Gas Analysis (DGA) transformer oil dielectric breakdown voltage test.",
      },
      {
        id: "AST-IND-106",
        name: "Automated Heavy Pallet Conveyor Line A",
        category: "Intralogistics & Conveyance",
        usageDomain: "Heavy Continuous Production Line",
        usageDescription: "Transports 1.2-ton finished goods pallets from production hall to automated high-bay warehouse staging.",
        location: "Warehouse Logistics Hub",
        healthScore: 91,
        status: "Optimal",
        rulDays: 160,
        vibrationMmS: 1.4,
        operatingTempC: 38.0,
        powerKw: 15.5,
        specificMetricLabel: "Conveyor Line Speed",
        specificMetricValue: "1.2 m/s (100% Sync)",
        dutyCyclePct: 75,
        lastService: "20 days ago",
        nextScheduled: "In 60 days",
        recommendedAction: "Check drive roller chain tension and inspect photoelectric safety interlocking sensors.",
      },
    ],
  },
  hospital: {
    sectorTitle: "Clinical Life-Support & Hospital Infrastructure",
    icon: Stethoscope,
    summary: { total: 168, active: 158, maintenance: 7, critical: 3 },
    usageCategories: [
      "All Usages",
      "Clinical Life-Support & ICU",
      "Sterile Cleanrooms (OT & CSSD)",
      "Cryogenic Medical Gases (LMO)",
      "Hemodialysis & Sterile RO Water",
      "N+1 Critical Redundant Power",
    ],
    rulChartData: [
      { name: "LMO Vaporizer", days: 11, status: "Critical", fill: "#ef4444" },
      { name: "OT-3 HEPA AHU", days: 28, status: "Warning", fill: "#f59e0b" },
      { name: "Dialysis RO Unit", days: 45, status: "Warning", fill: "#f59e0b" },
      { name: "Trauma Vacuum", days: 75, status: "Warning", fill: "#f59e0b" },
      { name: "Blood Bank -80C", days: 190, status: "Optimal", fill: "#10b981" },
      { name: "250kVA ICU UPS", days: 310, status: "Optimal", fill: "#0ea5e9" },
    ],
    assets: [
      {
        id: "AST-HSP-201",
        name: "Liquid Medical Oxygen (LMO) Dual Vaporizer",
        category: "Life-Support Medical Gases",
        usageDomain: "Cryogenic Medical Gases (LMO)",
        usageDescription: "Vaporizes liquid O2 into continuous 4.2 bar pipeline supply feeding 48 ICU ventilators and 12 Operation Theaters 24/7.",
        location: "Medical Gas Plant Yard (MGPS)",
        healthScore: 44,
        status: "Critical",
        rulDays: 11,
        vibrationMmS: 1.2,
        operatingTempC: -18.0,
        powerKw: 12.0,
        specificMetricLabel: "LMO Tank Level & Pressure",
        specificMetricValue: "84% (4.2 bar | 320 L/min)",
        dutyCyclePct: 100,
        lastService: "60 days ago",
        nextScheduled: "IMMEDIATE AUDIT",
        recommendedAction: "De-ice secondary ambient vaporizer fin block and swap lead/lag regulator circuit to prevent frosting drop.",
      },
      {
        id: "AST-HSP-202",
        name: "Modular Operation Theater OT-3 Class-100 AHU",
        category: "HVAC & Sterile Air Handling",
        usageDomain: "Sterile Cleanrooms (OT & CSSD)",
        usageDescription: "Provides laminar ultra-clean sterile airflow with positive pressure (+25 Pa) and HEPA 99.99% particulate filtration.",
        location: "Surgical Block (Roof AHU-3)",
        healthScore: 66,
        status: "Warning",
        rulDays: 28,
        vibrationMmS: 3.1,
        operatingTempC: 42.0,
        powerKw: 22.0,
        specificMetricLabel: "Positive Differential Pressure",
        specificMetricValue: "+24.8 Pa (ISO Class 5)",
        dutyCyclePct: 98,
        lastService: "40 days ago",
        nextScheduled: "In 7 days",
        recommendedAction: "Replace terminal H14 HEPA filters and recalibrate Magnehelic differential pressure transmitter.",
      },
      {
        id: "AST-HSP-203",
        name: "Double-Pass Reverse Osmosis (RO) Dialysis Plant",
        category: "Sterile Water Purification",
        usageDomain: "Hemodialysis & Sterile RO Water",
        usageDescription: "Produces ultra-pure endotoxin-free water (< 0.1 EU/mL, conductivity < 1.5 µS/cm) feeding 16 renal dialysis stations.",
        location: "Dialysis Wing Utility Room",
        healthScore: 71,
        status: "Warning",
        rulDays: 45,
        vibrationMmS: 2.4,
        operatingTempC: 28.0,
        powerKw: 14.5,
        specificMetricLabel: "Product Water Conductivity",
        specificMetricValue: "1.8 µS/cm (Sterility Normal)",
        dutyCyclePct: 88,
        lastService: "30 days ago",
        nextScheduled: "In 14 days",
        recommendedAction: "Perform chemical sanitization with peracetic acid and replace 1-micron carbon pre-cartridge.",
      },
      {
        id: "AST-HSP-204",
        name: "Medical Vacuum Duplex Pump Unit #1",
        category: "Life-Support Suction",
        usageDomain: "Clinical Life-Support & ICU",
        usageDescription: "Generates continuous -650 mmHg clinical suction for surgical aspiration, airway management, and trauma resuscitation.",
        location: "Basement Medical Gas Room",
        healthScore: 76,
        status: "Warning",
        rulDays: 75,
        vibrationMmS: 2.7,
        operatingTempC: 56.0,
        powerKw: 11.0,
        specificMetricLabel: "Suction Vacuum Level",
        specificMetricValue: "-648 mmHg (Continuous)",
        dutyCyclePct: 92,
        lastService: "45 days ago",
        nextScheduled: "In 25 days",
        recommendedAction: "Replace exhaust bacterial filter and top up rotary vane synthetic lubricant.",
      },
      {
        id: "AST-HSP-205",
        name: "Ultra-Low Temp Blood Bank Cryo-Freezer #2",
        category: "Cold-Chain & Bio-Storage",
        usageDomain: "Clinical Life-Support & ICU",
        usageDescription: "Preserves rare blood units, fresh frozen plasma (FFP), and clinical pathology specimens at -80°C with automated SMS alarm.",
        location: "Central Blood Transfusion Wing",
        healthScore: 94,
        status: "Optimal",
        rulDays: 190,
        vibrationMmS: 0.9,
        operatingTempC: -81.4,
        powerKw: 3.2,
        specificMetricLabel: "Core Temperature",
        specificMetricValue: "-81.4°C (Target -80.0°C)",
        dutyCyclePct: 85,
        lastService: "20 days ago",
        nextScheduled: "In 80 days",
        recommendedAction: "Inspect door perimeter silicone seal and clean cascade stage-1 condenser fan mesh.",
      },
      {
        id: "AST-HSP-206",
        name: "250 kVA True Online N+1 Redundant UPS",
        category: "Power & Life-Support Backup",
        usageDomain: "N+1 Critical Redundant Power",
        usageDescription: "Guarantees 0ms power transfer uninterrupted supply for ICU, Ventilators, Defibrillators, and Cardiac Cath Lab.",
        location: "Critical Care Electrical Sub-Vault",
        healthScore: 98,
        status: "Optimal",
        rulDays: 310,
        vibrationMmS: 0.1,
        operatingTempC: 32.0,
        powerKw: 185.0,
        specificMetricLabel: "Battery Health & Autonomy",
        specificMetricValue: "98% (42 Min Runtime @ Full Load)",
        dutyCyclePct: 100,
        lastService: "15 days ago",
        nextScheduled: "In 105 days",
        recommendedAction: "Quarterly individual VRLA battery cell internal resistance and float voltage verification.",
      },
    ],
  },
  smart_city: {
    sectorTitle: "Smart City & Municipal Utility Assets",
    icon: HardHat,
    summary: { total: 340, active: 322, maintenance: 12, critical: 6 },
    usageCategories: [
      "All Usages",
      "Municipal Water Distribution",
      "Public Lighting & Automation",
      "Traffic & AI Surveillance",
      "Civic Waste & STP Reclamation",
      "Public EV Charging Infrastructure",
    ],
    rulChartData: [
      { name: "Booster Pump #4", days: 18, status: "Critical", fill: "#ef4444" },
      { name: "STP Aerator #2", days: 32, status: "Warning", fill: "#f59e0b" },
      { name: "150kW EV Hub", days: 140, status: "Optimal", fill: "#10b981" },
      { name: "AI Vision Edge", days: 280, status: "Optimal", fill: "#0ea5e9" },
      { name: "Smart High-Mast", days: 350, status: "Optimal", fill: "#0ea5e9" },
      { name: "Grid Sub-Station", days: 420, status: "Optimal", fill: "#0ea5e9" },
    ],
    assets: [
      {
        id: "AST-CTY-301",
        name: "Municipal Water Distribution Booster Pump #4",
        category: "Civic Water Utility",
        usageDomain: "Municipal Water Distribution",
        usageDescription: "Pressurizes 1,200 m³/h potable drinking water from central city reservoir to urban residential Sector 4 & 5.",
        location: "Central Water Works Booster Station",
        healthScore: 46,
        status: "Critical",
        rulDays: 18,
        vibrationMmS: 5.2,
        operatingTempC: 66.0,
        powerKw: 75.0,
        specificMetricLabel: "Distribution Flow Rate",
        specificMetricValue: "1,180 m³/h @ 5.8 bar",
        dutyCyclePct: 92,
        lastService: "65 days ago",
        nextScheduled: "Urgent Inspection",
        recommendedAction: "Replace worn pump bronze wear-rings and re-pack gland packing to arrest leakage and pressure loss.",
      },
      {
        id: "AST-CTY-302",
        name: "SCADA STP Secondary Clarifier Aeration Turbine",
        category: "Sewage & Water Reclamation",
        usageDomain: "Civic Waste & STP Reclamation",
        usageDescription: "Oxygenates municipal sewage water converting organic load into non-toxic treated water for city parks and cooling towers.",
        location: "City Sewage Treatment Plant (STP)",
        healthScore: 68,
        status: "Warning",
        rulDays: 32,
        vibrationMmS: 3.6,
        operatingTempC: 58.0,
        powerKw: 55.0,
        specificMetricLabel: "BOD Reduction Ratio",
        specificMetricValue: "89.2% (Target > 92%)",
        dutyCyclePct: 98,
        lastService: "50 days ago",
        nextScheduled: "In 8 days",
        recommendedAction: "Inspect gearbox planetary gear teeth for pitting and replace synthetic EP oil.",
      },
      {
        id: "AST-CTY-303",
        name: "150 kW DC Fast EV Multi-Port Charging Hub",
        category: "Public EV Infrastructure",
        usageDomain: "Public EV Charging Infrastructure",
        usageDescription: "CCS-2 dual-gun fast DC charger supporting municipal electric transit buses and public citizens with smart payment gateway.",
        location: "Civic Center Intermodal Terminal",
        healthScore: 92,
        status: "Optimal",
        rulDays: 140,
        vibrationMmS: 0.1,
        operatingTempC: 38.0,
        powerKw: 148.0,
        specificMetricLabel: "Charger Availability",
        specificMetricValue: "98.4% (54 Sessions / Day)",
        dutyCyclePct: 68,
        lastService: "25 days ago",
        nextScheduled: "In 65 days",
        recommendedAction: "Inspect liquid-cooled charging cable jacket and verify DC insulation resistance (Megger test).",
      },
      {
        id: "AST-CTY-304",
        name: "AI Edge Vision Surveillance Gateway Server #12",
        category: "City Computing & Traffic AI",
        usageDomain: "Traffic & AI Surveillance",
        usageDescription: "Processes real-time 16-channel 4K video streams for traffic congestion index, red-light violations, and crowd density alerts.",
        location: "Central Municipal Smart Command Center",
        healthScore: 96,
        status: "Optimal",
        rulDays: 280,
        vibrationMmS: 0.3,
        operatingTempC: 44.0,
        powerKw: 1.8,
        specificMetricLabel: "Frame Processing Rate",
        specificMetricValue: "480 FPS (Zero Drop)",
        dutyCyclePct: 100,
        lastService: "15 days ago",
        nextScheduled: "In 120 days",
        recommendedAction: "Apply firmware security patch and clear temporary video cache buffer.",
      },
      {
        id: "AST-CTY-305",
        name: "Smart High-Mast LED Lighting Master Controller",
        category: "Public Lighting & Automation",
        usageDomain: "Public Lighting & Automation",
        usageDescription: "Astronomical clock and ambient light sensor automated dimming (100% to 50% at 01:00) saving 42% public street lighting energy.",
        location: "Ring Road Interchange Mast #07",
        healthScore: 97,
        status: "Optimal",
        rulDays: 350,
        vibrationMmS: 0.1,
        operatingTempC: 34.0,
        powerKw: 8.5,
        specificMetricLabel: "Energy Saving Rate",
        specificMetricValue: "42.8% vs Conventional",
        dutyCyclePct: 50,
        lastService: "10 days ago",
        nextScheduled: "In 140 days",
        recommendedAction: "Remote cellular IoT telemetry modem ping test and surge protection device (SPD) status audit.",
      },
    ],
  },
};

export default function AssetsOperationsView({
  facilityType = "engineering_college",
  facilityName = "SRM KTR Campus",
}: AssetsOperationsViewProps) {
  const [activeTab, setActiveTab] = useState<"Overview" | "Equipment" | "Maintenance" | "Work Orders">("Overview");
  const [selectedUsage, setSelectedUsage] = useState<string>("All Usages");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [inspectedAsset, setInspectedAsset] = useState<AssetRecord | null>(null);
  const [dispatchToast, setDispatchToast] = useState<string | null>(null);

  // Pick active sector configuration with fallback
  const sectorData =
    SECTOR_ASSET_DATABASE[facilityType] ||
    SECTOR_ASSET_DATABASE.engineering_college;

  const summary = sectorData.summary;
  const SectorIcon = sectorData.icon;

  const donutData = [
    { name: "Active & Optimal", value: summary.active, color: "#10b981" },
    { name: "Under Maintenance", value: summary.maintenance, color: "#f59e0b" },
    { name: "Critical Risk", value: summary.critical, color: "#ef4444" },
  ];

  const rulData = sectorData.rulChartData;

  // Filtered asset list based on search, usage domain, and health status
  const filteredAssets = sectorData.assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUsage =
      selectedUsage === "All Usages" || asset.usageDomain === selectedUsage;

    const matchesStatus =
      statusFilter === "All" || asset.status === statusFilter;

    return matchesSearch && matchesUsage && matchesStatus;
  });

  const handleDispatchWorkOrder = (asset: AssetRecord) => {
    setDispatchToast(`Work Order dispatched for ${asset.name} (#WO-${crypto.randomUUID().slice(0, 8).toUpperCase()})`);
    setTimeout(() => {
      setDispatchToast(null);
    }, 4500);
  };

  return (
    <div className="space-y-7">
      {/* Toast Notification for Dispatched Work Orders */}
      {dispatchToast && (
        <div className="fixed bottom-8 right-8 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-black text-white">{dispatchToast}</p>
            <p className="text-[11px] text-slate-400">Assigned to On-Duty Facility Engineering Team</p>
          </div>
        </div>
      )}

      {/* Top Sector Banner & Sub Tabs Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0 border border-orange-200/60 dark:border-orange-800/60 shadow-xs">
            <SectorIcon className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {sectorData.sectorTitle}
              </h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400">
                {facilityName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
              Sector-tailored assets, multi-domain usage tracking, RUL estimation, and predictive maintenance dispatch.
            </p>
          </div>
        </div>

        {/* Sub Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {(["Overview", "Equipment", "Maintenance", "Work Orders"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-full text-xs font-black tracking-wide transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-102"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xs"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Sector Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-500 flex items-center justify-center shadow-xs shrink-0 border border-sky-200/60 dark:border-sky-800/60">
            <Building2 className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sector Assets</p>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">{summary.total} Units</h3>
          </div>
        </div>

        <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Optimal Health</p>
            <h3 className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary.active} Units</h3>
          </div>
        </div>

        <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center shadow-xs shrink-0 border border-amber-200/60 dark:border-amber-800/60">
            <Clock className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Scheduled Service</p>
            <h3 className="text-2xl lg:text-3xl font-black text-amber-500 dark:text-amber-400 mt-1">{summary.maintenance} Units</h3>
          </div>
        </div>

        <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-5 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center shadow-xs shrink-0 border border-rose-200/60 dark:border-rose-800/60">
            <AlertOctagon className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Critical Risk</p>
            <h3 className="text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{summary.critical} Units</h3>
          </div>
        </div>
      </div>

      {/* Donut Chart & RUL Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Equipment Status Donut */}
        <div className="lg:col-span-5 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Health Status Classification</h3>
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                Random Forest ML
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
              Multi-sensor degradation & failure anomaly scoring
            </p>
          </div>

          <div className="w-full h-60 relative flex items-center justify-center my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<ChartTooltipContent />} />
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute text-center pointer-events-none">
              <span className="text-3xl font-black text-slate-900 dark:text-white block leading-none">
                {Math.round((summary.active / summary.total) * 100)}%
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Optimal</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="block text-emerald-600 dark:text-emerald-400 text-base">{summary.active}</span>
              <span className="text-slate-400 text-[11px]">Optimal</span>
            </div>
            <div>
              <span className="block text-amber-500 dark:text-amber-400 text-base">{summary.maintenance}</span>
              <span className="text-slate-400 text-[11px]">Scheduled</span>
            </div>
            <div>
              <span className="block text-rose-500 dark:text-rose-400 text-base">{summary.critical}</span>
              <span className="text-slate-400 text-[11px]">Critical</span>
            </div>
          </div>
        </div>

        {/* Remaining Useful Life (RUL) Bar Chart */}
        <div className="lg:col-span-7 dashboard-card p-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Sector Remaining Useful Life (RUL Estimation)
              </h3>
              <span className="text-[11px] font-black text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800/60">
                Predictive Maintenance
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1">
              Estimated operational days remaining before mandatory overhaul
            </p>
          </div>

          <div className="w-full h-60 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rulData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} fontWeight={700} axisLine={false} tickLine={false} unit="d" />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="days" name="Remaining Days" radius={[6, 6, 0, 0]}>
                  {rulData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 dark:text-slate-500">
            <span>Critical Warning Threshold: &lt; 30 Days</span>
            <span className="font-black text-rose-600 dark:text-rose-400">
              {summary.critical} Assets Require Immediate Maintenance Dispatch
            </span>
          </div>
        </div>
      </div>

      {/* Sector Usage Domain Filter & Search Bar */}
      <div className="dashboard-card p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400 dark:text-slate-500">
            <Filter className="w-4 h-4 text-orange-500" />
            <span>Filter by Operational Usage Domain:</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets, telemetry, locations..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition"
            />
          </div>
        </div>

        {/* Usage Domain Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {sectorData.usageCategories.map((cat) => {
            const isSelected = selectedUsage === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedUsage(cat)}
                className={`px-4 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sector Detailed Asset Inventory Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-orange-500" />
            <span>Live Sector Asset Inventory & Degradation Telemetry</span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              ({filteredAssets.length} of {sectorData.assets.length} displayed)
            </span>
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">Status:</span>
            {["All", "Critical", "Warning", "Optimal"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full font-bold cursor-pointer transition ${
                  statusFilter === st
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const isCrit = asset.status === "Critical";
            const isWarn = asset.status === "Warning";

            return (
              <div
                key={asset.id}
                className={`dashboard-card p-6 bg-white dark:bg-slate-900 border transition-all hover:shadow-lg flex flex-col justify-between ${
                  isCrit
                    ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
                    : isWarn
                    ? "border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10"
                    : "border-slate-200/90 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          {asset.id}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {asset.category}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 dark:text-white mt-1 leading-snug">
                        {asset.name}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                        isCrit
                          ? "bg-rose-500 text-white"
                          : isWarn
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-500 text-white"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  {/* Usage Domain Badge & Location */}
                  <div className="space-y-1.5 mb-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{asset.usageDomain}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold line-clamp-2">
                      {asset.usageDescription}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{asset.location}</span>
                    </p>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 mb-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">Vibration FFT</span>
                      <span
                        className={`font-black text-sm ${
                          asset.vibrationMmS > 4.0
                            ? "text-rose-600 dark:text-rose-400"
                            : asset.vibrationMmS > 2.5
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {asset.vibrationMmS} mm/s
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">Operating Temp</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {asset.operatingTempC}°C
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">Power / Load</span>
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {asset.powerKw} kW
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] font-bold block">RUL Est.</span>
                      <span
                        className={`font-black text-sm ${
                          asset.rulDays < 30
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {asset.rulDays} Days
                      </span>
                    </div>

                    {asset.specificMetricLabel && (
                      <div className="col-span-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-slate-400 text-[10px] font-bold block">
                          {asset.specificMetricLabel}
                        </span>
                        <span className="font-black text-orange-600 dark:text-orange-400 text-xs">
                          {asset.specificMetricValue}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Health Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span className="text-slate-400">Random Forest Health</span>
                      <span
                        className={
                          asset.healthScore < 50
                            ? "text-rose-600 dark:text-rose-400"
                            : asset.healthScore < 80
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {asset.healthScore}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          asset.healthScore < 50
                            ? "bg-rose-500"
                            : asset.healthScore < 80
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${asset.healthScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setInspectedAsset(asset)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Telemetry Spec</span>
                  </button>

                  <button
                    onClick={() => handleDispatchWorkOrder(asset)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isCrit
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-600/30"
                        : "bg-orange-500 hover:bg-orange-600 text-white shadow-xs shadow-orange-500/30"
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Dispatch</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Asset Telemetry & Diagnostics Modal */}
      {inspectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 lg:p-8 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-7 lg:p-8 shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 relative text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setInspectedAsset(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-500 flex items-center justify-center shrink-0 border border-orange-200/60 dark:border-orange-800/60">
                <Wrench className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">{inspectedAsset.id}</span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                      inspectedAsset.status === "Critical"
                        ? "bg-rose-500 text-white"
                        : inspectedAsset.status === "Warning"
                        ? "bg-amber-500 text-white"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {inspectedAsset.status}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {inspectedAsset.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                  {inspectedAsset.location} • {inspectedAsset.usageDomain}
                </p>
              </div>
            </div>

            {/* Diagnostic Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-400 font-bold block mb-1">Vibration Level</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{inspectedAsset.vibrationMmS} mm/s</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-400 font-bold block mb-1">Operating Temp</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{inspectedAsset.operatingTempC} °C</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-400 font-bold block mb-1">Duty Cycle</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{inspectedAsset.dutyCyclePct} %</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-slate-400 font-bold block mb-1">RUL Prediction</span>
                <span className="text-lg font-black text-orange-600 dark:text-orange-400">{inspectedAsset.rulDays} Days</span>
              </div>
            </div>

            {/* AI Prescriptive Maintenance Recommendation */}
            <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI Prescriptive Maintenance Recommendation</span>
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                {inspectedAsset.recommendedAction}
              </p>
            </div>

            {/* Work Order Schedule Info */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="text-slate-400 text-[11px] block">Last Completed Service:</span>
                <span className="font-black text-slate-900 dark:text-white">{inspectedAsset.lastService}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="text-slate-400 text-[11px] block">Next Due Schedule:</span>
                <span className="font-black text-rose-600 dark:text-rose-400">{inspectedAsset.nextScheduled}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setInspectedAsset(null)}
                className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-black cursor-pointer transition"
              >
                Close Window
              </button>
              <button
                onClick={() => {
                  handleDispatchWorkOrder(inspectedAsset);
                  setInspectedAsset(null);
                }}
                className="px-6 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md shadow-orange-500/30 cursor-pointer transition flex items-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                <span>Dispatch Maintenance Crew</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
