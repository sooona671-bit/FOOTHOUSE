import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { onboarding } from "@/lib/entry";
import { Dots, FhButton, Icon } from "@/components/fh/primitives";
import img1 from "@/assets/onboarding-1.jpg";
import img2 from "@/assets/onboarding-2.jpg";
import img3 from "@/assets/onboarding-3.jpg";

const slides = [
  { img: img1, kicker: "Curated Releases", title: "Curated Designer Collections", text: "Explore seasonal drops from independent designers and premium makers, tailored for timeless everyday wear.", pos: "object-top" },
  { img: img2, kicker: "Ergonomic Form", title: "Engineered Footwear & Fits", text: "Sculpted silhouettes and high-performance ergonomics. Designed for frictionless movement across urban landscapes.", pos: "object-center" },
  { img: img3, kicker: "Capsule Wardrobe", title: "Seamless Wardrobe Essentials", text: "Personalized sizing profiles, early-access notifications, and members-only drops delivered directly to you.", pos: "object-top" },
];

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Welcome — FOOT HOUSE" },
      { name: "description", content: "Discover curated collections, engineered footwear and wardrobe essentials at FOOT HOUSE." },
      { property: "og:title", content: "Welcome — FOOT HOUSE" },
      { property: "og:description", content: "Discover curated collections, engineered footwear and wardrobe essentials." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const s = slides[i]!;
  const finish = () => {
    onboarding.markSeen();
    navigate({ to: "/auth" });
  };

  return (
    <section key={i} className="animate-screen relative flex min-h-full flex-1 flex-col justify-between bg-background">
      <div className="relative h-[52dvh] max-h-[460px] min-h-[300px] w-full overflow-hidden bg-surface">
        <img src={s.img} alt={s.title} width={832} height={1024} className={`h-full w-full object-cover ${s.pos}`} />
        <div className="bg-hero-fade absolute inset-0" />
        <button onClick={finish} className="absolute right-6 top-4 text-label-md text-primary-foreground drop-shadow-md hover:opacity-75">
          Skip
        </button>
      </div>
      <div className="flex flex-1 flex-col justify-between gap-4 px-7 pb-8 pt-2">
        <div className="space-y-3 text-center">
          <span className="text-caption font-bold uppercase tracking-[0.2em] text-muted-foreground">{s.kicker}</span>
          <h2 className="text-headline-lg text-foreground">{s.title}</h2>
          <p className="px-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
        </div>
        <Dots count={slides.length} active={i} />
        <div className="flex w-full items-center gap-3">
          {i > 0 && (
            <FhButton variant="outline" size="icon" aria-label="Previous" onClick={() => setI(i - 1)}>
              <Icon name="arrow_back" className="text-[20px]" />
            </FhButton>
          )}
          {i < slides.length - 1 ? (
            <FhButton onClick={() => setI(i + 1)}>
              <span>Next</span>
              <Icon name="arrow_forward" className="text-[18px]" />
            </FhButton>
          ) : (
            <FhButton onClick={finish}>
              <span>Get Started</span>
              <Icon name="east" className="text-[18px]" />
            </FhButton>
          )}
        </div>
      </div>
    </section>
  );
}
