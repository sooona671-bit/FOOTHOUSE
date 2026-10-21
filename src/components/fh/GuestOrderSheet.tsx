import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fhButton } from "@/components/fh/primitives";
import { getGuestDetails, normalizeGuestDetails, saveGuestDetails, validate, type GuestDetails, type GuestDetailErrors } from "@/lib/guest-details";

export function GuestOrderSheet({ open, onOpenChange, onSubmit, sending = false }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (details: GuestDetails) => Promise<void>; sending?: boolean }) {
  const [details, setDetails] = useState<GuestDetails>({ name: "", phone: "", city: "", address: "" });
  const [errors, setErrors] = useState<GuestDetailErrors>({});
  const [editing, setEditing] = useState(true);
  const [locating, setLocating] = useState(false);

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
  }, [open]);

  const update = (field: keyof GuestDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetails((current) => ({ ...current, lat: position.coords.latitude, lng: position.coords.longitude }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error("We couldn't get your location. You can continue without it.");
      },
      { timeout: 8000, enableHighAccuracy: false },
    );
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
      {!editing ? <div className="space-y-4"><div className="space-y-1 rounded-2xl bg-surface p-4 text-sm text-foreground"><p className="font-semibold">{details.name}</p><p>{details.phone}</p><p>{details.city}</p><p>{details.address}</p>{typeof details.lat === "number" && <p className="text-xs text-muted-foreground">Location added ✓</p>}</div><button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-muted-foreground underline underline-offset-4">Edit</button><SendButton sending={sending} onClick={submit} /></div> : <div className="space-y-3">
        <GuestField label="Full name" value={details.name} error={errors.name} onChange={(value) => update("name", value)} />
        <GuestField label="Phone number" type="tel" inputMode="tel" value={details.phone} error={errors.phone} onChange={(value) => update("phone", value)} />
        <GuestField label="City / Town" value={details.city} error={errors.city} onChange={(value) => update("city", value)} />
        <GuestField label="Full address or landmark" value={details.address} error={errors.address} onChange={(value) => update("address", value)} textarea />
        <div className="flex items-center gap-3"><button type="button" onClick={useLocation} disabled={locating} className="text-xs font-semibold text-foreground underline underline-offset-4">{locating ? "Getting location…" : "Use my current location"}</button>{typeof details.lat === "number" && <button type="button" aria-label="Remove location" onClick={() => setDetails((current) => ({ name: current.name, phone: current.phone, city: current.city, address: current.address }))} className="text-muted-foreground">×</button>}</div>
        <SendButton sending={sending} onClick={submit} />
      </div>}
      <p className="text-center text-[10px] leading-4 text-muted-foreground">Your details are saved only on this phone to make your next order faster.</p>
    </DialogContent>
  </Dialog>;
}

function GuestField({ label, value, error, onChange, type = "text", inputMode, textarea = false }: { label: string; value: string; error?: string | undefined; onChange: (value: string) => void; type?: string; inputMode?: "tel"; textarea?: boolean }) {
  const className = "w-full rounded-2xl bg-surface px-4 py-3 text-sm text-foreground outline-none ring-primary focus:ring-2";
  return <label className="block text-xs font-semibold text-foreground">{label}{textarea ? <textarea rows={2} value={value} onChange={(event) => onChange(event.target.value)} className={`${className} mt-1.5 resize-none`} /> : <input type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} className={`${className} mt-1.5`} />}{error && <span className="mt-1 block text-xs font-normal text-destructive">{error}</span>}</label>;
}

function SendButton({ sending, onClick }: { sending: boolean; onClick: () => void }) { return <button type="button" disabled={sending} onClick={onClick} className={fhButton({ size: "lg" })}>{sending ? "Opening WhatsApp…" : "Send order on WhatsApp"}</button>; }
