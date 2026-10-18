import type { QueryClient } from "@tanstack/react-query";
import { profileQuery } from "./profile";
import { resolveEntry } from "./entry";
import { consumeReturnTo } from "./guest";

export async function routeAfterAuth(queryClient: QueryClient, userId: string) {
  try {
    const p = await queryClient.fetchQuery({ ...profileQuery(userId), staleTime: 0 });
    if (p?.profile_completed) return (consumeReturnTo() ?? "/home") as "/home";
    return resolveEntry({ hasSession: true, profileCompleted: false, onboardingSeen: true });
  } catch {
    return "/profile-setup" as const;
  }
}
