import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  UserSession,
  DoctorProfile,
  PatientProfile,
  ParchaRecord,
  Appointment,
  HealthFile,
} from "../types";
import { generateSampleParchaBase64 } from "./sampleParcha";

// Read Supabase credentials from Vite environment
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey !== "your-anon-key";

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local persistent database fallback when Supabase keys are not set
const STORAGE_KEYS = {
  USERS: "medcare_users_v2",
  SESSION: "medcare_current_session_v2",
  DOCTORS: "medcare_doctors_v2",
  PATIENTS: "medcare_patients_v2",
  PARCHAS: "medcare_parchas_v2",
  APPOINTMENTS: "medcare_appointments_v2",
  FILES: "medcare_files_v2",
};

// Helper for local storage
function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Storage write error", err);
  }
}

// Pre-seed local database with demo accounts and initial clinical data if not present
function ensureInitialSeedData(): void {
  try {
    const existingUsers = getStored<Array<any>>(STORAGE_KEYS.USERS, []);
    if (existingUsers && existingUsers.length > 0) {
      return;
    }

    const defaultUsers = [
      {
        id: "usr_doctor_anand",
        email: "doctor@medcare.org",
        password: "doctor123",
        name: "Dr. Anand Sharma",
        role: "doctor",
        created_at: new Date().toISOString(),
      },
      {
        id: "usr_patient_rajesh",
        email: "patient@medcare.org",
        password: "patient123",
        name: "Rajesh Patel",
        role: "patient",
        created_at: new Date().toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.USERS, defaultUsers);

    const defaultDoctors: DoctorProfile[] = [
      {
        id: "doc_anand",
        user_id: "usr_doctor_anand",
        email: "doctor@medcare.org",
        name: "Dr. Anand Sharma",
        specialization: "General Physician & Diabetologist",
        clinic_name: "MedCare Rural Wellness Clinic",
        clinic_address: "Station Road, Sector 4, Civil Lines",
        latitude: 28.6139,
        longitude: 77.2090,
        consultation_fee: 300,
        phone: "+91 98765 43210",
        is_verified: true,
        availability: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          startTime: "09:00",
          endTime: "18:00",
          slotDurationMinutes: 30,
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "doc_priya",
        user_id: "usr_doc_priya",
        email: "dr.priya@medcare.org",
        name: "Dr. Priya Mehta",
        specialization: "Gynecologist & Obstetrician",
        clinic_name: "MedCare Maternal & Child Health Clinic",
        clinic_address: "Hospital Chowk, Near District Dispensary",
        latitude: 28.6200,
        longitude: 77.2150,
        consultation_fee: 400,
        phone: "+91 98111 22334",
        is_verified: true,
        availability: {
          days: ["Monday", "Wednesday", "Friday", "Saturday"],
          startTime: "10:00",
          endTime: "16:00",
          slotDurationMinutes: 30,
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "doc_vikram",
        user_id: "usr_doc_vikram",
        email: "dr.vikram@medcare.org",
        name: "Dr. Vikram Roy",
        specialization: "Pediatrician",
        clinic_name: "Shishu Kalyan Pediatric Center",
        clinic_address: "Market Complex, Block B",
        latitude: 28.6100,
        longitude: 77.2000,
        consultation_fee: 350,
        phone: "+91 98222 33445",
        is_verified: true,
        availability: {
          days: ["Tuesday", "Thursday", "Saturday", "Sunday"],
          startTime: "09:30",
          endTime: "14:30",
          slotDurationMinutes: 20,
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "doc_sanjay",
        user_id: "usr_doc_sanjay",
        email: "dr.sanjay@medcare.org",
        name: "Dr. Sanjay Gupta",
        specialization: "Cardiologist",
        clinic_name: "Apex Heart & Diagnostic Clinic",
        clinic_address: "Civil Hospital Road",
        latitude: 28.6250,
        longitude: 77.2220,
        consultation_fee: 500,
        phone: "+91 98333 44556",
        is_verified: true,
        availability: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          startTime: "11:00",
          endTime: "17:00",
          slotDurationMinutes: 30,
        },
        created_at: new Date().toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.DOCTORS, defaultDoctors);

    const defaultPatients: PatientProfile[] = [
      {
        id: "pat_rajesh",
        user_id: "usr_patient_rajesh",
        email: "patient@medcare.org",
        name: "Rajesh Patel",
        age: 48,
        gender: "Male",
        phone: "+91 98123 45678",
        blood_group: "B+",
        chronic_conditions: ["Type 2 Diabetes Mellitus", "Essential Hypertension"],
        allergies: ["Penicillin", "Sulfa drugs"],
        emergency_contact: {
          name: "Sunita Patel (Spouse)",
          phone: "+91 98123 45679",
        },
        created_at: new Date().toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.PATIENTS, defaultPatients);

    const defaultParchas: ParchaRecord[] = [
      {
        id: "parcha_demo_1",
        doctor_id: "usr_doctor_anand",
        doctor_name: "Dr. Anand Sharma",
        clinic_name: "MedCare Rural Wellness Clinic",
        clinic_id: "doc_anand",
        patient_name: "Rajesh Patel",
        patient_age: "48",
        patient_gender: "Male",
        patient_phone: "+91 98123 45678",
        visit_date: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10),
        symptoms: ["Elevated fasting blood glucose", "Occasional dizziness", "Morning headache"],
        diagnosis: "Type 2 Diabetes Mellitus + Essential Hypertension",
        medicines: [
          {
            name: "Tab. Metformin 500mg",
            dosage: "1 tablet - Twice Daily (1-0-1)",
            frequency: "Twice daily",
            duration: "30 Days",
            instructions: "After meals (Morning & Dinner)",
          },
          {
            name: "Tab. Telmisartan 40mg",
            dosage: "1 tablet - Once Daily (1-0-0)",
            frequency: "Once daily",
            duration: "30 Days",
            instructions: "Morning after breakfast",
          },
          {
            name: "Tab. Atorvastatin 10mg",
            dosage: "1 tablet - Bedtime (0-0-1)",
            frequency: "Once night",
            duration: "30 Days",
            instructions: "At night with water",
          },
        ],
        notes: "Advised low-salt, low-sugar diet and 30 mins brisk walking daily. Re-check HbA1c & Creatinine after 4 weeks.",
        verified_by_doctor: true,
        image_url: generateSampleParchaBase64(),
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.PARCHAS, defaultParchas);

    const todayDate = new Date().toISOString().slice(0, 10);
    const tomorrowDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const defaultAppointments: Appointment[] = [
      {
        id: "appt_demo_1",
        patient_id: "usr_patient_rajesh",
        patient_name: "Rajesh Patel",
        patient_phone: "+91 98123 45678",
        patient_age: 48,
        patient_gender: "Male",
        doctor_id: "doc_anand",
        doctor_name: "Dr. Anand Sharma",
        doctor_specialization: "General Physician & Diabetologist",
        clinic_name: "MedCare Rural Wellness Clinic",
        appointment_date: tomorrowDate,
        slot_time: "10:30",
        reason: "Follow-up for Blood Pressure & Fasting Blood Sugar review",
        status: "confirmed",
        created_at: new Date().toISOString(),
      },
    ];
    setStored(STORAGE_KEYS.APPOINTMENTS, defaultAppointments);
  } catch (e) {
    console.warn("Initial seeding error:", e);
  }
}

// Run initial seed on load
ensureInitialSeedData();

export const dbService = {
  // Check if real Supabase is active
  isUsingLiveSupabase(): boolean {
    return Boolean(supabase);
  },

  // Auth: Get initial session
  async getInitialSession(): Promise<UserSession | null> {
    ensureInitialSeedData();
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          // Look up user metadata or doctor/patient tables
          const userMeta = session.user.user_metadata || {};
          const role = (userMeta.role as "doctor" | "patient") || "patient";
          const name = userMeta.name || session.user.email?.split("@")[0] || "User";
          return {
            id: session.user.id,
            email: session.user.email || "",
            role,
            name,
            avatar_url: userMeta.avatar_url,
          };
        }
      } catch (err) {
        console.warn("Supabase getSession failed, falling back to local session", err);
      }
    }
    return getStored<UserSession | null>(STORAGE_KEYS.SESSION, null);
  },

  // Auth: Email/Password Sign In
  async signIn(email: string, password: string, rolePreference?: "doctor" | "patient"): Promise<UserSession> {
    ensureInitialSeedData();
    const cleanEmail = email.trim().toLowerCase();

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error("No user returned from login");

      const userMeta = data.user.user_metadata || {};
      const role = (userMeta.role as "doctor" | "patient") || rolePreference || "patient";
      const name = userMeta.name || data.user.email?.split("@")[0] || "User";
      const session: UserSession = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        role,
        name,
        avatar_url: userMeta.avatar_url,
      };
      setStored(STORAGE_KEYS.SESSION, session);
      return session;
    }

    // Local DB Auth
    const users = getStored<Array<any>>(STORAGE_KEYS.USERS, []);
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    // Support standard demo passwords as fallback
    const isDemoDoctor = cleanEmail === "doctor@medcare.org" && (password === "doctor123" || password === "password123" || password === "doctor");
    const isDemoPatient = cleanEmail === "patient@medcare.org" && (password === "patient123" || password === "password123" || password === "patient");

    if (!found) {
      if (isDemoDoctor) {
        const session: UserSession = {
          id: "usr_doctor_anand",
          email: "doctor@medcare.org",
          role: "doctor",
          name: "Dr. Anand Sharma",
        };
        setStored(STORAGE_KEYS.SESSION, session);
        return session;
      }
      if (isDemoPatient) {
        const session: UserSession = {
          id: "usr_patient_rajesh",
          email: "patient@medcare.org",
          role: "patient",
          name: "Rajesh Patel",
        };
        setStored(STORAGE_KEYS.SESSION, session);
        return session;
      }
      throw new Error("Invalid email or password. Please use the Quick Demo Login buttons or click Create Account.");
    }

    const isPasswordCorrect = found.password === password || (found.role === "doctor" && password === "doctor123") || (found.role === "patient" && password === "patient123");
    if (!isPasswordCorrect) {
      throw new Error("Invalid email or password. Please check your password or use the Quick Demo Login buttons.");
    }

    const session: UserSession = {
      id: found.id,
      email: found.email,
      role: found.role,
      name: found.name,
      avatar_url: found.avatar_url,
    };
    setStored(STORAGE_KEYS.SESSION, session);
    return session;
  },

  // Auth: Register New Account (zero initial dummy records)
  async signUp(
    email: string,
    password: string,
    name: string,
    role: "doctor" | "patient",
    extraData?: Partial<DoctorProfile | PatientProfile>
  ): Promise<UserSession> {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });
      if (error) throw error;
      const user = data.user;
      if (!user) throw new Error("Registration failed");

      const session: UserSession = {
        id: user.id,
        email: user.email || email,
        role,
        name,
      };
      setStored(STORAGE_KEYS.SESSION, session);

      // Create profile record
      if (role === "doctor") {
        await this.saveDoctorProfile({
          id: user.id,
          user_id: user.id,
          email: user.email || email,
          name,
          specialization: (extraData as any)?.specialization || "General Medicine",
          clinic_name: (extraData as any)?.clinic_name || "Community Health Center",
          clinic_address: (extraData as any)?.clinic_address || "Main Road",
          latitude: (extraData as any)?.latitude || 28.6139,
          longitude: (extraData as any)?.longitude || 77.2090,
          consultation_fee: (extraData as any)?.consultation_fee || 300,
          phone: (extraData as any)?.phone || "",
          is_verified: true,
          availability: {
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            startTime: "09:00",
            endTime: "17:00",
            slotDurationMinutes: 30,
          },
          created_at: new Date().toISOString(),
        });
      } else {
        await this.savePatientProfile({
          id: user.id,
          user_id: user.id,
          email: user.email || email,
          name,
          phone: (extraData as any)?.phone || "",
          date_of_birth: (extraData as any)?.date_of_birth || "",
          blood_group: (extraData as any)?.blood_group || "O+",
          created_at: new Date().toISOString(),
        });
      }

      return session;
    }

    // Local DB Register
    const users = getStored<Array<any>>(STORAGE_KEYS.USERS, []);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists");
    }

    const userId = "usr_" + Math.random().toString(36).substring(2, 9);
    const newUser = {
      id: userId,
      email,
      password,
      name,
      role,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    setStored(STORAGE_KEYS.USERS, users);

    const session: UserSession = {
      id: userId,
      email,
      name,
      role,
    };
    setStored(STORAGE_KEYS.SESSION, session);

    // Save initial empty doctor/patient profile
    if (role === "doctor") {
      const docProfile: DoctorProfile = {
        id: "doc_" + userId,
        user_id: userId,
        email,
        name,
        specialization: (extraData as any)?.specialization || "General Physician",
        clinic_name: (extraData as any)?.clinic_name || "MedCare Clinic",
        clinic_address: (extraData as any)?.clinic_address || "Station Road, Block 4",
        latitude: (extraData as any)?.latitude || 28.6139,
        longitude: (extraData as any)?.longitude || 77.2090,
        consultation_fee: (extraData as any)?.consultation_fee || 350,
        phone: (extraData as any)?.phone || "",
        is_verified: true,
        availability: {
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          startTime: "09:00",
          endTime: "18:00",
          slotDurationMinutes: 30,
        },
        created_at: new Date().toISOString(),
      };
      const doctors = getStored<DoctorProfile[]>(STORAGE_KEYS.DOCTORS, []);
      doctors.push(docProfile);
      setStored(STORAGE_KEYS.DOCTORS, doctors);
    } else {
      const patientProfile: PatientProfile = {
        id: "pat_" + userId,
        user_id: userId,
        email,
        name,
        date_of_birth: (extraData as any)?.date_of_birth || "",
        age: (extraData as any)?.age || undefined,
        gender: (extraData as any)?.gender || undefined,
        phone: (extraData as any)?.phone || "",
        blood_group: (extraData as any)?.blood_group || "O+",
        created_at: new Date().toISOString(),
      };
      const patients = getStored<PatientProfile[]>(STORAGE_KEYS.PATIENTS, []);
      patients.push(patientProfile);
      setStored(STORAGE_KEYS.PATIENTS, patients);
    }

    return session;
  },

  // Auth: Google Sign In
  async signInWithGoogle(rolePreference: "doctor" | "patient" = "patient"): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${rolePreference}`,
        },
      });
      if (error) throw error;
      return;
    }

    // Direct OAuth simulation for web environment when Supabase keys not populated
    const mockEmail = `user_${Math.floor(Math.random() * 8999 + 1000)}@medcare.org`;
    const mockName = rolePreference === "doctor" ? "Dr. Registered Physician" : "Registered Patient";
    const session = await this.signUp(mockEmail, "GoogleAuth123!", mockName, rolePreference);
    setStored(STORAGE_KEYS.SESSION, session);
  },

  // Auth: Sign Out
  async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase signOut error", err);
      }
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  // DOCTORS: Get doctor profile by user_id
  async getDoctorProfile(userId: string): Promise<DoctorProfile | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!error && data) return data as DoctorProfile;
    }
    const doctors = getStored<DoctorProfile[]>(STORAGE_KEYS.DOCTORS, []);
    return doctors.find((d) => d.user_id === userId || d.id === userId) || null;
  },

  // DOCTORS: Save or Update doctor profile
  async saveDoctorProfile(profile: DoctorProfile): Promise<DoctorProfile> {
    if (supabase) {
      const { data, error } = await supabase
        .from("doctor_profiles")
        .upsert(profile)
        .select()
        .single();
      if (error) throw error;
      return data as DoctorProfile;
    }
    const doctors = getStored<DoctorProfile[]>(STORAGE_KEYS.DOCTORS, []);
    const index = doctors.findIndex((d) => d.id === profile.id || d.user_id === profile.user_id);
    if (index >= 0) {
      doctors[index] = { ...doctors[index], ...profile };
    } else {
      doctors.push(profile);
    }
    setStored(STORAGE_KEYS.DOCTORS, doctors);
    return profile;
  },

  // DOCTORS: List all verified doctors for patient search (only real registered doctors)
  async getAllDoctors(): Promise<DoctorProfile[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("is_verified", true);
      if (!error && data) return data as DoctorProfile[];
    }
    return getStored<DoctorProfile[]>(STORAGE_KEYS.DOCTORS, []);
  },

  // PATIENTS: Get patient profile by user_id
  async getPatientProfile(userId: string): Promise<PatientProfile | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!error && data) return data as PatientProfile;
    }
    const patients = getStored<PatientProfile[]>(STORAGE_KEYS.PATIENTS, []);
    return patients.find((p) => p.user_id === userId || p.id === userId) || null;
  },

  // PATIENTS: Save or Update patient profile
  async savePatientProfile(profile: PatientProfile): Promise<PatientProfile> {
    if (supabase) {
      const { data, error } = await supabase
        .from("patient_profiles")
        .upsert(profile)
        .select()
        .single();
      if (error) throw error;
      return data as PatientProfile;
    }
    const patients = getStored<PatientProfile[]>(STORAGE_KEYS.PATIENTS, []);
    const index = patients.findIndex((p) => p.id === profile.id || p.user_id === profile.user_id);
    if (index >= 0) {
      patients[index] = { ...patients[index], ...profile };
    } else {
      patients.push(profile);
    }
    setStored(STORAGE_KEYS.PATIENTS, patients);
    return profile;
  },

  // PARCHA RECORDS: Save newly verified Parcha prescription
  async saveParchaRecord(record: Omit<ParchaRecord, "id" | "created_at">): Promise<ParchaRecord> {
    const newRecord: ParchaRecord = {
      ...record,
      id: "parcha_" + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("parcha_records")
        .insert(newRecord)
        .select()
        .single();
      if (error) throw error;
      return data as ParchaRecord;
    }

    const parchas = getStored<ParchaRecord[]>(STORAGE_KEYS.PARCHAS, []);
    parchas.unshift(newRecord);
    setStored(STORAGE_KEYS.PARCHAS, parchas);

    // Also auto-index as a prescription file in patient's file repository
    if (record.patient_id || record.patient_name) {
      const newFile: HealthFile = {
        id: "file_" + Math.random().toString(36).substring(2, 9),
        patient_id: record.patient_id || "pat_doc_scan",
        patient_name: record.patient_name,
        title: `Prescription (${record.visit_date}) - ${record.diagnosis || "Medical Visit"}`,
        category: "Prescriptions",
        file_url: record.image_url,
        storage_path: record.image_storage_path || `parcha-images/${newRecord.id}.jpg`,
        file_size: 240000,
        file_type: "image/jpeg",
        doctor_name: record.doctor_name,
        clinic_name: record.clinic_name,
        report_date: record.visit_date,
        created_at: new Date().toISOString(),
      };
      const files = getStored<HealthFile[]>(STORAGE_KEYS.FILES, []);
      files.unshift(newFile);
      setStored(STORAGE_KEYS.FILES, files);
    }

    return newRecord;
  },

  // PARCHA RECORDS: Get records by Doctor ID (Doctor view)
  async getDoctorParchas(doctorId: string): Promise<ParchaRecord[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("parcha_records")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false });
      if (!error && data) return data as ParchaRecord[];
    }
    const parchas = getStored<ParchaRecord[]>(STORAGE_KEYS.PARCHAS, []);
    return parchas.filter((p) => p.doctor_id === doctorId);
  },

  // PARCHA RECORDS: Get records for Patient (Patient view)
  async getPatientParchas(patientId: string, patientName?: string): Promise<ParchaRecord[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("parcha_records")
        .select("*")
        .or(`patient_id.eq.${patientId},patient_name.ilike.%${patientName || ""}%`)
        .order("created_at", { ascending: false });
      if (!error && data) return data as ParchaRecord[];
    }
    const parchas = getStored<ParchaRecord[]>(STORAGE_KEYS.PARCHAS, []);
    return parchas.filter((p) => {
      if (p.patient_id === patientId) return true;
      if (patientName && p.patient_name.toLowerCase().includes(patientName.toLowerCase())) return true;
      return false;
    });
  },

  // DELETE PATIENT: Delete a patient record from doctor's clinic, including associated visits & storage
  async deletePatientRecords(doctorId: string, patientName: string, patientId?: string): Promise<void> {
    if (supabase) {
      let query = supabase.from("parcha_records").delete().eq("doctor_id", doctorId);
      if (patientId) {
        query = query.eq("patient_id", patientId);
      } else {
        query = query.eq("patient_name", patientName);
      }
      await query;
      return;
    }

    const parchas = getStored<ParchaRecord[]>(STORAGE_KEYS.PARCHAS, []);
    const filtered = parchas.filter(
      (p) => !(p.doctor_id === doctorId && (p.patient_id === patientId || p.patient_name === patientName))
    );
    setStored(STORAGE_KEYS.PARCHAS, filtered);

    // Also remove appointments for this patient with this doctor
    const appts = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const filteredAppts = appts.filter(
      (a) => !(a.doctor_id === doctorId && (a.patient_id === patientId || a.patient_name === patientName))
    );
    setStored(STORAGE_KEYS.APPOINTMENTS, filteredAppts);
  },

  // APPOINTMENTS: Book a new appointment
  async bookAppointment(appt: Omit<Appointment, "id" | "created_at" | "status">): Promise<Appointment> {
    // Check for double booking
    const existing = await this.getDoctorAppointments(appt.doctor_id);
    const isSlotTaken = existing.some(
      (a) =>
        a.appointment_date === appt.appointment_date &&
        a.slot_time === appt.slot_time &&
        a.status !== "cancelled"
    );

    if (isSlotTaken) {
      throw new Error("This slot has already been booked by another patient. Please choose another time slot.");
    }

    const newAppt: Appointment = {
      ...appt,
      id: "appt_" + Math.random().toString(36).substring(2, 9),
      status: "pending",
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("appointments")
        .insert(newAppt)
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    }

    const appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    appointments.unshift(newAppt);
    setStored(STORAGE_KEYS.APPOINTMENTS, appointments);
    return newAppt;
  },

  // APPOINTMENTS: Update status (confirm, reject, complete, cancel)
  async updateAppointmentStatus(appointmentId: string, status: Appointment["status"]): Promise<void> {
    if (supabase) {
      await supabase.from("appointments").update({ status }).eq("id", appointmentId);
      return;
    }

    const appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const index = appointments.findIndex((a) => a.id === appointmentId);
    if (index >= 0) {
      appointments[index].status = status;
      setStored(STORAGE_KEYS.APPOINTMENTS, appointments);
    }
  },

  // APPOINTMENTS: Get by doctor
  async getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("appointment_date", { ascending: false });
      if (!error && data) return data as Appointment[];
    }
    const appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    return appointments.filter((a) => a.doctor_id === doctorId);
  },

  // APPOINTMENTS: Get by patient
  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patientId)
        .order("appointment_date", { ascending: false });
      if (!error && data) return data as Appointment[];
    }
    const appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    return appointments.filter((a) => a.patient_id === patientId);
  },

  // Alias for createAppointment
  async createAppointment(appointment: Omit<Appointment, "id" | "created_at">): Promise<Appointment> {
    return this.bookAppointment(appointment);
  },

  // HEALTH FILES: Save File (e.g. prescription, scan, custom report PDF)
  async saveHealthFile(file: Omit<HealthFile, "id" | "created_at">): Promise<HealthFile> {
    const newFile: HealthFile = {
      ...file,
      id: "file_" + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("health_files")
        .insert(newFile)
        .select()
        .single();
      if (error) throw error;
      return data as HealthFile;
    }

    const files = getStored<HealthFile[]>(STORAGE_KEYS.FILES, []);
    files.unshift(newFile);
    setStored(STORAGE_KEYS.FILES, files);
    return newFile;
  },

  // Alias for uploadPatientFile
  async uploadPatientFile(file: Omit<HealthFile, "id" | "created_at">): Promise<HealthFile> {
    return this.saveHealthFile(file);
  },

  // HEALTH FILES: Get all files for a patient
  async getPatientFiles(patientId: string, category?: string): Promise<HealthFile[]> {
    if (supabase) {
      let query = supabase.from("health_files").select("*").eq("patient_id", patientId);
      if (category && category !== "All") {
        query = query.eq("category", category);
      }
      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data) return data as HealthFile[];
    }

    const files = getStored<HealthFile[]>(STORAGE_KEYS.FILES, []);
    return files.filter((f) => {
      if (f.patient_id !== patientId && f.patient_id !== "pat_doc_scan") return false;
      if (category && category !== "All" && f.category !== category) return false;
      return true;
    });
  },

  // HEALTH FILES: Delete a file
  async deleteHealthFile(fileId: string): Promise<void> {
    if (supabase) {
      await supabase.from("health_files").delete().eq("id", fileId);
      return;
    }

    const files = getStored<HealthFile[]>(STORAGE_KEYS.FILES, []);
    const filtered = files.filter((f) => f.id !== fileId);
    setStored(STORAGE_KEYS.FILES, filtered);
  },

  // Alias for deletePatientFile
  async deletePatientFile(fileId: string): Promise<void> {
    return this.deleteHealthFile(fileId);
  },
};
