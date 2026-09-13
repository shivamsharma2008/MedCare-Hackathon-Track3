import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { ParchaRecord, Appointment } from "../../types";
import {
  Users,
  ScanLine,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Stethoscope,
  PlusCircle,
  FileText,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export const DoctorHome: React.FC = () => {
  const { user, doctorProfile, navigateTo } = useAuth();
  const [parchas, setParchas] = useState<ParchaRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [loadedParchas, loadedAppts] = await Promise.all([
          dbService.getDoctorParchas(user.id),
          dbService.getDoctorAppointments(user.id),
        ]);
        setParchas(loadedParchas);
        setAppointments(loadedAppts);
      } catch (err) {
        console.error("Error loading doctor home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Derive unique real patients count
  const uniquePatients = new Set(parchas.map((p) => p.patient_name.trim().toLowerCase())).size;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayVisits = parchas.filter((p) => p.visit_date === todayStr).length;
  const pendingAppointments = appointments.filter((a) => a.status === "pending").length;
  const completedVisits = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome, Dr. {doctorProfile?.name || user?.name || "Doctor"}
            </h1>
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-sm text-slate-300">
            {doctorProfile?.clinic_name || "MedCare Clinic"} &bull;{" "}
            {doctorProfile?.specialization || "General Medicine"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-quick-scan-parcha"
            onClick={() => navigateTo("/doctor/scan")}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-cyan-500/20 flex items-center space-x-2 transition-transform active:scale-95"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan Parcha</span>
          </button>
          <button
            id="btn-quick-appointments"
            onClick={() => navigateTo("/doctor/appointments")}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs sm:text-sm border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (Strictly Real Database Values: starts at 0 for new doctor) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Patients</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {loading ? "..." : uniquePatients}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Distinct verified records</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Visits</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {loading ? "..." : todayVisits}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Recorded on {todayStr}</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Appts</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {loading ? "..." : pendingAppointments}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Awaiting doctor confirmation</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Visits</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {loading ? "..." : completedVisits}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Fulfilled appointments</p>
        </div>
      </div>

      {/* Main Content Sections: Grid for Desktop & Tablet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Scanned Parchas */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Prescription Parchas</h2>
              <p className="text-xs text-slate-500">Handwritten records digitized with Gemini AI</p>
            </div>
            <button
              onClick={() => navigateTo("/doctor/patients")}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading prescription records...</div>
          ) : parchas.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl p-6 space-y-3">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-700">No patient records yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Digitize your first prescription parcha using your mobile camera or desktop webcam.
                </p>
              </div>
              <button
                onClick={() => navigateTo("/doctor/scan")}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Scan First Prescription</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {parchas.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={p.image_url}
                      alt="Parcha thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-200 flex-shrink-0"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{p.patient_name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {p.patient_age ? `${p.patient_age} yrs` : ""} {p.patient_gender || ""} &bull;{" "}
                        <span className="font-medium text-slate-700">{p.diagnosis || "Consultation"}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p.visit_date} &bull; {p.medicines?.length || 0} medications prescribed
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo("/doctor/patients")}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-cyan-500 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-2xs"
                  >
                    Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment Queue / Today's Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Appointment Queue</h2>
            <button
              onClick={() => navigateTo("/doctor/appointments")}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700"
            >
              Manage
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-xl p-4 space-y-2">
              <Calendar className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">No appointments scheduled</p>
              <p className="text-[11px] text-slate-400">
                Patients booking through MedCare doctor search will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[340px]">
              {appointments.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{a.patient_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        a.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800"
                          : a.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : a.status === "completed"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center text-[11px] text-slate-500 space-x-2">
                    <span>{a.appointment_date}</span>
                    <span>&bull;</span>
                    <span className="font-semibold text-cyan-700">{a.slot_time}</span>
                  </div>
                  {a.reason && (
                    <p className="text-[11px] text-slate-600 italic truncate">"{a.reason}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
