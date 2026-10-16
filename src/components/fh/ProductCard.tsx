import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { ProductWithUrls } from "@/lib/products";
import { npr, useWishlist } from "@/lib/shop";
import { Icon } from "./primitives";

export function ProductCard({ p, className }: { p: ProductWithUrls; className?: string }) {
  const wish = useWishlist();
  const saved = wish.has(p.id);
  return (
    <article className={cn("relative rounded-2xl border border-border bg-card p-2", className)}>
      <Link to="/product/$id" params={{ id: p.id }} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
          {p.imageUrls[0] ? (
            <img
              src={p.imageUrls[0]}
              alt={p.name}
              width={600}
              height={600}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-outline">
              <Icon name="hide_image" className="text-[32px]" />
            </div>
          )}
          {p.compare_at_price != null && p.compare_at_price > p.price && (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">SALE</span>
          )}
          {p.stock === 0 && (
            <span className="absolute bottom-2 left-2 rounded-full bg-background px-2 py-0.5 text-[10px] font-bold text-foreground">SOLD OUT</span>
          )}
        </div>
        <div className="px-1 pb-1 pt-2">
          <p className="text-[10px] uppercase tracking-wide text-outline">{p.category}</p>
          <p className="truncate text-label-md text-foreground">{p.name}</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {npr(p.price)}
            {p.compare_at_price != null && p.compare_at_price > p.price && (
              <span className="ml-1.5 text-xs font-normal text-outline line-through">{npr(p.compare_at_price)}</span>
            )}
          </p>
        </div>
      </Link>
      <button
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={saved}
        onClick={() => wish.toggle(p.id)}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm"
      >
        <Icon name="favorite" filled={saved} className="text-[18px]" />
      </button>
    </article>
  );
}

export function ProductGrid({ products, empty }: { products: ProductWithUrls[]; empty: string }) {
  if (!products.length) return <p className="py-10 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
