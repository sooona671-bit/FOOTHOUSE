import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fhButton, OrDivider, Screen, ScreenHeader } from "@/components/fh/primitives";
import { SocialAuth } from "@/components/fh/SocialAuth";

export const Route = createFileRoute("/auth/")({
  head: () => ({
    meta: [
      { title: "Sign in — FOOT HOUSE" },
      { name: "description", content: "Sign in to FOOT HOUSE to sync your bag, wishlist and fit profile." },
      { property: "og:title", content: "Sign in — FOOT HOUSE" },
      { property: "og:description", content: "Sign in to sync your bag, wishlist and fit profile." },
    ],
  }),
  component: AuthChoice,
});

function AuthChoice() {
  const navigate = useNavigate();
  return (
    <Screen className="justify-between bg-background px-7 py-3 lg:mx-auto lg:max-w-md">
      <ScreenHeader brand onBack={() => navigate({ to: "/onboarding" })} />
      <div className="my-6 flex flex-col items-center text-center">
        <div className="relative -mx-7 -my-[100px] mb-5 flex h-[360px] w-[calc(100%+3.5rem)] items-center justify-center overflow-x-clip">
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,0,0,0.05)] bg-[radial-gradient(circle,_rgba(255,255,255,0.7),_transparent_70%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,0,0,0.05)] bg-[radial-gradient(circle,_rgba(255,255,255,0.45),_transparent_70%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(350px,calc(100vw-24px))] w-[min(350px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(0,0,0,0.05)] bg-[radial-gradient(circle,_rgba(255,255,255,0.3),_transparent_70%)]" />
          <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,_#ffffff,_#f8f8f8)] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <img src="/assets/brand-logo.png" alt="FOOT HOUSE" width={96} height={96} decoding="async" className="h-24 w-24 object-contain" />
          </div>
        </div>
        <h2 className="text-display text-foreground">Let’s get you in</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to sync your bag and custom fit profiles</p>
      </div>
      <div className="space-y-5">
        <SocialAuth />
        <OrDivider />
        <Link to="/auth/sign-in" className={fhButton()}>
          Sign in with password
        </Link>
        <p className="text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <Link to="/auth/sign-up" className="font-bold text-foreground">
            Sign up
          </Link>
        </p>
        <Link to="/home" className="block pb-4 text-center text-sm text-muted-foreground underline underline-offset-4">Skip for now</Link>
      </div>
    </Screen>
  );
}
