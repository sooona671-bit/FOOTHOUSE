import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, PRODUCT_BUCKET, parseColors, parseSizes, uploadProductImage, type ProductWithUrls } from "@/lib/products";
import { FhButton, Icon } from "@/components/fh/primitives";
import { ImageCropper } from "@/components/fh/ImageCropper";

export function ProductForm({ product }: { product?: ProductWithUrls }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [category, setCategory] = useState<string>(product?.category ?? "Sneakers");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAt, setCompareAt] = useState(product?.compare_at_price != null ? String(product.compare_at_price) : "");
  const [sizes, setSizes] = useState((product?.sizes ?? []).join(", "));
  const [colors, setColors] = useState((product?.colors ?? []).join(", "));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [published, setPublished] = useState(product?.published ?? true);
  const [images, setImages] = useState<{ path: string; url: string }[]>(
    product ? product.images.map((p, i) => ({ path: p, url: product.imageUrls[i] ?? "" })) : [],
  );
  const [removed, setRemoved] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Every photo goes through the square cropper before it is uploaded.
  const [cropFile, setCropFile] = useState<File | null>(null);
  const cropResolver = useRef<((f: File | null) => void) | null>(null);
  const askCrop = (file: File) =>
    new Promise<File | null>((resolve) => {
      cropResolver.current = resolve;
      setCropFile(file);
    });
  const finishCrop = (f: File | null) => {
    cropResolver.current?.(f);
    cropResolver.current = null;
    setCropFile(null);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      for (const f of Array.from(files)) {
        if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { toast.error(`${f.name}: only PNG, JPG or WEBP images are allowed.`); continue; }
        if (f.size > 25 * 1024 * 1024) { toast.error(`${f.name}: photo is too large (max 25 MB).`); continue; }
        const cropped = await askCrop(f);
        if (!cropped) continue;
        setUploading(true);
        const path = await uploadProductImage(cropped);
        setImages((prev) => [...prev, { path, url: URL.createObjectURL(cropped) }]);
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
    setUploading(false);
  };

  // Re-crop a photo that is already in the list (for example an older, uncropped one).
  const recrop = async (img: { path: string; url: string }) => {
    try {
      const blob = await (await fetch(img.url)).blob();
      const cropped = await askCrop(new File([blob], "photo", { type: blob.type || "image/jpeg" }));
      if (!cropped) return;
      setUploading(true);
      const path = await uploadProductImage(cropped);
      setImages((prev) => prev.map((x) => (x.path === img.path ? { path, url: URL.createObjectURL(cropped) } : x)));
      setRemoved((r) => [...r, img.path]);
    } catch {
      toast.error("Couldn't edit this photo.");
    }
    setUploading(false);
  };

  const save = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const priceNum = Number(price);
    if (!name.trim()) { toast.error("Product name is required."); return; }
    if (!Number.isFinite(priceNum) || priceNum < 0) { toast.error("Enter a valid price."); return; }
    const compareNum = compareAt ? Number(compareAt) : null;
    if (compareNum !== null && (!Number.isFinite(compareNum) || compareNum <= priceNum)) { toast.error("Original price must be higher than the sale price."); return; }
    const stockNum = Math.max(0, Math.floor(Number(stock) || 0));
    if (parseSizes(sizes).some((x) => /^\d{4,}$/.test(x))) {
      toast.error("Sizes look joined together. Separate them with commas, like: 4, 5, 6, 7, 8, 9");
      return;
    }
    setSaving(true);
    const row = {
      name: name.trim(), description: description.trim(), category, price: priceNum, compare_at_price: compareNum,
      sizes: parseSizes(sizes), colors: parseColors(colors), stock: stockNum, published, images: images.map((i) => i.path),
    };
    const { error } = product
      ? await supabase.from("products").update(row).eq("id", product.id)
      : await supabase.from("products").insert(row);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (removed.length) await supabase.storage.from(PRODUCT_BUCKET).remove(removed);
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success(product ? "Product updated" : "Product created");
    navigate({ to: "/admin" });
  };

  const input = "h-11 w-full rounded-xl bg-surface px-4 text-sm text-foreground outline-none ring-primary focus:ring-2";
  const card = "space-y-4 rounded-[24px] bg-card p-6";
  const label = "mb-1.5 block text-xs font-semibold text-foreground";

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-foreground">{product ? "Edit product" : "Add new product"}</h1>
        <div className="flex gap-2">
          <FhButton size="md" type="button" variant="outline" className="h-11 px-5" onClick={() => navigate({ to: "/admin" })}>Cancel</FhButton>
          <FhButton size="md" type="submit" disabled={saving || uploading} className="h-11 px-6">{saving ? "Saving…" : "Save"}</FhButton>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="font-semibold text-foreground">Photos</h2>
            <div className="grid grid-cols-2 gap-2">
              {images.map((img) => (
                <div key={img.path} className="relative aspect-square overflow-hidden rounded-xl bg-surface">
                  {img.url && <img src={img.url} alt="Product" decoding="async" className="h-full w-full object-cover" />}
                  <button type="button" aria-label="Crop photo" onClick={() => recrop(img)}
                    className="absolute bottom-1.5 left-1.5 flex h-7 items-center gap-1 rounded-full bg-background px-2 text-[11px] font-semibold text-foreground shadow">
                    <Icon name="crop" className="text-[14px]" /> Crop
                  </button>
                  <button type="button" aria-label="Remove photo" onClick={() => { setImages((p) => p.filter((x) => x.path !== img.path)); setRemoved((r) => [...r, img.path]); }}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-background shadow">
                    <Icon name="close" className="text-[16px]" />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground hover:bg-surface">
                <Icon name={uploading ? "hourglass_top" : "add_photo_alternate"} className="text-[28px]" />
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP. You crop each photo to a square, exactly as customers will see it. The first photo is the cover.</p>
          </section>
          <section className={card}>
            <h2 className="font-semibold text-foreground">Status</h2>
            <select className={input} value={published ? "1" : "0"} onChange={(e) => setPublished(e.target.value === "1")}>
              <option value="1">Published — visible in the store</option>
              <option value="0">Draft — hidden from customers</option>
            </select>
            <label className={label}>Category</label>
            <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </section>
        </div>
        <div className="space-y-6">
          <section className={card}>
            <h2 className="font-semibold text-foreground">General</h2>
            <div><label className={label}>Product name</label><input className={input} value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><label className={label}>Description</label>
              <textarea className={`${input} h-32 py-3`} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          </section>
          <section className={card}>
            <h2 className="font-semibold text-foreground">Pricing & inventory</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className={label}>Price (NPR)</label><input className={input} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
              <div><label className={label}>Original price (NPR)</label><input className={input} type="number" min="0" step="0.01" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} /></div>
              <div><label className={label}>Stock</label><input className={input} type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
            </div>
            <p className="text-xs text-muted-foreground">Set an original price to show a discount.</p>
          </section>
          <section className={card}>
            <h2 className="font-semibold text-foreground">Variants</h2>
            <div><label className={label}>Sizes (comma separated)</label><input className={input} placeholder="7, 8, 9, 10, 11" value={sizes} onChange={(e) => setSizes(e.target.value)} /><Chips items={parseSizes(sizes)} /></div>
            <div><label className={label}>Colors (comma separated)</label><input className={input} placeholder="Black, White" value={colors} onChange={(e) => setColors(e.target.value)} /><Chips items={parseColors(colors)} /></div>
          </section>
        </div>
      </div>
      {cropFile && <ImageCropper file={cropFile} onDone={(f) => finishCrop(f)} onCancel={() => finishCrop(null)} />}
    </form>
  );
}

/** Live preview so you can see exactly how sizes/colours will be saved. */
function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((x) => (
        <span key={x} className="rounded-full bg-background px-3 py-1 text-xs text-foreground ring-1 ring-border">{x}</span>
      ))}
    </div>
  );
}
