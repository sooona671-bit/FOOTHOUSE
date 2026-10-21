import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fhButton } from "@/components/fh/primitives";
import { getGuestDetails, normalizeGuestDetails, saveGuestDetails, validate, type GuestDetails, type GuestDetailErrors } from "@/lib/guest-details";

export function GuestOrderSheet({ open, onOpenChange, onSubmit, sending = false }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (details: GuestDetails) => Promise<void>; sending?: boolean }) {
  const [details, setDetails] = useState<GuestDetails>({ name: "", phone: "", city: "", address: "" });
  const [errors, setErrors] = useState<GuestDetailErrors>({});
  const [editing, setEditing] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{ kind: "idle" | "success" | "error"; message?: string }>({ kind: "idle" });
  const [locationSuggested, setLocationSuggested] = useState(false);

  useEffect(() => {
    if (!open) return;
    const saved = getGuestDetails();
    if (saved && Object.keys(validate(saved)).length === 0) {
      setDetails(saved);
      setErrors({});
      setEditing(false);
    } else {
      setDetails(saved ?? { name: "", phone: "", city: "", address: "" });
      setErrors({});
      setEditing(true);
    }
    setLocationStatus(typeof saved?.lat === "number" && typeof saved.lng === "number" ? { kind: "success", message: "Location added ✓" } : { kind: "idle" });
    setLocationSuggested(false);
  }, [open]);

  const update = (field: keyof GuestDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === "city" || field === "address") setLocationSuggested(false);
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const params = new URLSearchParams({ format: "jsonv2", addressdetails: "1", zoom: "18", "accept-language": "en", lat: String(latitude), lon: String(longitude) });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, { signal: controller.signal });
      if (!response.ok) return;
      const result = await response.json() as { address?: Record<string, string | undefined> };
      const address = result.address ?? {};
      const city = address["city"] || address["town"] || address["village"] || address["suburb"] || address["county"];
      const parts = [address["road"], address["neighbourhood"], address["suburb"], city, address["district"], address["state"]].filter((part): part is string => Boolean(part));
      const line = [...new Set(parts)].join(", ");
      setDetails((current) => {
        const next = { ...current };
        let changed = false;
        if (!current.city.trim() && city) { next.city = city; changed = true; }
        if (!current.address.trim() && line) { next.address = line; changed = true; }
        if (changed) setLocationSuggested(true);
        return next;
      });
    } catch {
      // Coordinates remain usable when reverse geocoding is unavailable.
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const useLocation = () => {
    setLocationStatus({ kind: "idle" });
    if (typeof window === "undefined" || !window.isSecureContext) {
      setLocationStatus({ kind: "error", message: "Location needs a secure (https) connection." });
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus({ kind: "error", message: "Location is not available in this browser." });
      return;
    }
    setLocating(true);
    setLocationStatus({ kind: "idle", message: "Getting your location…" });
    const request = (options: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));
    void request({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 })
      .catch((error: GeolocationPositionError) => error.code === error.TIMEOUT ? request({ enableHighAccuracy: true, timeout: 15000 }) : Promise.reject(error))
      .then((position) => {
        const { latitude, longitude } = position.coords;
        setDetails((current) => ({ ...current, lat: latitude, lng: longitude }));
        setLocating(false);
        setLocationStatus({ kind: "success", message: "Location added ✓" });
        void reverseGeocode(latitude, longitude);
      })
      .catch((error: GeolocationPositionError) => {
        setLocating(false);
        const message = error.code === error.PERMISSION_DENIED
          ? "Location is blocked for this site. Tap the lock icon in the address bar, set Location to Allow, then try again."
          : error.code === error.POSITION_UNAVAILABLE
            ? "Couldn't find your location. Turn on Location in your device settings and try again."
            : error.code === error.TIMEOUT
              ? "Taking too long. Please try again, or type your address."
              : "Couldn't get your location. You can type your address and continue.";
        setLocationStatus({ kind: "error", message });
      });
  };

  const submit = async () => {
    const nextErrors = validate(details);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setEditing(true);
      return;
    }
    const saved = saveGuestDetails(normalizeGuestDetails(details));
    await onSubmit(saved);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="inset-x-0 bottom-0 top-auto max-h-[90dvh] w-full translate-x-0 translate-y-0 overflow-y-auto rounded-t-3xl rounded-b-none p-5 sm:max-w-lg sm:rounded-3xl lg:left-1/2 lg:top-1/2 lg:bottom-auto lg:w-[calc(100%-2rem)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl">
      <DialogHeader className="text-left"><DialogTitle>Delivery details</DialogTitle><DialogDescription>No account needed</DialogDescription></DialogHeader>
      {!editing ? <div className="space-y-4"><div className="space-y-1 rounded-2xl bg-surface p-4 text-sm text-foreground"><p className="font-semibold">{details.name}</p><p>{details.phone}</p><p>{details.city}</p><p>{details.address}</p>{typeof details.lat === "number" && <p className="text-xs text-muted-foreground">Location added ✓</p>}</div><button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-muted-foreground underline underline-offset-4">Edit</button><SendButton sending={sending} onClick={submit} type="button" /></div> : <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-3">
        <GuestField label="Full name" value={details.name} error={errors.name} onChange={(value) => update("name", value)} />
        <GuestField label="Phone number" type="tel" inputMode="tel" value={details.phone} error={errors.phone} onChange={(value) => update("phone", value)} />
        <GuestField label="City / Town" value={details.city} error={errors.city} onChange={(value) => update("city", value)} />
        <GuestField label="Full address or landmark" value={details.address} error={errors.address} onChange={(value) => update("address", value)} textarea />
        <div className="space-y-1"><div className="flex items-center gap-3"><button type="button" onClick={useLocation} disabled={locating} className="text-xs font-semibold text-foreground underline underline-offset-4">Use my current location</button>{typeof details.lat === "number" && <button type="button" aria-label="Remove location" onClick={() => { setDetails((current) => ({ name: current.name, phone: current.phone, city: current.city, address: current.address })); setLocationSuggested(false); setLocationStatus({ kind: "idle" }); }} className="text-xs text-muted-foreground underline underline-offset-4">Remove</button>}</div>{locationStatus.message && <p className={`text-xs ${locationStatus.kind === "error" ? "text-destructive" : locationStatus.kind === "success" ? "text-green-600" : "text-muted-foreground"}`}>{locating && <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]" aria-hidden="true" />}{locationStatus.message}</p>}<p className="text-xs text-muted-foreground">No luck? You can type your address, or share your live location in the WhatsApp chat after sending.</p></div>
        {locationSuggested && <p className="-mt-1 text-xs text-muted-foreground">Suggested from your location, please check</p>}
        <SendButton sending={sending} type="submit" />
      </form>}
      <p className="text-center text-[10px] leading-4 text-muted-foreground">Your details are saved only on this phone to make your next order faster.</p>
    </DialogContent>
  </Dialog>;
}

function GuestField({ label, value, error, onChange, type = "text", inputMode, textarea = false }: { label: string; value: string; error?: string | undefined; onChange: (value: string) => void; type?: string; inputMode?: "tel"; textarea?: boolean }) {
  const className = "w-full rounded-2xl bg-surface px-4 py-3 text-sm text-foreground outline-none ring-primary focus:ring-2";
  return <label className="block text-xs font-semibold text-foreground">{label}{textarea ? <textarea rows={2} value={value} onChange={(event) => onChange(event.target.value)} className={`${className} mt-1.5 resize-none`} /> : <input type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} className={`${className} mt-1.5`} />}{error && <span className="mt-1 block text-xs font-normal text-destructive">{error}</span>}</label>;
}

function SendButton({ sending, onClick, type = "button" }: { sending: boolean; onClick?: () => void; type?: "button" | "submit" }) { return <button type={type} disabled={sending} onClick={onClick} className={fhButton({ size: "lg" })}>{sending ? "Opening WhatsApp…" : "Send order on WhatsApp"}</button>; }
