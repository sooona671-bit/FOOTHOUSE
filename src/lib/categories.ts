import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
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
export type AdminCategory = Category & { productCount: number };

const categoryKey = ["categories", "active"] as const;
export const categoriesQuery = queryOptions({
  queryKey: categoryKey,
  staleTime: 60_000,
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").eq("active", true).order("sort_order").order("name");
    if (error) throw error;
    return data;
  },
});

export const adminCategoriesQuery = queryOptions({
  queryKey: ["categories", "admin"],
  queryFn: async (): Promise<AdminCategory[]> => {
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

const cleanName = (name: string) => name.trim();
const duplicateError = () => new Error("A category with this name already exists.");

export async function createCategory(name: string) {
  const value = cleanName(name);
  if (!value) throw new Error("Category name is required.");
  if (value.length > 24) throw new Error("Category names must be 24 characters or fewer.");
  const { data: duplicate, error: duplicateCheckError } = await supabase.from("categories").select("id").ilike("name", value).maybeSingle();
  if (duplicateCheckError) throw duplicateCheckError;
  if (duplicate) throw duplicateError();
  const { data: last, error: lastError } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  if (lastError) throw lastError;
  const { data, error } = await supabase.from("categories").insert({ name: value, sort_order: (last?.sort_order ?? -1) + 1 }).select().single();
  if (error) throw error;
  return data;
}

export async function renameCategory(id: string, newName: string) {
  const value = cleanName(newName);
  if (!value) throw new Error("Category name is required.");
  if (value.length > 24) throw new Error("Category names must be 24 characters or fewer.");
  const { data: current, error: currentError } = await supabase.from("categories").select("name").eq("id", id).single();
  if (currentError) throw currentError;
  const { data: duplicate, error: duplicateCheckError } = await supabase.from("categories").select("id").ilike("name", value).neq("id", id).maybeSingle();
  if (duplicateCheckError) throw duplicateCheckError;
  if (duplicate) throw duplicateError();
  const { error: categoryError } = await supabase.from("categories").update({ name: value }).eq("id", id);
  if (categoryError) throw categoryError;
  const { error: productsError } = await supabase.from("products").update({ category: value }).eq("category", current.name);
  if (productsError) throw productsError;
  return value;
}

export async function moveCategory(id: string, direction: "up" | "down") {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order").order("name");
  if (error) throw error;
  const index = data.findIndex((category) => category.id === id);
  const neighbourIndex = index + (direction === "up" ? -1 : 1);
  if (index < 0 || neighbourIndex < 0 || neighbourIndex >= data.length) return;
  const current = data[index]!;
  const neighbour = data[neighbourIndex]!;
  const [{ error: firstError }, { error: secondError }] = await Promise.all([
    supabase.from("categories").update({ sort_order: neighbour.sort_order }).eq("id", current.id),
    supabase.from("categories").update({ sort_order: current.sort_order }).eq("id", neighbour.id),
  ]);
  if (firstError) throw firstError;
  if (secondError) throw secondError;
}

export async function toggleCategory(id: string) {
  const { data, error } = await supabase.from("categories").select("active").eq("id", id).single();
  if (error) throw error;
  const { error: updateError } = await supabase.from("categories").update({ active: !data.active }).eq("id", id);
  if (updateError) throw updateError;
}

export async function deleteCategory(id: string) {
  const { data: category, error: categoryError } = await supabase.from("categories").select("name").eq("id", id).single();
  if (categoryError) throw categoryError;
  const { count, error: countError } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category", category.name);
  if (countError) throw countError;
  if ((count ?? 0) > 0) throw new Error(`This category is still used by ${count} product${count === 1 ? "" : "s"}.`);
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export function useMoveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: "up" | "down" }) => moveCategory(id, direction),
    onMutate: async ({ id, direction }) => {
      await queryClient.cancelQueries({ queryKey: adminCategoriesQuery.queryKey });
      const previous = queryClient.getQueryData<AdminCategory[]>(adminCategoriesQuery.queryKey);
      queryClient.setQueryData<AdminCategory[]>(adminCategoriesQuery.queryKey, (items = []) => {
        const next = [...items];
        const index = next.findIndex((category) => category.id === id);
        const neighbourIndex = index + (direction === "up" ? -1 : 1);
        if (index >= 0 && neighbourIndex >= 0 && neighbourIndex < next.length) [next[index]!, next[neighbourIndex]!] = [next[neighbourIndex]!, next[index]!];
        return next;
      });
      return { previous };
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(adminCategoriesQuery.queryKey, context?.previous),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminCategoriesQuery.queryKey });
      void queryClient.invalidateQueries({ queryKey: categoriesQuery.queryKey });
    },
  });
}

export function matchesAudience(productAudience: string | null | undefined, selected: CustomerAudience | "" | undefined) {
  if (!selected) return true;
  const audience = productAudience || "unisex";
  if (selected === "men" || selected === "women") return audience === selected || audience === "unisex";
  return audience === "kids";
}
