import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { publishedProductsQuery } from "@/lib/products";
import { useWishlist } from "@/lib/shop";
import { ComingSoon, StorePage } from "@/components/fh/StoreLayout";
import { ProductGrid } from "@/components/fh/ProductCard";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — FOOT HOUSE" },
      { name: "description", content: "The FOOT HOUSE pairs you've saved." },
      { property: "og:title", content: "Wishlist — FOOT HOUSE" },
      { property: "og:description", content: "The FOOT HOUSE pairs you've saved." },
    ],
  }),
  component: Wishlist,
});

function Wishlist() {
  const wish = useWishlist();
  const { data: products = [], isLoading } = useQuery(publishedProductsQuery);
  const saved = products.filter((p) => wish.has(p.id));
  return (
    <StorePage>
      {isLoading || wish.isLoading ? (
        <p className="py-24 text-center text-sm text-outline">Loading…</p>
      ) : saved.length === 0 ? (
        <div>
          <ComingSoon icon="favorite" title="Wishlist" text="Tap the heart on any product to save it here." />
          <div className="text-center"><Link to="/home" className="text-label-md underline">Browse products</Link></div>
        </div>
      ) : (
        <div className="px-5 pb-6 pt-4">
          <h1 className="mb-4 text-headline-lg text-foreground">Wishlist</h1>
          <ProductGrid products={saved} empty="" />
        </div>
      )}
    </StorePage>
  );
}
