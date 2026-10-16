import { createFileRoute, redirect } from "@tanstack/react-router";

// Orders are placed over WhatsApp, so there is no order history page.
export const Route = createFileRoute("/_authenticated/orders")({
  beforeLoad: () => {
    throw redirect({ to: "/home", replace: true });
  },
});
