"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown, Building2, Activity, Sun, Moon, LogOut, Shield, ShieldCheck, GraduationCap, Factory, Landmark, Key, Layers, Check, Menu } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth, DEMO_PERSONAS } from "../context/AuthContext";

interface HeaderProps {
  title: string;
  subtitle: string;
  selectedFacility: string;
  onFacilityChange: (facility: string) => void;
  userRole?: string;
  onRoleChange?: (role: string) => void;
  apiConnected?: boolean;
  onOpenPlaceManager?: () => void;
  onOpenUploadStudio?: () => void;
  onOpenMobileMenu?: () => void;
}

export default function Header({
  title,
  subtitle,
  selectedFacility,
  onFacilityChange,
  onOpenPlaceManager,
  onOpenUploadStudio,
  onOpenMobileMenu,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, switchRole } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isFacilityMenuOpen, setIsFacilityMenuOpen] = useState(false);
  const [personaSectorTab, setPersonaSectorTab] = useState<string>("active");
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false);
  const [showAuthDetails, setShowAuthDetails] = useState<boolean>(false);
  const profileRef = React.useRef<HTMLDivElement>(null);
  const facilityMenuRef = React.useRef<HTMLDivElement>(null);
  const sectorDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (facilityMenuRef.current && !facilityMenuRef.current.contains(event.target as Node)) {
        setIsFacilityMenuOpen(false);
      }
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) {
        setIsSectorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const defaultFacilities: { id: string; label: string; sector: string }[] = [
    { id: "engineering_college", label: "SRM Institute of Science and Technology, Kattankulathur", sector: "engineering_college" },
    { id: "industrial_estate", label: "Vedanta Aluminum & Power Plant Complex", sector: "industrial_estate" },
    { id: "hospital", label: "AIIMS Bhubaneswar Healthcare Complex", sector: "hospital" },
    { id: "municipal_campus", label: "Bhubaneswar Smart City Central Command", sector: "municipal_campus" },
  ];

  const [allFacilitiesList, setAllFacilitiesList] = useState(defaultFacilities);

  // Load custom places from LocalStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("campusiq_custom_places");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customList = parsed.filter((c: unknown): c is { id: string; name: string; sector?: string } =>
            typeof c === "object" && c !== null && "id" in c && typeof c.id === "string" && "name" in c && typeof c.name === "string"
          ).map((c) => ({ id: c.id, label: c.name, sector: c.sector || "engineering_college" }));
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore browser-local campus choices after the client mounts.
          setAllFacilitiesList(customList);
        }
      } catch {}
    }
  }, [selectedFacility]);

  // Strict Role-Based Filtering: Super Admin sees all; Sector roles only see their own facilities
  const isSuper = user?.isSuperAdmin || user?.sector === "all" || user?.permissions?.includes("*");
  const authorizedFacilities = isSuper
    ? allFacilitiesList
    : allFacilitiesList.filter(
        (f) => f.sector === user?.sector || f.id === user?.defaultSector || f.id === user?.sector
      );

  // Fallback if empty
  const displayFacilities = authorizedFacilities.length > 0 ? authorizedFacilities : allFacilitiesList;

  // Auto-sync active facility when a restricted role is active
  React.useEffect(() => {
    if (!isSuper && displayFacilities.length > 0) {
      const isCurrentAuthorized = displayFacilities.some((f) => f.id === selectedFacility);
      if (!isCurrentAuthorized) {
        onFacilityChange(displayFacilities[0].id);
      }
    }
  }, [user?.role, user?.sector, isSuper, displayFacilities, selectedFacility, onFacilityChange]);

  const getFacilityIcon = (sector?: string) => {
    switch (sector) {
      case "hospital":
        return <Building2 className="w-4.5 h-4.5 text-rose-500" />;
      case "industrial_estate":
        return <Factory className="w-4.5 h-4.5 text-amber-500" />;
      case "municipal_campus":
        return <Landmark className="w-4.5 h-4.5 text-cyan-500" />;
      case "engineering_college":
        return <GraduationCap className="w-4.5 h-4.5 text-orange-500" />;
      default:
        return <Building2 className="w-4.5 h-4.5 text-orange-500" />;
    }
  };

  const currentFacilityObj = allFacilitiesList.find((f) => f.id === selectedFacility) || displayFacilities[0];

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 sm:pb-5 border-b border-slate-200/90 dark:border-slate-800 transition-colors w-full">
      {/* Page Title, Subtitle, Mobile Menu Button & Inline Status */}
      <div className="min-w-0 flex-1 flex items-start gap-3">
        {/* Mobile Hamburger Drawer Trigger */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/90 text-slate-700 dark:text-slate-200 hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-500 shadow-xs transition cursor-pointer shrink-0 mt-0.5"
          >
            <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
              {title}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 shadow-xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>FastAPI ML Live</span>
            </div>
          </div>
          <p className="text-xs lg:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Control Groups Toolbar */}
      <div className="flex items-center flex-wrap gap-2 shrink-0 justify-start lg:justify-end">
        {/* 1. Sector / Facility Selector Pill */}
        <div className="relative shrink-0" ref={facilityMenuRef}>
          <button
            onClick={() => setIsFacilityMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-black rounded-full pl-2.5 pr-3 py-2 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer max-w-[155px] sm:max-w-[200px] md:max-w-[240px]"
          >
            <div className="w-5 h-5 rounded-full bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center shrink-0 border border-orange-200/50 dark:border-orange-900/50">
              {getFacilityIcon(currentFacilityObj?.sector)}
            </div>
            <span className="truncate">{currentFacilityObj?.label || "Select Facility"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                isFacilityMenuOpen ? "rotate-180 text-orange-500" : ""
              }`}
            />
          </button>

          {isFacilityMenuOpen && (
            <div
              data-lenis-prevent="true"
              className="absolute left-0 sm:left-auto right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
            >
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">Active Facility &amp; Campus</p>
                  <p className="text-[11px] font-bold text-slate-400">
                    {displayFacilities.length} Authorized {displayFacilities.length === 1 ? "Location" : "Locations"}
                  </p>
                </div>
                <Building2 className="w-4 h-4 text-orange-500" />
              </div>

              <div className="space-y-1.5 my-2 max-h-64 custom-scrollbar overflow-y-auto overscroll-contain pr-1" onWheel={(e) => e.stopPropagation()}>
                {displayFacilities.map((f) => {
                  const isSelected = f.id === selectedFacility;
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        onFacilityChange(f.id);
                        setIsFacilityMenuOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-2xl transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.01]"
                          : "hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 dark:bg-slate-800"
                          }`}
                        >
                          {getFacilityIcon(f.sector)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-black truncate ${isSelected ? "text-white" : "text-slate-900 dark:text-white"}`}>
                            {f.label}
                          </p>
                          <p className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                            {f.sector ? f.sector.replace(/_/g, " ") : "Institutional"}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {onOpenPlaceManager && (
                <button
                  onClick={() => {
                    setIsFacilityMenuOpen(false);
                    onOpenPlaceManager();
                  }}
                  className="w-full text-center py-2 text-[11px] font-black text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800/80 rounded-xl transition cursor-pointer border-t border-slate-100 dark:border-slate-800 mt-1"
                >
                  + Manage Places &amp; Add Custom Sector
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Unified Studio Actions Group */}
        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-xs shrink-0">
          {onOpenUploadStudio && (
            <button
              onClick={onOpenUploadStudio}
              title="Upload CSV sensor streams for energy, water, waste, and assets"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-xs transition cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px]">+ Ingest CSV</span>
            </button>
          )}

          {onOpenPlaceManager && (
            <button
              onClick={onOpenPlaceManager}
              title="Add or Manage Custom Campuses, Plants, Hospitals & Buildings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden md:inline text-[11px]">Places</span>
            </button>
          )}
        </div>

        {/* 3. Utility Group (Theme & Date) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark Mode"
            className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-300 dark:hover:border-orange-500 shadow-xs transition cursor-pointer flex items-center justify-center"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 animate-spin-once" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Date pill */}
          <div className="hidden 2xl:flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full px-3 py-1.5 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <span>
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* 4. Authenticated User Profile & Role Switcher */}
        {user && (
          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full pl-1.5 pr-2.5 sm:pr-3 py-1 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer max-w-[150px] sm:max-w-[190px] md:max-w-[220px]"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                {user.name[0]}
              </div>
              <div className="text-left hidden sm:block min-w-0 flex-1">
                <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight truncate">
                  {user.name.split(" ")[0]}
                </span>
                <span className="text-[9px] font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider block truncate">
                  {user.roleTitle}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${profileOpen ? "rotate-180 text-orange-500" : ""}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div
                data-lenis-prevent="true"
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-4 sm:p-4.5 z-50 animate-in fade-in-0 zoom-in-95 max-h-[85vh] overflow-hidden flex flex-col"
              >
                {/* Active User Header */}
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 shrink-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-400 font-semibold">{user.email}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">{user.department}</p>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shrink-0">
                      {user.sectorBadge || "CampusIQ"}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                      <span>{user.roleTitle}</span>
                    </div>

                    <button
                      onClick={() => setShowAuthDetails(!showAuthDetails)}
                      className="text-[10px] font-black text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                    >
                      {showAuthDetails ? "Hide Privileges" : `View Authorizations (${user.authorizations?.length || 0})`}
                    </button>
                  </div>

                  {/* Expandable Authorizations List */}
                  {showAuthDetails && user.authorizations && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-900/50 space-y-1.5 animate-in fade-in duration-150 max-h-36 custom-scrollbar overflow-y-auto" data-lenis-prevent="true" onWheel={(e) => e.stopPropagation()}>
                      <p className="text-[10px] font-black text-orange-900 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1">
                        <Key className="w-3 h-3 text-orange-500" /> Active Security Authorizations
                      </p>
                      <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 font-semibold">
                        {user.authorizations.map((auth, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{auth}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sector-Based Persona Switcher */}
                <div className="space-y-2 mb-3.5 flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Choose Sector &amp; Role (Demo)
                    </p>
                    <span className="text-[10px] font-bold text-orange-500">
                      1-Click Switch
                    </span>
                  </div>

                  {/* Custom Sector Dropdown Selector */}
                  <div className="relative shrink-0" ref={sectorDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsSectorDropdownOpen((prev) => !prev)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white shadow-2xs hover:border-orange-500/50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {(() => {
                          const activeOpt =
                            [
                              {
                                id: "active",
                                label: `Active Sector (${
                                  selectedFacility === "engineering_college"
                                    ? "College Campus"
                                    : selectedFacility === "industrial_estate"
                                    ? "Heavy Industry"
                                    : selectedFacility === "hospital"
                                    ? "Super Hospital"
                                    : "Smart City"
                                })`,
                                icon: Layers,
                                color: "text-orange-500",
                              },
                              { id: "engineering_college", label: "College Campus", icon: GraduationCap, color: "text-orange-400" },
                              { id: "industrial_estate", label: "Heavy Industry", icon: Factory, color: "text-amber-400" },
                              { id: "hospital", label: "Super-Speciality Hospital", icon: Building2, color: "text-rose-400" },
                              { id: "municipal_campus", label: "Smart City Command", icon: Landmark, color: "text-cyan-400" },
                              { id: "all", label: "Universal Super Admin", icon: Shield, color: "text-purple-400" },
                            ].find((s) => s.id === personaSectorTab) || {
                              id: "active",
                              label: "Active Sector",
                              icon: Layers,
                              color: "text-orange-500",
                            };
                          const ActiveIcon = activeOpt.icon;
                          return (
                            <>
                              <ActiveIcon className={`w-4 h-4 ${activeOpt.color} shrink-0`} />
                              <span className="truncate">{activeOpt.label}</span>
                            </>
                          );
                        })()}
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-orange-500 shrink-0 transition-transform duration-200 ${
                          isSectorDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isSectorDropdownOpen && (
                      <div
                        data-lenis-prevent="true"
                        className="absolute left-0 right-0 top-full mt-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar"
                      >
                        {[
                          {
                            id: "active",
                            label: `Active Sector (${
                              selectedFacility === "engineering_college"
                                ? "College Campus"
                                : selectedFacility === "industrial_estate"
                                ? "Heavy Industry"
                                : selectedFacility === "hospital"
                                ? "Super Hospital"
                                : "Smart City"
                            })`,
                            icon: Layers,
                            color: "text-orange-500",
                          },
                          { id: "engineering_college", label: "College Campus", icon: GraduationCap, color: "text-orange-400" },
                          { id: "industrial_estate", label: "Heavy Industry", icon: Factory, color: "text-amber-400" },
                          { id: "hospital", label: "Super-Speciality Hospital", icon: Building2, color: "text-rose-400" },
                          { id: "municipal_campus", label: "Smart City Command", icon: Landmark, color: "text-cyan-400" },
                          { id: "all", label: "Universal Super Admin", icon: Shield, color: "text-purple-400" },
                        ].map((opt) => {
                          const isSelected = personaSectorTab === opt.id;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setPersonaSectorTab(opt.id);
                                setIsSectorDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                isSelected
                                  ? "bg-orange-500 text-white shadow-xs"
                                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : opt.color} shrink-0`} />
                                <span className="truncate">{opt.label}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Sector Tab Selector (Pills) */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
                    {[
                      { id: "active", label: "Active Sector", icon: Layers },
                      { id: "engineering_college", label: "College", icon: GraduationCap },
                      { id: "industrial_estate", label: "Industry", icon: Factory },
                      { id: "hospital", label: "Hospital", icon: Building2 },
                      { id: "municipal_campus", label: "Smart City", icon: Landmark },
                      { id: "all", label: "Super Admin", icon: Shield },
                    ].map((tab) => {
                      const isSelected = personaSectorTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setPersonaSectorTab(tab.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap transition cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 dark:bg-orange-500 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Filtered Personas Scrollable List */}
                  <div
                    data-lenis-prevent="true"
                    onWheel={(e) => e.stopPropagation()}
                    className="space-y-2 max-h-56 sm:max-h-64 custom-scrollbar overflow-y-auto overscroll-contain pr-1 py-0.5 flex-1"
                  >
                    {DEMO_PERSONAS.filter((p) => {
                      if (personaSectorTab === "active") {
                        return p.sector === "all" || p.sector === selectedFacility;
                      }
                      return personaSectorTab === "all" ? p.sector === "all" : p.sector === personaSectorTab;
                    }).map((p) => {
                      const isCurrent = user.role === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            switchRole(p.id);
                            if (p.defaultSector && p.defaultSector !== selectedFacility) {
                              onFacilityChange(p.defaultSector);
                            }
                            setProfileOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-2xl border transition cursor-pointer ${
                            isCurrent
                              ? "bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 shadow-xs ring-1 ring-orange-500/20"
                              : "bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                              {p.title}
                            </span>
                            {isCurrent ? (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-500 text-white shrink-0">
                                Active
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                {p.badge}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                            <span>{p.name}</span>
                            <span>{p.department.split("&")[0]}</span>
                          </div>

                          {/* Key Authorization Snippet */}
                          {p.authorizations && p.authorizations.length > 0 && (
                            <div className="mt-1.5 flex items-center gap-1 overflow-hidden">
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 truncate">
                                {p.authorizations[0]}
                              </span>
                              {p.authorizations.length > 1 && (
                                <span className="text-[9px] font-bold text-slate-400 shrink-0">
                                  +{p.authorizations.length - 1} more
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="w-full shrink-0 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-black transition cursor-pointer border border-rose-200 dark:border-rose-900 shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
