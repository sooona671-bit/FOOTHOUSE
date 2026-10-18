import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";

export type Notification = Tables<"notifications">;
export type NotificationRead = Tables<"notification_reads">;
export type NotificationLink = "/search" | "/wishlist" | "/home" | "/bag";
export type NotificationDays = 1 | 3 | 7 | 30 | null;

export function normalizeNotificationLink(link: string | null | undefined): NotificationLink | null {
  if (!link) return null;
  if (link === "/categories") return "/home";
  if (link === "/search" || link === "/wishlist" || link === "/home" || link === "/bag") return link;
  return null;
}

const userNotificationsKey = (userId?: string) => ["notifications", "user", userId ?? "anon"] as const;
const readIdsKey = (userId?: string) => ["notification-reads", userId ?? "anon"] as const;

export const userNotificationsQuery = (userId?: string) => queryOptions({
  queryKey: userNotificationsKey(userId),
  enabled: !!userId,
  staleTime: 60_000,
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
  queryFn: async () => {
    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    const now = Date.now();
    return data.filter((item) => !item.expires_at || new Date(item.expires_at).getTime() > now);
  },
});

export const readIdsQuery = (userId?: string) => queryOptions({
  queryKey: readIdsKey(userId),
  enabled: !!userId,
  staleTime: 60_000,
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
  queryFn: async () => {
    const { data, error } = await supabase.from("notification_reads").select("notification_id");
    if (error) throw error;
    return data.map((item) => item.notification_id);
  },
});

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const notificationsQuery = useQuery(userNotificationsQuery(user?.id));
  const readsQuery = useQuery(readIdsQuery(user?.id));
  const notifications = notificationsQuery.data ?? [];
  const readIds = readsQuery.data ?? [];
  const unreadCount = notifications.reduce((count, item) => count + (readIds.includes(item.id) ? 0 : 1), 0);

  const markRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error("Please sign in first.");
      const { error } = await supabase.from("notification_reads").upsert(
        { user_id: user.id, notification_id: notificationId, read_at: new Date().toISOString() },
        { onConflict: "user_id,notification_id" },
      );
      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      const key = readIdsKey(user?.id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key);
      qc.setQueryData<string[]>(key, (old = []) => old.includes(notificationId) ? old : [...old, notificationId]);
      return { previous };
    },
    onError: (error: Error, _notificationId, context) => {
      qc.setQueryData(readIdsKey(user?.id), context?.previous);
      toast.error(error.message || "Couldn't mark notification as read");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: readIdsKey(user?.id) }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please sign in first.");
      const ids = notifications.filter((item) => !readIds.includes(item.id)).map((item) => ({
        user_id: user.id,
        notification_id: item.id,
        read_at: new Date().toISOString(),
      }));
      if (!ids.length) return;
      const { error } = await supabase.from("notification_reads").upsert(ids, { onConflict: "user_id,notification_id" });
      if (error) throw error;
    },
    onMutate: async () => {
      const key = readIdsKey(user?.id);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<string[]>(key);
      qc.setQueryData<string[]>(key, (old = []) => Array.from(new Set([...old, ...notifications.map((item) => item.id)])));
      return { previous };
    },
    onError: (error: Error, _variables, context) => {
      qc.setQueryData(readIdsKey(user?.id), context?.previous);
      toast.error(error.message || "Couldn't mark notifications as read");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: readIdsKey(user?.id) }),
  });

  return {
    notifications,
    readIds,
    unreadCount,
    isLoading: notificationsQuery.isLoading || readsQuery.isLoading,
    error: notificationsQuery.error ?? readsQuery.error,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
    markingAllRead: markAllRead.isPending,
  };
}

export function useNotificationsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel("public-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        void qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}

const expiresAtFor = (days: NotificationDays) => days == null ? null : new Date(Date.now() + days * 86_400_000).toISOString();

export const adminNotificationsQuery = queryOptions({
  queryKey: ["notifications", "admin"],
  queryFn: async () => {
    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const adminReadCounts = queryOptions({
  queryKey: ["notification-read-counts"],
  queryFn: async () => {
    const { data, error } = await supabase.from("notification_reads").select("notification_id");
    if (error) throw error;
    return data.reduce<Record<string, number>>((counts, item) => {
      counts[item.notification_id] = (counts[item.notification_id] ?? 0) + 1;
      return counts;
    }, {});
  },
});

export async function sendNotification(values: { title: string; body: string; link: NotificationLink | null; days: NotificationDays }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Please sign in first.");
  const { data, error } = await supabase.from("notifications").insert({
    title: values.title.trim(),
    body: values.body.trim(),
    link: values.link,
    expires_at: expiresAtFor(values.days),
    created_by: auth.user.id,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateNotification(id: string, values: { title: string; body: string; link: NotificationLink | null; expiresAt: string | null }) {
  const { data, error } = await supabase.from("notifications").update({
    title: values.title.trim(),
    body: values.body.trim(),
    link: values.link,
    expires_at: values.expiresAt,
  }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function stopNotification(id: string) {
  const { error } = await supabase.from("notifications").update({ expires_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) throw error;
}

export { expiresAtFor };
