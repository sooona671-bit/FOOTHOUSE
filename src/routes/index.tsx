import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { onboarding, resolveEntry } from "@/lib/entry";
import { profileQuery } from "@/lib/profile";
import { routeAfterAuth } from "@/lib/after-auth";
import { BRAND, FhButton, Icon, Monogram } from "@/components/fh/primitives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FOOT HOUSE — Premium Footwear & Fashion" },
      { name: "description", content: "Shop curated premium sneakers, footwear and wardrobe essentials at FOOT HOUSE." },
      { property: "og:title", content: "FOOT HOUSE — Premium Footwear & Fashion" },
      { property: "og:description", content: "Shop curated premium sneakers, footwear and wardrobe essentials at FOOT HOUSE." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEnter, setShowEnter] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setShowEnter(true);
      // Logged-out visitors move on automatically after the splash.
      const t = setTimeout(() => {
        navigate({
          to: resolveEntry({ hasSession: false, profileCompleted: false, onboardingSeen: onboarding.seen() }),
          replace: true,
        });
      }, 2200);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const p = await queryClient.fetchQuery(profileQuery(session.user.id));
        if (cancelled) return;
        navigate({
          to: p?.profile_completed ? await routeAfterAuth(queryClient, session.user.id) : resolveEntry({ hasSession: true, profileCompleted: false, onboardingSeen: true }),
          replace: true,
        });
      } catch {
        if (!cancelled) navigate({ to: "/profile-setup", replace: true });
      }
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [loading, session, navigate, queryClient]);

  const enter = () =>
    navigate({ to: resolveEntry({ hasSession: false, profileCompleted: false, onboardingSeen: onboarding.seen() }) });

  return (
    <section className="relative flex min-h-full flex-1 flex-col items-center justify-between overflow-hidden bg-background px-8 py-10 text-center text-foreground lg:mx-auto lg:w-full lg:max-w-md">
      <div className="flex w-full justify-end pt-2">
        <span className="text-caption uppercase tracking-widest text-muted-foreground">SS/25 Editions</span>
      </div>
      <div className="my-auto flex flex-col items-center space-y-5">
        <Monogram size="lg" />
        <div className="space-y-1">
          <h1 className="text-display uppercase tracking-[0.25em]">{BRAND}</h1>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Premium Footwear</p>
        </div>
        <p className="max-w-[220px] pt-1 text-xs text-muted-foreground">Premium Footwear Since 2004</p>
      </div>
      <div className="flex w-full flex-col items-center gap-5 pb-4">
        <div className="flex items-center gap-1.5" aria-label="Loading">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
        </div>
        <div className="h-14 w-full">
          {showEnter && (
            <FhButton onClick={enter} className="animate-screen">
              <span>Enter Store</span>
              <Icon name="arrow_forward" className="text-[20px]" />
            </FhButton>
          )}
        </div>
      </div>
    </section>
  );
}
