import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { FhButton, Field, Icon, Screen, ScreenHeader } from "@/components/fh/primitives";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({
    meta: [
      { title: "Forgot password — FOOT HOUSE" },
      { name: "description", content: "Reset your FOOT HOUSE password by email." },
      { property: "og:title", content: "Forgot password — FOOT HOUSE" },
      { property: "og:description", content: "Reset your FOOT HOUSE password by email." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) setError("Couldn't send the reset link. Please try again.");
    else setSent(true);
  };

  return (
    <Screen className="justify-between bg-background px-7 py-3 lg:mx-auto lg:max-w-md">
      <ScreenHeader title="Forgot Password" onBack={() => navigate({ to: "/auth/sign-in" })} />
      <div className="my-6 flex flex-col items-center">
        <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border border-surface-high bg-surface">
          <Icon name="lock_reset" filled className="text-[54px] text-foreground" />
        </div>
        <p className="max-w-[280px] text-center text-sm text-muted-foreground">
          {sent
            ? "If an account exists for that email, a reset link is on its way. Open it on this device to create a new password."
            : "Enter the email linked to your account and we'll send you a secure reset link."}
        </p>
      </div>
      {sent ? (
        <div className="pb-4">
          <FhButton onClick={() => navigate({ to: "/auth/sign-in" })}>Back to sign in</FhButton>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 pb-4">
          <label className="flex items-center gap-4 rounded-3xl border-2 border-primary bg-card p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface">
              <Icon name="mail" className="text-[22px]" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-muted-foreground">via Email:</span>
              <p className="text-label-md text-foreground">Secure reset link</p>
            </div>
            <Icon name="radio_button_checked" filled className="text-[22px]" />
          </label>
          <Field icon="alternate_email" type="email" autoComplete="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
          <FhButton type="submit" disabled={busy}>{busy ? "Sending…" : "Continue"}</FhButton>
        </form>
      )}
    </Screen>
  );
}
