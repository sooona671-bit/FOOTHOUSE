import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword, rememberMe } from "@/lib/entry";
import { cn } from "@/lib/utils";
import { Checkbox, FhButton, Field, Icon, OrDivider, PasswordField, Screen, ScreenHeader } from "@/components/fh/primitives";
import { SocialAuth } from "@/components/fh/SocialAuth";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Create your account — FOOT HOUSE" },
      { name: "description", content: "Join FOOT HOUSE for early access drops and personalized sizing." },
      { property: "og:title", content: "Create your account — FOOT HOUSE" },
      { property: "og:description", content: "Join FOOT HOUSE for early access drops and personalized sizing." },
    ],
  }),
  component: SignUp,
});

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs", ok ? "text-foreground" : "text-outline")}>
      <Icon name="check_circle" filled={ok} className="text-[16px]" />
      <span>{label}</span>
    </div>
  );
}

function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const rules = checkPassword(password);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please enter a valid email address.");
    if (!rules.valid) return setError("Your password doesn't meet the requirements yet.");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) return setError(error.message);
    // Supabase hides "already registered" emails: it returns a user with no identities.
    if (data.user && data.user.identities?.length === 0) {
      return setError("An account with this email already exists. Please sign in instead.");
    }
    rememberMe.set(remember);
    if (data.session) navigate({ to: "/profile-setup", replace: true });
    else setSentTo(email.trim());
  };

  if (sentTo) {
    return (
      <Screen className="items-center justify-center bg-background px-7 text-center">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
          <Icon name="mark_email_read" className="text-[44px]" />
        </div>
        <h2 className="text-headline-lg text-foreground">Check your inbox</h2>
        <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          We sent a confirmation link to <span className="font-bold text-foreground">{sentTo}</span>. Tap it to activate your account and set up your profile.
        </p>
        <Link to="/auth/sign-in" className="mt-8 text-label-md text-foreground underline">Back to sign in</Link>
      </Screen>
    );
  }

  return (
    <Screen className="justify-between bg-background px-7 py-3">
      <ScreenHeader brand onBack={() => navigate({ to: "/auth" })} />
      <div className="my-5">
        <h2 className="text-display text-foreground">Create Your Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Unlock exclusive drops and personalized sizing</p>
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field icon="mail" type="email" autoComplete="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField autoComplete="new-password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
          <Rule ok={rules.length} label="8+ characters minimum" />
          <Rule ok={rules.numberAndSymbol} label="Includes number & symbol" />
        </div>
        <div className="flex justify-center py-1">
          <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
        </div>
        {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
        <FhButton type="submit" disabled={busy}>{busy ? "Creating account…" : "Sign up"}</FhButton>
      </form>
      <div className="mt-6 space-y-5 pb-4">
        <OrDivider label="or continue with" />
        <SocialAuth compact />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="font-bold text-foreground">Sign in</Link>
        </p>
      </div>
    </Screen>
  );
}
