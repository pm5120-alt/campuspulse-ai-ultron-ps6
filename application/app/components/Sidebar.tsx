"use client";

import React from "react";
import {
  LayoutDashboard,
  MapPin,
  Zap,
  Sparkles,
  Wrench,
  Sliders,
  FileBarChart,
  ShieldCheck,
  Flame,
  ChevronRight,
  Lock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export type NavItem =
  | "dashboard"
  | "campus-map"
  | "energy-analytics"
  | "ai-insights"
  | "assets-operations"
  | "simulation"
  | "reports"
  | "safety";

interface SidebarProps {
  activeNav: NavItem;
  onSelectNav: (nav: NavItem) => void;
  userRole?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  activeNav,
  onSelectNav,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const { user, logout, hasPermission } = useAuth();

  const navItems = [
    { id: "dashboard" as NavItem, label: "Dashboard", icon: LayoutDashboard, requiredPerm: "view_overview" },
    { id: "campus-map" as NavItem, label: "Campus Map", icon: MapPin, requiredPerm: "view_map" },
    { id: "energy-analytics" as NavItem, label: "Energy", icon: Zap, requiredPerm: "energy_control" },
    { id: "ai-insights" as NavItem, label: "AI Insights", icon: Sparkles, requiredPerm: "view_insights" },
    { id: "assets-operations" as NavItem, label: "Assets", icon: Wrench, requiredPerm: "asset_diagnostics" },
    { id: "simulation" as NavItem, label: "Simulation", icon: Sliders, requiredPerm: "simulation_run" },
    { id: "reports" as NavItem, label: "Reports", icon: FileBarChart, requiredPerm: "esg_export" },
    { id: "safety" as NavItem, label: "Safety", icon: ShieldCheck, requiredPerm: "safety_dispatch" },
  ];

  return (
    <>
      {/* 1. Mobile Backdrop & Slide-Over Drawer (Visible on < lg screens when isMobileOpen is true) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Dark Glass Backdrop */}
          <div
            onClick={onMobileClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Drawer Content */}
          <aside className="fixed inset-y-0 left-0 w-72 sm:w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white shrink-0">
                    <Flame className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none">
                      Campus<span className="text-orange-500">IQ</span>
                    </h1>
                    <p className="text-[10px] font-extrabold text-slate-400 mt-0.5 uppercase tracking-wider">
                      Mobile Navigation
                    </p>
                  </div>
                </div>

                <button
                  onClick={onMobileClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation links in Mobile Drawer */}
              <nav className="space-y-1.5 p-3.5 max-h-[calc(100vh-170px)] overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  const isAuthorized =
                    hasPermission(item.requiredPerm) ||
                    hasPermission("view_all") ||
                    item.id === "dashboard";

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectNav(item.id);
                        onMobileClose?.();
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl font-extrabold transition-all duration-200 text-left cursor-pointer ${
                        isActive
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                          : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 ${
                          isActive ? "text-white stroke-[2.5]" : "text-slate-400 stroke-[2]"
                        }`}
                      />
                      <span className="flex-1 text-sm">{item.label}</span>
                      {item.id === "ai-insights" && !isActive && (
                        <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping mr-1" />
                      )}
                      {!isAuthorized && !isActive && (
                        <span title="Restricted role view">
                          <Lock className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Drawer Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              {user && (
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-xs shrink-0">
                      {user.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider truncate">
                        {user.roleTitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      onMobileClose?.();
                    }}
                    title="Sign Out"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* 2. Desktop Fixed Sidebar (Hidden on < lg screens) */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 flex-col justify-between z-40 select-none shadow-xs transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-80"
        }`}
      >
      {/* Brand Header */}
      <div>
        <div className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 ${
          isCollapsed ? "p-4 flex-col gap-3" : "p-6"
        }`}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 text-white font-extrabold transform hover:rotate-3 transition duration-200 shrink-0">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden transition-opacity duration-200">
                <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none">
                  Campus<span className="text-orange-500">IQ</span>
                </h1>
                <p className="text-[10px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider">
                  Facility Intelligence
                </p>
              </div>
            )}
          </div>

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-orange-500" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation links */}
        <nav className={`space-y-1.5 mt-4 ${isCollapsed ? "px-2.5" : "px-4"}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const isAuthorized =
              hasPermission(item.requiredPerm) ||
              hasPermission("view_all") ||
              item.id === "dashboard";

            return (
              <button
                key={item.id}
                onClick={() => onSelectNav(item.id)}
                title={isCollapsed ? `${item.label}${!isAuthorized ? " (Locked)" : ""}` : undefined}
                className={`w-full flex items-center rounded-2xl font-extrabold transition-all duration-200 text-left cursor-pointer group relative ${
                  isCollapsed
                    ? "justify-center p-3.5"
                    : "gap-3.5 px-4 py-3 text-[14px]"
                } ${
                  isActive
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800"
                }`}
              >
                <Icon
                  className={`w-5.5 h-5.5 transition-colors shrink-0 ${
                    isActive ? "text-white stroke-[2.5]" : "text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 stroke-[2]"
                  }`}
                />

                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.id === "ai-insights" && !isActive && (
                      <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping mr-1" />
                    )}
                    {!isAuthorized && !isActive && (
                      <span title="Restricted role view">
                        <Lock className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                  </>
                )}

                {/* Collapsed Active Indicator Pill */}
                {isCollapsed && isActive && (
                  <span className="absolute -left-1 w-1.5 h-6 bg-orange-500 rounded-r-full" />
                )}

                {/* Collapsed Ping dot on AI Insights */}
                {isCollapsed && item.id === "ai-insights" && !isActive && (
                  <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-orange-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Profile Section */}
      <div className={`border-t border-slate-100 dark:border-slate-800 ${
        isCollapsed ? "p-3" : "p-4"
      }`}>
        {user && (
          <div className={`flex items-center bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs ${
            isCollapsed ? "flex-col gap-2 p-2.5" : "justify-between p-3"
          }`}>
            <div className={`flex items-center min-w-0 ${isCollapsed ? "flex-col" : "gap-3"}`}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0">
                {user.name[0]}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 truncate uppercase tracking-wider">
                    {user.roleTitle}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
