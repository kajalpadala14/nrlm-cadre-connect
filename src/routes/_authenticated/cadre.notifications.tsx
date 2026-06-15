import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import { ArrowLeft, Bell, BellOff, Check, CheckCircle2, Clock, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cadre/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data: profile } = useProfile();
  const { t } = useT();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [busy, setBusy] = useState(false);

  // Fetch all notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ["my-notifications-all", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["my-notifications-all"] });
      qc.invalidateQueries({ queryKey: ["my-notifications-raw"] });
      toast.success(t("notif_marked_read"));
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", profile.id)
        .eq("read", false);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["my-notifications-all"] });
      qc.invalidateQueries({ queryKey: ["my-notifications-raw"] });
      toast.success(t("notif_all_marked_read"));
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["my-notifications-all"] });
      qc.invalidateQueries({ queryKey: ["my-notifications-raw"] });
      toast.success(t("notif_deleted"));
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const getNotifStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-50/70 border-emerald-100",
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
        };
      case "error":
        return {
          bg: "bg-rose-50/70 border-rose-100",
          icon: <XCircle className="h-5 w-5 text-rose-600 shrink-0" />,
        };
      case "warning":
        return {
          bg: "bg-amber-50/70 border-amber-100",
          icon: <Clock className="h-5 w-5 text-amber-600 shrink-0" />,
        };
      default:
        return {
          bg: "bg-blue-50/70 border-blue-100",
          icon: <Bell className="h-5 w-5 text-blue-600 shrink-0" />,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Back to Home link */}
      <div className="flex items-center justify-between">
        <Link
          to="/cadre"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back_to_home")}
        </Link>
        {notifications.some((n) => !n.read) && (
          <Button
            onClick={markAllAsRead}
            disabled={busy}
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs font-bold border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100/50 flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            {t("mark_all_read")}
          </Button>
        )}
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6 text-[#0055A4]" />
          {t("notifications_hub")}
        </h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
          View attendance updates, activity approvals, and system announcements
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex bg-slate-100 border border-slate-200/50 rounded-xl p-1 shadow-sm gap-1 text-xs w-max">
        {(["all", "unread", "read"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "rounded-lg px-4 py-2 font-bold transition-all capitalize",
              filter === tab
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50/50"
            )}
          >
            {tab === "all" && `${t("all_tab")} (${notifications.length})`}
            {tab === "unread" && `${t("unread")} (${notifications.filter((n) => !n.read).length})`}
            {tab === "read" && `${t("read_tab")} (${notifications.filter((n) => n.read).length})`}
          </button>
        ))}
      </div>

      {/* Notification Lists */}
      <div className="space-y-3">
        {isLoading && (
          <div className="text-center py-12 text-slate-400 font-bold animate-pulse">
            {t("loading")}
          </div>
        )}

        {!isLoading && filteredNotifications.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-slate-400 font-semibold shadow-sm flex flex-col items-center justify-center gap-2">
            <BellOff className="h-8 w-8 text-slate-300" />
            <span>{t("no_notifications")}</span>
          </div>
        )}

        {!isLoading &&
          filteredNotifications.map((n) => {
            const styles = getNotifStyles(n.type);
            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start justify-between gap-4 p-4 border rounded-2xl shadow-sm transition-all text-xs font-bold leading-normal",
                  styles.bg,
                  n.read ? "opacity-75" : "border-l-4 border-l-blue-500"
                )}
              >
                <div className="flex gap-3">
                  {styles.icon}
                  <div className="space-y-1">
                    <h4 className={cn("font-black text-slate-800", !n.read && "text-blue-950")}>
                      {n.title}
                    </h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{n.message}</p>
                    <span className="inline-block text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 bg-white rounded-lg border border-slate-100 shadow-sm transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
