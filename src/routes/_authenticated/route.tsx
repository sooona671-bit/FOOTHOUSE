import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationsRealtime } from "@/lib/notifications";
import { isPublicPath, setReturnTo } from "@/lib/guest";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user && !isPublicPath(location.pathname)) {
      setReturnTo(location.pathname);
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useNotificationsRealtime();
  return <Outlet />;
}
