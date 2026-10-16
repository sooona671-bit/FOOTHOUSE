import { createFileRoute, notFound } from "@tanstack/react-router";
import { SubPage, seo } from "@/components/fh/SubPage";
import { INFO_PAGES, type InfoSlug } from "@/lib/info-pages";

export const Route = createFileRoute("/_authenticated/info/$slug")({
  loader: ({ params }) => {
    if (!(params.slug in INFO_PAGES)) throw notFound();
    return { slug: params.slug as InfoSlug };
  },
  head: ({ loaderData }) => {
    const p = loaderData ? INFO_PAGES[loaderData.slug] : null;
    return p ? seo(p.title, p.summary) : { meta: [{ title: "Unavailable — FOOT HOUSE" }, { name: "robots", content: "noindex" }] };
  },
  component: Info,
});

function Info() {
  const { slug } = Route.useLoaderData();
  const p = INFO_PAGES[slug];
  return (
    <SubPage title={p.title}>
      <div className="space-y-6">
        {p.sections.map((s) => (
          <section key={s.h}>
            <h2 className="mb-2 text-label-lg text-foreground">{s.h}</h2>
            {s.body.map((b, i) => <p key={i} className="mb-2 text-sm leading-relaxed text-muted-foreground">{b}</p>)}
            {s.table && (
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {s.table.map((row, i) => (
                    <tr key={i} className={i === 0 ? "font-bold text-foreground" : "border-t border-border text-muted-foreground"}>
                      {row.map((c, j) => <td key={j} className="py-2">{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}
        {p.ownerNote && <p className="rounded-2xl border border-border p-4 text-xs text-muted-foreground"><strong className="text-foreground">Owner to confirm:</strong> {p.ownerNote}</p>}
      </div>
    </SubPage>
  );
}
