import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword } from "@/lib/entry";
import { BRAND, FhButton, Monogram } from "@/components/fh/primitives";

export const Route = createFileRoute("/admin_/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set new admin password — FOOT HOUSE" },
      { name: "description", content: "Choose a new password for your FOOT HOUSE staff account." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Set new admin password — FOOT HOUSE" },
      { property: "og:description", content: "Choose a new password for your FOOT HOUSE staff account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminReset,
});

type Status = "checking" | "ready" | "invalid";

function AdminReset() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1) + "&" + window.location.search.slice(1));
    if (params.get("error") || params.get("error_code")) {
      setStatus("invalid");
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setStatus("ready");
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setStatus("ready");
    });
    const t = setTimeout(() => setStatus((s) => (s === "checking" ? "invalid" : s)), 4000);
    return () => {
      clearTimeout(t);
      data.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!checkPassword(p1).valid) return setError("Use 8+ characters including a number and a symbol.");
    if (p1 !== p2) return setError("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    // Sign out so the admin signs in fresh; role checks run again at sign-in.
    await supabase.auth.signOut();
    toast.success("Password updated. Sign in with your new password.");
    navigate({ to: "/admin/login", replace: true });
  };

  const input = "h-12 w-full rounded-2xl bg-surface px-4 text-sm text-foreground outline-none ring-primary focus:ring-2";
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-5">
      <div className="w-full max-w-sm space-y-4 rounded-[28px] bg-card p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.25em] text-foreground"><Monogram />{BRAND}</div>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Set new password</h1>
          <p className="text-xs text-muted-foreground">
            {status === "checking" && "Verifying your reset link…"}
            {status === "ready" && "Choose a new password with 8+ characters, a number and a symbol."}
            {status === "invalid" && "This reset link is invalid or has expired. Please request a new one."}
          </p>
        </div>
        {status === "ready" && (
          <form onSubmit={submit} className="space-y-4">
            <input className={input} type="password" autoComplete="new-password" required placeholder="New password" value={p1} onChange={(e) => setP1(e.target.value)} />
            <input className={input} type="password" autoComplete="new-password" required placeholder="Confirm new password" value={p2} onChange={(e) => setP2(e.target.value)} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <FhButton type="submit" disabled={busy} className="h-12 w-full">{busy ? "Saving…" : "Update password"}</FhButton>
          </form>
        )}
        {status === "invalid" && (
          <Link to="/admin/forgot" className="block">
            <FhButton className="h-12 w-full">Request a new link</FhButton>
          </Link>
        )}
        <Link to="/admin/login" className="block text-center text-xs font-semibold text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
