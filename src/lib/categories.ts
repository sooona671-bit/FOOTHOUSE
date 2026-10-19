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

export const adminCategoriesQuery = queryOptions({
  queryKey: ["categories", "admin"] as const,
  queryFn: async () => {
    const [{ data: categories, error: categoriesError }, { data: products, error: productsError }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order").order("name"),
      supabase.from("products").select("category"),
    ]);
    if (categoriesError) throw categoriesError;
    if (productsError) throw productsError;
    const counts = new Map<string, number>();
    for (const product of products) counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    return categories.map((category) => ({ ...category, productCount: counts.get(category.name) ?? 0 }));
  },
});

export async function deleteCategory(id: string) {
  const { data: category, error: categoryError } = await supabase.from("categories").select("name").eq("id", id).single();
  if (categoryError) throw categoryError;
  const { count, error: countError } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", category.name);
  if (countError) throw countError;
  if ((count ?? 0) > 0) throw new Error(`Cannot delete this category because ${count} product${count === 1 ? " is" : "s are"} still assigned to it. Reassign the product${count === 1 ? "" : "s"} first.`);
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export function matchesAudience(productAudience: string | null | undefined, selected: CustomerAudience | "" | undefined) {
  if (!selected) return true;
  const audience = productAudience || "unisex";
  if (selected === "men" || selected === "women") return audience === selected || audience === "unisex";
  return audience === "kids";
}
