import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  useRouterState,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { PhoneShell } from "@/components/fh/PhoneShell";
import { Toaster } from "@/components/ui/sonner";
import { fhButton } from "@/components/fh/primitives";

function NotFoundComponent() {
  return (
    <PhoneShell>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <h1 className="text-display text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist or has been moved.</p>
        <Link to="/" className={fhButton({ size: "md", className: "mt-6" })}>
          Go home
        </Link>
      </div>
    </PhoneShell>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <PhoneShell>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <h1 className="text-headline-lg text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or head back home.</p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className={fhButton({ size: "md" })}
          >
            Try again
          </button>
          <a href="/" className={fhButton({ size: "md", variant: "outline" })}>
            Go home
          </a>
        </div>
      </div>
    </PhoneShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#ffffff" },
      { title: "FOOT HOUSE — Premium Footwear" },
      { name: "description", content: "FOOT HOUSE — premium footwear and fashion essentials." },
      { property: "og:title", content: "FOOT HOUSE — Premium Footwear" },
      { property: "og:description", content: "FOOT HOUSE — premium footwear and fashion essentials." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // The admin dashboard is a full-width desktop layout, not the phone frame.
  const isAdmin = useRouterState({ select: (s) => s.location.pathname.startsWith("/admin") });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isAdmin ? <Outlet /> : (
          <PhoneShell>
            <Outlet />
          </PhoneShell>
        )}
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
