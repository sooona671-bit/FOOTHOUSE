import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AvatarPicker } from "@/components/fh/AvatarPicker";
import { useAuth } from "@/hooks/use-auth";
import { profileQuery, saveProfile } from "@/lib/profile";
import { FhButton, Field, Screen, ScreenHeader } from "@/components/fh/primitives";

export const Route = createFileRoute("/_authenticated/profile-setup")({
  head: () => ({
    meta: [
      { title: "Fill your profile — FOOT HOUSE" },
      { name: "description", content: "Tell us a little about you to personalise your FOOT HOUSE experience." },
      { property: "og:title", content: "Fill your profile — FOOT HOUSE" },
      { property: "og:description", content: "Personalise your FOOT HOUSE experience." },
    ],
  }),
  component: ProfileSetup,
});

function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  const [form, setForm] = useState({ full_name: "", nickname: "", date_of_birth: "", phone: "", gender: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? (user?.user_metadata?.["full_name"] as string) ?? "",
      nickname: profile.nickname ?? "",
      date_of_birth: profile.date_of_birth ?? "",
      phone: profile.phone ?? "",
      gender: profile.gender ?? "",
    });
  }, [profile, user]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const finish = async (values: Partial<typeof form>) => {
    if (!user) return;
    setBusy(true);
    try {
      await saveProfile(user.id, {
        email: user.email ?? null,
        ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === "" ? null : v])),
        profile_completed: true,
      });
      await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      navigate({ to: profile?.profile_completed ? "/profile" : "/welcome", replace: true });
    } catch {
      toast.error("Couldn't save your profile. Please try again.");
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error("Please enter your full name."); return; }
    finish(form);
  };

  return (
    <Screen className="justify-between bg-background px-7 py-3 lg:mx-auto lg:w-full lg:max-w-2xl">
      <ScreenHeader
        title="Fill Your Profile"
        onBack={() => navigate({ to: profile?.profile_completed ? "/profile" : "/" })}
        right={
          <button disabled={busy} onClick={() => finish({})} className="text-label-md text-muted-foreground hover:text-foreground">
            Skip
          </button>
        }
      />
      <div className="mb-3 mt-2 flex justify-center">
        <AvatarPicker
          userId={user?.id ?? ""}
          initial={(profile?.full_name || user?.email || "?").charAt(0).toUpperCase()}
          className="h-24 w-24"
        />
      </div>
      <form id="profile-form" onSubmit={submit} className="my-auto space-y-3.5">
        <Field placeholder="Full Name" required autoComplete="name" value={form.full_name} onChange={set("full_name")} className="font-semibold" />
        <Field placeholder="Nickname" autoComplete="nickname" value={form.nickname} onChange={set("nickname")} />
        <Field type="date" aria-label="Date of Birth" placeholder="Date of Birth" value={form.date_of_birth} onChange={set("date_of_birth")} max={new Date().toISOString().slice(0, 10)} />
        <Field type="email" value={user?.email ?? ""} readOnly icon="mail" aria-label="Email" className="text-muted-foreground" />
        <Field type="tel" icon="call" placeholder="Phone Number" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        <div className="flex h-14 w-full items-center rounded-2xl bg-surface px-4 focus-within:ring-2 focus-within:ring-ring">
          <select aria-label="Gender" value={form.gender} onChange={set("gender")} className="w-full bg-transparent text-sm text-foreground outline-none">
            <option value="">Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
          </select>
        </div>
      </form>
      <div className="pb-4 pt-4">
        <FhButton type="submit" form="profile-form" disabled={busy}>{busy ? "Saving…" : "Continue"}</FhButton>
      </div>
    </Screen>
  );
}
