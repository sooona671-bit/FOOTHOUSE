export type GuestDetails = {
  name: string;
  phone: string;
  city: string;
  address: string;
  lat?: number;
  lng?: number;
};

export type GuestDetailErrors = Partial<Record<keyof GuestDetails, string>>;

const STORAGE_KEY = "fh_guest_details";

export function normalizeGuestDetails(details: GuestDetails): GuestDetails {
  const phone = details.phone.trim().replace(/[\s-]/g, "");
  return {
    name: details.name.trim(),
    phone,
    city: details.city.trim(),
    address: details.address.trim(),
    ...(typeof details.lat === "number" && typeof details.lng === "number" ? { lat: details.lat, lng: details.lng } : {}),
  };
}

export function validate(details: GuestDetails): GuestDetailErrors {
  const value = normalizeGuestDetails(details);
  const errors: GuestDetailErrors = {};
  if (value.name.length < 2) errors.name = "Please enter your full name.";
  if (!/^\+?\d{7,15}$/.test(value.phone)) errors.phone = "Enter a phone number with 7 to 15 digits.";
  if (!value.city) errors.city = "Please enter your city or town.";
  if (value.address.length < 5) errors.address = "Please enter at least 5 characters for your address.";
  return errors;
}

export function getGuestDetails(): GuestDetails | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestDetails;
    if (!parsed || typeof parsed !== "object") return null;
    return normalizeGuestDetails(parsed);
  } catch {
    return null;
  }
}

export function saveGuestDetails(details: GuestDetails) {
  const value = normalizeGuestDetails(details);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private or blocked storage must not prevent a guest order.
  }
  return value;
}

export function clearGuestDetails() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private or blocked storage must not crash the app.
  }
}
