import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchNotifications,
  countUnread,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  applyLocalReadState,
  markReadLocally,
  markAllReadLocally,
  type NotificationRow,
  type RealtimeNotificationEvent,
} from "@/lib/notificationService";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────

export type NotificationFilter = "all" | "unread" | "announcement" | "quiz" | "material";

interface UseNotificationsReturn {
  notifications: NotificationRow[];
  unreadCount: number;
  loading: boolean;
  filter: NotificationFilter;
  setFilter: (f: NotificationFilter) => void;
  /** Fetch next page (appends to list) */
  loadMore: () => Promise<void>;
  hasMore: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const PAGE_SIZE = 15;

// ── Hook ──────────────────────────────────────────────────────────────────

export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  // ── Initial fetch ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    offsetRef.current = 0;
    try {
      const [rows, count] = await Promise.all([
        fetchNotifications(userId, { limit: PAGE_SIZE, offset: 0 }),
        countUnread(userId),
      ]);
      // Merge per-user local read state (fixes shared broadcast is_read)
      const merged = applyLocalReadState(rows);
      const localUnread = merged.filter((n) => !n.is_read).length;
      setNotifications(merged);
      setUnreadCount(localUnread);
      setHasMore(rows.length === PAGE_SIZE);
      offsetRef.current = rows.length;
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Realtime subscription (INSERT + UPDATE + DELETE) ───────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = subscribeToNotifications(userId, (event: RealtimeNotificationEvent) => {
      switch (event.eventType) {
        case "INSERT": {
          const n = event.newRow!;
          setNotifications((prev) => [n, ...prev]);
          setUnreadCount((c) => c + 1);

          // Show toast for new notification
          const typeEmoji: Record<string, string> = {
            material: "📚",
            quiz: "🧠",
            announcement: "📢",
            achievement: "🏆",
            system: "⚙️",
            coding: "💻",
          };
          toast(n.title, {
            description: n.message,
            icon: typeEmoji[n.type] || "🔔",
            duration: 5000,
            action: n.link
              ? { label: "View", onClick: () => { window.location.hash = n.link || ""; } }
              : undefined,
          });
          break;
        }

        case "UPDATE": {
          const updated = event.newRow!;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n)),
          );
          // If the update marks it as read, recount
          if (updated.is_read && event.oldRow && !event.oldRow.is_read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          break;
        }

        case "DELETE": {
          const old = event.oldRow!;
          setNotifications((prev) => prev.filter((n) => n.id !== old.id));
          if (!old.is_read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          break;
        }
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  // ── Load more (pagination) ────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!userId || !hasMore) return;
    const rows = await fetchNotifications(userId, {
      limit: PAGE_SIZE,
      offset: offsetRef.current,
    });
    const merged = applyLocalReadState(rows);
    setNotifications((prev) => [...prev, ...merged]);
    setHasMore(rows.length === PAGE_SIZE);
    offsetRef.current += rows.length;
  }, [userId, hasMore]);

  // ── Mutations ─────────────────────────────────────────────────────────
  const markRead = useCallback(
    async (id: string) => {
      markReadLocally(id);
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    markAllReadLocally(ids);
    await markAllAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [userId, notifications]);

  const remove = useCallback(async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.is_read) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return n.type === filter;
  });

  return {
    notifications: filtered,
    unreadCount,
    loading,
    filter,
    setFilter,
    loadMore,
    hasMore,
    markRead,
    markAllRead,
    remove,
    refetch: fetchAll,
  };
}
