import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FhButton, Field, Icon } from "@/components/fh/primitives";
import { SubPage, seo } from "@/components/fh/SubPage";

export const Route = createFileRoute("/_authenticated/addresses")({
  head: () => seo("Addresses", "Manage your saved delivery addresses."),
  component: Addresses,
});

const schema = z.object({
  label: z.string().trim().min(1, "Required").max(30),
  full_name: z.string().trim().min(1, "Required").max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid phone number"),
  line1: z.string().trim().min(1, "Required").max(200),
  line2: z.string().trim().max(200),
  city: z.string().trim().min(1, "Required").max(80),
  district: z.string().trim().max(80),
});
type Form = z.infer<typeof schema>;
const empty: Form = { label: "Home", full_name: "", phone: "", line1: "", line2: "", city: "", district: "" };

function Addresses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["addresses", user?.id];
  const { data, isLoading, error } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const open = (id: string | "new") => {
    const a = data?.find((x) => x.id === id);
    setForm(a ? { label: a.label, full_name: a.full_name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, district: a.district } : empty);
    setErrors({});
    setEditing(id);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    if (!user) return;
    setBusy(true);
    const { error } = editing === "new"
      ? await supabase.from("addresses").insert({ ...r.data, user_id: user.id, is_default: !data?.length })
      : await supabase.from("addresses").update(r.data).eq("id", editing!);
    setBusy(false);
    if (error) { toast.error("Couldn't save address"); return; }
    toast.success("Address saved");
    setEditing(null);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete address"); return; }
    refresh();
  };

  const makeDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    if (error) { toast.error("Couldn't update default"); return; }
    refresh();
  };

  if (editing) {
    const f = (k: keyof Form, placeholder: string, icon?: string) => (
      <Field {...(icon ? { icon } : {})} {...(errors[k] ? { error: errors[k] } : {})} placeholder={placeholder} value={form[k]} aria-label={placeholder}
        onChange={(e) => setForm((s) => ({ ...s, [k]: e.target.value }))} />
    );
    return (
      <SubPage title={editing === "new" ? "New Address" : "Edit Address"}>
        <form onSubmit={save} className="space-y-3">
          {f("label", "Label (Home, Work…)", "sell")}
          {f("full_name", "Full name", "person")}
          {f("phone", "Phone", "call")}
          {f("line1", "Street / area", "home")}
          {f("line2", "Landmark (optional)")}
          {f("city", "City", "location_city")}
          {f("district", "District (optional)")}
          <div className="flex gap-3 pt-2">
            <FhButton type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</FhButton>
            <FhButton type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</FhButton>
          </div>
        </form>
      </SubPage>
    );
  }

  return (
    <SubPage title="Addresses">
      {isLoading && <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="py-10 text-center text-sm text-destructive">Couldn't load addresses.</p>}
      {data && data.length === 0 && (
        <div className="py-12 text-center">
          <Icon name="location_on" className="text-[44px]" />
          <p className="mt-3 text-label-lg text-foreground">No saved addresses</p>
          <p className="mt-1 text-sm text-muted-foreground">Your default address is sent with your WhatsApp order so we know where to deliver.</p>
        </div>
      )}
      <ul className="space-y-3">
        {data?.map((a) => (
          <li key={a.id} className="rounded-3xl bg-surface p-4">
            <div className="flex items-center gap-2">
              <span className="text-label-lg text-foreground">{a.label}</span>
              {a.is_default && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">Default</span>}
            </div>
            <p className="mt-1 text-sm text-foreground">{a.full_name} · {a.phone}</p>
            <p className="text-sm text-muted-foreground">{[a.line1, a.line2, a.city, a.district].filter(Boolean).join(", ")}</p>
            <div className="mt-3 flex gap-4 text-label-md">
              <button onClick={() => open(a.id)} className="text-foreground underline">Edit</button>
              {!a.is_default && <button onClick={() => makeDefault(a.id)} className="text-foreground underline">Set default</button>}
              <button onClick={() => remove(a.id)} className="text-destructive underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
      <FhButton className="mt-6" onClick={() => open("new")}><Icon name="add" /> Add address</FhButton>
    </SubPage>
  );
}
