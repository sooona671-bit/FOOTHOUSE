import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { departments, heroImage } from "@/data/sample-catalog";
import { bannerImageUrl, bannerQuery, BANNER_DEFAULTS, normalizeBannerLink } from "@/lib/banner";
import { publishedProductsQuery } from "@/lib/products";
import { Icon } from "@/components/fh/primitives";
import { ProductCard } from "@/components/fh/ProductCard";
import { StorePage } from "@/components/fh/StoreLayout";

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
  const { data: customBanner } = useQuery(bannerQuery);
  const { data: products = [], isLoading, error } = useQuery(publishedProductsQuery);
  const banner = { ...BANNER_DEFAULTS, ...(customBanner ?? {}) };
  const shown = dept === departments[0] ? products : products.filter((p) => p.category === dept);
  return (
    <StorePage>
      <div className="space-y-5 px-5 pb-6 pt-3">
        <Link to="/search" className="flex h-12 w-full items-center gap-3 rounded-2xl bg-surface px-4 transition hover:bg-surface-high lg:hidden">
          <Icon name="search" className="text-[20px] text-outline" />
          <span className="flex-1 text-xs text-outline">Search sneakers, boots, formal…</span>
          <Icon name="tune" className="text-[18px] text-outline" />
        </Link>

        <div className="relative overflow-hidden rounded-[26px] bg-primary text-primary-foreground shadow-sm lg:aspect-[21/9] lg:rounded-3xl">
          <img
            src={bannerImageUrl(banner.image_path) ?? heroImage}
            alt={banner.title || "New season drop"}
            width={832}
            height={1024}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="h-48 w-full object-cover object-top opacity-75 lg:h-full"
          />
          <div className="bg-banner-fade absolute inset-0 flex flex-col justify-end p-5">
            {banner.eyebrow && <span className="text-caption font-bold uppercase tracking-[0.2em] text-primary-foreground/80">{banner.eyebrow}</span>}
            {banner.title && <h2 className="text-headline-md">{banner.title}</h2>}
            {banner.subtitle && <p className="text-xs text-primary-foreground/80">{banner.subtitle}</p>}
            {banner.button_text && <Link to={normalizeBannerLink(banner.button_link)} className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-background px-4 py-2 text-label-md text-foreground">
              {banner.button_text} <Icon name="arrow_forward" className="text-[16px]" />
            </Link>}
          </div>
        </div>

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
