import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fhButton, Icon, OrDivider, Screen, ScreenHeader } from "@/components/fh/primitives";
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
        <div className="relative mb-5 flex h-32 w-32 items-center justify-center rounded-full border border-surface-high bg-surface">
          <Icon name="steps" filled className="text-[60px] text-foreground" />
          <span className="absolute right-3 top-3 text-lg text-foreground">✦</span>
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
        <p className="pb-4 text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <Link to="/auth/sign-up" className="font-bold text-foreground">
            Sign up
          </Link>
        </p>
      </div>
    </Screen>
  );
}
