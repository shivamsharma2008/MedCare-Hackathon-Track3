import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { DoctorProfile as IDoctorProfile } from "../../types";
import {
  User,
  Building,
  MapPin,
  Phone,
  DollarSign,
  ShieldCheck,
  Check,
  Loader2,
  Navigation,
} from "lucide-react";

export const DoctorProfile: React.FC = () => {
  const { doctorProfile, updateDoctorProfile, user } = useAuth();

  const [name, setName] = useState<string>(doctorProfile?.name || user?.name || "");
  const [specialization, setSpecialization] = useState<string>(
    doctorProfile?.specialization || "General Physician"
  );
  const [clinicName, setClinicName] = useState<string>(
    doctorProfile?.clinic_name || "MedCare Clinic"
  );
  const [clinicAddress, setClinicAddress] = useState<string>(
    doctorProfile?.clinic_address || "Main Market Road"
  );
  const [phone, setPhone] = useState<string>(doctorProfile?.phone || "");
  const [fee, setFee] = useState<number>(doctorProfile?.consultation_fee || 300);
  const [lat, setLat] = useState<number>(doctorProfile?.latitude || 28.6139);
  const [lng, setLng] = useState<number>(doctorProfile?.longitude || 77.2090);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setIsLocating(false);
      },
      (err) => {
        console.warn("Location error:", err);
        setIsLocating(false);
        alert("Could not detect current location automatically. Please enter coordinates manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated: IDoctorProfile = {
        ...doctorProfile,
        name: name.trim(),
        specialization: specialization.trim(),
        clinic_name: clinicName.trim(),
        clinic_address: clinicAddress.trim(),
        phone: phone.trim(),
        consultation_fee: Number(fee),
        latitude: Number(lat),
        longitude: Number(lng),
      };
      await updateDoctorProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <User className="w-6 h-6 text-cyan-600" />
          <span>Doctor & Clinic Profile Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Update practice information, consultation charges, and geographic coordinates for patient discovery.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Profile information successfully updated!</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Doctor Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Medical Specialization *</label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="General Physician">General Physician</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Pediatrician">Pediatrician</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Orthopedic">Orthopedic</option>
              <option value="Gynecologist">Gynecologist</option>
              <option value="Neurologist">Neurologist</option>
              <option value="ENT Specialist">ENT Specialist</option>
              <option value="Dentist">Dentist</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Clinic / Hospital Name *</label>
            <input
              type="text"
              required
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Contact Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Clinic Physical Address</label>
            <input
              type="text"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
              placeholder="Shop No. 4, Market Complex, Station Road"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Consultation Fee (₹ INR)</label>
            <input
              type="number"
              min={0}
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Geolocation Section for Doctor Search */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>Clinic GPS Coordinates</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Used to compute accurate distance (in km) when nearby patients search for doctors.
              </p>
            </div>
            <button
              type="button"
              id="btn-detect-clinic-location"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-colors"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Use Device Current GPS</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-600 font-medium">Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-600 font-medium">Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-cyan-600/20 flex items-center justify-center space-x-2 transition-transform active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile Details</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
