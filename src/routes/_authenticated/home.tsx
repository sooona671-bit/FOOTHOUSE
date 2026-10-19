import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { liveBannersQuery } from "@/lib/banner";
import { publishedProductsQuery } from "@/lib/products";
import { AUDIENCES, categoriesQuery, matchesAudience, type CustomerAudience } from "@/lib/categories";
import { Icon } from "@/components/fh/primitives";
import { ProductCard } from "@/components/fh/ProductCard";
import { StorePage } from "@/components/fh/StoreLayout";
import { HeroCarousel } from "@/components/fh/HeroCarousel";

type HomeSearch = {
  for?: CustomerAudience | undefined;
  cat?: string | undefined;
};

export const Route = createFileRoute("/_authenticated/home")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    for: typeof search["for"] === "string" && ["men", "women", "kids"].includes(search["for"] as string) ? search["for"] as CustomerAudience : undefined,
    cat: typeof search["cat"] === "string" ? search["cat"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Home — FOOT HOUSE" },
      { name: "description", content: "New season drops, departments and new arrivals at FOOT HOUSE." },
      { property: "og:title", content: "Home — FOOT HOUSE" },
      { property: "og:description", content: "New season drops and new arrivals at FOOT HOUSE." },
    ],
  }),
  component: Home,
});


function Home() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/home" });
  const { data: banners = [] } = useQuery(liveBannersQuery);
  const { data: products = [], isLoading, error } = useQuery(publishedProductsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const selectedAudience = search.for ?? "";
  const selectedCategory = search.cat ?? "";
  const visibleCategoryNames = new Set(products.filter((product) => matchesAudience(product.audience, selectedAudience)).map((product) => product.category));
  const departmentCategories = categories.filter((category) => visibleCategoryNames.has(category.name));
  const setFilters = (patch: { for?: CustomerAudience | undefined; cat?: string | undefined }) => navigate({ search: (previous) => ({ ...previous, ...patch }), replace: true });
  const shown = products.filter((p) => (!selectedCategory || p.category === selectedCategory) && matchesAudience(p.audience, selectedAudience));
  return (
    <StorePage>
      <div className="space-y-5 px-5 pb-6 pt-3">
        <Link to="/search" className="flex h-12 w-full items-center gap-3 rounded-2xl bg-surface px-4 transition hover:bg-surface-high lg:hidden">
          <Icon name="search" className="text-[20px] text-outline" />
          <span className="flex-1 text-xs text-outline">Search sneakers, boots, formal…</span>
          <Icon name="tune" className="text-[18px] text-outline" />
        </Link>

        <HeroCarousel banners={banners} />

        <div className="hide-scrollbar -mx-5 flex gap-6 overflow-x-auto px-5 lg:mx-0 lg:px-0">
          <button type="button" onClick={() => setFilters({ for: undefined })} className={cn("whitespace-nowrap border-b-2 pb-2 text-sm", !selectedAudience ? "border-foreground font-semibold text-foreground" : "border-transparent text-outline")}>All</button>
          {AUDIENCES.map((audience) => (
            <button key={audience.value} type="button" onClick={() => setFilters({ for: selectedAudience === audience.value ? undefined : audience.value })} className={cn("whitespace-nowrap border-b-2 pb-2 text-sm", selectedAudience === audience.value ? "border-foreground font-semibold text-foreground" : "border-transparent text-outline")}>
              {audience.label}
            </button>
          ))}
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-headline-sm text-foreground">Departments</h3>
          </div>
          <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-nowrap lg:overflow-visible lg:px-0">
            {["All Drops", ...departmentCategories.map((category) => category.name)].map((d) => (
              <button
                key={d}
                onClick={() => setFilters({ cat: d === "All Drops" ? undefined : d })}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-2 text-label-md transition",
                  (d === "All Drops" ? !selectedCategory : selectedCategory === d) ? "bg-primary text-primary-foreground" : "bg-surface text-foreground hover:bg-surface-high",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="text-headline-sm text-foreground">New Arrivals</h3>
              <p className="text-xs text-outline">Limited capsule production runs</p>
            </div>
            <Link to="/search" search={{ for: selectedAudience || undefined, cat: selectedCategory || undefined }} className="text-xs text-outline">View All</Link>
          </div>
          <div className="hide-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-5">
            {isLoading && <p className="text-xs text-outline">Loading…</p>}
            {error && <p className="text-xs text-destructive">Couldn't load products. Please try again.</p>}
            {!isLoading && !error && shown.length === 0 && <p className="text-xs text-outline">No products here yet.</p>}
            {shown.map((p) => (
              <ProductCard key={p.id} p={p} className="w-[46%] min-w-[160px] shrink-0 lg:w-auto lg:min-w-0" />
            ))}
          </div>
        </section>
      </div>
    </StorePage>
  );
}
