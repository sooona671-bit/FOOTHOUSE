import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Audience = "men" | "women" | "kids" | "unisex";
export type CustomerAudience = Exclude<Audience, "unisex">;

export const AUDIENCES = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "kids", label: "Kids" },
] as const satisfies readonly { value: CustomerAudience; label: string }[];

export type Category = Tables<"categories">;

export const categoriesQuery = queryOptions({
  queryKey: ["categories", "active"] as const,
  staleTime: 60_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").eq("active", true).order("sort_order").order("name");
    if (error) throw error;
    return data;
  },
});

const duplicateError = () => new Error("A category with this name already exists.");

export async function createCategory(name: string) {
  const value = name.trim();
  if (!value) throw new Error("Category name is required.");
  if (value.length > 24) throw new Error("Category names must be 24 characters or fewer.");
  const { data: duplicate, error: duplicateErrorResult } = await supabase.from("categories").select("id").ilike("name", value).maybeSingle();
  if (duplicateErrorResult) throw duplicateErrorResult;
  if (duplicate) throw duplicateError();
  const { data: last, error: lastError } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  if (lastError) throw lastError;
  const { data, error } = await supabase.from("categories").insert({ name: value, sort_order: (last?.sort_order ?? -1) + 1 }).select().single();
  if (error) throw error;
  return data;
}

export function matchesAudience(productAudience: string | null | undefined, selected: CustomerAudience | "" | undefined) {
  if (!selected) return true;
  const audience = productAudience || "unisex";
  if (selected === "men" || selected === "women") return audience === selected || audience === "unisex";
  return audience === "kids";
}
