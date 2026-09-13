import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { Appointment, ParchaRecord, HealthFile } from "../../types";
import {
  Heart,
  Search,
  Calendar,
  FileText,
  FolderOpen,
  ArrowRight,
  Clock,
  Pill,
  ShieldCheck,
  User,
  Sliders,
} from "lucide-react";

export const PatientHome: React.FC = () => {
  const { user, patientProfile, navigateTo } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [parchas, setParchas] = useState<ParchaRecord[]>([]);
  const [files, setFiles] = useState<HealthFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadPatientData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [appts, recs, fls] = await Promise.all([
          dbService.getPatientAppointments(user.id),
          dbService.getPatientParchas(user.id, user.name),
          dbService.getPatientFiles(user.id),
        ]);
        setAppointments(appts);
        setParchas(recs);
        setFiles(fls);
      } catch (err) {
        console.error("Error loading patient home:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPatientData();
  }, [user]);

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "confirmed" || a.status === "pending"
  );
  const activeMedications = parchas.flatMap((p) => p.medicines || []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Patient Welcome Header */}
      <div className="bg-gradient-to-r from-teal-800 to-cyan-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Hello, {patientProfile?.name || user?.name || "Patient"}
            </h1>
            <Heart className="w-5 h-5 text-teal-300 fill-teal-300/30" />
          </div>
          <p className="text-sm text-teal-100/90">
            Welcome to your digital health records & clinic navigation portal.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-patient-quick-find-doc"
            onClick={() => navigateTo("/patient/doctors")}
            className="px-5 py-2.5 bg-white hover:bg-teal-50 text-teal-900 font-bold rounded-xl text-xs sm:text-sm shadow-sm flex items-center space-x-2 transition-transform active:scale-95"
          >
            <Search className="w-4 h-4 text-teal-700" />
            <span>Find a Doctor</span>
          </button>
          <button
            id="btn-patient-quick-custom-report"
            onClick={() => navigateTo("/patient/custom-report")}
            className="px-4 py-2.5 bg-teal-950/50 hover:bg-teal-950/70 text-white font-medium rounded-xl text-xs sm:text-sm border border-teal-500/30 transition-colors flex items-center space-x-1.5"
          >
            <Sliders className="w-4 h-4 text-cyan-300" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => navigateTo("/patient/doctors")}
          className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">Find Doctor</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Nearby clinics by GPS</p>
        </button>

        <button
          onClick={() => navigateTo("/patient/appointments")}
          className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">Appointments</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{upcomingAppointments.length} Active</p>
        </button>

        <button
          onClick={() => navigateTo("/patient/reports")}
          className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">Health Reports</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{parchas.length} Records</p>
        </button>

        <button
          onClick={() => navigateTo("/patient/files")}
          className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left transition-all shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <FolderOpen className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">My Files</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{files.length} Uploaded</p>
        </button>
      </div>

      {/* Main Grid for Upcoming Visits & Medical Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upcoming Clinic Consultations</h2>
              <p className="text-xs text-slate-500">Scheduled visits with registered doctors</p>
            </div>
            <button
              onClick={() => navigateTo("/patient/appointments")}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading appointments...</div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl p-6 space-y-3">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-slate-700">No active appointments</h3>
                <p className="text-[11px] text-slate-500">
                  Search for a nearby doctor and book a consultation slot in seconds.
                </p>
              </div>
              <button
                onClick={() => navigateTo("/patient/doctors")}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg inline-flex items-center space-x-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Nearby Doctors</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{appt.doctor_name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          appt.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {appt.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{appt.clinic_name}</p>
                    <div className="flex items-center text-[11px] text-slate-500 space-x-2">
                      <Clock className="w-3 h-3 text-cyan-600" />
                      <span>{appt.appointment_date}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-cyan-700">{appt.slot_time}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigateTo("/patient/appointments")}
                    className="self-start sm:self-auto px-3.5 py-1.5 bg-white border border-slate-200 hover:border-cyan-500 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs"
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prescriptions Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Prescriptions</h2>
            <button
              onClick={() => navigateTo("/patient/reports")}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700"
            >
              All Reports
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading prescriptions...</div>
          ) : parchas.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl p-4 space-y-2">
              <Pill className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-medium text-slate-600">No prescriptions digitized yet</p>
              <p className="text-[11px] text-slate-400">
                Parchas digitized during doctor visits will automatically appear in your record.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {parchas.slice(0, 3).map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{p.diagnosis || "Consultation"}</span>
                    <span className="text-[10px] text-slate-500">{p.visit_date}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">Dr. {p.doctor_name} &bull; {p.clinic_name}</p>
                  <p className="text-[10px] text-cyan-700 font-semibold">
                    {p.medicines?.length || 0} medications prescribed
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
