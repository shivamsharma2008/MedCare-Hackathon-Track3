import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { ParchaRecord } from "../../types";
import { Modal } from "../common/Modal";
import {
  Users,
  Search,
  FileText,
  Calendar,
  Trash2,
  AlertTriangle,
  Eye,
  ExternalLink,
  Pill,
  Clock,
  User,
  CheckCircle2,
  Loader2,
  Activity,
} from "lucide-react";

export const DoctorPatients: React.FC = () => {
  const { user } = useAuth();
  const [parchas, setParchas] = useState<ParchaRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Selected patient for history view
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
  const [viewHistoryModal, setViewHistoryModal] = useState<boolean>(false);

  // Selected Parcha for full image preview
  const [previewParcha, setPreviewParcha] = useState<ParchaRecord | null>(null);

  // Delete modal state
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchRecords = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const records = await dbService.getDoctorParchas(user.id);
      setParchas(records);
    } catch (err) {
      console.error("Error fetching patient records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user]);

  // Group parchas by unique patient
  const patientMap = new Map<string, ParchaRecord[]>();
  parchas.forEach((p) => {
    const key = p.patient_name.trim();
    if (!patientMap.has(key)) {
      patientMap.set(key, []);
    }
    patientMap.get(key)!.push(p);
  });

  const patientList = Array.from(patientMap.entries()).map(([name, visits]) => {
    // Sort visits by date descending
    visits.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
    const latest = visits[0];
    return {
      name,
      patient_id: latest.patient_id,
      age: latest.patient_age,
      gender: latest.patient_gender,
      phone: latest.patient_phone,
      totalVisits: visits.length,
      lastVisitDate: latest.visit_date,
      latestDiagnosis: latest.diagnosis,
      visits,
    };
  });

  const filteredPatients = patientList.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.latestDiagnosis && p.latestDiagnosis.toLowerCase().includes(q)) ||
      p.visits.some((v) => v.symptoms.some((s) => s.toLowerCase().includes(q)))
    );
  });

  const handleOpenHistory = (name: string) => {
    setSelectedPatientName(name);
    setViewHistoryModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!user || !patientToDelete) return;
    setIsDeleting(true);
    try {
      await dbService.deletePatientRecords(user.id, patientToDelete);
      await fetchRecords();
      setPatientToDelete(null);
      setViewHistoryModal(false);
    } catch (err) {
      console.error("Error deleting patient:", err);
      alert("Failed to delete patient record");
    } finally {
      setIsDeleting(false);
    }
  };

  const activePatientDetails = selectedPatientName
    ? patientList.find((p) => p.name === selectedPatientName)
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-cyan-600" />
            <span>Clinic Patient Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real patient records & historical prescription parchas for this clinic.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, diagnosis, symptoms..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main List / Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading patient directory...</div>
      ) : patientList.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-white rounded-2xl p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No patient records yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you scan handwritten parchas or patients book visits, their verified clinical histories will appear here.
          </p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          No patients found matching "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table Layout (hidden on small mobile) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">Patient Demographics</th>
                  <th className="py-3 px-4">Latest Diagnosis</th>
                  <th className="py-3 px-4">Total Visits</th>
                  <th className="py-3 px-4">Last Visit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPatients.map((patient) => (
                  <tr key={patient.name} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-xs">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{patient.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {patient.age ? `${patient.age} yrs` : "Age N/A"} &bull; {patient.gender || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {patient.latestDiagnosis || "Routine Consultation"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {patient.totalVisits} {patient.totalVisits === 1 ? "Visit" : "Visits"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{patient.lastVisitDate}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenHistory(patient.name)}
                        className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-semibold rounded-lg transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>History</span>
                      </button>
                      <button
                        onClick={() => setPatientToDelete(patient.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete patient record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (shown on mobile & tablet) */}
          <div className="md:hidden space-y-3">
            {filteredPatients.map((patient) => (
              <div
                key={patient.name}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-800 font-bold flex items-center justify-center text-sm">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{patient.name}</h3>
                      <p className="text-[11px] text-slate-500">
                        {patient.age ? `${patient.age} yrs` : ""} {patient.gender || ""} &bull;{" "}
                        {patient.totalVisits} visits
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPatientToDelete(patient.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="text-[11px] text-slate-500">Latest Diagnosis:</div>
                  <div className="font-semibold text-slate-800">
                    {patient.latestDiagnosis || "Routine Consultation"}
                  </div>
                  <div className="text-[10px] text-slate-400">Last visited on {patient.lastVisitDate}</div>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenHistory(patient.name)}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Patient History</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient History Timeline Modal */}
      <Modal
        isOpen={viewHistoryModal}
        onClose={() => setViewHistoryModal(false)}
        title={
          activePatientDetails ? (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-cyan-600" />
              <span>Patient Medical History: {activePatientDetails.name}</span>
            </div>
          ) : (
            "Patient History"
          )
        }
        maxWidth="3xl"
      >
        {activePatientDetails && (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-slate-500">Age: </span>
                <span className="font-semibold text-slate-800">
                  {activePatientDetails.age ? `${activePatientDetails.age} yrs` : "N/A"}
                </span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-slate-500">Gender: </span>
                <span className="font-semibold text-slate-800">{activePatientDetails.gender || "N/A"}</span>
              </div>
              <div className="text-slate-500 font-medium">
                Total Visits: {activePatientDetails.totalVisits}
              </div>
            </div>

            {/* Visit Timeline */}
            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {activePatientDetails.visits.map((visit, idx) => (
                <div key={visit.id} className="relative pl-9 space-y-2">
                  {/* Timeline bullet */}
                  <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-cyan-600 border-2 border-white shadow-xs" />

                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          Visit on {visit.visit_date}
                        </span>
                        <p className="text-[11px] text-slate-500">{visit.clinic_name}</p>
                      </div>
                      <button
                        onClick={() => setPreviewParcha(visit)}
                        className="self-start sm:self-auto px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[11px] font-semibold rounded-lg flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Original Parcha</span>
                      </button>
                    </div>

                    {visit.diagnosis && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-700">Diagnosis: </span>
                        <span className="text-slate-900 font-bold">{visit.diagnosis}</span>
                      </div>
                    )}

                    {visit.symptoms && visit.symptoms.length > 0 && (
                      <div className="text-xs">
                        <span className="font-semibold text-slate-700">Symptoms: </span>
                        <span className="text-slate-600">{visit.symptoms.join(", ")}</span>
                      </div>
                    )}

                    {visit.medicines && visit.medicines.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                          <Pill className="w-3 h-3 text-cyan-600" />
                          <span>Prescription Medications</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {visit.medicines.map((m, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            >
                              <div className="font-bold text-slate-800">{m.name}</div>
                              <div className="text-[11px] text-slate-500">
                                {m.dosage} &bull; {m.frequency} &bull; {m.duration}
                              </div>
                              {m.instructions && (
                                <div className="text-[10px] text-slate-600 italic mt-0.5">
                                  {m.instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {visit.notes && (
                      <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-100 p-2.5 rounded-lg">
                        <span className="font-semibold text-amber-900">Doctor Advice: </span>
                        {visit.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => {
                  if (activePatientDetails) {
                    setPatientToDelete(activePatientDetails.name);
                  }
                }}
                className="px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl font-semibold flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Patient Records</span>
              </button>
              <button
                onClick={() => setViewHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Original Parcha Full Preview Modal */}
      <Modal
        isOpen={Boolean(previewParcha)}
        onClose={() => setPreviewParcha(null)}
        title="Original Handwritten Parcha Image"
        maxWidth="2xl"
      >
        {previewParcha && (
          <div className="space-y-4">
            <div className="bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-800">
              <img
                src={previewParcha.image_url}
                alt="Original prescription"
                className="w-full max-h-[500px] object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div>
                Patient: <span className="font-semibold text-slate-800">{previewParcha.patient_name}</span> &bull;{" "}
                {previewParcha.visit_date}
              </div>
              <button
                onClick={() => setPreviewParcha(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Explicit Delete Patient Confirmation Modal */}
      <Modal
        isOpen={Boolean(patientToDelete)}
        onClose={() => setPatientToDelete(null)}
        title="Delete Patient Record?"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-red-800 p-3 bg-red-50 rounded-xl border border-red-200">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-red-900">Irreversible Action</h4>
              <p className="text-xs text-red-700 leading-relaxed">
                Deleting <strong>{patientToDelete}</strong> will permanently remove all associated clinic visits,
                digitized Parcha images, prescription history, and appointment logs from this doctor account.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Are you sure you want to delete this patient from your clinic database?
          </p>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              onClick={() => setPatientToDelete(null)}
              disabled={isDeleting}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-delete-patient"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm shadow-red-600/20"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
