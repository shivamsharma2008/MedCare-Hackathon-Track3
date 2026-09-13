import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { ParchaRecord } from "../../types";
import { generateHealthReportPDF } from "../../lib/pdf";
import {
  Sliders,
  Download,
  FileText,
  Calendar,
  CheckSquare,
  Square,
  User,
  HeartPulse,
  Pill,
  ShieldCheck,
  Eye,
} from "lucide-react";

export const PatientCustomReport: React.FC = () => {
  const { user, patientProfile } = useAuth();
  const [parchas, setParchas] = useState<ParchaRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Configuration options
  const [reportTitle, setReportTitle] = useState<string>("Comprehensive Patient Health Summary");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [customNotes, setCustomNotes] = useState<string>("");

  // Section Toggles
  const [includeDemographics, setIncludeDemographics] = useState<boolean>(true);
  const [includeChronicConditions, setIncludeChronicConditions] = useState<boolean>(true);
  const [includeDiagnosticHistory, setIncludeDiagnosticHistory] = useState<boolean>(true);
  const [includeMedicationSchedule, setIncludeMedicationSchedule] = useState<boolean>(true);
  const [includeDoctorAdvice, setIncludeDoctorAdvice] = useState<boolean>(true);
  const [includeEmergencyContacts, setIncludeEmergencyContacts] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const records = await dbService.getPatientParchas(user.id, user.name);
        setParchas(records);
      } catch (err) {
        console.error("Error fetching parchas for custom report:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  // Filter records by date range
  const filteredParchas = parchas.filter((p) => {
    if (fromDate && p.visit_date < fromDate) return false;
    if (toDate && p.visit_date > toDate) return false;
    return true;
  });

  const handleExportPDF = () => {
    generateHealthReportPDF({
      patientName: patientProfile?.name || user?.name || "Patient",
      patientAge: patientProfile?.age ? String(patientProfile.age) : undefined,
      patientGender: patientProfile?.gender,
      bloodGroup: patientProfile?.blood_group,
      chronicConditions: patientProfile?.chronic_conditions,
      allergies: patientProfile?.allergies,
      emergencyContact: patientProfile?.emergency_contact,
      records: filteredParchas,
      reportTitle,
      customNotes,
      includeDemographics,
      includeChronicConditions,
      includeDiagnosticHistory,
      includeMedicationSchedule,
      includeDoctorAdvice,
      includeEmergencyContacts,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-cyan-600" />
            <span>Customize Medical Health Report</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Select the clinical sections, date range, and notes to include in your official PDF export.
          </p>
        </div>

        <button
          id="btn-export-custom-pdf"
          onClick={handleExportPDF}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-cyan-600/20 flex items-center space-x-2 self-start sm:self-auto transition-transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export Official PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* General Report Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-cyan-600" />
              <span>Report Header & Scope</span>
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Document Title</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Additional Doctor / Patient Notes</label>
              <textarea
                rows={2}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Include custom referral instructions or notes for consulting physicians..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section Inclusions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Include Clinical Sections</h2>

            <div className="space-y-2">
              <label
                onClick={() => setIncludeDemographics(!includeDemographics)}
                className="flex items-center space-x-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer select-none transition-colors"
              >
                {includeDemographics ? (
                  <CheckSquare className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-800">
                  Patient Demographics (Age, Gender, Blood Group)
                </span>
              </label>

              <label
                onClick={() => setIncludeChronicConditions(!includeChronicConditions)}
                className="flex items-center space-x-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer select-none transition-colors"
              >
                {includeChronicConditions ? (
                  <CheckSquare className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-800">
                  Chronic Medical Conditions & Known Allergies
                </span>
              </label>

              <label
                onClick={() => setIncludeDiagnosticHistory(!includeDiagnosticHistory)}
                className="flex items-center space-x-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer select-none transition-colors"
              >
                {includeDiagnosticHistory ? (
                  <CheckSquare className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-800">
                  Clinical Visit & Diagnostic History ({filteredParchas.length} Visits)
                </span>
              </label>

              <label
                onClick={() => setIncludeMedicationSchedule(!includeMedicationSchedule)}
                className="flex items-center space-x-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer select-none transition-colors"
              >
                {includeMedicationSchedule ? (
                  <CheckSquare className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-800">
                  Digitized Prescription Medications Schedule
                </span>
              </label>

              <label
                onClick={() => setIncludeDoctorAdvice(!includeDoctorAdvice)}
                className="flex items-center space-x-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer select-none transition-colors"
              >
                {includeDoctorAdvice ? (
                  <CheckSquare className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-800">
                  Doctor Precautions & Follow-up Advice
                </span>
              </label>

              <label
                onClick={() => setIncludeEmergencyContacts(!includeEmergencyContacts)}
                className="flex items-center space-x-3 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer select-none transition-colors"
              >
                {includeEmergencyContacts ? (
                  <CheckSquare className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
                <span className="text-xs font-semibold text-slate-800">
                  Emergency Contacts & Family Information
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Document Preview Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 shadow-md space-y-6">
            {/* Header Banner */}
            <div className="border-b-2 border-cyan-800 pb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-cyan-900">{reportTitle}</h2>
                <p className="text-xs text-slate-500">MedCare Digital Health Summary &bull; Rural Health Portal</p>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                Generated: {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Demographics Preview */}
            {includeDemographics && (
              <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1 border border-slate-200">
                <div className="font-bold text-slate-800 mb-1">Patient Profile & Demographics</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
                  <div>Name: <span className="font-semibold">{patientProfile?.name || user?.name || "Patient"}</span></div>
                  <div>Age: <span className="font-semibold">{patientProfile?.age || "N/A"} yrs</span></div>
                  <div>Gender: <span className="font-semibold">{patientProfile?.gender || "N/A"}</span></div>
                  <div>Blood Group: <span className="font-semibold text-red-700">{patientProfile?.blood_group || "N/A"}</span></div>
                </div>
              </div>
            )}

            {/* Chronic Conditions */}
            {includeChronicConditions && (
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-800">Known Conditions & Allergies</div>
                <p className="text-slate-600">
                  Chronic: {patientProfile?.chronic_conditions?.join(", ") || "None recorded"} &bull; Allergies: {patientProfile?.allergies?.join(", ") || "No known drug allergies"}
                </p>
              </div>
            )}

            {/* Diagnostic Records */}
            {includeDiagnosticHistory && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800">
                  Clinical History ({filteredParchas.length} Prescriptions Included)
                </div>

                {filteredParchas.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-2">No visits found in selected date range.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredParchas.map((rec) => (
                      <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{rec.diagnosis || "General Consultation"}</span>
                          <span className="text-slate-500 font-normal">{rec.visit_date}</span>
                        </div>
                        <div className="text-slate-600">
                          Doctor: Dr. {rec.doctor_name} ({rec.clinic_name})
                        </div>
                        {includeMedicationSchedule && rec.medicines && rec.medicines.length > 0 && (
                          <div className="text-[11px] text-slate-700">
                            <strong>Meds:</strong> {rec.medicines.map((m) => `${m.name} (${m.dosage} ${m.frequency})`).join(", ")}
                          </div>
                        )}
                        {includeDoctorAdvice && rec.notes && (
                          <div className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded">
                            <strong>Advice:</strong> {rec.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {customNotes && (
              <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-100 text-xs text-cyan-900">
                <span className="font-bold">Referral Notes: </span>
                {customNotes}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleExportPDF}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
