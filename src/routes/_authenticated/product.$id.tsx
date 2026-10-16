import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { discountPct, npr, productQuery, useCart, useWishlist } from "@/lib/shop";
import { normalizeSizes } from "@/lib/products";
import { useWhatsAppOrder } from "@/lib/whatsapp";
import { FhButton, Icon, ScreenHeader } from "@/components/fh/primitives";
import { BottomNav } from "@/components/fh/StoreLayout";

export const Route = createFileRoute("/_authenticated/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — FOOT HOUSE" },
      { name: "description", content: "Product details, sizes and colours at FOOT HOUSE." },
      { property: "og:title", content: "Product — FOOT HOUSE" },
      { property: "og:description", content: "Product details, sizes and colours at FOOT HOUSE." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: p, isLoading, error } = useQuery(productQuery(id));
  const cart = useCart();
  const wish = useWishlist();
  const order = useWhatsAppOrder();
  const [img, setImg] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

  if (isLoading) return <Shell><p className="py-24 text-center text-sm text-outline">Loading…</p></Shell>;
  if (error) return <Shell><p className="py-24 text-center text-sm text-destructive">Couldn't load this product. Please try again.</p></Shell>;
  if (!p)
    return (
      <Shell>
        <div className="py-24 text-center">
          <p className="text-sm text-muted-foreground">This product isn't available.</p>
          <Link to="/home" className="mt-3 inline-block text-label-md underline">Back to Home</Link>
        </div>
      </Shell>
    );

  const off = discountPct(p.price, p.compare_at_price);
  const soldOut = p.stock <= 0;
  const sizes = normalizeSizes(p.sizes);
  const pickOk = () => {
    if (sizes.length && !size) { toast.error("Please select a size"); return false; }
    if (p.colors.length && !color) { toast.error("Please select a colour"); return false; }
    return true;
  };
  const addToBag = async () => {
    if (!pickOk()) return;
    await cart.add({ productId: p.id, size, color });
  };
  const buyNow = async () => {
    if (!pickOk()) return;
    await order.send([{ productId: p.id, name: p.name, price: Number(p.price), size, color, quantity: 1, imagePath: p.images[0] }]);
  };

  return (
    <Shell right={
      <button aria-label="Wishlist" onClick={() => wish.toggle(p.id)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface">
        <Icon name="favorite" filled={wish.has(p.id)} className="text-[22px]" />
      </button>
    }>
      <div className="aspect-square overflow-hidden rounded-3xl bg-surface">
        {p.imageUrls[img] ? (
          <img src={p.imageUrls[img]} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-outline"><Icon name="hide_image" className="text-[40px]" /></div>
        )}
      </div>
      {p.imageUrls.length > 1 && (
        <div className="hide-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {p.imageUrls.map((u, i) => (
            <button key={u} onClick={() => setImg(i)} className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2", i === img ? "border-primary" : "border-transparent")}>
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="mt-5 space-y-1">
        <p className="text-[11px] uppercase tracking-widest text-outline">{p.category}</p>
        <h1 className="text-headline-md text-foreground">{p.name}</h1>
        <p className="text-lg font-bold text-foreground">
          {npr(p.price)}
          {off > 0 && (
            <>
              <span className="ml-2 text-sm font-normal text-outline line-through">{npr(p.compare_at_price!)}</span>
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">{off}% OFF</span>
            </>
          )}
        </p>
        <p className={cn("text-xs", soldOut ? "text-destructive" : "text-muted-foreground")}>
          {soldOut ? "Sold out" : p.stock <= 5 ? `Only ${p.stock} left` : "In stock"}
        </p>
      </div>
      {p.description && <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{p.description}</p>}
      {sizes.length > 0 && (
        <Options label="Size" values={sizes} value={size} onChange={setSize} />
      )}
      {p.colors.length > 0 && (
        <Options label="Colour" values={p.colors} value={color} onChange={setColor} />
      )}
      <div className="mt-6 space-y-3">
        <FhButton disabled={soldOut || order.sending} onClick={buyNow}>
          <Icon name="chat" className="text-[20px]" />
          {soldOut ? "Sold Out" : order.sending ? "Opening WhatsApp…" : "Buy Now on WhatsApp"}
        </FhButton>
        <div className="flex gap-3">
          <FhButton variant="outline" disabled={soldOut || cart.adding} onClick={addToBag}>
            <Icon name="shopping_bag" className="text-[20px]" />
            {cart.adding ? "Adding…" : "Add to Bag"}
          </FhButton>
          <FhButton variant="outline" size="icon" aria-label="Open bag" onClick={() => navigate({ to: "/bag" })}>
            <Icon name="shopping_bag" className="text-[20px]" />
          </FhButton>
        </div>
      </div>
    </Shell>
  );
}

function Options({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-label-md text-foreground">{label}{value && <span className="ml-1 font-normal text-outline">· {value}</span>}</p>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <button
            key={v}
            onClick={() => onChange(v === value ? "" : v)}
            aria-pressed={v === value}
            className={cn("min-w-12 rounded-full px-4 py-2 text-label-md transition", v === value ? "bg-primary text-primary-foreground" : "bg-surface text-foreground hover:bg-surface-high")}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="animate-screen flex min-h-full flex-1 flex-col bg-background">
      <div className="px-5"><ScreenHeader title="Details" right={right} /></div>
      <main className="flex-1 px-5 pb-8">{children}</main>
      <BottomNav />
    </div>
  );
}
