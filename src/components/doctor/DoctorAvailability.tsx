import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Clock, Check, Calendar, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export const DoctorAvailability: React.FC = () => {
  const { doctorProfile, updateDoctorProfile } = useAuth();

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const [selectedDays, setSelectedDays] = useState<string[]>(
    doctorProfile?.availability?.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  );
  const [startTime, setStartTime] = useState<string>(
    doctorProfile?.availability?.startTime || "09:00"
  );
  const [endTime, setEndTime] = useState<string>(
    doctorProfile?.availability?.endTime || "17:00"
  );
  const [slotDuration, setSlotDuration] = useState<number>(
    doctorProfile?.availability?.slotDurationMinutes || 30
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      const updated = {
        ...doctorProfile,
        availability: {
          days: selectedDays,
          startTime,
          endTime,
          slotDurationMinutes: Number(slotDuration),
        },
      };
      await updateDoctorProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving availability:", err);
      alert("Failed to update availability schedule");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <Clock className="w-6 h-6 text-cyan-600" />
          <span>Clinic Operating Hours & Slot Availability</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure working days and consultation slot intervals. Patients will only see and book slots matching these active hours.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Availability schedule updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveAvailability} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Days of Week */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Active Clinic Operating Days
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {daysOfWeek.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  id={`btn-day-${day.toLowerCase()}`}
                  onClick={() => toggleDay(day)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center space-y-1 ${
                    active
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-xs shadow-cyan-600/30"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
                  <span className="text-[10px] font-normal opacity-90">{active ? "Open" : "Off"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Clinic Opens At</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Clinic Closes At</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Slot Duration</label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value={15}>15 Minutes per patient</option>
              <option value={20}>20 Minutes per patient</option>
              <option value={30}>30 Minutes per patient</option>
              <option value={45}>45 Minutes per patient</option>
              <option value={60}>60 Minutes per patient</option>
            </select>
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
                <span>Saving Schedule...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Availability</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
