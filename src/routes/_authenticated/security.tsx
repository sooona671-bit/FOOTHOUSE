import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FhButton, PasswordField } from "@/components/fh/primitives";
import { SubPage, seo } from "@/components/fh/SubPage";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => seo("Privacy & Security", "Change your password and manage account security."),
  component: Security,
});

function Security() {
  const { user } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { setErr("Password must be at least 8 characters"); return; }
    if (pw !== pw2) { setErr("Passwords don't match"); return; }
    setErr("");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setPw(""); setPw2("");
    toast.success("Password updated");
  };

  const sendReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { toast.error("Couldn't send reset email"); return; }
    toast.success("Reset link sent — check your email");
  };

  const signOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
  };

  return (
    <SubPage title="Privacy & Security">
      <h2 className="mb-3 text-label-lg text-foreground">Change password</h2>
      <form onSubmit={change} className="space-y-3">
        <PasswordField placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label="New password" />
        <PasswordField placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} error={err} aria-label="Confirm new password" />
        <FhButton type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</FhButton>
      </form>
      <div className="mt-8 rounded-3xl bg-surface p-4">
        <h2 className="text-label-lg text-foreground">Your privacy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your name, phone and address are used only to process your orders. Your cart, wishlist and addresses are private to your account.
          They are shared with us only when you tap Buy Now or Order on WhatsApp.
        </p>
      </div>
      <div className="mt-8 space-y-3">
        <h2 className="text-label-lg text-foreground">Other options</h2>
        <FhButton variant="outline" onClick={sendReset}>Email me a reset link</FhButton>
        <FhButton variant="outline" onClick={signOutAll}>Sign out of all devices</FhButton>
      </div>
    </SubPage>
  );
}
