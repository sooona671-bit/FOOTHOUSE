import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { memberId, profileQuery } from "@/lib/profile";
import { toast } from "sonner";
import { AvatarPicker } from "@/components/fh/AvatarPicker";
import { Icon } from "@/components/fh/primitives";
import { StorePage } from "@/components/fh/StoreLayout";
import { whatsappNumber } from "@/lib/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — FOOT HOUSE" },
      { name: "description", content: "Your FOOT HOUSE account and settings." },
      { property: "og:title", content: "Profile — FOOT HOUSE" },
      { property: "og:description", content: "Your FOOT HOUSE account and settings." },
    ],
  }),
  component: Profile,
});

type MenuItem = {
  icon: string;
  label: string;
  to?: "/profile-setup" | "/addresses" | "/orders" | "/wishlist" | "/bag" | "/notifications" | "/security" | "/info/$slug" | "/feedback";
  slug?: string;
  action?: "install" | "help";
  external?: string;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type MenuSection = { title: string; items: MenuItem[] };

const sections: MenuSection[] = [
  {
    title: "Account",
    items: [
      { icon: "edit", label: "Edit Profile", to: "/profile-setup" },
      { icon: "location_on", label: "My Addresses", to: "/addresses" },
      { icon: "receipt_long", label: "My Orders", to: "/orders" },
      { icon: "favorite", label: "Wishlist", to: "/wishlist" },
      { icon: "shopping_bag", label: "My Bag", to: "/bag" },
    ],
  },
  {
    title: "Preferences & Security",
    items: [
      { icon: "notifications", label: "Notifications", to: "/notifications" },
      { icon: "lock", label: "Privacy & Security", to: "/security" },
      { icon: "install_mobile", label: "Add to Home Screen", action: "install" },
    ],
  },
  {
    title: "Help & Support",
    items: [
      { icon: "chat", label: "Order Help on WhatsApp", action: "help" },
      { icon: "photo_camera", label: "Follow Us on Instagram", external: "https://www.instagram.com/foothouse.np/" },
      { icon: "help", label: "Help Centre & FAQs", to: "/info/$slug", slug: "help" },
      { icon: "local_shipping", label: "Shipping Information", to: "/info/$slug", slug: "shipping" },
      { icon: "sync", label: "Returns & Exchanges", to: "/info/$slug", slug: "returns" },
      { icon: "straighten", label: "Size Guide", to: "/info/$slug", slug: "size-guide" },
      { icon: "feedback", label: "Feedback", to: "/feedback" },
    ],
  },
  {
    title: "About & Legal",
    items: [
      { icon: "info", label: "About FOOT HOUSE", to: "/info/$slug", slug: "about" },
      { icon: "description", label: "Terms & Conditions", to: "/info/$slug", slug: "terms" },
      { icon: "policy", label: "Privacy Policy", to: "/info/$slug", slug: "privacy" },
      { icon: "verified", label: "Licenses & Credits", to: "/info/$slug", slug: "licenses" },
    ],
  },
];

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  const [installGuideOpen, setInstallGuideOpen] = useState(false);
  const [guide, setGuide] = useState<"iphone" | "android">("iphone");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    setGuide(/Android/i.test(userAgent) ? "android" : "iphone");
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const askHelp = () => {
    const number = whatsappNumber();
    if (!number) { toast.error("WhatsApp number is not set yet."); return; }
    const who = [profile?.full_name && `Name: ${profile.full_name}`, user?.email && `Email: ${user.email}`].filter(Boolean).join("\n");
    const text = ["Hello FOOT HOUSE! I need help with my order.", who].filter(Boolean).join("\n\n");
    window.location.href = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  };

  const openMenuItem = (item: MenuItem) => {
    if (item.action === "install") {
      setInstallGuideOpen(true);
    } else if (item.action === "help") {
      askHelp();
    } else if (item.to === "/info/$slug" && item.slug) {
      navigate({ to: item.to, params: { slug: item.slug } });
    } else if (item.to) {
      navigate({ to: item.to });
    }
  };

  const menuRow = (item: MenuItem) => (
    <li key={item.label}>
      {item.external ? (
        <a
          href={item.external}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-4 py-4 text-left"
        >
          <Icon name={item.icon} className="text-[22px]" />
          <span className="flex-1 text-label-md text-foreground">{item.label}</span>
          <Icon name="open_in_new" className="text-outline" />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => openMenuItem(item)}
          className="flex w-full items-center gap-4 py-4 text-left"
        >
          <Icon name={item.icon} className="text-[22px]" />
          <span className="flex-1 text-label-md text-foreground">{item.label}</span>
          <Icon name="chevron_right" className="text-outline" />
        </button>
      )}
    </li>
  );

  return (
    <StorePage header={false}>
      <div className="px-5 pb-6 pt-6 lg:mx-auto lg:w-full lg:max-w-2xl">
        <h1 className="mb-6 text-headline-lg text-foreground">Profile</h1>
        <div className="mb-6 flex items-center gap-4 rounded-3xl bg-surface p-4">
          <AvatarPicker
            userId={user?.id ?? ""}
            initial={(profile?.full_name || user?.email || "?").charAt(0).toUpperCase()}
            className="h-16 w-16"
          />
          <div className="min-w-0">
            <p className="truncate text-label-lg text-foreground">{profile?.full_name || "FOOT HOUSE Member"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            {user && <p className="mt-1 text-caption font-bold uppercase tracking-wider text-foreground">{memberId(user.id)}</p>}
          </div>
        </div>
        <div className="space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-caption font-bold uppercase tracking-[0.18em] text-outline">{section.title}</h2>
              <ul className="divide-y divide-border">{section.items.map(menuRow)}</ul>
            </section>
          ))}
          <section>
            <h2 className="mb-2 text-caption font-bold uppercase tracking-[0.18em] text-outline">Account Action</h2>
            <ul className="divide-y divide-border">
              <li>
                <button onClick={signOut} className="flex w-full items-center gap-4 py-4 text-left text-destructive">
                  <Icon name="logout" className="text-[22px]" />
                  <span className="text-label-md">Log out</span>
                </button>
              </li>
            </ul>
          </section>
        </div>
      </div>
      <Dialog open={installGuideOpen} onOpenChange={setInstallGuideOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border-border bg-background p-5 sm:max-w-lg sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-foreground">Add FOOT HOUSE to your Home Screen</DialogTitle>
            <DialogDescription className="text-center text-sm leading-6 text-muted-foreground">
              Choose your phone to see the installation steps.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-1">
            <button
              type="button"
              onClick={() => setGuide("iphone")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${guide === "iphone" ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              iPhone (Safari)
            </button>
            <button
              type="button"
              onClick={() => setGuide("android")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${guide === "android" ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              Android (Chrome)
            </button>
          </div>
          <div className="space-y-4">
            {guide === "iphone" ? (
              <>
                <p className="text-sm leading-6 text-foreground">
                  Open FOOT HOUSE in Safari, tap the Share icon, choose “Add to Home Screen”, then confirm by tapping “Add”.
                </p>
                <img
                  src="/assets/ios-install-guide.png"
                  alt="iPhone Safari steps for adding FOOT HOUSE to the Home Screen"
                  width={768}
                  height={1152}
                  decoding="async"
                  className="h-auto w-full rounded-xl border border-border object-contain"
                />
              </>
            ) : (
              <>
                <p className="text-sm leading-6 text-foreground">
                  Open FOOT HOUSE in Chrome, tap the three-dot menu, then choose “Add to Home screen” or “Install app”, if available.
                </p>
                <img
                  src="/assets/android-install-guide.png"
                  alt="Android Chrome steps for adding FOOT HOUSE to the Home screen"
                  width={768}
                  height={1152}
                  decoding="async"
                  className="h-auto w-full rounded-xl border border-border object-contain"
                />
              </>
            )}
          </div>
          {installPrompt && (
            <button
              type="button"
              onClick={installApp}
              className="w-full rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Install App
            </button>
          )}
        </DialogContent>
      </Dialog>
    </StorePage>
  );
}
