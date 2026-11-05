"use client";

import React, { useState, useEffect } from "react";
import Sidebar, { NavItem } from "./components/Sidebar";
import Header from "./components/Header";
import DashboardView from "./components/DashboardView";
import CampusMapView from "./components/CampusMapView";
import EnergyAnalyticsView from "./components/EnergyAnalyticsView";
import AiInsightsView from "./components/AiInsightsView";
import AssetsOperationsView from "./components/AssetsOperationsView";
import SimulationView from "./components/SimulationView";
import ReportsView from "./components/ReportsView";
import SafetyView from "./components/SafetyView";
import LoginView from "./components/LoginView";
import SmoothScroll from "./components/SmoothScroll";
import AiExecutiveAssistantModal from "./components/AiExecutiveAssistantModal";
import CampusPlaceManagerModal from "./components/CampusPlaceManagerModal";
import DataUploadStudioModal from "./components/DataUploadStudioModal";
import { ThemeProvider } from "./context/ThemeContext";
import type { DashboardData, CampusMapData, EnergyAnalyticsData, AiInsightsData, AssetOperationsData, SustainabilityReportData, SafetyOverviewData } from "./lib/dataTypes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Lock, Shield, LayoutDashboard, MapPin, Zap, Sparkles, Menu } from "lucide-react";
import {
  getDashboardOverview,
  getCampusMapData,
  getEnergyAnalytics,
  getAiInsights,
  getAssetOperations,
  getSustainabilityReports,
  getSafetyOverview,
} from "./lib/api";

