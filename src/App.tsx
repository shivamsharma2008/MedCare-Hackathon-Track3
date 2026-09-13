import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { BottomNav } from "./components/layout/BottomNav";

// Auth Components
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";

// Doctor Components
import { DoctorHome } from "./components/doctor/DoctorHome";
import { DoctorScanParcha } from "./components/doctor/DoctorScanParcha";
import { DoctorPatients } from "./components/doctor/DoctorPatients";
import { DoctorAppointments } from "./components/doctor/DoctorAppointments";
import { DoctorAvailability } from "./components/doctor/DoctorAvailability";
import { DoctorDashboard } from "./components/doctor/DoctorDashboard";
import { DoctorProfile } from "./components/doctor/DoctorProfile";

// Patient Components
import { PatientHome } from "./components/patient/PatientHome";
import { PatientFindDoctor } from "./components/patient/PatientFindDoctor";
import { PatientAppointments } from "./components/patient/PatientAppointments";
import { PatientReports } from "./components/patient/PatientReports";
import { PatientHistory } from "./components/patient/PatientHistory";
import { PatientFiles } from "./components/patient/PatientFiles";
import { PatientCustomReport } from "./components/patient/PatientCustomReport";
import { PatientProfile } from "./components/patient/PatientProfile";

import { Activity, Loader2 } from "lucide-react";

const AppContent: React.FC = () => {
  const { user, role, loading, currentRoute } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4 text-white p-4">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center animate-pulse">
          <Activity className="w-8 h-8" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold tracking-tight">MedCare Clinical System</h2>
          <p className="text-xs text-slate-400 flex items-center justify-center space-x-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Establishing secure database session...</span>
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated
  if (!user) {
    if (currentRoute === "/register") {
      return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <RegisterPage />
          </main>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <LoginPage />
        </main>
      </div>
    );
  }

  // Doctor Route Resolver
  const renderDoctorContent = () => {
    if (currentRoute === "/doctor/scan" || currentRoute === "/scan") {
      return <DoctorScanParcha />;
    }
    if (currentRoute === "/doctor/patients" || currentRoute === "/patients") {
      return <DoctorPatients />;
    }
    if (currentRoute === "/doctor/appointments") {
      return <DoctorAppointments />;
    }
    if (currentRoute === "/doctor/availability") {
      return <DoctorAvailability />;
    }
    if (currentRoute === "/doctor/dashboard" || currentRoute === "/dashboard") {
      return <DoctorDashboard />;
    }
    if (currentRoute === "/doctor/profile" || currentRoute === "/doctor/settings") {
      return <DoctorProfile />;
    }
    // Default Doctor Home
    return <DoctorHome />;
  };

  // Patient Route Resolver
  const renderPatientContent = () => {
    if (currentRoute === "/patient/doctors" || currentRoute === "/doctors") {
      return <PatientFindDoctor />;
    }
    if (currentRoute === "/patient/appointments") {
      return <PatientAppointments />;
    }
    if (currentRoute === "/patient/reports") {
      return <PatientReports />;
    }
    if (currentRoute === "/patient/history") {
      return <PatientHistory />;
    }
    if (currentRoute === "/patient/files") {
      return <PatientFiles />;
    }
    if (currentRoute === "/patient/custom-report") {
      return <PatientCustomReport />;
    }
    if (currentRoute === "/patient/profile" || currentRoute === "/patient/settings") {
      return <PatientProfile />;
    }
    // Default Patient Home
    return <PatientHome />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 font-sans">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar (hidden on mobile) */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {role === "doctor" ? renderDoctorContent() : renderPatientContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation (shown only on mobile & tablet) */}
      <BottomNav />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
