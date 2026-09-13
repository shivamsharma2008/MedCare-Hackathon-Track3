export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface UserLocationResult {
  coords?: Coordinates;
  address?: string;
  error?: string;
}

// Haversine formula to calculate real great-circle distance between two GPS coordinates in kilometers
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place
}

// Request real browser geolocation with explicit user trigger
export function requestUserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser"));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let msg = "Could not retrieve location";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission was denied. You can select your location manually.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable on your device.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out. Please try again or select manually.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

export const getUserLocation = requestUserLocation;

// Standard preset locations for manual selection
export const MANUAL_LOCATIONS = [
  { name: "Central District (Connaught Place)", latitude: 28.6315, longitude: 77.2167 },
  { name: "North Sector (Civil Lines)", latitude: 28.6812, longitude: 77.2227 },
  { name: "South Sector (Saket / AIIMS area)", latitude: 28.5244, longitude: 77.2066 },
  { name: "East Block (Mayur Vihar / Preet Vihar)", latitude: 28.6096, longitude: 77.3048 },
  { name: "West Block (Janakpuri / Rajouri)", latitude: 28.6219, longitude: 77.0878 },
  { name: "Rural / Outer Block (Najafgarh / Alipur)", latitude: 28.6128, longitude: 76.9855 },
];
