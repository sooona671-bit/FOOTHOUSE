import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FhButton } from "@/components/fh/primitives";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  adminNotificationsQuery,
  adminReadCounts,
  deleteNotification,
  expiresAtFor,
  sendNotification,
  stopNotification,
  updateNotification,
  type Notification,
  type NotificationDays,
  type NotificationLink,
} from "@/lib/notifications";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [
    { title: "Notifications | FOOT HOUSE Admin" },
    { name: "description", content: "Send FOOT HOUSE notifications to customers." },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: AdminNotifications,
});

const input = "h-11 w-full rounded-xl bg-surface px-4 text-sm text-foreground outline-none ring-0 placeholder:text-outline focus:bg-background focus:ring-2 focus:ring-ring";
const textarea = "min-h-28 w-full resize-y rounded-xl bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-outline focus:bg-background focus:ring-2 focus:ring-ring";
const links: { value: NotificationLink | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "/search", label: "Search" },
  { value: "/categories", label: "Categories" },
  { value: "/wishlist", label: "Wishlist" },
  { value: "/home", label: "Home" },
  { value: "/bag", label: "Bag" },
];

function daysValue(value: string): NotificationDays {
  return value === "forever" ? null : Number(value) as NotificationDays;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function statusOf(notification: Notification) {
  if (!notification.expires_at) return { label: "Never expires", className: "bg-surface text-muted-foreground" };
  if (new Date(notification.expires_at).getTime() <= Date.now()) return { label: "Expired", className: "bg-destructive/10 text-destructive" };
  return { label: "Active", className: "bg-primary/10 text-primary" };
}

function AdminNotifications() {
  const qc = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery(adminNotificationsQuery);
  const { data: readCounts = {} } = useQuery(adminReadCounts);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState<NotificationLink | "">("");
  const [days, setDays] = useState("7");
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editLink, setEditLink] = useState<NotificationLink | "">("");
  const [editExpiry, setEditExpiry] = useState("keep");

  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["notifications", "admin"] }),
      qc.invalidateQueries({ queryKey: ["notification-read-counts"] }),
    ]);
  };

  const send = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSending(true);
    try {
      await sendNotification({ title, body, link: link || null, days: daysValue(days) });
      setTitle("");
      setBody("");
      setLink("");
      toast.success("Notification sent");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send notification");
    } finally {
      setSending(false);
    }
  };

  const startEdit = (notification: Notification) => {
    setEditing(notification.id);
    setEditTitle(notification.title);
    setEditBody(notification.body);
    setEditLink((notification.link as NotificationLink | null) ?? "");
    setEditExpiry("keep");
  };

  const saveEdit = async (notification: Notification) => {
    if (!editTitle.trim()) {
      toast.error("Title is required");
      return;
    }
    const expiresAt = editExpiry === "keep" ? notification.expires_at : editExpiry === "expire" ? new Date().toISOString() : expiresAtFor(daysValue(editExpiry));
    try {
      await updateNotification(notification.id, { title: editTitle, body: editBody, link: editLink || null, expiresAt });
      setEditing(null);
      toast.success("Notification updated");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update notification");
    }
  };

  const stop = async (id: string) => {
    try {
      await stopNotification(id);
      toast.success("Notification stopped");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't stop notification");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete notification");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send updates to everyone using FOOT HOUSE.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground">Compose notification</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <label className="text-sm font-semibold text-foreground">Title <span className="font-normal text-outline">{title.length}/80</span>
            <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className={`${input} mt-2`} placeholder="New drop is live" />
          </label>
          <label className="text-sm font-semibold text-foreground">Button goes to
            <select value={link} onChange={(e) => setLink(e.target.value as NotificationLink | "")} className={`${input} mt-2`}>{links.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}</select>
          </label>
          <label className="text-sm font-semibold text-foreground lg:col-span-2">Message <span className="font-normal text-outline">{body.length}/300</span>
            <textarea value={body} maxLength={300} onChange={(e) => setBody(e.target.value)} className={`${textarea} mt-2`} placeholder="Tell customers what is new." />
          </label>
          <label className="text-sm font-semibold text-foreground">Keep for
            <select value={days} onChange={(e) => setDays(e.target.value)} className={`${input} mt-2`}>
              <option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="30">30 days</option><option value="forever">Forever</option>
            </select>
          </label>
        </div>
        <div className="mt-5 rounded-xl border border-border bg-surface p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-outline">Customer preview</p>
          <p className="text-sm font-bold text-foreground">{title.trim() || "Notification title"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{body.trim() || "Your message will appear here."}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild><FhButton className="mt-5" disabled={sending || !title.trim()}>{sending ? "Sending…" : "Send to all users"}</FhButton></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Send notification?</AlertDialogTitle><AlertDialogDescription>This will be shown to every user.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={send}>Send notification</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Sent notifications</h2>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading notifications…</p> : !notifications.length ? <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">No notifications sent yet.</p> : notifications.map((notification) => {
          const status = statusOf(notification);
          const isEditing = editing === notification.id;
          const remainingDays = notification.expires_at && new Date(notification.expires_at).getTime() > Date.now() ? Math.ceil((new Date(notification.expires_at).getTime() - Date.now()) / 86_400_000) : null;
          return (
            <article key={notification.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              {isEditing ? (
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-foreground">Title<input value={editTitle} maxLength={80} onChange={(e) => setEditTitle(e.target.value)} className={`${input} mt-2`} /></label>
                  <label className="block text-sm font-semibold text-foreground">Message<textarea value={editBody} maxLength={300} onChange={(e) => setEditBody(e.target.value)} className={`${textarea} mt-2`} /></label>
                  <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-foreground">Button goes to<select value={editLink} onChange={(e) => setEditLink(e.target.value as NotificationLink | "")} className={`${input} mt-2`}>{links.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}</select></label><label className="text-sm font-semibold text-foreground">Expires<select value={editExpiry} onChange={(e) => setEditExpiry(e.target.value)} className={`${input} mt-2`}><option value="keep">Keep as is</option><option value="1">1 day from now</option><option value="3">3 days from now</option><option value="7">7 days from now</option><option value="30">30 days from now</option><option value="forever">Forever</option><option value="expire">Expire now</option></select></label></div>
                  <div className="flex gap-2"><FhButton size="sm" onClick={() => saveEdit(notification)}>Save changes</FhButton><FhButton size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</FhButton></div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-foreground">{notification.title}</h3><p className="mt-1 text-sm text-muted-foreground">{notification.body}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span></div>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-outline"><span>Sent {formatDate(notification.created_at)}</span><span>{remainingDays !== null ? `Expires in ${remainingDays} day${remainingDays === 1 ? "" : "s"}` : notification.expires_at ? `Expired ${formatDate(notification.expires_at)}` : "Never expires"}</span><span>Read by {readCounts[notification.id] ?? 0} users</span></div>
                  <div className="mt-4 flex flex-wrap gap-2"><FhButton size="sm" variant="outline" onClick={() => startEdit(notification)}>Edit</FhButton>{status.label === "Active" && <FhButton size="sm" variant="soft" onClick={() => stop(notification.id)}>Stop now</FhButton>}<AlertDialog><AlertDialogTrigger asChild><FhButton size="sm" variant="ghost">Delete</FhButton></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete notification?</AlertDialogTitle><AlertDialogDescription>This notification will be permanently removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(notification.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
                </>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
