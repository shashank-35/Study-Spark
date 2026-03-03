import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Trophy,
  Target,
  BookOpen,
  Brain,
  Star,
  Code,
  Flame,
  ArrowLeft,
  Clock,
  Activity,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabaseClient";
import { useProgress } from "@/hooks/useProgressContext";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface WeeklyDay {
  day: string;
  date: string;
  minutes: number;
  sessions: number;
}

/* ─────────────────────────────────────────────────────────────────────────── */

const ProgressDashboard = ({ onBackToDesktop }: { onBackToDesktop?: () => void }) => {
  const { user } = useUser();
  const userId = user?.id;

  // Shared state from context
  const {
    stats: ctxStats,
    subjects: ctxSubjects,
    progressMap,
    achievements,
    activity,
    quizAttempts,
    loading: ctxLoading,
  } = useProgress();

  // Local state for view-specific data
  const [localLoading, setLocalLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyDay[]>([]);


  /* ── Fetch Weekly Activity (last 7 days sessions) ── */
  const fetchWeekly = useCallback(async (uid: string) => {
    const days: WeeklyDay[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      days.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: iso,
        minutes: 0,
        sessions: 0,
      });
    }
    try {
      const weekAgo = days[0].date;
      const { data } = await supabase
        .from("study_sessions")
        .select("date, duration, actual_duration")
        .eq("user_id", uid)
        .eq("completed", true)
        .gte("date", weekAgo)
        .order("date", { ascending: true });

      (data ?? []).forEach((s: any) => {
        const entry = days.find((d) => d.date === s.date);
        if (entry) {
          entry.minutes += s.actual_duration ?? s.duration ?? 0;
          entry.sessions += 1;
        }
      });
    } catch { /* ignore */ }
    return days;
  }, []);



  /* ── Load Local Data (weekly activity only — subject progress comes from context) ── */
  const loadLocal = useCallback(async () => {
    if (!userId) return;
    try {
      const weekly = await fetchWeekly(userId);
      setWeeklyActivity(weekly);
    } catch (e) {
      console.error("ProgressDashboard load error:", e);
    } finally {
      setLocalLoading(false);
    }
  }, [userId, fetchWeekly]);

  useEffect(() => { loadLocal(); }, [loadLocal]);

  const loading = ctxLoading || localLoading;

  /* ── Helpers ── */
  const maxMinutes = Math.max(...weeklyActivity.map((d) => d.minutes), 1);
  const totalWeekMinutes = weeklyActivity.reduce((a, b) => a + b.minutes, 0);
  const totalWeekSessions = weeklyActivity.reduce((a, b) => a + b.sessions, 0);

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-60" />
          {onBackToDesktop && <Skeleton className="h-9 w-24" />}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/60"><CardContent className="p-4 space-y-2"><Skeleton className="h-10 w-10 mx-auto rounded-xl" /><Skeleton className="h-6 w-12 mx-auto" /><Skeleton className="h-3 w-16 mx-auto" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/60"><CardContent className="p-6 space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</CardContent></Card>
          <Card className="border-border/60"><CardContent className="p-6 space-y-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}</CardContent></Card>
        </div>
      </div>
    );
  }

  const s = ctxStats;

  const statCards = [
    { icon: Clock, value: Math.round(s.totalStudyMinutes / 60), label: "Study Hours", color: "text-primary", bg: "bg-primary/10" },
    { icon: BookOpen, value: s.totalSubjects, label: "Subjects", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Target, value: s.completedSubjects, label: "Completed", color: "text-green-500", bg: "bg-green-500/10" },
    { icon: Brain, value: s.quizzesCompleted, label: "Quizzes Done", color: "text-violet-500", bg: "bg-violet-500/10" },
    { icon: TrendingUp, value: `${s.avgQuizScore}%`, label: "Avg Score", color: "text-pink-500", bg: "bg-pink-500/10" },
    { icon: Flame, value: s.currentStreak, label: "Day Streak", color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Progress Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-1">Your real-time study analytics</p>
        </div>
        {onBackToDesktop && (
          <Button onClick={onBackToDesktop} variant="outline" size="sm" className="gap-2 border-border/60 hover:border-primary hover:text-primary hover:bg-primary/5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mx-auto mb-2`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className={`text-2xl font-bold ${card.color} tabular-nums`}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Subject Progress ── */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Subject Progress
            </CardTitle>
            <CardDescription>Your progress across all enrolled subjects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ctxSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No subjects enrolled yet</p>
            ) : (
              ctxSubjects.map((sub) => {
                const sp = progressMap[sub.id];
                const pct = sp?.progress_percent ?? 0;
                const status = pct >= 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started';
                const completedUnits = sp?.completed_units ?? 0;
                const totalUnits = sp?.total_units ?? 0;
                const lastAccessed = sp?.last_accessed_at;
                return (
                  <div key={sub.id} className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground truncate">{sub.name}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            status === "Completed"
                              ? "text-green-600 border-green-200 dark:border-green-800"
                              : status === "In Progress"
                              ? "text-blue-600 border-blue-200 dark:border-blue-800"
                              : "text-zinc-500 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {status}
                        </Badge>
                        <span className="text-xs font-semibold tabular-nums text-foreground">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 100 ? "bg-green-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        Sem {sub.semester} · {sub.credits} credits
                        {totalUnits > 0 && <> · {completedUnits}/{totalUnits} units</>}
                      </p>
                      {lastAccessed && (
                        <p className="text-[10px] text-muted-foreground">
                          Last: {new Date(lastAccessed).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ── Weekly Activity ── */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Weekly Activity
            </CardTitle>
            <CardDescription>
              {totalWeekMinutes > 0
                ? `${Math.floor(totalWeekMinutes / 60)}h ${totalWeekMinutes % 60}m studied · ${totalWeekSessions} sessions`
                : "No study sessions this week"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {weeklyActivity.map((day) => (
                <div key={day.date} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                  <span className="font-semibold text-sm text-foreground w-10 shrink-0">{day.day}</span>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${(day.minutes / maxMinutes) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-16">
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      {day.minutes >= 60 ? `${Math.floor(day.minutes / 60)}h ${day.minutes % 60}m` : `${day.minutes}m`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{day.sessions} session{day.sessions !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Achievements ── */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
          <CardDescription>Milestones you've earned through your study journey</CardDescription>
        </CardHeader>
        <CardContent>
          {achievements.length === 0 ? (
            <div className="py-10 text-center">
              <Trophy className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No achievements yet — keep studying!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/60 hover:shadow-sm transition-shadow"
                >
                  <span className="text-2xl leading-none">{a.icon || "🏆"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-foreground">{a.title}</h4>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-border/60">
                        {new Date(a.earned_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Quiz Results ── */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Recent Quiz Results
          </CardTitle>
          <CardDescription>Your latest quiz performance</CardDescription>
        </CardHeader>
        <CardContent>
          {quizAttempts.length === 0 ? (
            <div className="py-10 text-center">
              <Brain className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No quizzes taken yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizAttempts.map((qa) => {
                const pct = qa.total > 0 ? Math.round((qa.score / qa.total) * 100) : 0;
                return (
                  <div key={qa.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/40 hover:border-primary/30 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{qa.quiz_title || "Quiz"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {qa.subject_name && <span className="text-primary/80 font-medium">{qa.subject_name} · </span>}
                        {new Date(qa.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`text-xl font-bold tabular-nums ${pct >= 80 ? "text-green-500" : pct >= 50 ? "text-blue-500" : "text-orange-500"}`}>
                        {pct}%
                      </p>
                      <p className="text-xs text-muted-foreground">{qa.score}/{qa.total}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Activity ── */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest study activity</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <div className="py-10 text-center">
              <Activity className="h-9 w-9 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {a.type === "quiz_completed" ? <Brain className="h-4 w-4 text-primary" /> :
                     a.type === "session_completed" ? <BookOpen className="h-4 w-4 text-primary" /> :
                     a.type === "achievement_earned" ? <Trophy className="h-4 w-4 text-primary" /> :
                     <Activity className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Motivational Banner ── */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/10 to-primary/5 shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Star className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {s.currentStreak > 0 ? "You're on fire! 🔥" : "Start your streak today! 🌟"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {s.currentStreak > 0 ? (
              <>
                <span className="font-bold text-primary">{s.currentStreak}-day</span> streak ·{" "}
                <span className="font-bold text-primary">{s.overallProgress}%</span> overall progress ·{" "}
                <span className="font-bold text-primary">{Math.round(s.totalStudyMinutes / 60)}</span> hours studied
              </>
            ) : (
              "Complete a study session to start building your streak!"
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-3">📊 All data synced from Supabase in real-time</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressDashboard;
