/**
 * NotificationPage.tsx
 *
 * Full-page notifications view at /notifications (or rendered in-app).
 * Features:
 *  - Filter tabs: All | Unread | Announcements | Quizzes | Materials
 *  - Paginated list with "Load more"
 *  - Mark read / delete actions
 *  - Empty + loading states
 *  - Mobile responsive
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
  Trash2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, type NotificationFilter } from "@/hooks/useNotifications";
import type { NotificationRow, NotificationType } from "@/lib/notificationService";
import { timeAgo } from "@/lib/notificationService";

// ── Icon + colour map ─────────────────────────────────────────────────────

const TYPE_META: Record<NotificationType, { icon: typeof Bell; label: string; color: string }> = {
  material:     { icon: BookOpen,  label: "Material",      color: "text-emerald-500 bg-emerald-500/10" },
  quiz:         { icon: Brain,     label: "Quiz",          color: "text-purple-500 bg-purple-500/10" },
  announcement: { icon: Megaphone, label: "Announcement",  color: "text-amber-500 bg-amber-500/10" },
  achievement:  { icon: Trophy,    label: "Achievement",   color: "text-yellow-500 bg-yellow-500/10" },
  system:       { icon: Settings2, label: "System",        color: "text-zinc-500 bg-zinc-500/10" },
  coding:       { icon: Code,      label: "Coding",        color: "text-orange-500 bg-orange-500/10" },
};

const FILTER_TABS: { key: NotificationFilter; label: string }[] = [
  { key: "all",          label: "All" },
  { key: "unread",       label: "Unread" },
  { key: "announcement", label: "Announcements" },
  { key: "quiz",         label: "Quizzes" },
  { key: "material",     label: "Materials" },
];

// ── Item Card ─────────────────────────────────────────────────────────────

interface ItemProps {
  n: NotificationRow;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNav?: (link: string) => void;
}

function FullItem({ n, onRead, onDelete, onNav }: ItemProps) {
  const meta = TYPE_META[n.type] ?? TYPE_META.system;
  const Icon = meta.icon;

  const handleClick = () => {
    if (!n.is_read) onRead(n.id);
    if (n.link) onNav?.(n.link);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer transition-colors border ${
          n.is_read
            ? "border-border/50 hover:border-border"
            : "border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.06]"
        }`}
        onClick={handleClick}
      >
        <CardContent className="p-4 flex items-start gap-4">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm ${n.is_read ? "text-foreground/80" : "font-semibold text-foreground"}`}>
                {n.title}
              </p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/60 text-muted-foreground font-normal">
                {meta.label}
              </Badge>
              {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
            <span className="text-[11px] text-muted-foreground/60 mt-1.5 block">{timeAgo(n.created_at)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!n.is_read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => { e.stopPropagation(); onRead(n.id); }}
                aria-label="Mark read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardContent className="p-4 flex items-start gap-4">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Page Component ────────────────────────────────────────────────────────

interface NotificationPageProps {
  userId: string | undefined;
  onBack?: () => void;
  onNavigate?: (link: string) => void;
}

export default function NotificationPage({ userId, onBack, onNavigate }: NotificationPageProps) {
  const {
    notifications,
    unreadCount,
    loading,
    filter,
    setFilter,
    loadMore,
    hasMore,
    markRead,
    markAllRead,
    remove,
  } = useNotifications(userId);

  const handleRead = useCallback((id: string) => { markRead(id); }, [markRead]);
  const handleDel  = useCallback((id: string) => { remove(id); }, [remove]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto no-scrollbar pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && <PageSkeleton />}

      {!loading && notifications.length === 0 && (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 text-muted-foreground/15 mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {filter === "unread" ? "You're all caught up!" : "Activity and updates will appear here"}
          </p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-2.5">
          <AnimatePresence initial={false}>
            {notifications.map((n) => (
              <FullItem
                key={n.id}
                n={n}
                onRead={handleRead}
                onDelete={handleDel}
                onNav={onNavigate}
              />
            ))}
          </AnimatePresence>

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={loadMore}>
                <Loader2 className="h-3 w-3" /> Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
