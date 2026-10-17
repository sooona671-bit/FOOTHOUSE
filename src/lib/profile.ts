import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export const profileQuery = (userId: string) =>
  queryOptions({ queryKey: ["profile", userId], queryFn: () => fetchProfile(userId) });

export async function saveProfile(userId: string, values: ProfileUpdate) {
  const { error } = await supabase.from("profiles").upsert({ id: userId, ...values });
  if (error) throw error;
}

function previousAvatarPath(userId: string, avatarUrl: string | null | undefined) {
  if (!avatarUrl) return null;
  try {
    const path = decodeURIComponent(new URL(avatarUrl).pathname.split("/object/public/avatars/")[1] ?? "");
    return path.startsWith(`${userId}/`) ? path : null;
  } catch {
    return null;
  }
}

export async function uploadAvatar(userId: string, file: File) {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "31536000",
    contentType: "image/jpeg",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  try {
    const current = await fetchProfile(userId);
    await saveProfile(userId, { avatar_url: data.publicUrl });
    const oldPath = previousAvatarPath(userId, current?.avatar_url);
    if (oldPath && oldPath !== path) await supabase.storage.from("avatars").remove([oldPath]);
  } catch (error) {
    await supabase.storage.from("avatars").remove([path]);
    throw error;
  }
  return data.publicUrl;
}

export async function removeAvatar(userId: string) {
  const current = await fetchProfile(userId);
  await saveProfile(userId, { avatar_url: null });
  const oldPath = previousAvatarPath(userId, current?.avatar_url);
  if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);
}

export const memberId = (userId: string) => `#FH-${userId.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
