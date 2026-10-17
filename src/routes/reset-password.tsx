import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkPassword } from "@/lib/entry";
import { routeAfterAuth } from "@/lib/after-auth";
import { FhButton, Icon, PasswordField, Screen, ScreenHeader } from "@/components/fh/primitives";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create new password — FOOT HOUSE" },
      { name: "description", content: "Choose a new password for your FOOT HOUSE account." },
      { property: "og:title", content: "Create new password — FOOT HOUSE" },
      { property: "og:description", content: "Choose a new password for your FOOT HOUSE account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => s.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!checkPassword(p1).valid) return setError("Use 8+ characters including a number and a symbol.");
    if (p1 !== p2) return setError("Passwords don't match.");
    setBusy(true);
    const { data, error } = await supabase.auth.updateUser({ password: p1 });
    setBusy(false);
    if (error || !data.user) return setError(error?.message ?? "Couldn't update password.");
    setDone(true);
    const to = await routeAfterAuth(queryClient, data.user.id);
    setTimeout(() => navigate({ to, replace: true }), 2200);
  };

  return (
    <Screen className="relative justify-between bg-background px-7 py-3 lg:mx-auto lg:max-w-md">
      <ScreenHeader title="Create New Password" onBack={() => navigate({ to: "/" })} />
      <div className="my-auto flex flex-col items-center py-2">
        <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full border border-surface-high bg-surface">
          <Icon name="shield_person" filled className="text-[54px] text-foreground" />
        </div>
        <p className="max-w-[280px] text-center text-sm text-muted-foreground">
          {ready ? "Create your new password. Ensure it has at least 8 characters." : "Open this page from the reset link in your email."}
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4 pb-4">
        <PasswordField autoComplete="new-password" placeholder="New Password" required disabled={!ready} value={p1} onChange={(e) => setP1(e.target.value)} />
        <PasswordField autoComplete="new-password" placeholder="Confirm Password" required disabled={!ready} value={p2} onChange={(e) => setP2(e.target.value)} />
        {error && <p role="alert" className="text-center text-sm text-destructive">{error}</p>}
        <FhButton type="submit" disabled={!ready || busy}>{busy ? "Saving…" : "Continue"}</FhButton>
      </form>

      {done && (
        <div className="animate-screen absolute inset-0 z-40 flex items-center justify-center bg-primary/60 p-6 backdrop-blur-sm">
          <div className="flex w-full max-w-xs flex-col items-center space-y-4 rounded-[32px] border border-surface-high bg-card p-7 text-center shadow-2xl">
            <div className="my-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Icon name="verified" className="text-[44px]" />
            </div>
            <h3 className="text-headline-lg text-foreground">Congratulations!</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">Your password has been reset successfully. Redirecting you now…</p>
            <div className="flex items-center gap-2 pt-2">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
