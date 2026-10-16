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

export const memberId = (userId: string) => `#FH-${userId.replace(/-/g, "").slice(0, 5).toUpperCase()}`;
