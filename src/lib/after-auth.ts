import type { QueryClient } from "@tanstack/react-query";
import { profileQuery } from "./profile";
import { resolveEntry } from "./entry";

export async function routeAfterAuth(queryClient: QueryClient, userId: string) {
  try {
    const p = await queryClient.fetchQuery({ ...profileQuery(userId), staleTime: 0 });
    return resolveEntry({ hasSession: true, profileCompleted: !!p?.profile_completed, onboardingSeen: true });
  } catch {
    return "/profile-setup" as const;
  }
}
