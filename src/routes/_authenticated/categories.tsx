import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/categories")({
  beforeLoad: () => {
    throw redirect({ to: "/home", replace: true });
  },
});
