import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CATEGORIES, publishedProductsQuery } from "@/lib/products";
import { Icon } from "@/components/fh/primitives";
import { StorePage } from "@/components/fh/StoreLayout";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({
    meta: [
      { title: "Categories — FOOT HOUSE" },
      { name: "description", content: "Browse FOOT HOUSE sneakers, formal shoes, boots and sandals." },
      { property: "og:title", content: "Categories — FOOT HOUSE" },
      { property: "og:description", content: "Browse FOOT HOUSE sneakers, formal shoes, boots and sandals." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { data: products = [] } = useQuery(publishedProductsQuery);
  return (
    <StorePage>
      <div className="px-5 pb-6 pt-4">
        <h1 className="mb-4 text-headline-lg text-foreground">Categories</h1>
        <div className="grid grid-cols-2 gap-3">
          <Tile label="All Drops" count={products.length} img={products[0]?.imageUrls[0]} />
          {CATEGORIES.map((c) => {
            const list = products.filter((p) => p.category === c);
            return <Tile key={c} label={c} category={c} count={list.length} img={list[0]?.imageUrls[0]} />;
          })}
        </div>
      </div>
    </StorePage>
  );
}

function Tile({ label, category, count, img }: { label: string; category?: string | undefined; count: number; img?: string | undefined }) {
  return (
    <Link to="/search" search={category ? { category } : {}} className="relative block aspect-square overflow-hidden rounded-2xl bg-surface">
      {img ? (
        <img
          src={img}
          alt=""
          width={400}
          height={400}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
      ) : (
        <Icon name="footprint" className="absolute inset-0 m-auto h-fit w-fit text-[40px] text-outline" />
      )}
      <div className="bg-banner-fade absolute inset-0 flex flex-col justify-end p-3 text-primary-foreground">
        <span className="text-label-lg">{label}</span>
        <span className="text-[11px] opacity-80">{count} item{count === 1 ? "" : "s"}</span>
      </div>
    </Link>
  );
}
