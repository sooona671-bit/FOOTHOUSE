import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type HomeBanner = Tables<"home_banner">;
export type BannerLink = "/search" | "/categories" | "/wishlist" | "/home";
export type BannerUpdate = Omit<TablesUpdate<"home_banner">, "id" | "updated_at"> & { button_link: BannerLink };

export const BANNER_DEFAULTS = {
  eyebrow: "Edition 01 • Spring 2025",
  title: "THE NEW STANDARD",
  subtitle: "25% Off Minimalist Footwear",
  button_text: "Shop Drop",
  button_link: "/search" as BannerLink,
} as const;

export const bannerQuery = queryOptions({
  queryKey: ["home-banner"],
  staleTime: 60_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("home_banner").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export function bannerImageUrl(path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from("banners").getPublicUrl(path).data.publicUrl;
}

export async function saveBanner(values: BannerUpdate) {
  const { error } = await supabase.from("home_banner").upsert({ id: 1, ...values });
  if (error) throw error;
}

export async function uploadBannerImage(file: File) {
  const path = `hero-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("banners").upload(path, file, {
    cacheControl: "31536000",
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function deleteBannerImage(path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from("banners").remove([path]);
}
