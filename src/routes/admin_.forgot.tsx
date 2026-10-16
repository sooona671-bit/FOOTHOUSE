import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BRAND, FhButton, Monogram } from "@/components/fh/primitives";

export const Route = createFileRoute("/admin_/forgot")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset admin password — FOOT HOUSE" },
      { name: "description", content: "Request a secure password reset link for FOOT HOUSE staff." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Reset admin password — FOOT HOUSE" },
      { property: "og:description", content: "Request a secure password reset link for FOOT HOUSE staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminForgot,
});

function AdminForgot() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    // Only sends to existing accounts; never creates one or changes roles.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setBusy(false);
    if (error) setError("Couldn't send the reset link. Please try again in a minute.");
    else setSent(true);
  };

  const input = "h-12 w-full rounded-2xl bg-surface px-4 text-sm text-foreground outline-none ring-primary focus:ring-2";
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-5">
      <div className="w-full max-w-sm space-y-4 rounded-[28px] bg-card p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.25em] text-foreground"><Monogram />{BRAND}</div>
          <h1 className="mt-2 text-2xl font-bold text-foreground">Reset Admin Password</h1>
          <p className="text-xs text-muted-foreground">
            {sent
              ? "If this email belongs to a registered account, a reset link is on its way. Check your inbox (and spam folder) and open the link to set a new password."
              : "Enter your registered email and we'll send you a secure reset link."}
          </p>
        </div>
        {!sent && (
          <form onSubmit={submit} className="space-y-4">
            <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <FhButton type="submit" disabled={busy} className="h-12 w-full">{busy ? "Sending…" : "Send reset link"}</FhButton>
          </form>
        )}
        {sent && (
          <FhButton variant="outline" className="h-12 w-full" onClick={() => setSent(false)}>Send again</FhButton>
        )}
        <Link to="/admin/login" className="block text-center text-xs font-semibold text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
