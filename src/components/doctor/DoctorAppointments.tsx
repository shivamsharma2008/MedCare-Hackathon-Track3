import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { Appointment, AppointmentStatus } from "../../types";
import {
  Calendar,
  Clock,
  Check,
  X,
  CheckCircle,
  User,
  Phone,
  Filter,
  AlertCircle,
  Loader2,
  CalendarCheck2,
} from "lucide-react";

export const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dbService.getDoctorAppointments(user.id);
      setAppointments(data);
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    setUpdatingId(id);
    try {
      await dbService.updateAppointmentStatus(id, status);
      await fetchAppointments();
    } catch (err) {
      console.error("Error updating appointment status:", err);
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = appointments.filter((a) => {
    if (filterStatus === "all") return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-cyan-600" />
            <span>Clinic Appointments & Booking Schedule</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Confirm, reject, or complete consultation bookings from patients.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          {["all", "pending", "confirmed", "completed", "cancelled"].map((st) => (
            <button
              key={st}
              id={`filter-appt-${st}`}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Content */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading appointment schedule...</div>
      ) : appointments.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-white rounded-2xl p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No appointments scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Patients who discover your clinic through MedCare Doctor Search will book real consultation slots here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          No appointments found under status "{filterStatus}".
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Patient Information</th>
                  <th className="py-3 px-4">Date & Time Slot</th>
                  <th className="py-3 px-4">Chief Complaint / Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{appt.patient_name}</div>
                      {appt.patient_phone && (
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{appt.patient_phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{appt.appointment_date}</div>
                      <div className="text-[11px] text-cyan-700 font-medium flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{appt.slot_time}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">
                      {appt.reason || "General Consultation"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
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
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {updatingId === appt.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-600 inline-block" />
                      ) : (
                        <>
                          {appt.status === "pending" && (
                            <>
                              <button
                                id={`btn-confirm-appt-${appt.id}`}
                                onClick={() => handleUpdateStatus(appt.id, "confirmed")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs inline-flex items-center space-x-1 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm</span>
                              </button>
                              <button
                                id={`btn-reject-appt-${appt.id}`}
                                onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-700 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {appt.status === "confirmed" && (
                            <button
                              id={`btn-complete-appt-${appt.id}`}
                              onClick={() => handleUpdateStatus(appt.id, "completed")}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-xs inline-flex items-center space-x-1 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Complete Visit</span>
                            </button>
                          )}
                          {appt.status === "completed" && (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              Visit Concluded
                            </span>
                          )}
                          {appt.status === "cancelled" && (
                            <span className="text-[11px] text-red-500 font-medium italic">
                              Cancelled
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden space-y-3">
            {filtered.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{appt.patient_name}</h3>
                    {appt.patient_phone && (
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{appt.patient_phone}</span>
                      </p>
                    )}
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

                <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="font-semibold">{appt.appointment_date}</span>
                    <span>&bull;</span>
                    <span className="font-bold text-cyan-800">{appt.slot_time}</span>
                  </div>
                  {appt.reason && (
                    <div className="text-[11px] text-slate-600 mt-1 italic">
                      "{appt.reason}"
                    </div>
                  )}
                </div>

                {/* Mobile Action Buttons */}
                <div className="pt-1 flex items-center gap-2">
                  {updatingId === appt.id ? (
                    <div className="w-full py-2 text-center text-xs text-slate-400 flex items-center justify-center space-x-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <>
                      {appt.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(appt.id, "confirmed")}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(appt.id, "cancelled")}
                            className="py-2 px-3 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {appt.status === "confirmed" && (
                        <button
                          onClick={() => handleUpdateStatus(appt.id, "completed")}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Mark Visit Completed</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
