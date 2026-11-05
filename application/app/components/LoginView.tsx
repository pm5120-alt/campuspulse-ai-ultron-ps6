"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Zap,
  Building2,
  KeyRound,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Shield,
  Loader2,
  GraduationCap,
  Factory,
  Landmark,
  Check,
  RotateCcw,
} from "lucide-react";
import { DEMO_PERSONAS, UserRole, FacilitySector, useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

interface SectorOption {
  id: FacilitySector | "all";
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SECTORS_LIST: SectorOption[] = [
  { id: "engineering_college", label: "College Campus", shortLabel: "College", icon: GraduationCap, color: "text-orange-500" },
  { id: "industrial_estate", label: "Heavy Smelter & Industry", shortLabel: "Industry", icon: Factory, color: "text-amber-500" },
  { id: "hospital", label: "Super-Speciality Hospital", shortLabel: "Hospital", icon: Building2, color: "text-rose-500" },
  { id: "municipal_campus", label: "Smart City Command", shortLabel: "Smart City", icon: Landmark, color: "text-cyan-500" },
  { id: "all", label: "Universal Super Admin", shortLabel: "Master Admin", icon: Shield, color: "text-purple-500" },
];

export default function LoginView() {
  const { login, quickDemoLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [selectedSector, setSelectedSector] = useState<FacilitySector | "all">("engineering_college");
  const [email, setEmail] = useState("dean@campuspulse.local");
  const [password, setPassword] = useState("demo-password-123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<UserRole>("college_dean");
  const [rememberSession, setRememberSession] = useState(true);

  // Filter personas strictly by selected sector
  const filteredPersonas = DEMO_PERSONAS.filter((p) => {
    if (selectedSector === "all") {
      return p.sector === "all";
    }
    return p.sector === selectedSector;
  });

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || "Authentication failed. Please verify credentials.");
      }
    } catch {
      setError("An unexpected authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = (p: typeof DEMO_PERSONAS[0]) => {
    setSelectedPersona(p.id);
    setEmail(p.email);
    setPassword(p.password);
    setError(null);
  };

  const handleInstantLogin = async (pId: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await quickDemoLogin(pId);
    } finally {
      setLoading(false);
    }
  };

  const handleSectorChange = (secId: FacilitySector | "all") => {
    setSelectedSector(secId);
    const matching = DEMO_PERSONAS.filter((p) => (secId === "all" ? p.sector === "all" : p.sector === secId));
    if (matching.length > 0) {
      handleSelectPersona(matching[0]);
    }
  };

  const activePersonaObj = DEMO_PERSONAS.find((p) => p.id === selectedPersona);

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-slate-950 dark:text-slate-100 selection:bg-orange-500 selection:text-white relative overflow-x-hidden transition-colors duration-200">
      {/* Cinematic Dual-Theme Background System */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Light Mode Layer: Golden Hour Campus */}
        <div className="absolute inset-0">
          <Image
            src="/Golden Hour Future Campus.png"
            alt="Golden Hour Future Campus"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-center scale-100"
          />
          <div className="absolute inset-0 bg-slate-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30" />
        </div>

        {/* Dark Mode Layer: Moonlit Courtyard with Circular Radial Reveal (Bottom-Right -> Top-Left) */}
        <div
          className="absolute inset-0 transition-[clip-path] duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[clip-path]"
          style={{
            clipPath: theme === "dark" ? "circle(160% at 100% 100%)" : "circle(0% at 100% 100%)",
          }}
        >
          <Image
            src="/Moonlit Futuristic Campus Courtyard.png"
            alt="Moonlit Futuristic Campus Courtyard"
            fill
            priority
            sizes="100vw"
            className="w-full h-full object-cover object-center scale-100"
          />
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40" />
        </div>
      </div>

      {/* Main Centered Auth Container */}
      <div className="w-full max-w-2xl relative z-10 my-auto py-6 sm:py-8 space-y-6">
        {/* Top Branding & Status Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-white/35 dark:bg-slate-900/45 backdrop-blur-xl px-4 py-2 rounded-2xl border-2 border-white/60 dark:border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-500/30">
              <Zap className="w-5 h-5 text-white fill-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-950 dark:text-white leading-none drop-shadow-xs">
                  Campus<span className="text-orange-500">IQ</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-950 dark:text-orange-300 border border-orange-400/50">
                  AI OS
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 drop-shadow-xs">
                Institutional Multi-Sector Command Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className="hidden sm:flex items-center gap-2 bg-white/35 dark:bg-slate-900/45 backdrop-blur-xl px-3.5 py-2 rounded-2xl border-2 border-white/60 dark:border-white/15 text-xs font-black text-emerald-900 dark:text-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
              aria-label="System status: FastAPI ML v2.4 Live"
            >
              <span>ML Engine Active</span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl bg-white/35 dark:bg-slate-900/45 hover:bg-white/55 dark:hover:bg-slate-800/60 text-slate-900 dark:text-slate-100 border-2 border-white/60 dark:border-white/15 transition cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-slate-900" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>

        {/* Centered Ultra-Transparent Frosted Glass Authentication Card */}
        <section
          aria-labelledby="auth-heading"
          className="bg-white/25 dark:bg-slate-950/40 backdrop-blur-2xl border-2 border-white/60 dark:border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,0.7)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15)] space-y-6"
        >
          <div>
            <h1 id="auth-heading" className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight drop-shadow-xs">
              Sign In to Your Facility
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed drop-shadow-xs">
              Select your organization sector below, pick an authorized role persona, or enter your credentials.
            </p>
          </div>

          {/* Accessible Error Alert */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-2xl bg-rose-500/25 border-2 border-rose-400/60 text-rose-950 dark:text-rose-200 text-xs font-extrabold flex items-center gap-2 backdrop-blur-md shadow-md"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Sector Selection Tablist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black">
              <span id="sector-select-label" className="text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5 drop-shadow-xs">
                <Building2 className="w-4 h-4 text-orange-500" aria-hidden="true" />
                <span>1. Select Facility Sector</span>
              </span>
              <span className="text-slate-800 dark:text-slate-200 font-extrabold text-[11px] drop-shadow-xs">
                {filteredPersonas.length} Authorized Roles
              </span>
            </div>

            <div
              role="tablist"
              aria-labelledby="sector-select-label"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"
            >
              {SECTORS_LIST.map((sec) => {
                const isSelected = selectedSector === sec.id;
                const IconComponent = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    role="tab"
                    id={`tab-${sec.id}`}
                    aria-selected={isSelected}
                    aria-controls="persona-panel"
                    onClick={() => handleSectorChange(sec.id)}
                    className={`p-2.5 sm:p-3 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 backdrop-blur-md focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none ${isSelected
                      ? "border-2 border-orange-500 bg-orange-500/25 dark:bg-orange-500/30 text-orange-950 dark:text-orange-100 shadow-md ring-2 ring-orange-500/40 font-black"
                      : "border border-white/50 dark:border-white/10 bg-white/20 hover:bg-white/40 dark:bg-white/5 dark:hover:bg-white/15 text-slate-900 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:border-white/80"
                      }`}
                  >
                    <IconComponent className={`w-5 h-5 ${isSelected ? "text-orange-500" : "text-slate-700 dark:text-slate-300"}`} />
                    <span className="text-[11px] font-black tracking-tight leading-tight line-clamp-1">
                      {sec.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Role Persona Quick-Select */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black">
              <span id="persona-select-label" className="text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5 drop-shadow-xs">
                <KeyRound className="w-4 h-4 text-orange-500" aria-hidden="true" />
                <span>2. Select Role Persona</span>
              </span>
              <span className="text-[11px] text-orange-700 dark:text-orange-300 font-extrabold drop-shadow-xs">
                Click to Auto-fill or Double-click for Direct Login
              </span>
            </div>

            <div
              id="persona-panel"
              role="tabpanel"
              aria-labelledby={`tab-${selectedSector}`}
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 py-0.5 custom-scrollbar"
            >
              {filteredPersonas.map((p) => {
                const isSelected = selectedPersona === p.id;
                const isSuper = p.isSuperAdmin;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPersona(p)}
                    onDoubleClick={() => handleInstantLogin(p.id)}
                    className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between gap-2 backdrop-blur-md focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none ${isSelected
                      ? "border-2 border-orange-500 bg-orange-500/25 dark:bg-orange-500/30 ring-2 ring-orange-500/40 shadow-md"
                      : isSuper
                        ? "border border-purple-400/50 dark:border-purple-500/30 bg-purple-500/20 hover:bg-purple-500/30"
                        : "border border-white/50 dark:border-white/10 bg-white/20 hover:bg-white/40 dark:bg-white/5 dark:hover:bg-white/15 hover:border-white/80"
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-black text-slate-950 dark:text-white truncate">{p.title}</span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${isSelected
                            ? "bg-orange-500 text-white shadow-xs"
                            : isSuper
                              ? "bg-purple-600/30 text-purple-950 dark:text-purple-200 border border-purple-400/40"
                              : "bg-white/40 dark:bg-white/10 text-slate-900 dark:text-slate-200 border border-white/40 dark:border-white/15"
                            }`}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-800 dark:text-slate-300 font-bold mt-0.5">{p.name}</p>
                    </div>

                    {p.authorizations && p.authorizations.length > 0 && (
                      <div className="pt-1.5 border-t border-white/40 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-800 dark:text-slate-300 font-bold">
                        <span className={`font-black truncate flex items-center gap-1 ${isSelected ? "text-orange-950 dark:text-orange-300" : "text-slate-900 dark:text-slate-200"}`}>
                          <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`} aria-hidden="true" />
                          <span className="truncate">{p.authorizations[0]}</span>
                        </span>
                        {p.authorizations.length > 1 && (
                          <span className="text-slate-700 dark:text-slate-300 shrink-0 font-extrabold ml-1">
                            +{p.authorizations.length - 1}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Sign In Form */}
          <form onSubmit={handleManualLogin} className="space-y-4 pt-1" aria-label="Credentials Form">
            <div>
              <label htmlFor="login-email" className="block text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-1.5 drop-shadow-xs">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-700 dark:text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@campusiq.ai"
                  className="w-full bg-white/30 focus:bg-white/50 dark:bg-black/35 dark:focus:bg-black/55 border border-white/50 dark:border-white/15 text-sm font-bold text-slate-950 dark:text-white rounded-2xl pl-11 pr-4 py-3 placeholder:text-slate-600 dark:placeholder:text-slate-400 focus:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:outline-none transition shadow-xs backdrop-blur-md"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white mb-1.5 drop-shadow-xs">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-700 dark:text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-white/30 focus:bg-white/50 dark:bg-black/35 dark:focus:bg-black/55 border border-white/50 dark:border-white/15 text-sm font-bold text-slate-950 dark:text-white rounded-2xl pl-11 pr-11 py-3 placeholder:text-slate-600 dark:placeholder:text-slate-400 focus:border-orange-500 focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:outline-none transition shadow-xs backdrop-blur-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none rounded-lg"
                  aria-label={showPassword ? "Hide password text" : "Show password text"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs pt-1">
              <label
                onClick={() => setRememberSession(!rememberSession)}
                className="flex items-center gap-2.5 cursor-pointer select-none group"
              >
                <div
                  role="checkbox"
                  aria-checked={rememberSession}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setRememberSession(!rememberSession);
                    }
                  }}
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200 border-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none ${rememberSession
                    ? "bg-gradient-to-tr from-orange-500 to-amber-400 border-orange-300 text-white shadow-md shadow-orange-500/40 ring-2 ring-orange-500/30"
                    : "bg-white/40 dark:bg-white/10 border-white/80 dark:border-white/20 text-transparent hover:border-orange-400 backdrop-blur-md"
                    }`}
                >
                  <Check className={`w-3.5 h-3.5 stroke-[3.5] transition-transform duration-150 ${rememberSession ? "scale-100" : "scale-0"}`} />
                </div>
                <span className="font-extrabold text-slate-950 dark:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] tracking-wide dark:group-hover:text-orange-400 transition-colors">
                  Remember session
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  if (activePersonaObj) {
                    setPassword(activePersonaObj.password);
                    setEmail(activePersonaObj.email);
                  }
                }}
                className="text-xs font-black px-3 py-1.5 rounded-xl bg-orange-500/25 hover:bg-orange-500/40 text-orange-950 dark:text-orange-100 border border-orange-400/60 hover:border-orange-400 backdrop-blur-md transition-all cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none flex items-center gap-1.5 drop-shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-orange-800 dark:text-orange-300 stroke-[2.5]" />
                <span>Reset Demo Password</span>
              </button>
            </div>

            {/* Login Submit CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-orange-500/30 border border-white/40 transition-all transform active:scale-98 cursor-pointer disabled:opacity-75 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:outline-none"
            >
              {loading ? (
                <span className="flex items-center gap-2" role="status" aria-live="polite">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Authenticating Access...</span>
                </span>
              ) : (
                <>
                  <span>Sign In as {activePersonaObj?.title || "User"}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </section>

        {/* Security and Compliance Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/95 font-bold px-4 py-2.5 rounded-2xl bg-black/35 backdrop-blur-2xl border border-white/25 shadow-lg shadow-black/20">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>Role-Based Access Control (RBAC) &bull; AES-256 Encrypted</span>
          </div>
          <div>CampusIQ Enterprise v2.4</div>
        </footer>
      </div>
    </main>
  );
}
