/**
 * NotificationDropdown.tsx
 *
 * Dropdown panel shown when the bell icon is clicked in the navbar.
 * Contains:
 *  - Header with "Mark all read"
 *  - Scrollable list of NotificationItem cards
 *  - Empty state
 *  - Footer link to full notifications page
 */

import { useCallback } from "react";
import {
  Bell,
  BookOpen,
  Brain,
  Code,
  Trophy,
  Megaphone,
  Settings2,
  CheckCheck,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import type { NotificationRow, NotificationType } from "@/lib/notificationService";
import { timeAgo } from "@/lib/notificationService";

// ── Icon + colour map ─────────────────────────────────────────────────────

const TYPE_META: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  material:     { icon: BookOpen,  color: "text-emerald-500 bg-emerald-500/10" },
  quiz:         { icon: Brain,     color: "text-purple-500 bg-purple-500/10" },
  announcement: { icon: Megaphone, color: "text-amber-500 bg-amber-500/10" },
  achievement:  { icon: Trophy,    color: "text-yellow-500 bg-yellow-500/10" },
  system:       { icon: Settings2, color: "text-zinc-500 bg-zinc-500/10" },
  coding:       { icon: Code,      color: "text-orange-500 bg-orange-500/10" },
};

// ── NotificationItem ──────────────────────────────────────────────────────

interface ItemProps {
  notification: NotificationRow;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (link: string) => void;
}

function NotificationItem({ notification: n, onRead, onDelete, onNavigate }: ItemProps) {
  const meta = TYPE_META[n.type] ?? TYPE_META.system;
  const Icon = meta.icon;

  const handleClick = () => {
    if (!n.is_read) onRead(n.id);
    if (n.link) onNavigate?.(n.link);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        n.is_read
          ? "hover:bg-muted/50"
          : "bg-primary/[0.04] hover:bg-primary/[0.08] dark:bg-primary/[0.06] dark:hover:bg-primary/[0.1]"
      }`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug truncate ${n.is_read ? "text-foreground/80" : "font-semibold text-foreground"}`}>
          {n.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
        <span className="text-[11px] text-muted-foreground/60 mt-1 block">{timeAgo(n.created_at)}</span>
      </div>

      {/* Unread dot / delete */}
      <div className="flex items-center gap-1 shrink-0 pt-1">
        {!n.is_read && (
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-opacity"
          aria-label="Delete"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function ItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-52" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

// ── Dropdown ──────────────────────────────────────────────────────────────

interface DropdownProps {
  notifications: NotificationRow[];
  unreadCount: number;
  loading: boolean;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNavigate?: (link: string) => void;
  onViewAll?: () => void;
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onNavigate,
  onViewAll,
}: DropdownProps) {
  const handleRead = useCallback((id: string) => { onMarkRead(id); }, [onMarkRead]);
  const handleDel  = useCallback((id: string) => { onDelete(id); }, [onDelete]);

  return (
    <div className="w-[360px] max-w-[calc(100vw-2rem)] bg-card border border-border/60 rounded-xl shadow-xl shadow-black/8 dark:shadow-black/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
        {unreadCount > 0 && (
          <button
            onClick={() => onMarkAllRead()}
            className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <CheckCheck className="h-3 w-3" /> Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="max-h-[340px] overflow-y-auto overscroll-contain">
        {loading && (
          <div className="p-1 space-y-0.5">
            {[...Array(4)].map((_, i) => <ItemSkeleton key={i} />)}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="py-10 px-4 text-center">
            <Bell className="h-9 w-9 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">You're all caught up!</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">No new notifications right now</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="p-1 space-y-0.5">
            <AnimatePresence initial={false}>
              {notifications.slice(0, 10).map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleRead}
                  onDelete={handleDel}
                  onNavigate={onNavigate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-border/50">
          <button
            onClick={onViewAll}
            className="flex items-center justify-center gap-1 w-full py-2.5 text-xs text-primary hover:bg-muted/50 font-medium transition-colors"
          >
            View all notifications <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
