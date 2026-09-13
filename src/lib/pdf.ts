import { jsPDF } from "jspdf";
import { PatientProfile, ParchaRecord, CustomReportConfig } from "../types";

export function generateCustomReportPDF(
  patient: PatientProfile,
  parchas: ParchaRecord[],
  config: CustomReportConfig
): { blob: Blob; dataUrl: string; filename: string } {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const primaryColor: [number, number, number] = [14, 116, 144]; // cyan-700
  const darkTextColor: [number, number, number] = [30, 41, 59]; // slate-800
  const lightGrayColor: [number, number, number] = [100, 116, 139]; // slate-500

  let y = 20;

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MEDCARE HEALTH PLATFORM", 15, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Official Patient Health & Clinical Summary", 15, 20);

  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Generated on: ${reportDate}`, 150, 16);

  y = 35;

  // Report Title
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(config.title || "Comprehensive Health Summary", 15, y);
  y += 7;

  if (config.subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
    doc.text(config.subtitle, 15, y);
    y += 8;
  } else {
    y += 3;
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 8;

  // 1. Personal Information Section
  if (config.sections.personalInfo) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("1. PATIENT DEMOGRAPHICS", 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

    doc.text(`Full Name: ${patient.name || "N/A"}`, 15, y);
    doc.text(`Gender: ${patient.gender || "Not Specified"}`, 85, y);
    doc.text(`Age / DOB: ${patient.age ? `${patient.age} yrs` : patient.date_of_birth || "N/A"}`, 145, y);
    y += 5;

    doc.text(`Phone: ${patient.phone || "N/A"}`, 15, y);
    doc.text(`Email: ${patient.email || "N/A"}`, 85, y);
    y += 8;
  }

  // 2. Vitals & Blood Group
  if (config.sections.bloodGroup || config.sections.heightWeight) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("2. CLINICAL VITALS & BIOMETRICS", 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

    const bgText = config.sections.bloodGroup ? `Blood Group: ${patient.blood_group || "Unknown"}` : "";
    const hwText = config.sections.heightWeight
      ? `Height: ${patient.height ? `${patient.height} cm` : "N/A"} | Weight: ${patient.weight ? `${patient.weight} kg` : "N/A"}`
      : "";

    doc.text(bgText, 15, y);
    doc.text(hwText, 85, y);
    y += 8;
  }

  // 3. Emergency Information
  if (config.sections.emergencyInfo) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("3. EMERGENCY CONTACT", 15, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`Emergency Number / Contact: ${patient.emergency_contact || "None Registered"}`, 15, y);
    y += 8;
  }

  // 4. Current & Active Medications
  if (config.sections.medicines) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("4. PRESCRIBED MEDICATIONS", 15, y);
    y += 6;

    const allMeds: Array<{ name: string; dosage: string; frequency: string; duration: string; visitDate: string }> = [];
    parchas.forEach((p) => {
      p.medicines?.forEach((m) => {
        allMeds.push({ ...m, visitDate: p.visit_date });
      });
    });

    if (allMeds.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
      doc.text("No active prescriptions or medications recorded in database.", 15, y);
      y += 8;
    } else {
      // Table header
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y - 4, 180, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      doc.text("Medication Name", 17, y);
      doc.text("Dosage", 75, y);
      doc.text("Frequency", 110, y);
      doc.text("Duration", 145, y);
      doc.text("Date", 175, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      allMeds.slice(0, 10).forEach((med) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(med.name.substring(0, 32), 17, y);
        doc.text(med.dosage || "-", 75, y);
        doc.text(med.frequency || "-", 110, y);
        doc.text(med.duration || "-", 145, y);
        doc.text(med.visitDate || "-", 175, y);
        y += 5;
      });
      y += 4;
    }
  }

  // 5. Medical History & Doctor Visits
  if (config.sections.visits || config.sections.medicalHistory) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("5. CLINIC VISITS & CLINICAL DIAGNOSIS HISTORY", 15, y);
    y += 6;

    if (parchas.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(lightGrayColor[0], lightGrayColor[1], lightGrayColor[2]);
      doc.text("No clinic visit records found.", 15, y);
      y += 8;
    } else {
      parchas.forEach((p, idx) => {
        if (y > 265) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
        doc.text(`Visit #${idx + 1}: ${p.visit_date} - ${p.clinic_name || "MedCare Clinic"} (${p.doctor_name || "Doctor"})`, 15, y);
        y += 4.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        if (p.diagnosis) {
          doc.text(`Diagnosis: ${p.diagnosis}`, 20, y);
          y += 4;
        }
        if (p.symptoms && p.symptoms.length > 0) {
          doc.text(`Symptoms: ${p.symptoms.join(", ")}`, 20, y);
          y += 4;
        }
        if (p.notes) {
          doc.text(`Doctor Advice: ${p.notes}`, 20, y);
          y += 4;
        }
        y += 3;
      });
    }
  }

  // Additional Notes
  if (config.notes) {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Physician & Patient Notes:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(config.notes, 15, y, { maxWidth: 180 });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "CONFIDENTIAL MEDICAL RECORD - This document is intended for authorized healthcare providers and the registered patient only.",
      15,
      290
    );
    doc.text(`Page ${i} of ${totalPages}`, 185, 290);
  }

  const filename = `MedCare_Report_${(patient.name || "Patient").replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output("blob");
  const dataUrl = doc.output("datauristring");

  return { blob, dataUrl, filename };
}

export interface DirectReportOptions {
  patientName: string;
  patientAge?: string | number;
  patientGender?: string;
  bloodGroup?: string;
  chronicConditions?: string[];
  allergies?: string[];
  emergencyContact?: any;
  records: ParchaRecord[];
  reportTitle?: string;
  customNotes?: string;
  includeDemographics?: boolean;
  includeChronicConditions?: boolean;
  includeDiagnosticHistory?: boolean;
  includeMedicationSchedule?: boolean;
  includeDoctorAdvice?: boolean;
  includeEmergencyContacts?: boolean;
}

export function generateHealthReportPDF(options: DirectReportOptions) {
  const patientProfileStub: PatientProfile = {
    id: "temp",
    user_id: "temp",
    name: options.patientName,
    age: options.patientAge ? Number(options.patientAge) : undefined,
    gender: (options.patientGender as any) || "Other",
    blood_group: options.bloodGroup,
    chronic_conditions: options.chronicConditions,
    allergies: options.allergies,
    emergency_contact: typeof options.emergencyContact === "string" 
      ? options.emergencyContact 
      : options.emergencyContact?.phone || options.emergencyContact?.name || undefined,
    created_at: new Date().toISOString(),
  };

  const config: CustomReportConfig = {
    title: options.reportTitle || "MedCare Official Health Report",
    notes: options.customNotes,
    sections: {
      personalInfo: options.includeDemographics ?? true,
      bloodGroup: options.includeDemographics ?? true,
      heightWeight: options.includeDemographics ?? true,
      emergencyInfo: options.includeEmergencyContacts ?? true,
      medicines: options.includeMedicationSchedule ?? true,
      visits: options.includeDiagnosticHistory ?? true,
      medicalHistory: options.includeDiagnosticHistory ?? true,
      reports: true,
      prescriptions: true,
      files: false,
    },
  };

  const result = generateCustomReportPDF(patientProfileStub, options.records, config);

  // Trigger browser download
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return result;
}

