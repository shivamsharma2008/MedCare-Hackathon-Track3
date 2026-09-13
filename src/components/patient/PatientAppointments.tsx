import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { Appointment } from "../../types";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  CalendarCheck2,
  Phone,
} from "lucide-react";

export const PatientAppointments: React.FC = () => {
  const { user, navigateTo } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await dbService.getPatientAppointments(user.id);
      setAppointments(list);
    } catch (err) {
      console.error("Error loading patient appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setCancellingId(id);
    try {
      await dbService.updateAppointmentStatus(id, "cancelled");
      await fetchAppointments();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-cyan-600" />
            <span>My Clinic Appointments</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track consultation appointments, slot confirmations, and clinic visit statuses.
          </p>
        </div>

        <button
          onClick={() => navigateTo("/patient/doctors")}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Calendar className="w-4 h-4" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading your appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-white rounded-2xl p-8 space-y-3">
          <CalendarCheck2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No scheduled appointments</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You don't have any upcoming or past appointments booked through MedCare yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Dr. {appt.doctor_name}</h3>
                    <p className="text-xs text-cyan-700 font-semibold">{appt.clinic_name}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      appt.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-800"
                        : appt.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : appt.status === "completed"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {appt.status.toUpperCase()}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center space-x-2 text-slate-800 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{appt.appointment_date}</span>
                    <span>&bull;</span>
                    <span className="text-cyan-800">{appt.slot_time}</span>
                  </div>

                  {appt.reason && (
                    <div className="text-[11px] text-slate-600 italic">
                      Reason: "{appt.reason}"
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(appt.status === "pending" || appt.status === "confirmed") && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => handleCancelAppointment(appt.id)}
                    disabled={cancellingId === appt.id}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                  >
                    {cancellingId === appt.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Cancel Appointment</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
