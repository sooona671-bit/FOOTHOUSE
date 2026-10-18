import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { heroImage } from "@/data/sample-catalog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type HomeBanner = Tables<"home_banners">;
export type BannerInsert = Omit<TablesInsert<"home_banners">, "id" | "created_at" | "updated_at">;
export type BannerUpdate = Omit<TablesUpdate<"home_banners">, "id" | "created_at" | "updated_at">;
export type BannerLink = "/search" | "/home" | "/wishlist" | "/bag" | `/product/${string}`;
export type BannerOverlay = "none" | "soft" | "strong";
export type BannerTextColor = "light" | "dark";
export type BannerTextAlign = "left" | "center";

export const AUTOPLAY_MS = 6500;
export const MAX_BANNERS = 8;
export const DEFAULT_BANNER = {
  id: "default", eyebrow: "Edition 01 • Spring 2025", title: "THE NEW STANDARD", subtitle: "25% Off Minimalist Footwear",
  button_text: "Shop Drop", button_link: "/search", image_path: null, text_color: "light", overlay: "soft", text_align: "left",
  sort_order: 0, active: true, starts_at: new Date(0).toISOString(), ends_at: null, created_at: new Date(0).toISOString(), updated_at: new Date(0).toISOString(),
} as HomeBanner;

const order = (query: any) => query.order("sort_order", { ascending: true }).order("created_at", { ascending: true });

export const liveBannersQuery = queryOptions({
  queryKey: ["home-banners", "live"], staleTime: 60_000,
  queryFn: async () => {
    const now = new Date().toISOString();
    const { data, error } = await order(supabase.from("home_banners").select("*").eq("active", true).lte("starts_at", now).or(`ends_at.is.null,ends_at.gt.${now}`));
    if (error) throw error;
    return data as HomeBanner[];
  },
});

export const adminBannersQuery = queryOptions({
  queryKey: ["home-banners", "admin"],
  queryFn: async () => { const { data, error } = await order(supabase.from("home_banners").select("*")); if (error) throw error; return data as HomeBanner[]; },
});

export function bannerImageUrl(path: string | null | undefined) { return path ? supabase.storage.from("banners").getPublicUrl(path).data.publicUrl : null; }
export function bannerImage(banner: Pick<HomeBanner, "image_path">) { return bannerImageUrl(banner.image_path) ?? heroImage; }

export function resolveLink(link: string | null | undefined): { to: "/search" | "/home" | "/wishlist" | "/bag" } | { to: "/product/$id"; params: { id: string } } {
  if (link?.startsWith("/product/")) return { to: "/product/$id", params: { id: link.slice(9) } };
  if (link === "/search" || link === "/wishlist" || link === "/bag") return { to: link };
  return { to: "/home" };
}
export function normalizeBannerLink(link: string | null | undefined): BannerLink { const target = resolveLink(link); return target.to === "/product/$id" ? `/product/${target.params.id}` : target.to; }

export async function createBanner(values: BannerInsert) { const { data, error } = await supabase.from("home_banners").insert(values).select().single(); if (error) throw error; return data; }
export async function updateBanner(id: string, values: BannerUpdate) { const { data, error } = await supabase.from("home_banners").update(values).eq("id", id).select().single(); if (error) throw error; return data; }
export async function deleteBannerImage(path: string | null | undefined) { if (!path) return; try { await supabase.storage.from("banners").remove([path]); } catch { /* best effort cleanup */ } }
export async function deleteBanner(banner: Pick<HomeBanner, "id" | "image_path"> | string) { const id = typeof banner === "string" ? banner : banner.id; const path = typeof banner === "string" ? null : banner.image_path; const { error } = await supabase.from("home_banners").delete().eq("id", id); if (error) throw error; await deleteBannerImage(path); }
export async function toggleActive(id: string, active: boolean) { const { error } = await supabase.from("home_banners").update({ active }).eq("id", id); if (error) throw error; }
export async function uploadBannerImage(file: File) { if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) throw new Error("Only PNG, JPG or WEBP images are allowed."); if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10 MB."); const path = `hero-${Date.now()}-${crypto.randomUUID()}.jpg`; const { error } = await supabase.storage.from("banners").upload(path, file, { cacheControl: "31536000", contentType: "image/jpeg", upsert: false }); if (error) throw error; return path; }

export async function moveBanner(id: string, direction: "up" | "down") {
  const { data, error } = await order(supabase.from("home_banners").select("*"));
  if (error) throw error;
  const items = data as HomeBanner[];
  const index = items.findIndex((banner) => banner.id === id);
  const swap = index + (direction === "up" ? -1 : 1);
  if (index < 0 || swap < 0 || swap >= items.length) return;
  await updateBanner(id, { sort_order: items[swap].sort_order });
  await updateBanner(items[swap].id, { sort_order: items[index].sort_order });
}

export function useMoveBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const items = qc.getQueryData<HomeBanner[]>(adminBannersQuery.queryKey) ?? []; const i = items.findIndex((b) => b.id === id); const j = i + (direction === "up" ? -1 : 1); if (i < 0 || j < 0 || j >= items.length) return;
      await moveBanner(id, direction);
    },
    onMutate: async ({ id, direction }) => { await qc.cancelQueries({ queryKey: adminBannersQuery.queryKey }); const previous = qc.getQueryData<HomeBanner[]>(adminBannersQuery.queryKey); qc.setQueryData<HomeBanner[]>(adminBannersQuery.queryKey, (items = []) => { const next = [...items]; const i = next.findIndex((b) => b.id === id); const j = i + (direction === "up" ? -1 : 1); if (i >= 0 && j >= 0 && j < next.length) [next[i], next[j]] = [next[j], next[i]]; return next; }); return { previous }; },
    onError: (_error, _variables, context) => qc.setQueryData(adminBannersQuery.queryKey, context?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: ["home-banners"] }),
  });
}
