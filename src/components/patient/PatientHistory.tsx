import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { ParchaRecord } from "../../types";
import {
  History,
  Calendar,
  Pill,
  ShieldCheck,
  Stethoscope,
  Activity,
  FileText,
} from "lucide-react";

export const PatientHistory: React.FC = () => {
  const { user } = useAuth();
  const [parchas, setParchas] = useState<ParchaRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const records = await dbService.getPatientParchas(user.id, user.name);
        records.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
        setParchas(records);
      } catch (err) {
        console.error("Error loading patient history:", err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <History className="w-6 h-6 text-cyan-600" />
          <span>Patient Medical & Clinical Timeline</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Chronological timeline of all doctor visits, symptoms diagnosed, and prescriptions received.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading medical history...</div>
      ) : parchas.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-white rounded-2xl p-8 space-y-3">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No medical history logged</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your clinical timeline will build automatically as doctors scan and verify your clinic parchas.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 space-y-6">
          {parchas.map((record) => (
            <div key={record.id} className="relative space-y-2">
              {/* Timeline Bullet */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-xs shadow-xs border-2 border-white">
                <Stethoscope className="w-3 h-3" />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-semibold text-cyan-700">{record.visit_date}</span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {record.diagnosis || "Clinical Consultation"}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    Dr. {record.doctor_name} &bull; {record.clinic_name}
                  </div>
                </div>

                {record.symptoms && record.symptoms.length > 0 && (
                  <div className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Symptoms: </span>
                    <span>{record.symptoms.join(", ")}</span>
                  </div>
                )}

                {record.medicines && record.medicines.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                      <Pill className="w-3 h-3 text-cyan-600" />
                      <span>Prescribed Medication Schedule</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {record.medicines.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                        >
                          <div className="font-bold text-slate-800">{m.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {m.dosage} &bull; {m.frequency} &bull; {m.duration}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div className="p-2.5 bg-amber-50/60 rounded-xl text-xs text-slate-700 border border-amber-100">
                    <span className="font-semibold text-amber-900">Doctor Advice: </span>
                    {record.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
