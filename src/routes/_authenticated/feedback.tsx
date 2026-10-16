import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FhButton, Field, Icon } from "@/components/fh/primitives";
import { SubPage, seo } from "@/components/fh/SubPage";

const kinds = { contact: "Contact Us", problem: "Report a Problem", feedback: "Feedback" } as const;

export const Route = createFileRoute("/_authenticated/feedback")({
  validateSearch: z.object({ kind: z.enum(["contact", "problem", "feedback"]).catch("feedback") }),
  head: () => seo("Contact & Feedback", "Send a message or report a problem to the FOOT HOUSE team."),
  component: Feedback,
});

const schema = z.object({
  subject: z.string().trim().min(1, "Please add a subject").max(120),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
});

function Feedback() {
  const { kind } = Route.useSearch();
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; message?: string; form?: string }>({});
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse({ subject, message });
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; }
    if (!user) return;
    setErrors({});
    setState("busy");
    const { error } = await supabase.from("feedback").insert({ ...r.data, kind, user_id: user.id });
    if (error) {
      setState("idle");
      { setErrors({ form: "Couldn't send your message. Please try again." }); return; }
    }
    setState("done");
  };

  return (
    <SubPage title={kinds[kind]}>
      {state === "done" ? (
        <div className="py-12 text-center">
          <Icon name="check_circle" className="text-[48px]" />
          <p className="mt-3 text-label-lg text-foreground">Message received</p>
          <p className="mt-1 text-sm text-muted-foreground">Your message was saved for the FOOT HOUSE team to review in the app.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {kind === "contact"
              ? "A public support email or phone number hasn't been set up yet. Send us a message here and the team will see it."
              : "Tell us what happened or what we could do better."}
          </p>
          <Field placeholder="Subject" aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} {...(errors.subject ? { error: errors.subject } : {})} />
          <div>
            <textarea aria-label="Message" placeholder="Your message" rows={6} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-2xl bg-surface p-4 text-sm text-foreground outline-none placeholder:text-outline focus:ring-2 focus:ring-ring" />
            {errors.message && <p className="mt-1.5 px-1 text-xs text-destructive">{errors.message}</p>}
          </div>
          {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
          <FhButton type="submit" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Send"}</FhButton>
        </form>
      )}
    </SubPage>
  );
}
