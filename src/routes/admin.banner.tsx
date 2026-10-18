import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { heroImage } from "@/data/sample-catalog";
import { ImageCropper } from "@/components/fh/ImageCropper";
import { FhButton, Icon } from "@/components/fh/primitives";
import {
  BANNER_DEFAULTS,
  bannerImageUrl,
  bannerQuery,
  deleteBannerImage,
  saveBanner,
  uploadBannerImage,
  normalizeBannerLink,
  type BannerLink,
  type HomeBanner,
} from "@/lib/banner";

export const Route = createFileRoute("/admin/banner")({
  head: () => ({
    meta: [
      { title: "Home Banner | FOOT HOUSE Admin" },
      { name: "description", content: "Manage the FOOT HOUSE home page hero banner." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminBanner,
});

type BannerForm = {
  eyebrow: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: BannerLink;
};

const LIMITS = { eyebrow: 60, title: 60, subtitle: 120, button_text: 24 } as const;
const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const input = "h-11 w-full rounded-xl bg-surface px-4 text-sm text-foreground outline-none ring-primary focus:ring-2";
const card = "space-y-4 rounded-[24px] bg-card p-6";
const label = "mb-1.5 block text-xs font-semibold text-foreground";

const formFrom = (banner: typeof BANNER_DEFAULTS | HomeBanner): BannerForm => ({
  eyebrow: banner.eyebrow,
  title: banner.title,
  subtitle: banner.subtitle,
  button_text: banner.button_text,
  button_link: normalizeBannerLink(banner.button_link),
});

function AdminBanner() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const originalPath = useRef<string | null>(null);
  const pendingPaths = useRef<string[]>([]);
  const { data, isLoading, error } = useQuery(bannerQuery);
  const [form, setForm] = useState<BannerForm>(formFrom(BANNER_DEFAULTS));
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm(formFrom(data));
    setImagePath(data.image_path);
    originalPath.current = data.image_path;
  }, [data]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const update = (key: keyof BannerForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const imageUrl = previewUrl ?? bannerImageUrl(imagePath) ?? heroImage;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error("Please choose a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Banner images must be under 10 MB.");
      return;
    }
    setCropFile(file);
  };

  const finishCrop = async (cropped: File) => {
    setUploading(true);
    try {
      const path = await uploadBannerImage(cropped);
      pendingPaths.current.push(path);
      setImagePath(path);
      setPreviewUrl(URL.createObjectURL(cropped));
      setCropFile(null);
    } catch (e) {
      toast.error((e as Error).message || "Couldn't upload the banner image.");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveBanner({ ...form, image_path: imagePath });
      if (originalPath.current && originalPath.current !== imagePath) await deleteBannerImage(originalPath.current);
      for (const path of pendingPaths.current) {
        if (path !== imagePath) await deleteBannerImage(path);
      }
      pendingPaths.current = imagePath ? [imagePath] : [];
      originalPath.current = imagePath;
      await qc.invalidateQueries({ queryKey: bannerQuery.queryKey });
      toast.success("Banner updated");
    } catch (e) {
      toast.error((e as Error).message || "Couldn't update the banner.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm("Reset the home banner to the default text and remove its custom image?")) return;
    const previousForm = form;
    const previousPath = imagePath;
    setForm(formFrom(BANNER_DEFAULTS));
    setImagePath(null);
    setPreviewUrl(null);
    setSaving(true);
    try {
      await saveBanner({ ...BANNER_DEFAULTS, image_path: null });
      if (previousPath) await deleteBannerImage(previousPath);
      for (const path of pendingPaths.current) {
        if (path !== previousPath) await deleteBannerImage(path);
      }
      pendingPaths.current = [];
      originalPath.current = null;
      await qc.invalidateQueries({ queryKey: bannerQuery.queryKey });
      toast.success("Banner reset to default");
    } catch (e) {
      setForm(previousForm);
      setImagePath(previousPath);
      toast.error((e as Error).message || "Couldn't reset the banner.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <p className="p-8 text-sm text-muted-foreground">Loading banner…</p>;
  if (error) return <p className="p-8 text-sm text-destructive">Couldn't load the banner settings.</p>;

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Home banner</h1>
          <p className="text-sm text-muted-foreground">Edit the hero section shown on the customer home page.</p>
        </div>
        <div className="flex gap-2">
          <FhButton size="md" type="button" variant="outline" className="h-11 px-5" onClick={reset} disabled={saving || uploading}>Reset to default</FhButton>
          <FhButton size="md" type="submit" disabled={saving || uploading} className="h-11 px-6">{saving ? "Saving…" : "Save"}</FhButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="font-semibold text-foreground">Live preview</h2>
            <div className="relative aspect-[21/9] overflow-hidden rounded-[26px] bg-primary text-primary-foreground shadow-sm">
              <img src={imageUrl} alt={form.title || "Home banner preview"} width={1600} height={686} decoding="async" className="h-full w-full object-cover object-top opacity-75" />
              <div className="bg-banner-fade absolute inset-0 flex flex-col justify-end p-5">
                {form.eyebrow && <span className="text-caption font-bold uppercase tracking-[0.2em] text-primary-foreground/80">{form.eyebrow}</span>}
                {form.title && <h2 className="text-headline-md">{form.title}</h2>}
                {form.subtitle && <p className="text-xs text-primary-foreground/80">{form.subtitle}</p>}
                {form.button_text && <Link to={form.button_link} className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-background px-4 py-2 text-label-md text-foreground">{form.button_text}<Icon name="arrow_forward" className="text-[16px]" /></Link>}
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className="font-semibold text-foreground">Banner photo</h2>
            <div className="flex items-center gap-3">
              <FhButton type="button" size="md" variant="outline" className="h-11 px-5" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? "Uploading…" : "Change photo"}</FhButton>
              <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.currentTarget.value = ""; }} />
              <span className="text-xs text-muted-foreground">PNG, JPG or WEBP · max 10 MB</span>
            </div>
          </section>
        </div>

        <section className={card}>
          <h2 className="font-semibold text-foreground">Banner text</h2>
          <TextField label="Small label" value={form.eyebrow} maxLength={LIMITS.eyebrow} onChange={(v) => update("eyebrow", v)} />
          <TextField label="Title" value={form.title} maxLength={LIMITS.title} onChange={(v) => update("title", v)} />
          <TextField label="Subtitle" value={form.subtitle} maxLength={LIMITS.subtitle} onChange={(v) => update("subtitle", v)} />
          <TextField label="Button text" value={form.button_text} maxLength={LIMITS.button_text} onChange={(v) => update("button_text", v)} />
          <div>
            <label className={label}>Button goes to</label>
            <select className={input} value={form.button_link} onChange={(e) => update("button_link", e.target.value)}>
              <option value="/search">Search</option>
              <option value="/wishlist">Wishlist</option>
              <option value="/home">Home</option>
            </select>
          </div>
        </section>
      </div>

      {cropFile && <ImageCropper file={cropFile} aspect={7 / 3} guideAspect={2.03} outputSize={1600} allowFit={false} onDone={finishCrop} onCancel={() => setCropFile(null)} />}
    </form>
  );
}

function TextField({ label: fieldLabel, value, maxLength, onChange }: { label: string; value: string; maxLength: number; onChange: (value: string) => void }) {
  return (
    <div>
      <label className={label}>{fieldLabel}</label>
      <input className={input} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      <p className="mt-1 text-right text-[11px] text-muted-foreground">{value.length}/{maxLength}</p>
    </div>
  );
}
