import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { withImageUrls, type ProductWithUrls } from "./products";
import { matchesAudience, type CustomerAudience } from "./categories";
import type { Tables } from "@/integrations/supabase/types";

/** Prices are shown in Nepali rupees. */
export const npr = (n: number) => `NPR ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const discountPct = (price: number, compare: number | null) =>
  compare != null && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;

export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["products", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).eq("published", true).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return (await withImageUrls([data]))[0];
    },
  });

export type Filters = { q: string; category: string; audience: CustomerAudience | ""; size: string; color: string; min: number; max: number; inStock: boolean };

export function filterProducts<T extends { name: string; description: string; category: string; audience?: string | null; sizes: string[]; colors: string[]; price: number; stock: number }>(
  list: T[],
  f: { [K in keyof Filters]?: Filters[K] | undefined },
) {
  const q = (f.q ?? "").trim().toLowerCase();
  return list.filter(
    (p) =>
      (!q || `${p.name} ${p.description} ${p.category} ${p.colors.join(" ")}`.toLowerCase().includes(q)) &&
      (!f.category || f.category === "All" || p.category === f.category) &&
      matchesAudience(p.audience, f.audience) &&
      (!f.size || p.sizes.includes(f.size)) &&
      (!f.color || p.colors.some((c) => c.toLowerCase() === f.color!.toLowerCase())) &&
      (!f.min || p.price >= f.min) &&
      (!f.max || p.price <= f.max) &&
      (!f.inStock || p.stock > 0),
  );
}

/* ---------------- Wishlist ---------------- */
const wishKey = (uid?: string) => ["wishlist", uid ?? "anon"];

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: wishKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("product_id");
      if (error) throw error;
      return data.map((r) => r.product_id);
    },
  });
  const ids = query.data ?? [];
  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Please sign in first.");
      if (ids.includes(productId)) {
        const { error } = await supabase.from("wishlist_items").delete().eq("product_id", productId).eq("user_id", user.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
      if (error) throw error;
      return true;
    },
    onSuccess: (added) => {
      toast.success(added ? "Saved to wishlist" : "Removed from wishlist");
    },
    onMutate: async (productId) => {
      const key = wishKey(user?.id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key);
      if (user) {
        qc.setQueryData<string[]>(key, (old = []) => old.includes(productId) ? old.filter((id) => id !== productId) : [...old, productId]);
      }
      return { previous };
    },
    onError: (e: Error, _productId, context) => {
      qc.setQueryData(wishKey(user?.id), context?.previous);
      toast.error(e.message || "Couldn't update wishlist");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: wishKey(user?.id) }),
  });
  return { ids, has: (id: string) => ids.includes(id), toggle: (id: string) => toggle.mutate(id), isLoading: query.isLoading };
}

/* ---------------- Cart ---------------- */
const cartKey = (uid?: string) => ["cart", uid ?? "anon"];

type CartItem = Tables<"cart_items"> & { product: ProductWithUrls };

export function useCart() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: cartKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("cart_items").select("*, product:products(*)").order("created_at");
      if (error) throw error;
      const products = await withImageUrls(data.map((r) => r.product).filter(Boolean) as never);
      const byId = new Map(products.map((p) => [p.id, p]));
      return data.filter((r) => r.product).map((r) => ({ ...r, product: byId.get(r.product_id)! }));
    },
  });
  const done = () => qc.invalidateQueries({ queryKey: cartKey(user?.id) });
  const onError = (e: Error) => toast.error(e.message || "Couldn't update bag");

  const add = useMutation({
    mutationFn: async (v: { productId: string; size: string; color: string; quantity?: number }) => {
      if (!user) throw new Error("Please sign in first.");
      const existing = (qc.getQueryData<CartItem[]>(cartKey(user.id)) ?? query.data ?? []).find((i) => i.product_id === v.productId && i.size === v.size && i.color === v.color);
      if (existing) {
        const { error } = await supabase.from("cart_items").update({ quantity: Math.min(20, existing.quantity + (v.quantity ?? 1)) }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: v.productId, size: v.size, color: v.color, quantity: v.quantity ?? 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Added to bag");
    },
    onMutate: async (v) => {
      const key = cartKey(user?.id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<CartItem[]>(key);
      if (!user) return { previous };
      const current = previous ?? [];
      const existing = current.find((i) => i.product_id === v.productId && i.size === v.size && i.color === v.color);
      if (existing) {
        qc.setQueryData<CartItem[]>(key, current.map((i) => i.id === existing.id ? { ...i, quantity: Math.min(20, i.quantity + (v.quantity ?? 1)) } : i));
      } else {
        const product = qc.getQueryData<ProductWithUrls[]>(["products", "published"])?.find((p) => p.id === v.productId)
          ?? qc.getQueryData<ProductWithUrls | null>(["products", "detail", v.productId]) ?? null;
        if (product) {
          qc.setQueryData<CartItem[]>(key, [...current, {
            id: `optimistic-${crypto.randomUUID()}`,
            created_at: new Date().toISOString(),
            user_id: user.id,
            product_id: v.productId,
            size: v.size,
            color: v.color,
            quantity: v.quantity ?? 1,
            product,
          }]);
        }
      }
      return { previous };
    },
    onError: (e, _v, context) => {
      qc.setQueryData(cartKey(user?.id), context?.previous);
      onError(e);
    },
    onSettled: done,
  });
  const setQty = useMutation({
    mutationFn: async (v: { id: string; quantity: number }) => {
      const { error } = await supabase.from("cart_items").update({ quantity: v.quantity }).eq("id", v.id);
      if (error) throw error;
    },
    onMutate: async (v) => {
      const key = cartKey(user?.id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<CartItem[]>(key);
      qc.setQueryData<CartItem[]>(key, (old = []) => old.map((i) => i.id === v.id ? { ...i, quantity: v.quantity } : i));
      return { previous };
    },
    onError: (e, _v, context) => {
      qc.setQueryData(cartKey(user?.id), context?.previous);
      onError(e);
    },
    onSettled: done,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed from bag");
    },
    onMutate: async (id) => {
      const key = cartKey(user?.id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<CartItem[]>(key);
      qc.setQueryData<CartItem[]>(key, (old = []) => old.filter((i) => i.id !== id));
      return { previous };
    },
    onError: (e, _id, context) => {
      qc.setQueryData(cartKey(user?.id), context?.previous);
      onError(e);
    },
    onSettled: done,
  });
  const items = query.data ?? [];
  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.quantity * Number(i.product.price), 0),
    add: add.mutateAsync,
    adding: add.isPending,
    setQty: (id: string, quantity: number) => setQty.mutate({ id, quantity }),
    remove: (id: string) => remove.mutate(id),
  };
}
