import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { memberId } from "@/lib/profile";
import { fhButton, Icon, Screen } from "@/components/fh/primitives";

export const Route = createFileRoute("/_authenticated/welcome")({
  head: () => ({
    meta: [
      { title: "You're in — FOOT HOUSE" },
      { name: "description", content: "Your FOOT HOUSE membership is ready." },
      { property: "og:title", content: "You're in — FOOT HOUSE" },
      { property: "og:description", content: "Your FOOT HOUSE membership is ready." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const { user } = useAuth();
  return (
    <Screen className="relative items-center justify-between overflow-hidden bg-background px-7 py-6 text-center">
      <div className="absolute left-8 top-10 font-mono text-xs opacity-20">✦ 2025 COLLECTION</div>
      <div className="absolute right-8 top-16 font-mono text-xs opacity-20">EDITION 01 ✦</div>
      <span className="pt-2 text-caption font-bold uppercase tracking-[0.25em] text-muted-foreground">Registration Complete</span>
      <div className="my-auto flex flex-col items-center space-y-4">
        <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-surface p-2">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl">
            <Icon name="check" className="text-[52px]" />
          </div>
        </div>
        <h2 className="text-display text-foreground">Congratulations!</h2>
        <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          Your FOOT HOUSE membership is now ready. Your personalized sizing profile is configured.
        </p>
        {user && (
          <div className="flex items-center gap-2 rounded-full border border-surface-high bg-surface px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-highlight" />
            <span className="text-caption font-bold uppercase tracking-wider text-foreground">Member ID: {memberId(user.id)}</span>
          </div>
        )}
      </div>
      <div className="w-full pb-3">
        <Link to="/home" replace className={fhButton()}>
          <span>Explore New Season</span>
          <Icon name="north_east" className="text-[18px]" />
        </Link>
      </div>
    </Screen>
  );
}
