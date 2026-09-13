import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { PatientProfile as IPatientProfile } from "../../types";
import {
  User,
  Heart,
  Phone,
  ShieldCheck,
  Check,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

export const PatientProfile: React.FC = () => {
  const { patientProfile, updatePatientProfile, user } = useAuth();

  const [name, setName] = useState<string>(patientProfile?.name || user?.name || "");
  const [age, setAge] = useState<string>(patientProfile?.age ? String(patientProfile.age) : "");
  const [gender, setGender] = useState<string>(patientProfile?.gender || "Male");
  const [phone, setPhone] = useState<string>(patientProfile?.phone || "");
  const [bloodGroup, setBloodGroup] = useState<string>(patientProfile?.blood_group || "O+");

  // Chronic conditions
  const [chronicConditions, setChronicConditions] = useState<string[]>(
    patientProfile?.chronic_conditions || []
  );
  const [newCondition, setNewCondition] = useState<string>("");

  // Allergies
  const [allergies, setAllergies] = useState<string[]>(patientProfile?.allergies || []);
  const [newAllergy, setNewAllergy] = useState<string>("");

  // Emergency contact
  const [emName, setEmName] = useState<string>(patientProfile?.emergency_contact?.name || "");
  const [emRelation, setEmRelation] = useState<string>(
    patientProfile?.emergency_contact?.relation || ""
  );
  const [emPhone, setEmPhone] = useState<string>(patientProfile?.emergency_contact?.phone || "");

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleAddCondition = () => {
    if (!newCondition.trim()) return;
    setChronicConditions([...chronicConditions, newCondition.trim()]);
    setNewCondition("");
  };

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    setAllergies([...allergies, newAllergy.trim()]);
    setNewAllergy("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientProfile) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated: IPatientProfile = {
        ...patientProfile,
        name: name.trim(),
        age: age ? Number(age) : undefined,
        gender,
        phone: phone.trim(),
        blood_group: bloodGroup,
        chronic_conditions: chronicConditions,
        allergies,
        emergency_contact: emName
          ? {
              name: emName.trim(),
              relation: emRelation.trim(),
              phone: emPhone.trim(),
            }
          : undefined,
      };

      await updatePatientProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving patient profile:", err);
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
          <span>Patient Profile & Medical Details</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Maintain your personal demographics, emergency contact info, and medical flags.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold animate-fadeIn">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Medical profile successfully updated!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Age</label>
            <input
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 32"
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Chronic Medical Conditions
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              placeholder="Add condition (e.g. Hypertension, Type 2 Diabetes, Asthma)"
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
            />
            <button
              type="button"
              onClick={handleAddCondition}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {chronicConditions.map((cond, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
              >
                <span>{cond}</span>
                <button
                  type="button"
                  onClick={() => setChronicConditions(chronicConditions.filter((_, i) => i !== idx))}
                  className="hover:text-red-600 ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Known Drug / Food Allergies
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="Add allergy (e.g. Penicillin, Sulfa drugs, Peanuts)"
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl"
            />
            <button
              type="button"
              onClick={handleAddAllergy}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {allergies.map((allg, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-800 text-xs font-medium border border-red-200"
              >
                <span>{allg}</span>
                <button
                  type="button"
                  onClick={() => setAllergies(allergies.filter((_, i) => i !== idx))}
                  className="hover:text-red-600 ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Emergency Contact Information
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={emName}
              onChange={(e) => setEmName(e.target.value)}
              placeholder="Contact Person Name"
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
            <input
              type="text"
              value={emRelation}
              onChange={(e) => setEmRelation(e.target.value)}
              placeholder="Relation (e.g. Spouse, Father)"
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
            <input
              type="tel"
              value={emPhone}
              onChange={(e) => setEmPhone(e.target.value)}
              placeholder="Emergency Phone Number"
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />
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
                <span>Saving Details...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Patient Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
