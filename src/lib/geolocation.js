// -----------------------------------------------------------------------
// Powers the "Use my current location" button on the address form.
// Two steps:
//   1. Ask the browser's Geolocation API for the device's coordinates.
//   2. Reverse-geocode those coordinates into a street address using
//      OpenStreetMap's free Nominatim API — no Google Maps API key or
//      billing account required.
// -----------------------------------------------------------------------

// Wraps navigator.geolocation.getCurrentPosition in a Promise with
// friendlier, customer-facing error messages for each failure mode.
export function getCurrentCoords(options = {}) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location isn't supported on this browser or device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const messages = {
          1: "Location access was denied. Please allow location permission in your browser and try again.",
          2: "Your location couldn't be determined right now. Please try again or enter your address manually.",
          3: "That took too long to respond. Please try again.",
        };
        reject(new Error(messages[err.code] || "Couldn't get your current location."));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000, ...options }
    );
  });
}

// Turns lat/lng into a structured address via Nominatim's free reverse
// geocoding endpoint. Intended for low-volume, user-triggered lookups
// (one tap = one request) — Nominatim's public instance is rate
// limited (~1 request/sec) and asks that heavier use self-host or use
// a paid provider instead, which doesn't apply here.
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
  let res;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new Error("Couldn't reach the address lookup service. Please check your connection.");
  }
  if (!res.ok) throw new Error("Couldn't look up an address for that location.");
  const data = await res.json();
  const a = data.address || {};

  const line1 =
    [a.house_number, a.road || a.pedestrian || a.neighbourhood || a.suburb].filter(Boolean).join(" ") ||
    (data.display_name ? data.display_name.split(",")[0] : "");
  const city = a.city || a.town || a.village || a.suburb || a.county || "";
  const state = a.state || "";
  const pincode = a.postcode || "";

  return { line1, city, state, pincode, displayName: data.display_name || "" };
}

// Convenience wrapper for the address form's "Use my current
// location" button: gets coordinates, reverse-geocodes them, and
// returns everything the form needs in one call.
export async function detectCurrentAddress() {
  const coords = await getCurrentCoords();
  const address = await reverseGeocode(coords.lat, coords.lng);
  return { ...coords, ...address };
}
