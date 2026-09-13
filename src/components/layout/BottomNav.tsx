import React from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Home,
  ScanLine,
  Users,
  Calendar,
  Search,
  FolderOpen,
  User,
} from "lucide-react";

interface BottomNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export const BottomNav: React.FC = () => {
  const { role, currentRoute, navigateTo } = useAuth();

  const doctorMobileItems: BottomNavItem[] = [
    { label: "Home", path: "/doctor/home", icon: Home },
    { label: "Scan", path: "/doctor/scan", icon: ScanLine, highlight: true },
    { label: "Patients", path: "/doctor/patients", icon: Users },
    { label: "Appts", path: "/doctor/appointments", icon: Calendar },
    { label: "Profile", path: "/doctor/profile", icon: User },
  ];

  const patientMobileItems: BottomNavItem[] = [
    { label: "Home", path: "/patient/home", icon: Home },
    { label: "Doctors", path: "/patient/doctors", icon: Search },
    { label: "Appts", path: "/patient/appointments", icon: Calendar },
    { label: "Files", path: "/patient/files", icon: FolderOpen },
    { label: "Profile", path: "/patient/profile", icon: User },
  ];

  const items = role === "doctor" ? doctorMobileItems : patientMobileItems;

  const isItemActive = (path: string) => {
    if (path === "/doctor/home" && (currentRoute === "/home" || currentRoute === "/doctor/home" || currentRoute === "/doctor")) {
      return true;
    }
    if (path === "/patient/home" && (currentRoute === "/patient/home" || currentRoute === "/patient")) {
      return true;
    }
    if (path === "/doctor/scan" && currentRoute === "/scan") return true;
    if (path === "/doctor/patients" && currentRoute === "/patients") return true;
    return currentRoute.startsWith(path);
  };

  return (
    <nav
      id="medcare-mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg shadow-slate-900/10"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isItemActive(item.path);

        return (
          <button
            key={item.path}
            id={`bottom-nav-${item.label.toLowerCase()}`}
            onClick={() => navigateTo(item.path)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors min-w-[56px] min-h-[44px] ${
              active
                ? "text-cyan-700 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className={`relative p-1 rounded-lg ${active ? "bg-cyan-50" : ""}`}>
              <Icon className={`w-5 h-5 ${active ? "text-cyan-700 stroke-[2.5]" : "text-slate-500"}`} />
              {item.highlight && !active && (
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-500" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
