/**
 * NotificationManager – Admin panel for creating, broadcasting, and managing notifications.
 *
 * Features:
 *  - Broadcast announcements to all users
 *  - Choose notification type, role target, optional link
 *  - Preview before sending
 *  - View recent notifications with delete
 *  - Live count of sent notifications
 */
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  BookOpen,
  Brain,
  Code,
  Trophy,
  Megaphone,
  Settings2,
  Send,
  Eye,
  Trash2,
  Plus,
  Users,
  Shield,
  Globe,
  Loader2,
  CheckCheck,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  createNotification,
  fetchAllNotifications,
  deleteNotification,
  type NotificationRow,
  type NotificationType,
  type RoleTarget,
} from "@/lib/notificationService";
import { timeAgo } from "@/lib/notificationService";

// ── Props ─────────────────────────────────────────────────────────────────

interface NotificationManagerProps {
  refreshKey: number;
}

// ── Metadata maps ─────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: NotificationType; label: string; icon: typeof Bell; color: string }[] = [
  { value: "announcement", label: "Announcement", icon: Megaphone, color: "text-amber-500 bg-amber-500/10" },
  { value: "material",     label: "Material",     icon: BookOpen,  color: "text-emerald-500 bg-emerald-500/10" },
  { value: "quiz",         label: "Quiz",         icon: Brain,     color: "text-purple-500 bg-purple-500/10" },
  { value: "coding",       label: "Coding",       icon: Code,      color: "text-orange-500 bg-orange-500/10" },
  { value: "achievement",  label: "Achievement",  icon: Trophy,    color: "text-yellow-500 bg-yellow-500/10" },
  { value: "system",       label: "System",       icon: Settings2, color: "text-zinc-500 bg-zinc-500/10" },
];

const ROLE_OPTIONS: { value: RoleTarget; label: string; icon: typeof Globe; desc: string }[] = [
  { value: "all",     label: "Everyone",      icon: Globe,  desc: "All students & admins" },
  { value: "student", label: "Students Only",  icon: Users,  desc: "Only student accounts" },
  { value: "admin",   label: "Admins Only",    icon: Shield, desc: "Only admin accounts" },
];

const TYPE_ICON_MAP: Record<NotificationType, typeof Bell> = {
  material: BookOpen,
  quiz: Brain,
  announcement: Megaphone,
  achievement: Trophy,
  system: Settings2,
  coding: Code,
};

const TYPE_COLOR_MAP: Record<NotificationType, string> = {
  material: "text-emerald-500 bg-emerald-500/10",
  quiz: "text-purple-500 bg-purple-500/10",
  announcement: "text-amber-500 bg-amber-500/10",
  achievement: "text-yellow-500 bg-yellow-500/10",
  system: "text-zinc-500 bg-zinc-500/10",
  coding: "text-orange-500 bg-orange-500/10",
};

// ── Component ─────────────────────────────────────────────────────────────

