import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/products";
import { BRAND, FhButton, Monogram } from "@/components/fh/primitives";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin sign in — FOOT HOUSE" },
      { name: "description", content: "Authorized staff sign in for FOOT HOUSE." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin sign in — FOOT HOUSE" },
      { property: "og:description", content: "Authorized staff sign in for FOOT HOUSE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setError("Incorrect email or password.");
      setBusy(false);
      return;
    }
    if (!(await isAdmin(data.user.id))) {
      await supabase.auth.signOut();
      setError("This account is not authorized for the admin dashboard.");
      setBusy(false);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/admin", replace: true });
  };

  const input = "h-12 w-full rounded-2xl bg-surface px-4 text-sm text-foreground outline-none ring-primary focus:ring-2";
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-[28px] bg-card p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.25em] text-foreground"><Monogram />{BRAND}</div>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Admin sign in</h1>
          <p className="text-xs text-muted-foreground">Authorized staff only.</p>
        </div>
        <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={input} type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <FhButton type="submit" disabled={busy} className="h-12 w-full">{busy ? "Signing in…" : "Sign in"}</FhButton>
        <Link to="/admin/forgot" className="block text-center text-xs font-semibold text-muted-foreground hover:text-foreground">
          Forgot Password?
        </Link>
      </form>
    </div>
  );
}
