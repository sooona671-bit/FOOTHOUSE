import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { publishedProductsQuery } from "@/lib/products";
import { AUDIENCES, categoriesQuery, matchesAudience, type CustomerAudience } from "@/lib/categories";
import { filterProducts } from "@/lib/shop";
import { Icon } from "@/components/fh/primitives";
import { StorePage } from "@/components/fh/StoreLayout";
import { ProductCard } from "@/components/fh/ProductCard";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type SortKey = "newest" | "price-asc" | "price-desc";
type S = { q: string; for: CustomerAudience; cat: string; size: string; color: string; min: number; max: number; inStock: boolean; sort: SortKey };
type SP = { [K in keyof S]?: S[K] | undefined };
const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (s: Record<string, unknown>): SP => ({
    q: str(s["q"]) || undefined,
    for: ["men", "women", "kids"].includes(str(s["for"])) ? str(s["for"]) as CustomerAudience : undefined,
    cat: str(s["cat"]) || undefined,
    size: str(s["size"]) || undefined,
    color: str(s["color"]) || undefined,
    min: num(s["min"]) || undefined,
    max: num(s["max"]) || undefined,
    inStock: s["inStock"] === true || s["inStock"] === "true" || undefined,
    sort: ["newest", "price-asc", "price-desc"].includes(str(s["sort"])) ? str(s["sort"]) as SortKey : "newest",
  }),
  head: () => ({ meta: [{ title: "Search — FOOT HOUSE" }, { name: "description", content: "Search FOOT HOUSE footwear by category, size, colour and price." }] }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { data: products = [], isLoading, error } = useQuery(publishedProductsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const [open, setOpen] = useState(false);
  const [queryText, setQueryText] = useState(search.q ?? "");
  const [minText, setMinText] = useState(search.min == null ? "" : String(search.min));
  const [maxText, setMaxText] = useState(search.max == null ? "" : String(search.max));
  const set = (patch: SP) => navigate({ search: (previous) => ({ ...previous, ...patch }), replace: true });
  const setPrice = (patch: { min?: number | undefined; max?: number | undefined }) => {
    if ("min" in patch) setMinText(patch.min == null ? "" : String(patch.min));
    if ("max" in patch) setMaxText(patch.max == null ? "" : String(patch.max));
  };
  useEffect(() => setQueryText(search.q ?? ""), [search.q]);
  useEffect(() => setMinText(search.min == null ? "" : String(search.min)), [search.min]);
  useEffect(() => setMaxText(search.max == null ? "" : String(search.max)), [search.max]);
  useEffect(() => { const timer = window.setTimeout(() => set({ q: queryText || undefined }), 250); return () => window.clearTimeout(timer); }, [queryText]);
  useEffect(() => { const timer = window.setTimeout(() => set({ min: numberOrUndefined(minText), max: numberOrUndefined(maxText) }), 400); return () => window.clearTimeout(timer); }, [minText, maxText]);

  const clearFilters = () => navigate({ search: { q: search.q, sort: "newest" }, replace: true });
  const results = useMemo(() => {
    const filtered = filterProducts(products, { q: search.q, category: search.cat, audience: search.for, size: search.size, color: search.color, min: search.min, max: search.max, inStock: search.inStock });
    return [...filtered].sort((a, b) => search.sort === "price-asc" ? a.price - b.price : search.sort === "price-desc" ? b.price - a.price : 0);
  }, [products, search]);
  const visibleCategoryNames = new Set(products.filter((product) => matchesAudience(product.audience, search.for)).map((product) => product.category));
  const availableCategories = categories.filter((category) => visibleCategoryNames.has(category.name));
  const sizes = useMemo(() => uniqueSizes(products.flatMap((product) => product.sizes)), [products]);
  const colors = useMemo(() => uniqueColors(products.flatMap((product) => product.colors)), [products]);
  const active = [search.for, search.cat, search.size, search.color, search.min, search.max, search.inStock].filter(Boolean).length;

  return <StorePage><div className="space-y-4 px-5 pb-6 pt-3">
    <SearchInput value={queryText} onChange={setQueryText} />
    <div className="flex items-center gap-2 lg:hidden"><button type="button" onClick={() => setOpen(true)} className="relative flex h-11 items-center gap-2 rounded-xl bg-surface px-4 text-sm font-semibold"><Icon name="tune" className="text-[19px]" />Filters{active > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{active}</span>}</button><SortSelect value={search.sort ?? "newest"} onChange={(value) => set({ sort: value })} className="ml-auto" /></div>
    <div className="hide-scrollbar flex gap-2 overflow-x-auto lg:hidden"><FilterPill label="All" selected={!search.for} onClick={() => set({ for: undefined, cat: undefined })} />{AUDIENCES.map((audience) => <FilterPill key={audience.value} label={audience.label} selected={search.for === audience.value} onClick={() => set({ for: search.for === audience.value ? undefined : audience.value })} />)}{availableCategories.map((category) => <FilterPill key={category.id} label={category.name} selected={search.cat === category.name} onClick={() => set({ cat: search.cat === category.name ? undefined : category.name })} />)}</div>
    <ActiveFilters search={search} onRemove={set} onClear={clearFilters} />
    <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <aside className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-2"><FilterSections search={search} categories={availableCategories.map((category) => category.name)} sizes={sizes} colors={colors} set={set} setPrice={setPrice} /><button type="button" disabled={active === 0} onClick={clearFilters} className="mt-5 text-xs font-semibold text-outline underline disabled:opacity-40">Clear all</button></aside>
      <main className="min-w-0"><div className="mb-4 flex items-center justify-between"><p className="text-xs text-outline">{isLoading ? "Loading…" : `${results.length} result${results.length === 1 ? "" : "s"}`}</p><SortSelect value={search.sort ?? "newest"} onChange={(value) => set({ sort: value })} className="hidden lg:flex" /></div>{error ? <p className="py-10 text-center text-sm text-destructive">Couldn't load products. Please try again.</p> : isLoading ? <SkeletonGrid /> : results.length === 0 ? <EmptyResults onClear={clearFilters} /> : <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">{results.map((product) => <ProductCard key={product.id} p={product} />)}</div>}</main>
    </div>
  </div><Sheet open={open} onOpenChange={setOpen}><SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl p-5"><SheetHeader className="mb-5 pr-8 text-left"><SheetTitle>Filters</SheetTitle><SheetDescription>Refine the products you want to see.</SheetDescription></SheetHeader><FilterSections search={search} categories={availableCategories.map((category) => category.name)} sizes={sizes} colors={colors} set={set} setPrice={setPrice} /><SheetFooter className="sticky bottom-0 -mx-5 mt-5 flex-row justify-between gap-3 border-t border-border bg-background/95 p-5 backdrop-blur-md"><button type="button" disabled={active === 0} onClick={clearFilters} className="text-xs font-semibold text-outline underline disabled:opacity-40">Clear all</button><button type="button" onClick={() => setOpen(false)} className="rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground">Show {results.length} results</button></SheetFooter></SheetContent></Sheet></StorePage>;
}

function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <label className="flex h-12 w-full items-center gap-3 rounded-2xl bg-surface px-4 focus-within:ring-2 focus-within:ring-ring"><Icon name="search" className="text-[20px] text-outline" /><input autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search sneakers, boots, formal…" className="w-full bg-transparent text-sm outline-none placeholder:text-outline" /></label>; }

function FilterSections({ search, categories, sizes, colors, set, setPrice }: { search: SP; categories: string[]; sizes: string[]; colors: string[]; set: (patch: SP) => void; setPrice: (patch: { min?: number | undefined; max?: number | undefined }) => void }) { return <div className="space-y-5"><FilterSection title="For"><div className="flex flex-wrap gap-2"><FilterPill label="All" selected={!search.for} onClick={() => set({ for: undefined })} />{AUDIENCES.map((audience) => <FilterPill key={audience.value} label={audience.label} selected={search.for === audience.value} onClick={() => set({ for: search.for === audience.value ? undefined : audience.value })} />)}</div></FilterSection>{categories.length > 0 && <FilterSection title="Category"><div className="flex flex-wrap gap-2"><FilterPill label="All" selected={!search.cat} onClick={() => set({ cat: undefined })} />{categories.map((category) => <FilterPill key={category} label={category} selected={search.cat === category} onClick={() => set({ cat: search.cat === category ? undefined : category })} />)}</div></FilterSection>}{sizes.length > 0 && <FilterSection title="Size"><div className="grid grid-cols-4 gap-2">{sizes.map((size) => <button key={size} type="button" onClick={() => set({ size: search.size === size ? undefined : size })} className={cn("h-11 rounded-xl border text-xs font-semibold", search.size === size ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:bg-surface")}>{size}</button>)}</div></FilterSection>}{colors.length > 0 && <FilterSection title="Colour"><div className="flex flex-wrap gap-2">{colors.map((color) => <button key={color} type="button" onClick={() => set({ color: search.color?.toLowerCase() === color.toLowerCase() ? undefined : color })} className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs", search.color?.toLowerCase() === color.toLowerCase() ? "border-primary text-primary" : "border-border text-foreground")}><ColorDot color={color} />{color}{search.color?.toLowerCase() === color.toLowerCase() && <Icon name="check" className="text-[14px]" />}</button>)}</div></FilterSection>}<FilterSection title="Price (NPR)"><div className="flex items-center gap-2"><input type="number" min={0} placeholder="Min" value={search.min ?? ""} onChange={(event) => setPrice({ min: numberOrUndefined(event.target.value) })} className="h-10 w-full rounded-xl bg-surface px-3 text-sm outline-none" /><span className="text-outline">–</span><input type="number" min={0} placeholder="Max" value={search.max ?? ""} onChange={(event) => setPrice({ max: numberOrUndefined(event.target.value) })} className="h-10 w-full rounded-xl bg-surface px-3 text-sm outline-none" /></div></FilterSection><label className="flex items-center justify-between text-sm"><span>In stock only</span><input type="checkbox" checked={!!search.inStock} onChange={(event) => set({ inStock: event.target.checked || undefined })} className="h-4 w-4 accent-[var(--color-primary)]" /></label></div>; }

function FilterSection({ title, children }: { title: string; children: ReactNode }) { return <section className="border-t border-border pt-4 first:border-t-0 first:pt-0"><h2 className="mb-3 text-xs font-bold uppercase tracking-wide">{title}</h2>{children}</section>; }
function FilterPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} aria-pressed={selected} className={cn("whitespace-nowrap rounded-full px-3 py-2 text-xs transition", selected ? "bg-primary text-primary-foreground" : "bg-surface text-foreground hover:bg-surface-high")}>{label}</button>; }
function SortSelect({ value, onChange, className }: { value: SortKey; onChange: (value: SortKey) => void; className?: string }) { return <label className={cn("flex items-center gap-2 text-xs text-outline", className)}><span className="whitespace-nowrap">Sort by</span><select value={value} onChange={(event) => onChange(event.target.value as SortKey)} className="h-9 rounded-xl border border-border bg-background px-2 text-xs text-foreground outline-none"><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>; }
function ActiveFilters({ search, onRemove, onClear }: { search: SP; onRemove: (patch: SP) => void; onClear: () => void }) { const filters: { label: string; patch: SP }[] = []; if (search.for) filters.push({ label: search.for.slice(0, 1).toUpperCase() + search.for.slice(1), patch: { for: undefined } }); if (search.cat) filters.push({ label: search.cat, patch: { cat: undefined } }); if (search.size) filters.push({ label: `Size ${search.size}`, patch: { size: undefined } }); if (search.color) filters.push({ label: search.color, patch: { color: undefined } }); if (search.min != null) filters.push({ label: `Min NPR ${search.min}`, patch: { min: undefined } }); if (search.max != null) filters.push({ label: `Max NPR ${search.max}`, patch: { max: undefined } }); if (search.inStock) filters.push({ label: "In stock", patch: { inStock: undefined } }); if (!filters.length) return null; return <div className="flex flex-wrap items-center gap-2">{filters.map((filter) => <button key={filter.label} type="button" onClick={() => onRemove(filter.patch)} className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs">{filter.label}<Icon name="close" className="text-[14px]" /></button>)}<button type="button" onClick={onClear} className="text-xs font-semibold text-outline underline">Clear all</button></div>; }
function EmptyResults({ onClear }: { onClear: () => void }) { return <div className="rounded-2xl bg-surface px-5 py-12 text-center"><p className="text-sm font-semibold">No products match your filters</p><button type="button" onClick={onClear} className="mt-3 text-xs font-semibold text-outline underline">Clear filters</button></div>; }
function SkeletonGrid() { return <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="animate-pulse rounded-2xl border border-border bg-card p-2"><div className="aspect-square rounded-xl bg-surface" /><div className="space-y-2 px-1 pb-2 pt-3"><div className="h-2 w-1/3 rounded bg-surface" /><div className="h-3 w-4/5 rounded bg-surface" /><div className="h-3 w-1/2 rounded bg-surface" /></div></div>)}</div>; }
function ColorDot({ color }: { color: string }) { const key = color.toLowerCase().match(/black|white|red|blue|navy|green|grey|gray|brown|beige|cream|pink|yellow|orange|purple|maroon|tan|gold|silver/)?.[0]; if (!key) return null; const classes: Record<string, string> = { black: "bg-black", white: "border border-border bg-white", red: "bg-red-500", blue: "bg-blue-500", navy: "bg-blue-950", green: "bg-green-600", grey: "bg-gray-400", gray: "bg-gray-400", brown: "bg-amber-800", beige: "bg-amber-100", cream: "border border-border bg-yellow-50", pink: "bg-pink-400", yellow: "bg-yellow-400", orange: "bg-orange-500", purple: "bg-purple-500", maroon: "bg-red-900", tan: "bg-amber-600", gold: "bg-yellow-600", silver: "bg-gray-300" }; return <span aria-hidden="true" className={cn("h-3 w-3 rounded-full", classes[key])} />; }
function uniqueSizes(values: string[]) { return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => { const an = Number(a.replace(/^[^0-9]*/, "")); const bn = Number(b.replace(/^[^0-9]*/, "")); const ap = /^\d+(?:\.\d+)?$/.test(a); const bp = /^\d+(?:\.\d+)?$/.test(b); if (ap && bp) return an - bn; if (ap !== bp) return ap ? -1 : 1; if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn; return a.localeCompare(b); }); }
function uniqueColors(values: string[]) { const map = new Map<string, string>(); for (const value of values) { const trimmed = value.trim(); if (trimmed && !map.has(trimmed.toLowerCase())) map.set(trimmed.toLowerCase(), trimmed.slice(0, 1).toUpperCase() + trimmed.slice(1)); } return Array.from(map.values()).sort((a, b) => a.localeCompare(b)); }
function numberOrUndefined(value: string) { const number = Number(value); return value.trim() && Number.isFinite(number) ? number : undefined; }
