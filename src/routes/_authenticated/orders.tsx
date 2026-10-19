import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/fh/primitives";
import { SubPage, seo } from "@/components/fh/SubPage";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => seo("My Orders", "Your FOOT HOUSE order history."),
  component: Orders,
});

function Orders() {
  return (
    <SubPage title="My Orders">
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <Icon name="receipt_long" className="text-[48px] text-outline" />
        <h2 className="mt-4 text-headline-sm text-foreground">No saved orders yet</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Orders are currently completed over WhatsApp, so they are not recorded in this account history.
        </p>
      </div>
    </SubPage>
  );
}
