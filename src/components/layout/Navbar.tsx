import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Activity,
  LogOut,
  User,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, role, logout, navigateTo, doctorProfile, patientProfile } = useAuth();

  const displayName =
    role === "doctor"
      ? doctorProfile?.name || user?.name || "Doctor"
      : patientProfile?.name || user?.name || "Patient";

  return (
    <header
      id="medcare-navbar"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between"
    >
      <div className="flex items-center space-x-3">
        <button
          id="btn-brand-logo"
          onClick={() => navigateTo(role === "doctor" ? "/doctor/home" : "/patient/home")}
          className="flex items-center space-x-2.5 text-left group focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-cyan-600/20 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-900">MedCare</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-50 text-cyan-700 rounded border border-cyan-200">
                WEB
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
              Rural Clinic & Prescription Digitizer
            </p>
          </div>
        </button>
      </div>

      {user && (
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
              {role === "doctor" ? (
                <Stethoscope className="w-4 h-4 text-cyan-600" />
              ) : (
                <User className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center space-x-1">
                <span className="text-xs font-semibold text-slate-800 max-w-[140px] truncate">
                  {displayName}
                </span>
                {role === "doctor" && (
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                )}
              </div>
              <span className="inline-block text-[10px] text-slate-500 capitalize font-medium">
                {role} Portal
              </span>
            </div>
          </div>

          <button
            id="btn-logout"
            onClick={logout}
            title="Sign Out"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
