import type { ReactNode } from "react";
import { ScreenHeader } from "./primitives";
import { BottomNav } from "./StoreLayout";

/** Inner page with back header + bottom nav, used by Profile sub-pages. */
export function SubPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="animate-screen flex min-h-full flex-1 flex-col bg-background">
      <div className="sticky top-0 z-30 border-b border-border bg-background/80 px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-md">
        <div className="lg:mx-auto lg:w-full lg:max-w-2xl">
          <ScreenHeader title={title} />
        </div>
      </div>
      <main className="flex-1 px-5 pb-8 pt-5 lg:mx-auto lg:w-full lg:max-w-2xl">{children}</main>
      <BottomNav />
    </div>
  );
}

export function seo(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — FOOT HOUSE` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — FOOT HOUSE` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