function AppContent() {
  const { user, isAuthenticated, hasPermission, quickDemoLogin } = useAuth();
  const [activeNav, setActiveNav] = useState<NavItem>("dashboard");
  const [facilityType, setFacilityType] = useState("engineering_college");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPlaceManagerOpen, setIsPlaceManagerOpen] = useState(false);
  const [isUploadStudioOpen, setIsUploadStudioOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [mapData, setMapData] = useState<CampusMapData | null>(null);
  const [energyData, setEnergyData] = useState<EnergyAnalyticsData | null>(null);
  const [insightsData, setInsightsData] = useState<AiInsightsData | null>(null);
  const [assetsData, setAssetsData] = useState<AssetOperationsData | null>(null);
  const [reportsData, setReportsData] = useState<SustainabilityReportData | null>(null);
  const [safetyData, setSafetyData] = useState<SafetyOverviewData | null>(null);

  const facilityLabels: Record<string, string> = {
    engineering_college: "SRM KTR Campus",
    hospital: "District Hospital Complex",
    industrial_estate: "Industrial Estate Zone",
    municipal_campus: "Municipal Corporation Center",
  };

  // Synchronize active facility type when authenticated user role changes
  useEffect(() => {
    if (user?.defaultSector) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- The selected facility must follow the authenticated user's default sector.
      setFacilityType(user.defaultSector);
    }
  }, [user?.defaultSector, user?.role]);

  // Load sector data from ML backend
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    async function loadAllData() {
      try {
        const [d, m, e, i, a, r, s] = await Promise.all([
          getDashboardOverview(facilityType),
          getCampusMapData(facilityType),
          getEnergyAnalytics(facilityType),
          getAiInsights(facilityType),
          getAssetOperations(facilityType),
          getSustainabilityReports(facilityType),
          getSafetyOverview(facilityType),
        ]);

        if (isMounted) {
          setDashboardData(d);
          setMapData(m);
          setEnergyData(e);
          setInsightsData(i);
          setAssetsData(a);
          setReportsData(r);
          setSafetyData(s);
        }
      } catch (err) {
        console.error("Error loading ML data:", err);
      } finally {
      }
    }

    loadAllData();
    return () => {
      isMounted = false;
    };
  }, [facilityType, isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Permission mapping per view
  const viewPermissions: Record<NavItem, string> = {
    dashboard: "view_overview",
    "campus-map": "view_map",
    "energy-analytics": "energy_control",
    "ai-insights": "view_insights",
    "assets-operations": "asset_diagnostics",
    simulation: "simulation_run",
    reports: "esg_export",
    safety: "safety_dispatch",
  };

  const isViewAuthorized =
    hasPermission(viewPermissions[activeNav]) ||
    hasPermission("view_all") ||
    activeNav === "dashboard";

  // Headers metadata mapped per navigation view
  const headerMeta: Record<NavItem, { title: string; subtitle: string }> = {
    dashboard: {
      title: `Welcome, ${user?.name || "Officer"}`,
      subtitle: `Multi-sector telemetry synthesis and active anomaly learning (${user?.roleTitle} Mode).`,
    },
    "campus-map": {
      title: "SRM KTR Campus Map",
      subtitle: "Satellite view with named campus landmarks and illustrative demo indicators.",
    },
    "energy-analytics": {
      title: "Energy Intelligence & Forecasting",
      subtitle: "Prophet + XGBoost load forecasting, tariff cost metrics, and peak-shaving analytics.",
    },
    "ai-insights": {
      title: "AI Insights & Anomaly Diagnostics",
      subtitle: "Continuous active learning engine with operator feedback confirmation loops.",
    },
    "assets-operations": {
      title: "Asset Operations & Health",
      subtitle: "Random Forest predictive maintenance, RUL estimation, and vibration telemetry.",
    },
    simulation: {
      title: "What-If Scenario Simulation",
      subtitle: "Parameterized Monte Carlo policy impact simulator for energy, cost, and ESG carbon cuts.",
    },
    reports: {
      title: "Sustainability & ESG Reports",
      subtitle: "6-Axis ESG compliance scorecard, radar metrics, and period-over-period comparison.",
    },
    safety: {
      title: "Safety & Hazard Hotspot Analysis",
      subtitle: "Spatial risk cluster detection, IoT compliance checklists, and response time metrics.",
    },
  };

  const currentMeta = headerMeta[activeNav] || headerMeta.dashboard;

  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-[#090d16] flex text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar Navigation (Desktop Fixed + Mobile Slide-Over Drawer) */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={(nav) => setActiveNav(nav)}
        userRole={user?.roleTitle}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out pb-24 lg:pb-10 ml-0 ${
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
        }`}
      >
        <div className="p-3.5 sm:p-6 lg:p-10 max-w-[1700px] w-full mx-auto space-y-6 lg:space-y-8">
          {/* Header */}
          <Header
            title={currentMeta.title}
            subtitle={currentMeta.subtitle}
            selectedFacility={facilityType}
            onFacilityChange={(f) => setFacilityType(f)}
            onOpenPlaceManager={() => setIsPlaceManagerOpen(true)}
            onOpenUploadStudio={() => setIsUploadStudioOpen(true)}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          {/* Active View Rendering or RBAC Guard */}
          <div className="transition-all duration-200">
            {!isViewAuthorized ? (
              <div className="dashboard-card p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-xl mx-auto space-y-5 my-12 shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Access Restricted by Role
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Your current persona (<strong className="text-orange-600 dark:text-orange-400">{user?.roleTitle}</strong>) does not have authorization to view this module.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveNav("dashboard")}
                    className="px-6 py-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-black transition cursor-pointer"
                  >
                    Back to Overview
                  </button>
                  <button
                    onClick={() => quickDemoLogin("director")}
                    className="px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md shadow-orange-500/30 transition cursor-pointer flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Elevate to Facility Director</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeNav === "dashboard" && (
                  <DashboardView
                    data={dashboardData}
                    onNavigate={(v) => setActiveNav(v as NavItem)}
                    facilityType={facilityType}
                  />
                )}
                {activeNav === "campus-map" && (
                  <CampusMapView
                    data={mapData}
                    facilityType={facilityType}
                    onOpenPlaceManager={() => setIsPlaceManagerOpen(true)}
                  />
                )}
                {activeNav === "energy-analytics" && (
                  <EnergyAnalyticsView
                    facilityType={facilityType}
                    facilityName={facilityLabels[facilityType] || "SRM KTR Campus"}
                  />
                )}
                {activeNav === "ai-insights" && (
                  <AiInsightsView
                    key={facilityType}
                    data={insightsData}
                    facilityName={facilityLabels[facilityType] || "SRM KTR Campus"}
                    facilityType={facilityType}
                  />
                )}
                {activeNav === "assets-operations" && (
                  <AssetsOperationsView
                    facilityType={facilityType}
                    facilityName={facilityLabels[facilityType] || "SRM KTR Campus"}
                  />
                )}
                {activeNav === "simulation" && (
                  <SimulationView
                    facilityName={facilityLabels[facilityType] || "SRM KTR Campus"}
                    facilityType={facilityType}
                  />
                )}
                {activeNav === "reports" && (
                  <ReportsView
                    data={reportsData}
                    facilityType={facilityType}
                    facilityName={facilityLabels[facilityType] || "SRM KTR Campus"}
                  />
                )}
                {activeNav === "safety" && <SafetyView data={safetyData} />}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Floating Navigation Dock (Active on screens < lg) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 px-2 sm:px-4 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex items-center justify-around"
      >
        {/* 1. Overview */}
        <button
          onClick={() => setActiveNav("dashboard")}
          className={`flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-4 rounded-2xl transition-all cursor-pointer ${
            activeNav === "dashboard"
              ? "text-orange-500 bg-orange-500/10 font-black shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeNav === "dashboard" ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="text-[10px] mt-1 tracking-tight">Overview</span>
        </button>

        {/* 2. Map */}
        <button
          onClick={() => setActiveNav("campus-map")}
          className={`flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-4 rounded-2xl transition-all cursor-pointer ${
            activeNav === "campus-map"
              ? "text-orange-500 bg-orange-500/10 font-black shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
          }`}
        >
          <MapPin className={`w-5 h-5 ${activeNav === "campus-map" ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="text-[10px] mt-1 tracking-tight">Map</span>
        </button>

        {/* 3. Energy */}
        <button
          onClick={() => setActiveNav("energy-analytics")}
          className={`flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-4 rounded-2xl transition-all cursor-pointer ${
            activeNav === "energy-analytics"
              ? "text-orange-500 bg-orange-500/10 font-black shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
          }`}
        >
          <Zap className={`w-5 h-5 ${activeNav === "energy-analytics" ? "stroke-[2.5]" : "stroke-2"}`} />
          <span className="text-[10px] mt-1 tracking-tight">Energy</span>
        </button>

        {/* 4. AI Insights */}
        <button
          onClick={() => setActiveNav("ai-insights")}
          className={`flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-4 rounded-2xl transition-all cursor-pointer relative ${
            activeNav === "ai-insights"
              ? "text-orange-500 bg-orange-500/10 font-black shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
          }`}
        >
          <div className="relative">
            <Sparkles className={`w-5 h-5 ${activeNav === "ai-insights" ? "stroke-[2.5]" : "stroke-2"}`} />
            {activeNav !== "ai-insights" && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">AI Insights</span>
        </button>

        {/* 5. More Modules Drawer Trigger */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-4 rounded-2xl transition-all cursor-pointer ${
            ["assets-operations", "simulation", "reports", "safety"].includes(activeNav)
              ? "text-orange-500 bg-orange-500/10 font-black shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
          }`}
        >
          <Menu className="w-5 h-5 stroke-2" />
          <span className="text-[10px] mt-1 tracking-tight">
            {["assets-operations", "simulation", "reports", "safety"].includes(activeNav) ? "More..." : "More"}
          </span>
        </button>
      </nav>

      {/* Interactive Neural LLM Executive Assistant Modal */}
      <AiExecutiveAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        facilityName={facilityLabels[facilityType] || "Campus Facility"}
        currentData={{
          healthScore: dashboardData?.facility_health?.overall_health_pct || 92,
          energyKwh: dashboardData?.kpi_cards?.energy_usage_kwh || 24850,
          peakKw: energyData?.kpis?.peak_demand_kw || 480,
          anomalies: dashboardData?.recent_alerts?.map((a) => `${a.severity}: ${a.message}`) || [],
          maintenanceAlerts: assetsData?.priority_maintenance?.map((m) => `${m.asset_name}: ${m.action_required}`) || [],
          safetyStatus: safetyData?.safety_analytics?.overall_safety_status || "97.1% SLA Compliant",
          sustainabilityScore: reportsData?.sustainability_score || 91,
        }}
      />

      {/* Custom Campus, Places & Multi-Sector Entry Manager Modal */}
      <CampusPlaceManagerModal
        isOpen={isPlaceManagerOpen}
        onClose={() => setIsPlaceManagerOpen(false)}
        activeCampusId={facilityType}
        onSelectCampus={(cId) => {
          setFacilityType(cId);
          setIsPlaceManagerOpen(false);
        }}
      />

      {/* Real Data Telemetry Ingestion & CSV Studio Modal */}
      <DataUploadStudioModal
        isOpen={isUploadStudioOpen}
        onClose={() => setIsUploadStudioOpen(false)}
        facilityType={facilityType}
        facilityName={facilityLabels[facilityType] || "SRM KTR Campus"}
        onDatasetApplied={() => {
          // Trigger refresh of energy analytics and dashboard data
          getEnergyAnalytics(facilityType).then(setEnergyData);
          getDashboardOverview(facilityType).then(setDashboardData);
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SmoothScroll>
          <AppContent />
        </SmoothScroll>
      </AuthProvider>
    </ThemeProvider>
  );
}
