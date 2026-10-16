import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { CATEGORIES, publishedProductsQuery } from "@/lib/products";
import { filterProducts } from "@/lib/shop";
import { Icon } from "@/components/fh/primitives";
import { StorePage } from "@/components/fh/StoreLayout";
import { ProductGrid } from "@/components/fh/ProductCard";

type SP = { [K in keyof S]?: S[K] | undefined };
type S = { q: string; category: string; size: string; color: string; min: number; max: number; inStock: boolean };
const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>): SP => ({
    q: str(s["q"]) || undefined,
    category: str(s["category"]) || undefined,
    size: str(s["size"]) || undefined,
    color: str(s["color"]) || undefined,
    min: num(s["min"]) || undefined,
    max: num(s["max"]) || undefined,
    inStock: s["inStock"] === true || s["inStock"] === "true" || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search — FOOT HOUSE" },
      { name: "description", content: "Search FOOT HOUSE footwear by category, size, colour and price." },
      { property: "og:title", content: "Search — FOOT HOUSE" },
      { property: "og:description", content: "Search FOOT HOUSE footwear by category, size, colour and price." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const set = (patch: SP) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const { data: products = [], isLoading, error } = useQuery(publishedProductsQuery);
  const [open, setOpen] = useState(false);
  const results = useMemo(() => filterProducts(products, search), [products, search]);
  const sizes = useMemo(() => Array.from(new Set(products.flatMap((p) => p.sizes))), [products]);
  const colors = useMemo(() => Array.from(new Set(products.flatMap((p) => p.colors))), [products]);
  const active = [search.category, search.size, search.color, search.min, search.max, search.inStock].filter(Boolean).length;

  return (
    <StorePage>
      <div className="space-y-4 px-5 pb-6 pt-3">
        <div className="flex gap-2">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-2xl bg-surface px-4 focus-within:ring-2 focus-within:ring-ring">
            <Icon name="search" className="text-[20px] text-outline" />
            <input
              autoFocus
              value={search.q ?? ""}
              onChange={(e) => set({ q: e.target.value || undefined })}
              placeholder="Search sneakers, boots, formal…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-outline"
            />
          </label>
          <button
            aria-label="Filters"
            onClick={() => setOpen((o) => !o)}
            className={cn("relative flex h-12 w-12 items-center justify-center rounded-2xl", open ? "bg-primary text-primary-foreground" : "bg-surface text-foreground")}
          >
            <Icon name="tune" className="text-[20px]" />
            {active > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">{active}</span>}
          </button>
        </div>

        <Chips label="Category" values={["All", ...CATEGORIES]} value={search.category ?? "All"} onChange={(v) => set({ category: v === "All" ? undefined : v })} />

        {open && (
          <div className="space-y-4 rounded-2xl border border-border p-4">
            {sizes.length > 0 && <Chips label="Size" values={sizes} value={search.size ?? ""} onChange={(v) => set({ size: v === search.size ? undefined : v })} />}
            {colors.length > 0 && <Chips label="Colour" values={colors} value={search.color ?? ""} onChange={(v) => set({ color: v === search.color ? undefined : v })} />}
            <div>
              <p className="mb-2 text-label-md text-foreground">Price (NPR)</p>
              <div className="flex gap-2">
                <input type="number" min={0} placeholder="Min" value={search.min ?? ""} onChange={(e) => set({ min: Number(e.target.value) || undefined })} className="h-11 w-full rounded-xl bg-surface px-3 text-sm outline-none" />
                <input type="number" min={0} placeholder="Max" value={search.max ?? ""} onChange={(e) => set({ max: Number(e.target.value) || undefined })} className="h-11 w-full rounded-xl bg-surface px-3 text-sm outline-none" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={!!search.inStock} onChange={(e) => set({ inStock: e.target.checked || undefined })} className="h-4 w-4 accent-[var(--color-primary)]" />
              In stock only
            </label>
            <button onClick={() => navigate({ search: { q: search.q }, replace: true })} className="text-xs text-outline underline">Clear filters</button>
          </div>
        )}

        <p className="text-xs text-outline">{isLoading ? "Loading…" : `${results.length} result${results.length === 1 ? "" : "s"}`}</p>
        {error ? (
          <p className="py-10 text-center text-sm text-destructive">Couldn't load products. Please try again.</p>
        ) : (
          !isLoading && <ProductGrid products={results} empty="No products match your search." />
        )}
      </div>
    </StorePage>
  );
}

function Chips({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="sr-only">{label}</p>
      <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {values.map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            aria-pressed={v === value}
            className={cn("whitespace-nowrap rounded-full px-4 py-2 text-label-md transition", v === value ? "bg-primary text-primary-foreground" : "bg-surface text-foreground hover:bg-surface-high")}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
