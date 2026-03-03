/**
 * notificationService.ts  —  v2
 *
 * Supabase CRUD + Realtime for the `notifications` table.
 *
 * Table schema:
 *   id           uuid  (default gen_random_uuid())
 *   user_id      text  (null = broadcast to all)
 *   title        text
 *   message      text
 *   type         text  ('material' | 'quiz' | 'announcement' | 'achievement' | 'system' | 'coding')
 *   link         text  (nullable — route like /subjects/1)
 *   is_read      boolean (default false)
 *   role_target  text  ('student' | 'admin' | 'all')  — v2
 *   metadata     jsonb (default '{}')                  — v2
 *   created_at   timestamptz (default now())
 */

import { supabase } from "./supabaseClient";

// ── Types ─────────────────────────────────────────────────────────────────

export type NotificationType =
  | "material"
  | "quiz"
  | "announcement"
  | "achievement"
  | "system"
  | "coding";

export type RoleTarget = "student" | "admin" | "all";

export interface NotificationRow {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  role_target: RoleTarget;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Payload for creating a notification (omits server-generated fields) */
export interface CreateNotificationPayload {
  user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  role_target?: RoleTarget;
  metadata?: Record<string, unknown>;
}

// ── Realtime event types ──────────────────────────────────────────────────

export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export interface RealtimeNotificationEvent {
  eventType: RealtimeEventType;
  newRow: NotificationRow | null;
  oldRow: NotificationRow | null;
}

// ── Fetch ─────────────────────────────────────────────────────────────────

/**
 * Fetch notifications for a user.
 * Includes personal (user_id = <userId>) and broadcast (user_id IS NULL).
 */
export async function fetchNotifications(
  userId: string,
  { limit = 15, offset = 0, unreadOnly = false } = {},
): Promise<NotificationRow[]> {
  let query = supabase
    .from("notifications")
    .select("*")
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) {
    console.error("fetchNotifications error:", error);
    return [];
  }
  return (data ?? []) as NotificationRow[];
}

/**
 * Count unread notifications for a user.
 */
export async function countUnread(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq("is_read", false);

  if (error) {
    console.error("countUnread error:", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Fetch all notifications (admin view — no user filter).
 */
export async function fetchAllNotifications(
  { limit = 50, offset = 0 } = {},
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("fetchAllNotifications error:", error);
    return [];
  }
  return (data ?? []) as NotificationRow[];
}

// ── Mutations ─────────────────────────────────────────────────────────────

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) console.error("markAsRead error:", error);
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq("is_read", false);
  if (error) console.error("markAllAsRead error:", error);
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);
  if (error) console.error("deleteNotification error:", error);
}

/**
 * Create a notification (used by admin or system logic).
 * Set user_id = null for broadcast.
 *
 * Gracefully handles the case where the v2 columns (role_target, metadata)
 * don't exist yet — falls back to inserting only the base columns.
 */
export async function createNotification(
  payload: CreateNotificationPayload,
): Promise<NotificationRow | null> {
  // Build the row with all v2 fields
  const row: Record<string, unknown> = {
    user_id: payload.user_id,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    link: payload.link,
    is_read: false,
    role_target: payload.role_target ?? "all",
    metadata: payload.metadata ?? {},
  };

  let result = await supabase
    .from("notifications")
    .insert([row])
    .select()
    .single();

  // If insert fails (likely missing v2 columns), retry with base columns only
  if (result.error) {
    console.warn("createNotification: v2 insert failed, retrying with base columns:", result.error.message);
    const baseRow: Record<string, unknown> = {
      user_id: payload.user_id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link,
      is_read: false,
    };
    result = await supabase
      .from("notifications")
      .insert([baseRow])
      .select()
      .single();
  }

  if (result.error) {
    console.error("createNotification error:", result.error);
    return null;
  }
  return result.data as NotificationRow;
}

// ── High-level helpers ────────────────────────────────────────────────────

/**
 * Broadcast announcement to all users (admin action).
 */
