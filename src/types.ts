export type UserRole = "doctor" | "patient";

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar_url?: string;
}

export interface DoctorAvailability {
  days: string[]; // e.g. ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDurationMinutes: number; // 15 or 30
  lunchBreakStart?: string; // "13:00"
  lunchBreakEnd?: string; // "14:00"
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  specialization: string;
  clinic_name: string;
  clinic_address: string;
  latitude: number;
  longitude: number;
  consultation_fee: number;
  phone: string;
  is_verified: boolean;
  availability: DoctorAvailability;
  experience_years?: number;
  qualification?: string;
  created_at: string;
}

export interface EmergencyContactDetails {
  name?: string;
  relation?: string;
  phone?: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  email?: string;
  name: string;
  date_of_birth?: string;
  age?: number;
  gender?: "Male" | "Female" | "Other" | string;
  weight?: number; // in kg
  height?: number; // in cm
  blood_group?: string; // e.g. "O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"
  phone?: string;
  emergency_contact?: string | EmergencyContactDetails;
  chronic_conditions?: string[];
  allergies?: string[];
  address?: string;
  created_at: string;
}

export interface MedicineItem {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface ParchaExtractionResult {
  patientName?: string | null;
  patientAge?: string | null;
  patientGender?: string | null;
  symptoms: string[];
  diagnosis?: string | null;
  medicines: MedicineItem[];
  notes?: string | null;
  uncertain_fields: string[];
  confidenceScore?: number;
}

export interface ParchaRecord {
  id: string;
  doctor_id: string;
  doctor_name: string;
  clinic_name: string;
  clinic_id?: string;
  patient_id?: string; // linked registered patient if matched
  patient_name: string;
  patient_age?: string | number;
  patient_gender?: string;
  patient_phone?: string;
  visit_date: string;
  symptoms: string[];
  diagnosis: string;
  medicines: MedicineItem[];
  notes?: string;
  image_url: string;
  image_storage_path?: string;
  verified_by_doctor: boolean;
  created_at: string;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  doctor_id: string;
  doctor_name: string;
  clinic_name: string;
  doctor_specialization?: string;
  doctor_phone?: string;
  doctor_address?: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_age?: number | string;
  patient_gender?: string;
  appointment_date: string; // YYYY-MM-DD
  slot_time: string; // e.g. "10:30 AM"
  reason?: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
}

export type FileCategory =
  | "All"
  | "Prescriptions"
  | "Prescription"
  | "Lab Reports"
  | "Lab Report"
  | "X-Ray"
  | "Scans"
  | "Scan"
  | "Certificates"
  | "Discharge Summary"
  | "Custom Reports"
  | "Other";

export interface HealthFile {
  id: string;
  patient_id: string;
  patient_name?: string;
  file_name?: string;
  title?: string;
  category: string;
  file_url: string;
  storage_path?: string;
  file_size?: number;
  file_type?: string;
  doctor_name?: string;
  clinic_name?: string;
  report_date?: string;
  upload_date?: string;
  created_at: string;
}

export interface CustomReportSections {
  personalInfo?: boolean;
  bloodGroup?: boolean;
  heightWeight?: boolean;
  medicines?: boolean;
  medicalHistory?: boolean;
  visits?: boolean;
  reports?: boolean;
  emergencyInfo?: boolean;
  prescriptions?: boolean;
  files?: boolean;
}

export interface CustomReportConfig {
  title: string;
  subtitle?: string;
  sections: CustomReportSections;
  notes?: string;
}
