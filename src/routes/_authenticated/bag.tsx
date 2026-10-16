import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { npr, useCart } from "@/lib/shop";
import { FhButton, Icon } from "@/components/fh/primitives";
import { ComingSoon, StorePage } from "@/components/fh/StoreLayout";
import { useWhatsAppOrder } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/bag")({
  head: () => ({
    meta: [
      { title: "Your Bag — FOOT HOUSE" },
      { name: "description", content: "Review the items in your FOOT HOUSE bag." },
      { property: "og:title", content: "Your Bag — FOOT HOUSE" },
      { property: "og:description", content: "Review the items in your FOOT HOUSE bag." },
    ],
  }),
  component: Bag,
});

function Bag() {
  const cart = useCart();
  const order = useWhatsAppOrder();
  if (cart.isLoading) return <StorePage><p className="py-24 text-center text-sm text-outline">Loading…</p></StorePage>;
  if (cart.error) return <StorePage><p className="py-24 text-center text-sm text-destructive">Couldn't load your bag. Please try again.</p></StorePage>;
  if (!cart.items.length)
    return (
      <StorePage>
        <ComingSoon icon="shopping_bag" title="Your Bag" text="Your bag is empty. Add a pair you love." />
        <div className="text-center"><Link to="/home" className="text-label-md underline">Start shopping</Link></div>
      </StorePage>
    );
  return (
    <StorePage>
      <div className="px-5 pb-6 pt-4">
        <h1 className="mb-4 text-headline-lg text-foreground">Your Bag <span className="text-sm font-normal text-outline">({cart.count})</span></h1>
        <ul className="space-y-3">
          {cart.items.map((i) => (
            <li key={i.id} className="flex gap-3 rounded-2xl border border-border p-2">
              <Link to="/product/$id" params={{ id: i.product_id }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                {i.product.imageUrls[0] && (
                  <img
                    src={i.product.imageUrls[0]}
                    alt={i.product.name}
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-md text-foreground">{i.product.name}</p>
                <p className="text-[11px] text-outline">{[i.size && `Size ${i.size}`, i.color].filter(Boolean).join(" · ")}</p>
                {!i.product.published && <p className="text-[11px] text-destructive">No longer available</p>}
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold">{npr(Number(i.product.price) * i.quantity)}</span>
                  <div className="flex items-center gap-1 rounded-full bg-surface">
                    <button aria-label="Decrease quantity" disabled={i.quantity <= 1} onClick={() => cart.setQty(i.id, i.quantity - 1)} className="flex h-8 w-8 items-center justify-center disabled:opacity-40"><Icon name="remove" className="text-[16px]" /></button>
                    <span className="w-5 text-center text-sm">{i.quantity}</span>
                    <button aria-label="Increase quantity" disabled={i.quantity >= Math.min(20, i.product.stock)} onClick={() => cart.setQty(i.id, i.quantity + 1)} className="flex h-8 w-8 items-center justify-center disabled:opacity-40"><Icon name="add" className="text-[16px]" /></button>
                  </div>
                </div>
              </div>
              <button aria-label="Remove item" onClick={() => cart.remove(i.id)} className="self-start p-1 text-outline hover:text-destructive"><Icon name="delete" className="text-[20px]" /></button>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-lg font-bold">{npr(cart.subtotal)}</span>
        </div>
        <FhButton
          className="mt-4"
          disabled={order.sending}
          onClick={() => {
            const lines = cart.items
              .filter((i) => i.product.published && i.product.stock > 0)
              .map((i) => ({
                productId: i.product_id,
                name: i.product.name,
                price: Number(i.product.price),
                size: i.size,
                color: i.color,
                quantity: i.quantity,
                imagePath: i.product.images[0],
              }));
            if (!lines.length) { toast.error("These items are no longer available."); return; }
            order.send(lines);
          }}
        >
          <Icon name="chat" className="text-[20px]" />
          {order.sending ? "Opening WhatsApp…" : "Order on WhatsApp"}
        </FhButton>
        <p className="mt-2 text-center text-[11px] text-outline">Your bag details are sent to us on WhatsApp. No payment is taken here.</p>
      </div>
    </StorePage>
  );
}
