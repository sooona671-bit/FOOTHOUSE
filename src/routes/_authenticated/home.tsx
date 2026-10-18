import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { departments } from "@/data/sample-catalog";
import { liveBannersQuery } from "@/lib/banner";
import { publishedProductsQuery } from "@/lib/products";
import { Icon } from "@/components/fh/primitives";
import { ProductCard } from "@/components/fh/ProductCard";
import { StorePage } from "@/components/fh/StoreLayout";
import { HeroCarousel } from "@/components/fh/HeroCarousel";

export const Route = createFileRoute("/_authenticated/home")({
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
  const [dept, setDept] = useState(departments[0]);
  const { data: banners = [] } = useQuery(liveBannersQuery);
  const { data: products = [], isLoading, error } = useQuery(publishedProductsQuery);
  const shown = dept === departments[0] ? products : products.filter((p) => p.category === dept);
  return (
    <StorePage>
      <div className="space-y-5 px-5 pb-6 pt-3">
        <Link to="/search" className="flex h-12 w-full items-center gap-3 rounded-2xl bg-surface px-4 transition hover:bg-surface-high lg:hidden">
          <Icon name="search" className="text-[20px] text-outline" />
          <span className="flex-1 text-xs text-outline">Search sneakers, boots, formal…</span>
          <Icon name="tune" className="text-[18px] text-outline" />
        </Link>

        <HeroCarousel banners={banners} />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-headline-sm text-foreground">Departments</h3>
          </div>
          <div className="hide-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-nowrap lg:overflow-visible lg:px-0">
            {departments.map((d) => (
              <button
                key={d}
                onClick={() => setDept(d)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-2 text-label-md transition",
                  d === dept ? "bg-primary text-primary-foreground" : "bg-surface text-foreground hover:bg-surface-high",
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
            <Link to="/search" search={dept === departments[0] ? {} : { category: dept }} className="text-xs text-outline">View All</Link>
          </div>
          <div className="hide-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-5">
            {isLoading && <p className="text-xs text-outline">Loading…</p>}
            {error && <p className="text-xs text-destructive">Couldn't load products. Please try again.</p>}
            {!isLoading && !error && shown.length === 0 && <p className="text-xs text-outline">New styles are coming soon.</p>}
            {shown.map((p) => (
              <ProductCard key={p.id} p={p} className="w-[46%] min-w-[160px] shrink-0 lg:w-auto lg:min-w-0" />
            ))}
          </div>
        </section>
      </div>
    </StorePage>
  );
}