export default function NotificationManager({ refreshKey }: NotificationManagerProps) {
  // ── Form state ────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("announcement");
  const [roleTarget, setRoleTarget] = useState<RoleTarget>("all");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<NotificationRow | null>(null);

  // ── Fetch recent notifications ────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    setLoadingList(true);
    try {
      const rows = await fetchAllNotifications({ limit: 50 });
      setNotifications(rows);
    } catch {
      // silent
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications, refreshKey]);

  // ── Computed ──────────────────────────────────────────────────────────
  const totalCount = notifications.length;
  const broadcastCount = notifications.filter((n) => n.user_id === null).length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q) ||
      n.type.includes(q)
    );
  });

  const canSend = title.trim().length >= 3 && message.trim().length >= 5;

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const result = await createNotification({
        user_id: null,
        title: title.trim(),
        message: message.trim(),
        type,
        link: link.trim() || null,
        role_target: roleTarget,
        metadata: { broadcast: true, sentAt: new Date().toISOString() },
      });
      if (result) {
        toast.success("Notification sent!", { description: `Broadcast "${title}" to ${roleTarget === "all" ? "everyone" : roleTarget + "s"}.` });
        // Reset form
        setTitle("");
        setMessage("");
        setType("announcement");
        setRoleTarget("all");
        setLink("");
        setPreviewOpen(false);
        // Refresh list
        loadNotifications();
      } else {
        toast.error("Failed to send notification");
      }
    } catch {
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNotification(deleteTarget.id);
      setNotifications((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  const TypeIcon = TYPE_ICON_MAP[type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Notification Manager</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and broadcast notifications to your users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 px-3 py-1">
            <Bell className="h-3.5 w-3.5" /> {totalCount} total
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1">
            <Megaphone className="h-3.5 w-3.5" /> {broadcastCount} broadcasts
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Left: Composer (3 cols) ──────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Create Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="notif-title" className="text-xs font-medium">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="notif-title"
                  placeholder="e.g. New Study Materials Available"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
                <p className="text-[11px] text-muted-foreground">{title.length}/120</p>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="notif-message" className="text-xs font-medium">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="notif-message"
                  placeholder="Describe the notification..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                <p className="text-[11px] text-muted-foreground">{message.length}/500</p>
              </div>

              {/* Type + Target row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <t.icon className={`h-3.5 w-3.5 ${t.color.split(" ")[0]}`} />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Role target */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Audience</Label>
                  <Select value={roleTarget} onValueChange={(v) => setRoleTarget(v as RoleTarget)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          <div className="flex items-center gap-2">
                            <r.icon className="h-3.5 w-3.5 text-muted-foreground" />
                            {r.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Link (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="notif-link" className="text-xs font-medium">
                  Link <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="notif-link"
                  placeholder="e.g. /subjects or /coding"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={!canSend}
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={!canSend || sending}
                  onClick={handleSend}
                >
                  {sending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {sending ? "Sending…" : "Send Notification"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Stats + Quick send (2 cols) ─────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <Bell className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                <p className="text-[11px] text-muted-foreground">Total Sent</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <Badge variant="secondary" className="mx-auto mb-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                  {unreadCount}
                </Badge>
                <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
                <p className="text-[11px] text-muted-foreground">Unread</p>
              </CardContent>
            </Card>
          </div>

          {/* Preview card */}
          {title.trim() && (
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-4">
                <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-2">Live Preview</p>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLOR_MAP[type]}`}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{title || "Notification Title"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{message || "Notification message..."}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5">{type}</Badge>
                      <span className="text-[10px] text-muted-foreground/60">Just now</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── Recent Notifications ───────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Notifications</CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingList && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-72" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingList && filteredNotifications.length === 0 && (
            <div className="text-center py-10">
              <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? "No matching notifications" : "No notifications yet"}
              </p>
            </div>
          )}

          {!loadingList && filteredNotifications.length > 0 && (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredNotifications.map((n) => {
                const Icon = TYPE_ICON_MAP[n.type] ?? Bell;
                const color = TYPE_COLOR_MAP[n.type] ?? "text-zinc-500 bg-zinc-500/10";
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5">{n.type}</Badge>
                        {n.user_id === null && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-0.5">
                            <Globe className="h-2.5 w-2.5" /> broadcast
                          </Badge>
                        )}
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">{timeAgo(n.created_at)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(n)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Preview Dialog ─────────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preview Notification</DialogTitle>
            <DialogDescription>
              This is how the notification will appear to users.
            </DialogDescription>
          </DialogHeader>

          <div className="border border-border/60 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLOR_MAP[type]}`}>
                <TypeIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] h-5 px-2">{type}</Badge>
                  <Badge variant="secondary" className="text-[10px] h-5 px-2 gap-1">
                    {ROLE_OPTIONS.find((r) => r.value === roleTarget)?.icon &&
                      (() => {
                        const RIcon = ROLE_OPTIONS.find((r) => r.value === roleTarget)!.icon;
                        return <RIcon className="h-3 w-3" />;
                      })()}
                    {ROLE_OPTIONS.find((r) => r.value === roleTarget)?.label}
                  </Badge>
                  {link && (
                    <Badge variant="outline" className="text-[10px] h-5 px-2 text-primary">{link}</Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground/60 mt-2 block">Just now</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Edit
            </Button>
            <Button className="gap-1.5" disabled={sending} onClick={handleSend}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {sending ? "Sending…" : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
