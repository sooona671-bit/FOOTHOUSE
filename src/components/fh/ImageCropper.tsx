import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FhButton, Icon } from "@/components/fh/primitives";

/** Size (px) of the square photo that gets saved. */
const MAX_ZOOM = 3;

type Props = {
  file: File;
  onDone: (cropped: File) => void;
  onCancel: () => void;
  outputSize?: number;
  round?: boolean;
};

/**
 * Square photo cropper for the admin. The square frame is exactly what customers
 * see in the store. Drag to move, use the slider to zoom.
 * Zooming all the way out fits the whole photo and fills the extra space with white.
 */
export function ImageCropper({ file, onDone, onCancel, outputSize = 1200, round = false }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState(320);
  const [t, setT] = useState(0); // 0 = whole photo visible, 1 = most zoomed in
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [broken, setBroken] = useState(false);

  // Create and revoke the blob URL in the same effect. Creating it during
  // render and revoking it from an effect cleanup breaks in React Strict Mode:
  // the cleanup can run while this modal is still mounted, leaving the image
  // pointed at a revoked URL.
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setNat(null);
    setBroken(false);
    setLoading(true);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    const fit = () => setFrame(Math.max(220, Math.min(360, window.innerWidth - 80)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Scale limits: "contain" shows the whole photo, "cover" fills the frame.
  const contain = nat ? frame / Math.max(nat.w, nat.h) : 1;
  const cover = nat ? frame / Math.min(nat.w, nat.h) : 1;
  const maxScale = Math.max(cover * MAX_ZOOM, contain * 1.5);
  const tFill = maxScale > contain ? (cover - contain) / (maxScale - contain) : 0;
  const scale = contain + t * (maxScale - contain);

  const clampPos = (p: { x: number; y: number }) => {
    if (!nat) return { x: 0, y: 0 };
    const limX = Math.max(0, (nat.w * scale - frame) / 2);
    const limY = Math.max(0, (nat.h * scale - frame) / 2);
    return { x: Math.min(limX, Math.max(-limX, p.x)), y: Math.min(limY, Math.max(-limY, p.y)) };
  };
  const eff = clampPos(pos);

  const onLoad = async () => {
    const img = imgRef.current;
    if (!img) return;
    try {
      if (typeof img.decode === "function") await img.decode();
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) throw new Error("Image has no dimensions");
      const f = Math.max(220, Math.min(360, window.innerWidth - 80));
      const c = f / Math.max(w, h);
      const v = f / Math.min(w, h);
      const m = Math.max(v * MAX_ZOOM, c * 1.5);
      setNat({ w, h });
      setT(m > c ? (v - c) / (m - c) : 0); // start with the frame filled
      setPos({ x: 0, y: 0 });
      setLoading(false);
    } catch {
      setNat(null);
      setLoading(false);
      setBroken(true);
    }
  };

  const setFill = () => {
    if (nat) {
      setT(tFill);
      setPos({ x: 0, y: 0 });
    }
  };
  const setFit = () => {
    if (nat) {
      setT(0);
      setPos({ x: 0, y: 0 });
    }
  };

  const apply = () => {
    const img = imgRef.current;
    if (!img || !nat) return;
    setBusy(true);
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      toast.error("Couldn't crop this photo.");
      return;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);
    ctx.imageSmoothingQuality = "high";
    const k = outputSize / frame;
    const dw = nat.w * scale * k;
    const dh = nat.h * scale * k;
    ctx.drawImage(img, outputSize / 2 + eff.x * k - dw / 2, outputSize / 2 + eff.y * k - dh / 2, dw, dh);
    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (!blob) {
          toast.error("Couldn't crop this photo.");
          return;
        }
        onDone(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crop photo"
    >
      <div className="w-full max-w-md rounded-3xl bg-card p-5 shadow-xl">
        <h2 className="text-lg font-bold text-foreground">Crop photo</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          The square is exactly what customers will see. Drag the photo to move it and use the
          slider to zoom.
        </p>

        <div
          className="relative mx-auto mt-4 cursor-grab touch-none select-none overflow-hidden rounded-2xl bg-white ring-1 ring-border active:cursor-grabbing"
          style={{ width: frame, height: frame }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { px: e.clientX, py: e.clientY, x: eff.x, y: eff.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            setPos(clampPos({ x: d.x + (e.clientX - d.px), y: d.y + (e.clientY - d.py) }));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onWheel={(e) => setT((v) => Math.min(1, Math.max(0, v - e.deltaY * 0.001)))}
        >
          {url && (
            <img
              ref={imgRef}
              src={url}
              alt="Photo to crop"
              decoding="async"
              draggable={false}
              onLoad={onLoad}
              onError={() => {
                setLoading(false);
                setNat(null);
                setBroken(true);
              }}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                maxWidth: "none",
                width: nat ? nat.w * scale : undefined,
                height: nat ? nat.h * scale : undefined,
                transform: `translate(calc(-50% + ${eff.x}px), calc(-50% + ${eff.y}px))`,
                visibility: nat ? "visible" : "hidden",
              }}
            />
          )}
          {/* Rule-of-thirds guide */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-0 h-full w-px bg-black/15" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-black/15" />
            <div className="absolute left-0 top-1/3 h-px w-full bg-black/15" />
            <div className="absolute left-0 top-2/3 h-px w-full bg-black/15" />
            {round && <div className="absolute inset-0 rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />}
          </div>
          {loading && (
            <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
              Loading photo…
            </p>
          )}
          {broken && (
            <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-destructive">
              This photo couldn’t be decoded. Please choose a valid JPG, PNG, or WEBP image.
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Icon name="zoom_out" className="text-[20px] text-muted-foreground" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={t}
            disabled={loading || !nat || broken}
            onChange={(e) => setT(Number(e.target.value))}
            aria-label="Zoom"
            className="h-2 w-full cursor-pointer accent-black"
          />
          <Icon name="zoom_in" className="text-[20px] text-muted-foreground" />
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={loading || !nat || broken}
            onClick={setFill}
            className="h-9 flex-1 rounded-full bg-surface text-xs font-semibold text-foreground"
          >
            Fill the square
          </button>
          <button
            type="button"
            disabled={loading || !nat || broken}
            onClick={setFit}
            className="h-9 flex-1 rounded-full bg-surface text-xs font-semibold text-foreground"
          >
            Fit whole photo
          </button>
        </div>

        <div className="mt-5 flex gap-3">
          <FhButton type="button" variant="outline" onClick={onCancel}>
            Cancel
          </FhButton>
          <FhButton type="button" disabled={busy || loading || !nat || broken} onClick={apply}>
            {busy ? "Cropping…" : "Use photo"}
          </FhButton>
        </div>
      </div>
    </div>
  );
}
