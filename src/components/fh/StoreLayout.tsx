import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BRAND, Icon, Monogram } from "./primitives";
import { useCart } from "@/lib/shop";

const tabs = [
  { to: "/home", label: "Home", icon: "storefront" },
  { to: "/categories", label: "Categories", icon: "grid_view" },
  { to: "/wishlist", label: "Wishlist", icon: "favorite" },
  { to: "/bag", label: "Bag", icon: "shopping_bag" },
  { to: "/profile", label: "Profile", icon: "person" },
] as const;

export function BottomNav() {
  const { count } = useCart();
  return (
    <nav className="sticky bottom-0 z-30 mt-auto grid grid-cols-5 border-t border-border bg-background/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-md">
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className="flex flex-col items-center gap-0.5 py-1 text-[11px] text-outline"
          activeProps={{ className: "font-semibold !text-foreground" }}
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <Icon name={t.icon} filled={isActive} className="text-[24px]" />
                {t.to === "/bag" && count > 0 && (
                  <span aria-label={`${count} items in bag`} className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">{count}</span>
                )}
              </span>
              <span>{t.label}</span>
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-border bg-background/95 px-5 pb-3 pt-3 backdrop-blur-md">
      <Link to="/home" className="flex items-center gap-2">
        <Monogram />
        <span className="text-[15px] font-extrabold uppercase tracking-[0.2em] text-foreground">{BRAND}</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/search" aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground transition hover:bg-surface-high">
          <Icon name="search" className="text-[19px]" />
        </Link>
        <Link to="/notifications" aria-label="Notifications" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground transition hover:bg-surface-high">
          <Icon name="notifications" className="text-[19px]" />
        </Link>
        <Link to="/wishlist" aria-label="Wishlist" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-foreground transition hover:bg-surface-high">
          <Icon name="favorite" className="text-[19px]" />
        </Link>
      </div>
    </header>
  );
}

export function StorePage({ children, header = true }: { children: ReactNode; header?: boolean }) {
  return (
    <div className="animate-screen flex min-h-full flex-1 flex-col bg-background">
      {header && <StoreHeader />}
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}

/** Placeholder body for store sections that arrive in later steps. */
export function ComingSoon({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-surface-high bg-surface">
        <Icon name={icon} className="text-[44px] text-foreground" />
      </div>
      <h1 className="text-headline-lg text-foreground">{title}</h1>
      <p className="mt-2 max-w-[260px] text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
