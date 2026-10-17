import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon, StorePage } from "@/components/fh/StoreLayout";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — FOOT HOUSE" },
      { name: "description", content: "Drop alerts and order updates will appear here." },
      { property: "og:title", content: "Notifications — FOOT HOUSE" },
      { property: "og:description", content: "Drop alerts and order updates will appear here." },
    ],
  }),
  component: () => (
    <StorePage>
      <div className="lg:mx-auto lg:w-full lg:max-w-2xl">
        <ComingSoon icon="notifications" title="Notifications" text="You have no notifications yet. Drop alerts and order updates will appear here." />
      </div>
    </StorePage>
  ),
});
