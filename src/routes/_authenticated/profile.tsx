import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { memberId, profileQuery } from "@/lib/profile";
import { toast } from "sonner";
import { Icon } from "@/components/fh/primitives";
import { StorePage } from "@/components/fh/StoreLayout";
import { whatsappNumber } from "@/lib/whatsapp";

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

type MenuItem = { icon: string; label: string; to?: "/profile-setup" | "/addresses" | "/wishlist" | "/bag" | "/notifications" | "/security"; help?: true };

const items: MenuItem[] = [
  { icon: "edit", label: "Edit Profile", to: "/profile-setup" },
  { icon: "location_on", label: "Addresses", to: "/addresses" },
  { icon: "favorite", label: "Wishlist", to: "/wishlist" },
  { icon: "shopping_bag", label: "My Bag", to: "/bag" },
  { icon: "notifications", label: "Notifications", to: "/notifications" },
  { icon: "lock", label: "Privacy & Security", to: "/security" },
  { icon: "chat", label: "Order Help on WhatsApp", help: true },
];

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });

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

  return (
    <StorePage header={false}>
      <div className="px-5 pb-6 pt-6">
        <h1 className="mb-6 text-headline-lg text-foreground">Profile</h1>
        <div className="mb-6 flex items-center gap-4 rounded-3xl bg-surface p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {(profile?.full_name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-label-lg text-foreground">{profile?.full_name || "FOOT HOUSE Member"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            {user && <p className="mt-1 text-caption font-bold uppercase tracking-wider text-foreground">{memberId(user.id)}</p>}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.label}>
              <button
                onClick={() => (it.to ? navigate({ to: it.to }) : askHelp())}
                className="flex w-full items-center gap-4 py-4 text-left disabled:opacity-60"
              >
                <Icon name={it.icon} className="text-[22px]" />
                <span className="flex-1 text-label-md text-foreground">{it.label}</span>
                <Icon name="chevron_right" className="text-outline" />
              </button>
            </li>
          ))}
          <li>
            <button onClick={signOut} className="flex w-full items-center gap-4 py-4 text-left text-destructive">
              <Icon name="logout" className="text-[22px]" />
              <span className="text-label-md">Log out</span>
            </button>
          </li>
        </ul>
      </div>
    </StorePage>
  );
}
