import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { ParchaRecord } from "../../types";
import { generateHealthReportPDF } from "../../lib/pdf";
import { Modal } from "../common/Modal";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Pill,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sliders,
} from "lucide-react";

export const PatientReports: React.FC = () => {
  const { user, patientProfile, navigateTo } = useAuth();
  const [parchas, setParchas] = useState<ParchaRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedParcha, setSelectedParcha] = useState<ParchaRecord | null>(null);

  useEffect(() => {
    const fetchParchas = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const records = await dbService.getPatientParchas(user.id, user.name);
        setParchas(records);
      } catch (err) {
        console.error("Error fetching patient health reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchParchas();
  }, [user]);

  const handleDownloadSingleReport = (record: ParchaRecord) => {
    generateHealthReportPDF({
      patientName: record.patient_name,
      patientAge: record.patient_age,
      patientGender: record.patient_gender,
      bloodGroup: patientProfile?.blood_group,
      chronicConditions: patientProfile?.chronic_conditions,
      allergies: patientProfile?.allergies,
      emergencyContact: patientProfile?.emergency_contact,
      records: [record],
      reportTitle: `MedCare Health Report - ${record.visit_date}`,
      includeDemographics: true,
      includeChronicConditions: true,
      includeDiagnosticHistory: true,
      includeMedicationSchedule: true,
      includeDoctorAdvice: true,
      includeEmergencyContacts: true,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-cyan-600" />
            <span>Digital Health Reports & Prescriptions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Access verified clinical records, digitized medications, and export official PDF reports.
          </p>
        </div>

        <button
          onClick={() => navigateTo("/patient/custom-report")}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Sliders className="w-4 h-4" />
          <span>Customize Multi-Visit PDF</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading clinical reports...</div>
      ) : parchas.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-white rounded-2xl p-8 space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No medical reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Prescriptions scanned during doctor visits will automatically synchronize here for download.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {parchas.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-cyan-500 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-sm font-bold text-slate-900">{record.diagnosis || "Medical Consultation"}</h3>
                    <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Dr. {record.doctor_name} &bull; {record.clinic_name}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {record.visit_date}
                </span>
              </div>

              {/* Symptoms */}
              {record.symptoms && record.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {record.symptoms.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-medium rounded-md"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Medicines Summary */}
              {record.medicines && record.medicines.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                    <Pill className="w-3 h-3 text-cyan-600" />
                    <span>Prescribed Medications ({record.medicines.length})</span>
                  </div>
                  <div className="space-y-1">
                    {record.medicines.slice(0, 3).map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold">{m.name}</span>
                        <span className="text-slate-500 text-[11px]">{m.dosage} ({m.frequency})</span>
                      </div>
                    ))}
                    {record.medicines.length > 3 && (
                      <div className="text-[10px] text-cyan-700 font-medium">
                        + {record.medicines.length - 3} more medications
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedParcha(record)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>

                <button
                  onClick={() => handleDownloadSingleReport(record)}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details & Parcha Preview Modal */}
      <Modal
        isOpen={Boolean(selectedParcha)}
        onClose={() => setSelectedParcha(null)}
        title={
          selectedParcha ? (
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-600" />
              <span>Prescription Record: {selectedParcha.visit_date}</span>
            </div>
          ) : (
            "Prescription Details"
          )
        }
        maxWidth="2xl"
      >
        {selectedParcha && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <span className="font-bold text-slate-900">Dr. {selectedParcha.doctor_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Clinic:</span>
                <span className="font-semibold text-slate-800">{selectedParcha.clinic_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Diagnosis:</span>
                <span className="font-bold text-cyan-800">{selectedParcha.diagnosis}</span>
              </div>
            </div>

            {/* Medicines List */}
            {selectedParcha.medicines && selectedParcha.medicines.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800">Prescribed Medicines:</div>
                <div className="space-y-1.5">
                  {selectedParcha.medicines.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-600">
                        {m.dosage} &bull; Frequency: {m.frequency} &bull; Duration: {m.duration}
                      </div>
                      {m.instructions && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5">
                          Instructions: {m.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Original Parcha Image */}
            {selectedParcha.image_url && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800">Original Handwritten Prescription:</div>
                <div className="bg-slate-950 rounded-xl overflow-hidden max-h-72 flex items-center justify-center p-2 border border-slate-800">
                  <img
                    src={selectedParcha.image_url}
                    alt="Original parcha"
                    className="max-h-64 object-contain"
                  />
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => handleDownloadSingleReport(selectedParcha)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official PDF</span>
              </button>
              <button
                onClick={() => setSelectedParcha(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