export async function broadcastNotification(
  title: string,
  message: string,
  type: NotificationType = "announcement",
  link?: string,
): Promise<NotificationRow | null> {
  return createNotification({
    user_id: null,
    title,
    message,
    type,
    link: link ?? null,
    role_target: "all",
    metadata: { broadcast: true, sentAt: new Date().toISOString() },
  });
}

/**
 * Send an achievement notification to a specific user.
 */
export async function createAchievementNotification(
  userId: string,
  data: { badge?: string; title: string; description: string; link?: string },
): Promise<NotificationRow | null> {
  return createNotification({
    user_id: userId,
    title: data.title,
    message: data.description,
    type: "achievement",
    link: data.link ?? null,
    role_target: "student",
    metadata: { badge: data.badge ?? "🏆", achievedAt: new Date().toISOString() },
  });
}

/**
 * Send a welcome notification to a new user on signup.
 */
export async function createWelcomeNotification(
  userId: string,
  userName?: string,
): Promise<NotificationRow | null> {
  return createNotification({
    user_id: userId,
    title: `Welcome to StudySpark${userName ? `, ${userName}` : ""}! 🎉`,
    message: "Start exploring subjects, take quizzes, and practice coding to supercharge your BCA journey.",
    type: "system",
    link: null,
    role_target: "student",
    metadata: { welcome: true, onboardedAt: new Date().toISOString() },
  });
}

// ── Realtime ──────────────────────────────────────────────────────────────

/**
 * Subscribe to INSERT / UPDATE / DELETE events on the notifications table.
 * The callback receives a structured event so the hook can handle each type.
 */
export function subscribeToNotifications(
  userId: string,
  onEvent: (event: RealtimeNotificationEvent) => void,
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes" as any,
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload: any) => {
        const row = payload.new as NotificationRow;
        if (row.user_id === userId || row.user_id === null) {
          onEvent({ eventType: "INSERT", newRow: row, oldRow: null });
        }
      },
    )
    .on(
      "postgres_changes" as any,
      { event: "UPDATE", schema: "public", table: "notifications" },
      (payload: any) => {
        const row = payload.new as NotificationRow;
        const old = payload.old as NotificationRow;
        if (row.user_id === userId || row.user_id === null) {
          onEvent({ eventType: "UPDATE", newRow: row, oldRow: old });
        }
      },
    )
    .on(
      "postgres_changes" as any,
      { event: "DELETE", schema: "public", table: "notifications" },
      (payload: any) => {
        const old = payload.old as NotificationRow;
        if (old.user_id === userId || old.user_id === null) {
          onEvent({ eventType: "DELETE", newRow: null, oldRow: old });
        }
      },
    )
    .subscribe();

  return channel;
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Human-readable relative time (simple version) */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Per-user read tracking (localStorage) ─────────────────────────────────
// Broadcast notifications share a single `is_read` DB flag. We track
// per-user read state in localStorage so one user marking "read" doesn't
// affect others.

const READ_KEY = "studyspark_read_notifs";

function getReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function persistReadSet(set: Set<string>): void {
  // keep at most 500 entries to avoid unbounded growth
  const arr = [...set].slice(-500);
  localStorage.setItem(READ_KEY, JSON.stringify(arr));
}

/** Mark a notification as "read" for the current user (local only). */
export function markReadLocally(notificationId: string): void {
  const set = getReadSet();
  set.add(notificationId);
  persistReadSet(set);
}

/** Mark all given IDs as read locally. */
export function markAllReadLocally(ids: string[]): void {
  const set = getReadSet();
  ids.forEach((id) => set.add(id));
  persistReadSet(set);
}

/**
 * Merge local read state into notification rows.
 * Broadcast rows get their `is_read` overridden per-user.
 */
export function applyLocalReadState(rows: NotificationRow[]): NotificationRow[] {
  const set = getReadSet();
  return rows.map((n) => (set.has(n.id) ? { ...n, is_read: true } : n));
}
