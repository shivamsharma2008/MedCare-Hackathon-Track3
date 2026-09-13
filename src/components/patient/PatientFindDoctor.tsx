import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dbService } from "../../lib/supabase";
import { DoctorProfile, Appointment } from "../../types";
import { calculateDistanceKm, getUserLocation, Coordinates } from "../../lib/geo";
import { Modal } from "../common/Modal";
import {
  Search,
  MapPin,
  Stethoscope,
  Clock,
  Calendar,
  DollarSign,
  Phone,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
  ShieldCheck,
} from "lucide-react";

export const PatientFindDoctor: React.FC = () => {
  const { user, patientProfile, navigateTo } = useAuth();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // User Geolocation State
  const [userCoords, setUserCoords] = useState<Coordinates | null>(null);
  const [locationPromptOpen, setLocationPromptOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSpec, setSelectedSpec] = useState<string>("All");
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [sortBy, setSortBy] = useState<"distance" | "fee" | "name">("distance");

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [appointmentReason, setAppointmentReason] = useState<string>("");
  const [patientContactPhone, setPatientContactPhone] = useState<string>(patientProfile?.phone || "");
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const list = await dbService.getAllDoctors();
        setDoctors(list);
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleRequestLocation = async () => {
    setLocationPromptOpen(false);
    setIsLocating(true);
    setLocationError(null);
    try {
      const coords = await getUserLocation();
      setUserCoords(coords);
    } catch (err: any) {
      console.warn("Location error:", err);
      setLocationError(err.message || "Location permission denied. Showing all clinics.");
    } finally {
      setIsLocating(false);
    }
  };

  // Compute doctors with distance
  const doctorsWithDistance = doctors.map((doc) => {
    let distanceKm: number | null = null;
    if (userCoords && doc.latitude && doc.longitude) {
      distanceKm = calculateDistanceKm(
        userCoords.latitude,
        userCoords.longitude,
        doc.latitude,
        doc.longitude
      );
    }
    return {
      ...doc,
      distanceKm,
    };
  });

  // Filter & Sort
  const filteredDoctors = doctorsWithDistance
    .filter((doc) => {
      // Specialization filter
      if (selectedSpec !== "All" && doc.specialization !== selectedSpec) {
        return false;
      }
      // Search query (doctor name, clinic name, address)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesClinic = doc.clinic_name.toLowerCase().includes(q);
        const matchesAddress = doc.clinic_address?.toLowerCase().includes(q);
        if (!matchesName && !matchesClinic && !matchesAddress) {
          return false;
        }
      }
      // Distance filter (if user location enabled)
      if (doc.distanceKm !== null && doc.distanceKm > maxDistance) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "distance") {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      }
      if (sortBy === "fee") {
        return a.consultation_fee - b.consultation_fee;
      }
      return a.name.localeCompare(b.name);
    });

  // Generate available time slots for doctor based on availability
  const generateSlots = (doc: DoctorProfile) => {
    const slots: string[] = [];
    const startHour = doc.availability ? parseInt(doc.availability.startTime.split(":")[0]) : 9;
    const endHour = doc.availability ? parseInt(doc.availability.endTime.split(":")[0]) : 17;
    const duration = doc.availability?.slotDurationMinutes || 30;

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += duration) {
        const formattedHour = h.toString().padStart(2, "0");
        const formattedMin = m.toString().padStart(2, "0");
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
        slots.push(`${displayH}:${formattedMin} ${period}`);
      }
    }
    return slots;
  };

  const handleOpenBooking = (doc: DoctorProfile) => {
    setBookingDoctor(doc);
    const slots = generateSlots(doc);
    if (slots.length > 0) {
      setSelectedSlot(slots[0]);
    }
    setBookingSuccess(false);
  };

  const handleConfirmAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bookingDoctor) return;

    setIsBooking(true);
    try {
      const appt: Omit<Appointment, "id" | "created_at"> = {
        patient_id: user.id,
        patient_name: patientProfile?.name || user.name || "Patient",
        patient_phone: patientContactPhone,
        doctor_id: bookingDoctor.id,
        doctor_name: bookingDoctor.name,
        clinic_name: bookingDoctor.clinic_name,
        doctor_specialization: bookingDoctor.specialization || "General Physician",
        appointment_date: selectedDate,
        slot_time: selectedSlot,
        reason: appointmentReason.trim() || "General Consultation",
        status: "pending",
      };

      await dbService.createAppointment(appt);
      setBookingSuccess(true);
    } catch (err) {
      console.error("Error creating appointment:", err);
      alert("Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  };

  const specializations = [
    "All",
    "General Physician",
    "Cardiologist",
    "Pediatrician",
    "Dermatologist",
    "Orthopedic",
    "Gynecologist",
    "Neurologist",
    "ENT Specialist",
    "Dentist",
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Location Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Search className="w-6 h-6 text-cyan-600" />
            <span>Find a Doctor & Book Appointment</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Search nearby verified doctors, clinics, and check real-time consultation slot availability.
          </p>
        </div>

        <div>
          {!userCoords ? (
            <button
              id="btn-trigger-find-nearby-location"
              onClick={() => setLocationPromptOpen(true)}
              disabled={isLocating}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm flex items-center space-x-2 transition-transform active:scale-95"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Locating Device...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Find Nearest Clinics</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs text-emerald-800 font-semibold">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Location Active ({userCoords.latitude.toFixed(2)}, {userCoords.longitude.toFixed(2)})</span>
            </div>
          )}
        </div>
      </div>

      {locationError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Text Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor, clinic, or area..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {/* Specialization Filter */}
          <div className="sm:col-span-4">
            <select
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec === "All" ? "All Specializations" : spec}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="distance">Sort by: Nearest Distance</option>
              <option value="fee">Sort by: Consultation Fee</option>
              <option value="name">Sort by: Doctor Name</option>
            </select>
          </div>
        </div>

        {/* Max Distance Slider if location enabled */}
        {userCoords && (
          <div className="flex items-center space-x-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span className="font-medium whitespace-nowrap">Max Distance: {maxDistance} km</span>
            <input
              type="range"
              min={1}
              max={100}
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full max-w-xs accent-cyan-600 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Searching clinic directory...</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 bg-white rounded-2xl p-8 space-y-3">
          <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No doctors found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria, widening the distance radius, or clearing specialization filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-cyan-500 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white font-bold flex items-center justify-center text-base shadow-sm">
                      {doc.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                          Dr. {doc.name}
                        </h3>
                        {doc.is_verified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-cyan-700">{doc.specialization}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="font-semibold text-slate-800">{doc.clinic_name}</div>
                  {doc.clinic_address && (
                    <div className="text-[11px] text-slate-500 flex items-start space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{doc.clinic_address}</span>
                    </div>
                  )}
                  {doc.distanceKm !== null && (
                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 font-bold text-[11px]">
                      <Navigation className="w-3 h-3 text-cyan-600" />
                      <span>{doc.distanceKm.toFixed(1)} km away</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Consultation Fee:</span>
                    <span className="font-bold text-slate-900">₹ {doc.consultation_fee}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Operating Hours:</span>
                    <span className="text-slate-700 font-medium">
                      {doc.availability ? `${doc.availability.startTime} - ${doc.availability.endTime}` : "09:00 - 17:00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  id={`btn-book-doc-${doc.id}`}
                  onClick={() => handleOpenBooking(doc)}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-cyan-600/20 flex items-center justify-center space-x-1.5 transition-transform active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pre-permission Geolocation Modal */}
      <Modal
        isOpen={locationPromptOpen}
        onClose={() => setLocationPromptOpen(false)}
        title="Allow Location Access"
        maxWidth="md"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto border border-cyan-100">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">Find Doctors Near You</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              MedCare uses your device GPS coordinates to calculate exact distances in kilometers to the nearest clinics.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              id="btn-confirm-location-permission"
              onClick={handleRequestLocation}
              className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Allow Location
            </button>
            <button
              onClick={() => setLocationPromptOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </Modal>

      {/* Appointment Slot Booking Modal */}
      <Modal
        isOpen={Boolean(bookingDoctor)}
        onClose={() => setBookingDoctor(null)}
        title={
          bookingDoctor ? (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-cyan-600" />
              <span>Book Appointment &bull; Dr. {bookingDoctor.name}</span>
            </div>
          ) : (
            "Book Appointment"
          )
        }
        maxWidth="lg"
      >
        {bookingDoctor && (
          <div>
            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Appointment Request Sent!</h3>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Your appointment for <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong> has been submitted to Dr. {bookingDoctor.name}.
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setBookingDoctor(null);
                      navigateTo("/patient/appointments");
                    }}
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl"
                  >
                    View in My Appointments
                  </button>
                  <button
                    onClick={() => setBookingDoctor(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmAppointment} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-900">{bookingDoctor.clinic_name}</div>
                  <div className="text-slate-600">{bookingDoctor.specialization} &bull; Consultation Fee: ₹ {bookingDoctor.consultation_fee}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Appointment Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().slice(0, 10)}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none bg-white"
                  />
                </div>

                {/* Slot Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Select Available Time Slot</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                    {generateSlots(bookingDoctor).map((slot) => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all text-center ${
                            isSelected
                              ? "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Patient Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={patientContactPhone}
                    onChange={(e) => setPatientContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Reason for Visit / Symptoms</label>
                  <textarea
                    rows={2}
                    value={appointmentReason}
                    onChange={(e) => setAppointmentReason(e.target.value)}
                    placeholder="Describe symptoms (e.g. Mild headache and cough for 2 days)"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBookingDoctor(null)}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    id="btn-submit-appointment-booking"
                    type="submit"
                    disabled={isBooking || !selectedSlot}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-1.5"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Confirming...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Booking</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
