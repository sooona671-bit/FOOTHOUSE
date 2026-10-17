import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/products";
import { BRAND, Icon, Monogram } from "@/components/fh/primitives";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — FOOT HOUSE" },
      { name: "description", content: "Private product management for FOOT HOUSE." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin — FOOT HOUSE" },
      { property: "og:description", content: "Private product management for FOOT HOUSE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
    if (!(await isAdmin(data.user.id))) throw redirect({ to: "/home", replace: true });
    return { adminEmail: data.user.email ?? "" };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { adminEmail } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };
  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-10 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Link to="/admin" className="flex items-center gap-2 text-sm font-extrabold tracking-[0.2em]"><Monogram />{BRAND} <span className="font-medium opacity-60">ADMIN</span></Link>
          <nav className="ml-4 flex gap-1 text-sm">
            <Link to="/admin" activeOptions={{ exact: true }} className="rounded-full px-3 py-1.5 opacity-70 [&.active]:bg-background [&.active]:text-foreground [&.active]:opacity-100">Products</Link>
            <Link to="/admin/new" className="rounded-full px-3 py-1.5 opacity-70 [&.active]:bg-background [&.active]:text-foreground [&.active]:opacity-100">Add product</Link>
            <Link to="/admin/banner" className="rounded-full px-3 py-1.5 opacity-70 [&.active]:bg-background [&.active]:text-foreground [&.active]:opacity-100">Home banner</Link>
          </nav>
          <span className="ml-auto hidden text-xs opacity-70 sm:inline">{adminEmail}</span>
          <button onClick={signOut} className="flex items-center gap-1 rounded-full border border-primary-foreground/30 px-3 py-1.5 text-xs">
            <Icon name="logout" className="text-[16px]" /> Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8"><Outlet /></main>
    </div>
  );
}
