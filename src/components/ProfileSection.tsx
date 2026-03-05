import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Edit3,
  Trophy,
  Target,
  Calendar,
  BookOpen,
  Brain,
  Clock,
  TrendingUp,
  Camera,
  Save,
  ArrowLeft,
  Flame,
  Activity,
  Zap,
  GraduationCap,
  Mail,
  LogOut,
  Shield,
  Bell,
  Palette,
  Trash2,
  Settings,
  ChevronRight,
  X,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { motion, useInView } from "framer-motion";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import type { SubjectProgressItem as SubjectProgressType } from "@/hooks/useProfile";
import { upsertProfile } from "@/lib/profileService";

/* ── Animation Variants ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

/* ── Animated Counter ───────────────────────────────────────────────────── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const dur = 700;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ── Section Wrapper (scroll-triggered) ─────────────────────────────────── */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ── Progress Ring SVG ──────────────────────────────────────────────────── */
function ProgressRing({ value, size = 88, strokeWidth = 6 }: { value: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeWidth} className="stroke-muted" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-primary"
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - value / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">
        <AnimatedNumber value={value} suffix="%" />
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  PROFILE SECTION                                                         */
/* ══════════════════════════════════════════════════════════════════════════ */

interface ProfileSectionProps {
  user: { name: string; email: string; semester: string; college: string };
  isAdmin?: boolean;
  onBackToDesktop: () => void;
  onUpdateProfile?: (userData: any) => void;
}

const ProfileSection = ({ user, isAdmin = false, onBackToDesktop, onUpdateProfile }: ProfileSectionProps) => {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const userId = clerkUser?.id;
  const { stats, subjects, activity, achievements, loading, refetch } = useProfile(userId);

  /* ── Edit States ── */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    semester: user.semester,
    college: user.college,
    learning_goal: "",
  });
  const [saving, setSaving] = useState(false);
  const [semFilter, setSemFilter] = useState<number | "all">("all");

  /* ── Notification prefs (local) ── */
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);

  const joinDate = clerkUser?.createdAt
    ? new Date(clerkUser.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "—";

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ── Save profile ── */
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      // 1. Save to Supabase
      await upsertProfile(userId, {
        name: editForm.name,
        semester: parseInt(editForm.semester) || 5,
        college: editForm.college,
        learning_goal: editForm.learning_goal,
      });

      // 2. Sync name to Clerk so it persists across sessions
      if (clerkUser) {
        const nameParts = editForm.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";
        try {
          await clerkUser.update({ firstName, lastName });
        } catch (e) {
          console.warn("Could not sync name to Clerk:", e);
        }
      }

      // 3. Update parent state so UI reflects changes immediately
      if (onUpdateProfile) onUpdateProfile(editForm);
      toast.success("Profile updated");
      setEditOpen(false);
      refetch();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  /* ── Filtered subjects ── */
  const filteredSubjects =
    semFilter === "all" ? subjects : subjects.filter((s) => s.semester === semFilter);

  const semesters = Array.from(new Set(subjects.map((s) => s.semester))).sort();

  const statusColor = (s: SubjectProgressType) => {
    if (s.status === "Completed")
      return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (s.status === "In Progress")
      return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    return "text-zinc-500 bg-zinc-50 dark:text-zinc-400 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700";
  };

  const activityIcon = (type: string) => {
    if (type === "quiz_completed") return Brain;
    if (type === "session_completed") return BookOpen;
    if (type === "achievement_earned") return Trophy;
    if (type === "coding_submission") return Zap;
    return Activity;
  };

  /* ════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* ── Back button ── */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBackToDesktop} className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* ━━ 1. PROFILE HEADER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section>
        <motion.div
          variants={fadeUp}
          className="glass-card p-6 md:p-8"
        >
          {/* Gradient accent strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl" />
          {/* Subtle glow */}
          <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0 self-center md:self-auto">
              <Avatar className="w-24 h-24 border-[3px] border-primary/20 shadow-sm transition-transform duration-200 group-hover:scale-105">
                <AvatarImage src={clerkUser?.imageUrl ?? ""} alt={user.name} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => clerkUser?.setProfileImage && toast.info("Use Clerk dashboard to change avatar")}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-1.5">
              <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-none"><Mail className="h-3.5 w-3.5 shrink-0" />{user.email}</span>
                <span className="hidden md:inline text-border">·</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />BCA · Sem {user.semester}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1.5">
                {stats.currentStreak > 0 && (
                  <Badge variant="outline" className="gap-1 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 text-xs">
                    <Flame className="h-3 w-3" /> {stats.currentStreak}-day streak
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs gap-1 border-border/60">
                  <Calendar className="h-3 w-3" /> Joined {joinDate}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0">
              <button onClick={() => setEditOpen(true)} className="btn-gradient h-9 px-3.5 text-xs gap-1.5 inline-flex items-center">
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </button>
              <Button size="sm" variant="outline" onClick={() => setSettingsOpen(true)} className="gap-1.5 h-9 text-xs rounded-xl border-white/40 dark:border-white/20 hover:border-primary/30 backdrop-blur-sm">
                <Settings className="h-3.5 w-3.5" /> Settings
              </Button>
              {isAdmin && (
                <Button size="sm" variant="destructive" onClick={() => navigate('/admin')} className="gap-1.5 h-9 text-xs">
                  <Shield className="h-3.5 w-3.5" /> Admin Panel
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => signOut()} className="text-destructive hover:text-destructive hover:bg-destructive/5 gap-1.5 h-9 text-xs">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </Button>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ━━ 2. ACADEMIC SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-4">
        <motion.h2 variants={fadeUp} className="section-title text-lg">Academic Summary</motion.h2>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass-card p-5 space-y-2"><Skeleton className="h-6 w-14" /><Skeleton className="h-3 w-20" /></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Progress ring – spans first card on mobile */}
            <motion.div variants={fadeUp} custom={0}>
              <div className="glass-card h-full">
                <div className="p-5 flex flex-col items-center justify-center gap-2">
                  <ProgressRing value={stats.overallProgress} size={76} strokeWidth={5} />
                  <p className="text-xs text-muted-foreground">Overall</p>
                </div>
              </div>
            </motion.div>

            {([
              { icon: BookOpen, value: stats.totalSubjects, label: "Enrolled", color: "text-primary", bg: "bg-gradient-to-br from-indigo-500/15 to-purple-500/15" },
              { icon: Target, value: stats.completedSubjects, label: "Completed", color: "text-green-500", bg: "bg-gradient-to-br from-green-500/15 to-emerald-500/15" },
              { icon: Brain, value: stats.quizzesCompleted, label: "Quizzes", color: "text-violet-500", bg: "bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15" },
              { icon: TrendingUp, value: stats.avgQuizScore, label: "Avg Score", color: "text-blue-500", bg: "bg-gradient-to-br from-blue-500/15 to-cyan-500/15", suffix: "%" },
            ] as const).map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i + 1}>
                <div className="glass-card h-full">
                  <div className="p-5 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                      <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${s.color} tabular-nums`}>
                        <AnimatedNumber value={s.value} suffix={"suffix" in s ? s.suffix : ""} />
                      </p>
                      <p className="text-[11px] text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Section>

      {/* ━━ 3. SUBJECT PROGRESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-4">
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <h2 className="section-title text-lg">Subject Progress</h2>
          {semesters.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              <button
                className={`h-7 text-xs px-2.5 rounded-lg transition-all font-medium ${semFilter === "all" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground bg-white/40 dark:bg-white/5 backdrop-blur-sm"}`}
                onClick={() => setSemFilter("all")}
              >
                All
              </button>
              {semesters.map((s) => (
                <button
                  key={s}
                  className={`h-7 text-xs px-2.5 rounded-lg transition-all font-medium ${semFilter === s ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground bg-white/40 dark:bg-white/5 backdrop-blur-sm"}`}
                  onClick={() => setSemFilter(s)}
                >
                  Sem {s}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-5 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-2 w-full mt-2" /></div>
            ))}
          </div>
        ) : filteredSubjects.length === 0 ? (
          <motion.div variants={fadeUp} className="py-14 text-center border border-dashed border-border rounded-xl">
            <BookOpen className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No subjects found</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSubjects.map((subj, i) => (
              <motion.div key={subj.subject_id} variants={fadeUp} custom={i}>
                <div className="glass-card">
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{subj.subject_name}</p>
                        <p className="text-xs text-muted-foreground">Semester {subj.semester}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border ${statusColor(subj)}`}>
                        {subj.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="progress-track">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${subj.progress_percent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="progress-fill"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {subj.last_accessed_at
                            ? `Last: ${new Date(subj.last_accessed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                            : "Not started"}
                        </span>
                        <span className="text-xs font-medium text-primary tabular-nums">{subj.progress_percent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Section>

      {/* ━━ 4. ACTIVITY HISTORY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-4">
        <motion.h2 variants={fadeUp} className="section-title text-lg flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Activity History
        </motion.h2>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : activity.length === 0 ? (
          <motion.div variants={fadeUp} className="py-14 text-center border border-dashed border-border rounded-xl">
            <Activity className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No activity yet — start your first quiz or study session!</p>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="max-h-[360px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
            {activity.map((item, i) => {
              const Icon = activityIcon(item.type);
              return (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  custom={i}
                  className="activity-item"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                    {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </Section>

      {/* ━━ 5. ACHIEVEMENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-4">
        <motion.h2 variants={fadeUp} className="section-title text-lg flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Achievements
        </motion.h2>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 min-w-[200px] rounded-xl" />)}
          </div>
        ) : achievements.length === 0 ? (
          <motion.div variants={fadeUp} className="py-14 text-center border border-dashed border-border rounded-xl">
            <Trophy className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Start studying to unlock achievements</p>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="overflow-x-auto pb-2 -mx-1 px-1">
            <div className="flex gap-3 snap-x snap-mandatory" style={{ minWidth: "min-content" }}>
              {achievements.map((a, i) => (
                <motion.div
                  key={a.id}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className="min-w-[220px] shrink-0 snap-start"
                >
                  <div className="achievement-card h-full">
                    <div className="p-5 space-y-2">
                      <span className="text-3xl">{a.icon || "🏆"}</span>
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                      <p className="text-[10px] text-muted-foreground/60">
                        {new Date(a.earned_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </Section>

      {/* ━━ EDIT PROFILE DIALOG ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Semester</label>
                <Input value={editForm.semester} onChange={(e) => setEditForm((p) => ({ ...p, semester: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">College</label>
                <Input value={editForm.college} onChange={(e) => setEditForm((p) => ({ ...p, college: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Learning Goal <span className="text-muted-foreground text-xs">(optional)</span></label>
              <Input
                value={editForm.learning_goal}
                onChange={(e) => setEditForm((p) => ({ ...p, learning_goal: e.target.value }))}
                placeholder="e.g. Master Java by end of semester"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? "Saving…" : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ━━ SETTINGS DIALOG ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>Account preferences & notifications</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Toggle light / dark theme</p>
                </div>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
            </div>

            {/* Notifications */}
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notifications</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">Email Notifications</p>
                </div>
                <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-foreground">Study Reminders</p>
                </div>
                <Switch checked={notifReminder} onCheckedChange={setNotifReminder} />
              </div>
            </div>

            {/* Account */}
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-sm h-9"
                onClick={() => {
                  // Clerk handles password changes
                  toast.info("Password change is managed through Clerk");
                }}
              >
                <Shield className="h-3.5 w-3.5" /> Change Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-sm text-destructive border-destructive/30 hover:bg-destructive/5 h-9"
                onClick={() => toast.error("Contact support to delete your account")}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Account
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSection;