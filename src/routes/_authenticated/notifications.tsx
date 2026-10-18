import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FhButton, Icon } from "@/components/fh/primitives";
import { StorePage } from "@/components/fh/StoreLayout";
import { useNotifications, type NotificationLink } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — FOOT HOUSE" },
      { name: "description", content: "Drop alerts and order updates will appear here." },
      { property: "og:title", content: "Notifications — FOOT HOUSE" },
      { property: "og:description", content: "Drop alerts and order updates will appear here." },
    ],
  }),
component: Notifications,
});

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString();
}

function Notifications() {
  const navigate = useNavigate();
  const { notifications, readIds, unreadCount, isLoading, error, markRead, markAllRead, markingAllRead } = useNotifications();

  const openNotification = (id: string, link: string | null) => {
    markRead(id);
    if (link) navigate({ to: link as NotificationLink });
  };

  return (
    <StorePage>
      <div className="px-5 pb-8 pt-5 lg:mx-auto lg:w-full lg:max-w-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h1 className="text-headline-lg text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <FhButton size="sm" variant="ghost" onClick={markAllRead} disabled={markingAllRead}>
              {markingAllRead ? "Marking…" : "Mark all as read"}
            </FhButton>
          )}
        </div>
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Loading notifications…</p>
        ) : error ? (
          <p className="py-16 text-center text-sm text-destructive">Couldn’t load notifications. Please try again.</p>
        ) : !notifications.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-surface text-outline"><Icon name="notifications_none" className="text-[38px]" /></div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const unread = !readIds.includes(notification.id);
              const remainingDays = notification.expires_at ? Math.max(0, Math.ceil((new Date(notification.expires_at).getTime() - Date.now()) / 86_400_000)) : null;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification.id, notification.link)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:bg-surface"
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${unread ? "bg-primary" : "bg-transparent"}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-bold text-foreground">{notification.title}</span>
                      <span className="shrink-0 text-xs text-outline">{relativeTime(notification.created_at)}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">{notification.body}</span>
                    {remainingDays !== null && <span className="mt-2 block text-xs text-outline">Ends in {remainingDays} day{remainingDays === 1 ? "" : "s"}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </StorePage>
  );
}
