import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ProductRow = Tables<"products">;
export type ProductWithUrls = ProductRow & { imageUrls: string[] };

export const PRODUCT_BUCKET = "product-images";
export const CATEGORIES = ["Sneakers", "Formal", "Boots", "Sandals"];

/** Images are stored as paths in a private bucket; resolve to signed URLs for display. */
export async function withImageUrls(rows: ProductRow[]): Promise<ProductWithUrls[]> {
  const paths = Array.from(new Set(rows.flatMap((r) => r.images)));
  const map = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(PRODUCT_BUCKET).createSignedUrls(paths, 60 * 60 * 12);
    data?.forEach((d) => d.path && d.signedUrl && map.set(d.path, d.signedUrl));
  }
  return rows.map((r) => ({ ...r, imageUrls: r.images.map((p) => map.get(p)).filter(Boolean) as string[] }));
}

/** Storefront: RLS only returns published rows to customers. */
export const publishedProductsQuery = queryOptions({
  queryKey: ["products", "published"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return withImageUrls(data);
  },
});

export const adminProductsQuery = queryOptions({
  queryKey: ["products", "admin"],
  queryFn: async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return withImageUrls(data);
  },
});

export async function isAdmin(userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) return false;
  return data === true;
}

export async function uploadProductImage(file: File) {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error("Only PNG, JPG or WEBP images are allowed.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

/** Admin input helpers. Colours may contain spaces ("light blue"), sizes may not. */
export const parseColors = (s: string) =>
  Array.from(new Set(s.split(",").map((x) => x.trim()).filter(Boolean)));
export const parseSizes = (s: string) =>
  Array.from(new Set(s.split(/[,\s/]+/).map((x) => x.trim()).filter(Boolean)));
/** Repairs older products where sizes were saved as one string like "7 8 9". */
export const normalizeSizes = (sizes: string[]) =>
  Array.from(new Set(sizes.flatMap((x) => x.split(/[,\s/]+/)).map((x) => x.trim()).filter(Boolean)));
