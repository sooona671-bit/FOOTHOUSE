import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rememberMe } from "@/lib/entry";
import { routeAfterAuth } from "@/lib/after-auth";
import { Checkbox, FhButton, Field, OrDivider, PasswordField, Screen, ScreenHeader } from "@/components/fh/primitives";
import { SocialAuth } from "@/components/fh/SocialAuth";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Login to your account — FOOT HOUSE" },
      { name: "description", content: "Welcome back to FOOT HOUSE. Sign in with your email and password." },
      { property: "og:title", content: "Login — FOOT HOUSE" },
      { property: "og:description", content: "Welcome back. Sign in with your email and password." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) {
      setBusy(false);
      setError(
        error?.message.toLowerCase().includes("confirm")
          ? "Please confirm your email first — check your inbox."
          : "Incorrect email or password.",
      );
      return;
    }
    rememberMe.set(remember);
    navigate({ to: await routeAfterAuth(queryClient, data.user.id), replace: true });
  };

  return (
    <Screen className="justify-between bg-background px-7 py-3">
      <ScreenHeader brand onBack={() => navigate({ to: "/auth" })} />
      <div className="my-5">
        <h2 className="text-display text-foreground">Login to Your Account</h2>
        <p className="mt-2 text-sm text-muted-foreground">Welcome back. Enter your credentials to continue</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field icon="mail" type="email" autoComplete="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField autoComplete="current-password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex justify-center py-1">
          <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
        </div>
        {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
        <FhButton type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</FhButton>
        <div className="text-center">
          <Link to="/auth/forgot" className="text-label-md text-foreground">Forgot the password?</Link>
        </div>
      </form>
      <div className="mt-6 space-y-5 pb-4">
        <OrDivider label="or continue with" />
        <SocialAuth compact />
        <p className="text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <Link to="/auth/sign-up" className="font-bold text-foreground">Sign up</Link>
        </p>
      </div>
    </Screen>
  );
}
