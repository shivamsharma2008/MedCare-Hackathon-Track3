import React, { createContext, useContext, useEffect, useState } from "react";
import { UserSession, DoctorProfile, PatientProfile, UserRole } from "../types";
import { dbService } from "../lib/supabase";

interface AuthContextType {
  user: UserSession | null;
  role: UserRole | null;
  doctorProfile: DoctorProfile | null;
  patientProfile: PatientProfile | null;
  loading: boolean;
  login: (email: string, password: string, rolePreference?: UserRole) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    extraData?: Partial<DoctorProfile | PatientProfile>
  ) => Promise<void>;
  googleLogin: (rolePreference?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateDoctorProfile: (profile: DoctorProfile) => Promise<void>;
  updatePatientProfile: (profile: PatientProfile) => Promise<void>;
  currentRoute: string;
  navigateTo: (path: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || "/";
  });

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentRoute(path);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const loadUserProfile = async (sessionUser: UserSession) => {
    try {
      if (sessionUser.role === "doctor") {
        let doc = await dbService.getDoctorProfile(sessionUser.id);
        if (!doc) {
          doc = {
            id: sessionUser.id,
            user_id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
            specialization: "General Physician",
            clinic_name: "MedCare Primary Clinic",
            clinic_address: "Station Road, Block 4",
            latitude: 28.6139,
            longitude: 77.2090,
            consultation_fee: 300,
            phone: "",
            is_verified: true,
            availability: {
              days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              startTime: "09:00",
              endTime: "17:00",
              slotDurationMinutes: 30,
            },
            created_at: new Date().toISOString(),
          };
          await dbService.saveDoctorProfile(doc);
        }
        setDoctorProfile(doc);
      } else {
        let pat = await dbService.getPatientProfile(sessionUser.id);
        if (!pat) {
          pat = {
            id: sessionUser.id,
            user_id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
            created_at: new Date().toISOString(),
          };
          await dbService.savePatientProfile(pat);
        }
        setPatientProfile(pat);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const session = await dbService.getInitialSession();
        if (session) {
          setUser(session);
          await loadUserProfile(session);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, rolePreference?: UserRole) => {
    setLoading(true);
    try {
      const session = await dbService.signIn(email, password, rolePreference);
      setUser(session);
      await loadUserProfile(session);
      if (session.role === "doctor") {
        navigateTo("/doctor/home");
      } else {
        navigateTo("/patient/home");
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    extraData?: Partial<DoctorProfile | PatientProfile>
  ) => {
    setLoading(true);
    try {
      const session = await dbService.signUp(email, password, name, role, extraData);
      setUser(session);
      await loadUserProfile(session);
      if (role === "doctor") {
        navigateTo("/doctor/home");
      } else {
        navigateTo("/patient/home");
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (rolePreference: UserRole = "patient") => {
    setLoading(true);
    try {
      await dbService.signInWithGoogle(rolePreference);
      const session = await dbService.getInitialSession();
      if (session) {
        setUser(session);
        await loadUserProfile(session);
        if (session.role === "doctor") {
          navigateTo("/doctor/home");
        } else {
          navigateTo("/patient/home");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await dbService.signOut();
      setUser(null);
      setDoctorProfile(null);
      setPatientProfile(null);
      navigateTo("/login");
    } finally {
      setLoading(false);
    }
  };

  const updateDoctorProfile = async (profile: DoctorProfile) => {
    const updated = await dbService.saveDoctorProfile(profile);
    setDoctorProfile(updated);
  };

  const updatePatientProfile = async (profile: PatientProfile) => {
    const updated = await dbService.savePatientProfile(profile);
    setPatientProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        doctorProfile,
        patientProfile,
        loading,
        login,
        signup,
        googleLogin,
        logout,
        updateDoctorProfile,
        updatePatientProfile,
        currentRoute,
        navigateTo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
