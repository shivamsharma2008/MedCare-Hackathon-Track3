import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  ScanLine,
  Users,
  Calendar,
  Clock,
  LayoutDashboard,
  Settings,
  Search,
  FileText,
  History,
  FolderOpen,
  Sliders,
  User,
  Sparkles,
  HeartHandshake,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { role, currentRoute, navigateTo, doctorProfile, patientProfile } = useAuth();

  const doctorNavItems = [
    { label: "Home", path: "/doctor/home", icon: Home },
    { label: "Scan Parcha", path: "/doctor/scan", icon: ScanLine, highlight: true },
    { label: "Patients", path: "/doctor/patients", icon: Users },
    { label: "Appointments", path: "/doctor/appointments", icon: Calendar },
    { label: "Availability", path: "/doctor/availability", icon: Clock },
    { label: "Clinic Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
    { label: "Settings", path: "/doctor/profile", icon: Settings },
  ];

  const patientNavItems = [
    { label: "Home", path: "/patient/home", icon: Home },
    { label: "Find Doctor", path: "/patient/doctors", icon: Search, highlight: true },
    { label: "Appointments", path: "/patient/appointments", icon: Calendar },
    { label: "Health Reports", path: "/patient/reports", icon: FileText },
    { label: "Medical History", path: "/patient/history", icon: History },
    { label: "My Files", path: "/patient/files", icon: FolderOpen },
    { label: "Customize Report", path: "/patient/custom-report", icon: Sliders },
    { label: "Profile", path: "/patient/profile", icon: User },
    { label: "Settings", path: "/patient/settings", icon: Settings },
  ];

  const items = role === "doctor" ? doctorNavItems : patientNavItems;

  const isItemActive = (path: string) => {
    if (path === "/doctor/home" && (currentRoute === "/home" || currentRoute === "/doctor/home" || currentRoute === "/doctor")) {
      return true;
    }
    if (path === "/patient/home" && (currentRoute === "/patient/home" || currentRoute === "/patient")) {
      return true;
    }
    if (path === "/doctor/scan" && currentRoute === "/scan") return true;
    if (path === "/doctor/patients" && currentRoute === "/patients") return true;
    if (path === "/doctor/dashboard" && currentRoute === "/dashboard") return true;
    return currentRoute.startsWith(path);
  };

  return (
    <aside
      id="medcare-desktop-sidebar"
      className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-shrink-0 min-h-[calc(100vh-57px)] select-none"
    >
      <div className="p-4 border-b border-slate-800">
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
              {role === "doctor" ? "DR" : "PT"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {role === "doctor"
                  ? doctorProfile?.clinic_name || "Doctor Portal"
                  : patientProfile?.name || "Patient Portal"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {role === "doctor" ? doctorProfile?.specialization || "Physician" : "Personal Health Records"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {role === "doctor" ? "Clinical Operations" : "Health Navigator"}
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.path);

          return (
            <button
              key={item.path}
              id={`sidebar-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => navigateTo(item.path)}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                active
                  ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400"}`} />
              <span className="truncate">{item.label}</span>
              {item.highlight && !active && (
                <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
        <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300">Gemini 3.8 AI Enabled</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500">
          Instant handwritten parcha extraction & prescription OCR.
        </p>
      </div>
    </aside>
  );
};
