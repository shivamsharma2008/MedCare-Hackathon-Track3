import React, { useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { CameraModal } from "../common/CameraModal";
import { MedicineItem, ParchaExtractionResult, ParchaRecord } from "../../types";
import { generateSampleParchaBase64 } from "../../lib/sampleParcha";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
  RotateCcw,
  ShieldCheck,
  Loader2,
  ArrowRight,
} from "lucide-react";

export const DoctorScanParcha: React.FC = () => {
  const { user, doctorProfile, navigateTo } = useAuth();

  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form review fields
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<string>("Male");
  const [patientPhone, setPatientPhone] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState<string>("");
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<string>("");
  const [uncertainFields, setUncertainFields] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCaptureImage = async (_blob: Blob, base64Url: string) => {
    setSelectedImage(base64Url);
    await runGeminiExtraction(base64Url);
  };

  const handleTrySampleParcha = async () => {
    const sampleBase64 = generateSampleParchaBase64();
    if (!sampleBase64) return;
    setSelectedImage(sampleBase64);
    await runGeminiExtraction(sampleBase64);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      setSelectedImage(base64Url);
      await runGeminiExtraction(base64Url);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      setSelectedImage(base64Url);
      await runGeminiExtraction(base64Url);
    };
    reader.readAsDataURL(file);
  };

  const runGeminiExtraction = async (imageBase64: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/parcha/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze handwritten prescription");
      }

      const { data } = (await response.json()) as { data: ParchaExtractionResult };

      setPatientName(data.patientName || "");
      setPatientAge(data.patientAge || "");
      if (data.patientGender && ["Male", "Female", "Other"].includes(data.patientGender)) {
        setPatientGender(data.patientGender);
      }
      setDiagnosis(data.diagnosis || "");
      setSymptoms(data.symptoms || []);
      setMedicines(
        data.medicines && data.medicines.length > 0
          ? data.medicines
          : [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
      );
      setDoctorNotes(data.notes || "");
      setUncertainFields(data.uncertain_fields || []);
    } catch (err: any) {
      console.error("Gemini Extraction Error:", err);
      setErrorMessage(err.message || "Could not analyze prescription. You may enter details manually.");
      // Provide fallback empty fields for doctor manual verification
      setMedicines([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const handleUpdateMedicine = (index: number, field: keyof MedicineItem, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleAddSymptom = () => {
    if (!symptomInput.trim()) return;
    setSymptoms([...symptoms, symptomInput.trim()]);
    setSymptomInput("");
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleSaveVerifiedParcha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!patientName.trim()) {
      alert("Please enter a patient name");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const visitDate = new Date().toISOString().slice(0, 10);
      const cleanedMeds = medicines.filter((m) => m.name.trim().length > 0);

      const record: Omit<ParchaRecord, "id" | "created_at"> = {
        doctor_id: user.id,
        doctor_name: doctorProfile?.name || user.name || "Doctor",
        clinic_name: doctorProfile?.clinic_name || "MedCare Clinic",
        clinic_id: doctorProfile?.id || user.id,
        patient_name: patientName.trim(),
        patient_age: patientAge.trim() || undefined,
        patient_gender: patientGender,
        patient_phone: patientPhone.trim() || undefined,
        visit_date: visitDate,
        symptoms,
        diagnosis: diagnosis.trim(),
        medicines: cleanedMeds,
        notes: doctorNotes.trim() || undefined,
        image_url: selectedImage || "",
        verified_by_doctor: true,
      };

      await dbService.saveParchaRecord(record);
      setSaveSuccess(true);
    } catch (err: any) {
      console.error("Error saving verified parcha:", err);
      setErrorMessage(err.message || "Failed to save verified prescription record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPatientName("");
    setPatientAge("");
    setDiagnosis("");
    setSymptoms([]);
    setMedicines([]);
    setDoctorNotes("");
    setUncertainFields([]);
    setSaveSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Prescription / Parcha Digitizer</span>
            <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-800 font-bold rounded-full">
              AI Powered
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Photograph handwritten prescriptions to extract patient details and medications with Gemini AI.
          </p>
        </div>

        {selectedImage && (
          <button
            onClick={handleReset}
            className="self-start sm:self-auto px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Scan Another</span>
          </button>
        )}
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-start space-x-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">Prescription Successfully Verified & Saved</h3>
              <p className="text-xs text-emerald-700 mt-1">
                The digitized clinical record has been stored and added to {patientName}'s medical history.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => navigateTo("/doctor/patients")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors"
            >
              <span>View in Patient Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Scan New Parcha
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Capture or Upload Options */}
      {!selectedImage && !saveSuccess && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Camera Capture Card */}
            <div className="bg-white border-2 border-slate-200 hover:border-cyan-500 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-between text-center space-y-4 transition-all shadow-xs group">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-cyan-100">
                <Camera className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">Scan with Camera</h3>
                <p className="text-xs text-slate-500">
                  Use device webcam or phone camera to snap handwritten paper.
                </p>
              </div>
              <button
                id="btn-trigger-camera-modal"
                onClick={() => setIsCameraOpen(true)}
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Open Camera</span>
              </button>
            </div>

            {/* File Upload Card with Drag & Drop */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="bg-white border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-between text-center space-y-4 transition-all shadow-xs group"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center group-hover:scale-105 transition-transform border border-slate-200">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">Upload Parcha Image</h3>
                <p className="text-xs text-slate-500">
                  Select JPEG, PNG, or WebP photo from your computer or phone.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                id="btn-upload-file-trigger"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Browse Files</span>
              </button>
            </div>

            {/* Sample Parcha Demo Card */}
            <div className="bg-gradient-to-br from-cyan-50/60 to-emerald-50/60 border-2 border-cyan-200 hover:border-cyan-500 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-between text-center space-y-4 transition-all shadow-xs group">
              <div className="w-14 h-14 rounded-2xl bg-white text-cyan-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-cyan-200 shadow-xs">
                <Sparkles className="w-7 h-7 text-cyan-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-1.5">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800">Sample Parcha Demo</h3>
                  <span className="text-[10px] bg-cyan-200/80 text-cyan-800 font-bold px-1.5 py-0.5 rounded">
                    Instant AI
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Instant test with realistic handwritten doctor prescription data.
                </p>
              </div>
              <button
                id="btn-try-sample-parcha"
                onClick={handleTrySampleParcha}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-transform active:scale-95 flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Try Sample Parcha</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal component with pre-permission dialog */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCaptureImage}
        onSwitchToUpload={() => fileInputRef.current?.click()}
      />

      {/* Step 2: AI Analyzing & Review Form */}
      {selectedImage && !saveSuccess && (
        <div className="space-y-6">
          {/* AI Analyzing Progress State */}
          {isAnalyzing && (
            <div className="bg-cyan-50/80 border border-cyan-200 rounded-2xl p-6 text-center space-y-3 animate-pulse">
              <div className="w-10 h-10 bg-cyan-600 text-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-cyan-900">Analyzing Handwriting with Gemini AI...</h3>
                <p className="text-xs text-cyan-700 mt-1">
                  Extracting patient demographics, handwritten symptoms, medicines, and dosages.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">Extraction Notice</h4>
                <p className="text-xs text-amber-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {uncertainFields.length > 0 && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Uncertain Handwritten Fields (Please Check Carefully):</span>
              </div>
              <ul className="list-disc list-inside text-amber-800 text-[11px] pl-1">
                {uncertainFields.map((uf, i) => (
                  <li key={i}>{uf}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Form and Image Side-by-Side or Stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Parcha Preview Column */}
            <div className="lg:col-span-4 space-y-3">
              <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 shadow-sm sticky top-20">
                <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-2 px-1">
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Original Parcha</span>
                  </span>
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Retake
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden bg-slate-950 max-h-[420px] flex items-center justify-center border border-slate-800">
                  <img
                    src={selectedImage}
                    alt="Prescription parcha"
                    className="w-full h-auto object-contain max-h-[420px]"
                  />
                </div>
                <div className="mt-2 text-[10px] text-slate-400 text-center font-medium">
                  Stored securely under clinic records
                </div>
              </div>
            </div>

            {/* Doctor Verification Form Column */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-600" />
                    <span>Doctor Verification & Clinical Review</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  AI-generated extraction &mdash; please verify and edit any details before saving to patient history.
                </p>
              </div>

              <form onSubmit={handleSaveVerifiedParcha} className="space-y-5">
                {/* Demographics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-1 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Patient Name *</label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Age</label>
                    <input
                      type="text"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="e.g. 38"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Gender</label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Symptoms */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Symptoms</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={symptomInput}
                      onChange={(e) => setSymptomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSymptom();
                        }
                      }}
                      placeholder="Add symptom (e.g. Fever, Dry cough, Joint pain)"
                      className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSymptom}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {symptoms.map((s, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 text-xs font-medium border border-cyan-200"
                        >
                          <span>{s}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSymptom(idx)}
                            className="hover:text-red-600"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Diagnosis */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Diagnosis / Clinical Impression</label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute Upper Respiratory Infection"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Medicines Table */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Prescribed Medications ({medicines.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Medicine</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-5">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleUpdateMedicine(idx, "name", e.target.value)}
                              placeholder="Medicine Name (e.g. Tab Paracetamol)"
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleUpdateMedicine(idx, "dosage", e.target.value)}
                              placeholder="Dosage (500mg)"
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => handleUpdateMedicine(idx, "frequency", e.target.value)}
                              placeholder="Freq (1-0-1)"
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) => handleUpdateMedicine(idx, "duration", e.target.value)}
                              placeholder="Duration (5d)"
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                            />
                          </div>
                          <div className="sm:col-span-1 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={med.instructions || ""}
                            onChange={(e) => handleUpdateMedicine(idx, "instructions", e.target.value)}
                            placeholder="Special Instructions (e.g. After meals with warm water)"
                            className="w-full px-2.5 py-1 text-[11px] border border-slate-200 rounded-lg bg-white text-slate-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Doctor Advice / Follow-up Notes</label>
                  <textarea
                    rows={2}
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Dietary precautions, review after 3 days..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Save Buttons */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-confirm-save-parcha"
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-cyan-600/20 flex items-center justify-center space-x-2 transition-transform active:scale-95"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Verified Record...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Save Record</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
