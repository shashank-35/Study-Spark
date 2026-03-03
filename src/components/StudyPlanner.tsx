import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import {
  Plus, Trash2, CheckCircle2, Circle, Clock, Target, BookOpen, TrendingUp,
  Calendar, Flame, Timer, ArrowLeft, AlertCircle, Sparkles, Play, Pause,
  RotateCcw, GraduationCap, ListTodo, Zap, BarChart3, Quote, Edit3, Save, X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSessions, addSession, updateSession, deleteSession as delSessionApi,
  fetchGoals, addGoal, updateGoal, deleteGoal as delGoalApi,
  fetchTodos, addTodo, updateTodo, deleteTodo as delTodoApi,
  subscribeToSessions, subscribeToGoals, subscribeToTodos,
  computeStats, getRandomQuote,
  type StudySession, type StudyGoal, type StudyTodo, type PlannerStats,
} from "@/lib/studyPlannerService";

type Tab = "overview" | "sessions" | "goals" | "todos";
interface Props { onBackToDesktop?: () => void; }

const PRI = {
  high:   { label: "High",   cls: "bg-rose-500/15 text-rose-400 border-rose-500/30", dot: "bg-rose-500" },
  medium: { label: "Medium", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-500" },
  low:    { label: "Low",    cls: "bg-teal-500/15 text-teal-400 border-teal-500/30", dot: "bg-teal-500" },
} as const;

const fmtMin = (m: number) => m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60 > 0 ? `${m%60}m` : ""}`.trim();
const isOverdue = (d: string) => new Date(d) < new Date(new Date().toISOString().split("T")[0]);
const daysLeft = (d: string) => Math.ceil((new Date(d).getTime() - new Date(new Date().toISOString().split("T")[0]).getTime()) / 864e5);
const todayStr = () => new Date().toISOString().split("T")[0];

/* ── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({ icon: I, label, value, sub, gradient, delay = 0 }: {
  icon: any; label: string; value: string | number; sub?: string; gradient: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, type: "spring", stiffness: 200 }}>
      <div className={`relative overflow-hidden rounded-2xl p-4 ${gradient} shadow-lg`}>
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/10" />
        <I className="h-5 w-5 text-white/80 mb-2" />
        <p className="text-2xl font-extrabold text-white leading-none">{value}</p>
        <p className="text-xs text-white/70 font-medium mt-1">{label}</p>
        {sub && <p className="text-[10px] text-white/50 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── Weekly Chart ──────────────────────────────────────────────────────── */
function WeeklyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date().getDay(); // 0=Sun
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return days[d.getDay() === 0 ? 6 : d.getDay() - 1];
  });
  return (
    <div className="flex items-end gap-1.5 h-20 px-1">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }} animate={{ height: `${Math.max((v / max) * 100, 4)}%` }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className={`w-full rounded-t-md min-h-[3px] ${i === 6 ? "bg-gradient-to-t from-violet-500 to-fuchsia-400" : "bg-violet-500/40"}`}
            title={`${v} min`}
          />
          <span className="text-[9px] text-muted-foreground font-medium">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Focus Timer ───────────────────────────────────────────────────────── */
function FocusTimer() {
  const [sec, setSec] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  useEffect(() => {
    if (!running || sec <= 0) return;
    const t = setInterval(() => setSec(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [running, sec]);
  useEffect(() => {
    if (sec === 0 && running) {
      setRunning(false);
      setMode(m => m === "focus" ? "break" : "focus");
      setSec(mode === "focus" ? 5 * 60 : 25 * 60);
    }
  }, [sec, running, mode]);
  const total = mode === "focus" ? 25 * 60 : 5 * 60;
  const pct = ((total - sec) / total) * 100;
  const radius = 42, circ = 2 * Math.PI * radius;
  return (
    <Card className="border-border/30 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardContent className="pt-5 pb-4 flex flex-col items-center">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          {mode === "focus" ? "🎯 Focus" : "☕ Break"}
        </p>
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
            <motion.circle cx="50" cy="50" r={radius} fill="none"
              stroke={mode === "focus" ? "#8b5cf6" : "#10b981"} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circ} animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
              transition={{ duration: 0.3 }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-mono font-bold tabular-nums">
              {String(Math.floor(sec / 60)).padStart(2, "0")}:{String(sec % 60).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={() => setRunning(!running)} className="gap-1.5 rounded-full px-4">
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Pause" : "Start"}
          </Button>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { setRunning(false); setSec(mode === "focus" ? 25 * 60 : 5 * 60); }}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Quote Card ────────────────────────────────────────────────────────── */
function QuoteCard() {
  const [q] = useState(getRandomQuote);
  return (
    <Card className="border-border/30 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5">
      <CardContent className="pt-5 pb-4">
        <Quote className="h-5 w-5 text-violet-400/60 mb-2" />
        <p className="text-sm italic text-foreground/80 leading-relaxed">"{q.text}"</p>
        <p className="text-xs text-muted-foreground mt-2">— {q.author}</p>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                          MAIN COMPONENT                                */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function StudyPlanner({ onBackToDesktop }: Props) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const { toast } = useToast();

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [todos, setTodos] = useState<StudyTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  // Forms visibility
  const [showSF, setShowSF] = useState(false);
  const [showGF, setShowGF] = useState(false);
  const [showTF, setShowTF] = useState(false);

  // Inline edit
  const [editTodo, setEditTodo] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editSession, setEditSession] = useState<string | null>(null);
  const [editSessionNotes, setEditSessionNotes] = useState("");

  // Forms
  const [sf, setSf] = useState({ subject: "", duration: "30", date: todayStr(), notes: "" });
  const [gf, setGf] = useState({ title: "", description: "", dueDate: "", priority: "medium" as const, category: "" });
  const [tf, setTf] = useState({ task: "", dueDate: todayStr(), priority: "medium" as const });

  /* ── Load data ─────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [s, g, t] = await Promise.all([fetchSessions(userId), fetchGoals(userId), fetchTodos(userId)]);
      setSessions(s); setGoals(g); setTodos(t);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!userId) return;
    const u1 = subscribeToSessions(userId, load);
    const u2 = subscribeToGoals(userId, load);
    const u3 = subscribeToTodos(userId, load);
    return () => { u1(); u2(); u3(); };
  }, [userId, load]);

  const stats = useMemo(() => computeStats(sessions, goals, todos), [sessions, goals, todos]);

  /* ── OPTIMISTIC SESSION HANDLERS ───────────────────────────────────── */
  const handleAddSession = async () => {
    if (!userId || !sf.subject.trim() || !sf.duration) return toast({ title: "Fill subject & duration", variant: "destructive" });
    const optimistic: StudySession = {
      id: `temp-${Date.now()}`, user_id: userId, subject: sf.subject.trim(),
      duration: parseInt(sf.duration), actual_duration: null, date: sf.date,
      start_time: null, notes: sf.notes.trim() || null, completed: false,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setSessions(prev => [optimistic, ...prev]);
    setSf({ subject: "", duration: "30", date: todayStr(), notes: "" }); setShowSF(false);
    toast({ title: "✅ Session added!" });
    try { await addSession({ user_id: userId, subject: optimistic.subject, duration: optimistic.duration, actual_duration: null, date: optimistic.date, start_time: null, notes: optimistic.notes, completed: false }); }
    catch { toast({ title: "Failed to save", variant: "destructive" }); load(); }
  };

  const handleToggleSession = async (s: StudySession) => {
    setSessions(prev => prev.map(x => x.id === s.id ? { ...x, completed: !x.completed, actual_duration: !x.completed ? x.duration : null } : x));
    try { await updateSession(s.id, { completed: !s.completed, actual_duration: !s.completed ? s.duration : null }); }
    catch { load(); }
  };

  const handleDeleteSession = async (id: string) => {
    setSessions(prev => prev.filter(x => x.id !== id));
    toast({ title: "Session deleted" });
    try { await delSessionApi(id); } catch { load(); }
  };

  const handleSaveSessionNotes = async (id: string) => {
    setSessions(prev => prev.map(x => x.id === id ? { ...x, notes: editSessionNotes } : x));
    setEditSession(null);
    try { await updateSession(id, { notes: editSessionNotes }); } catch { load(); }
  };

  /* ── OPTIMISTIC GOAL HANDLERS ──────────────────────────────────────── */
  const handleAddGoal = async () => {
    if (!userId || !gf.title.trim() || !gf.dueDate) return toast({ title: "Fill title & due date", variant: "destructive" });
    const optimistic: StudyGoal = {
      id: `temp-${Date.now()}`, user_id: userId, title: gf.title.trim(),
      description: gf.description.trim() || null, due_date: gf.dueDate, progress: 0,
      priority: gf.priority, completed: false, category: gf.category.trim() || null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setGoals(prev => [optimistic, ...prev]);
    setGf({ title: "", description: "", dueDate: "", priority: "medium", category: "" }); setShowGF(false);
    toast({ title: "🎯 Goal created!" });
    try { await addGoal({ user_id: userId, title: optimistic.title, description: optimistic.description, due_date: optimistic.due_date, progress: 0, priority: optimistic.priority, completed: false, category: optimistic.category }); }
    catch { toast({ title: "Failed to save", variant: "destructive" }); load(); }
  };

  const handleGoalProgress = async (g: StudyGoal, p: number) => {
    const clamped = Math.min(100, Math.max(0, p));
    setGoals(prev => prev.map(x => x.id === g.id ? { ...x, progress: clamped, completed: clamped >= 100 } : x));
    try { await updateGoal(g.id, { progress: clamped, completed: clamped >= 100 }); } catch { load(); }
  };

  const handleToggleGoal = async (g: StudyGoal) => {
    setGoals(prev => prev.map(x => x.id === g.id ? { ...x, completed: !x.completed, progress: !x.completed ? 100 : x.progress } : x));
    try { await updateGoal(g.id, { completed: !g.completed, progress: !g.completed ? 100 : g.progress }); } catch { load(); }
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(x => x.id !== id));
    toast({ title: "Goal deleted" });
    try { await delGoalApi(id); } catch { load(); }
  };

  /* ── OPTIMISTIC TODO HANDLERS ──────────────────────────────────────── */
  const handleAddTodo = async () => {
    if (!userId || !tf.task.trim()) return toast({ title: "Enter a task", variant: "destructive" });
    const optimistic: StudyTodo = {
      id: `temp-${Date.now()}`, user_id: userId, task: tf.task.trim(),
      due_date: tf.dueDate, priority: tf.priority, completed: false,
      completed_at: null, sort_order: todos.length,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setTodos(prev => [optimistic, ...prev.filter(t => !t.completed), ...prev.filter(t => t.completed)]);
    setTf({ task: "", dueDate: todayStr(), priority: "medium" }); setShowTF(false);
    toast({ title: "✓ Task added!" });
    try { await addTodo({ user_id: userId, task: optimistic.task, due_date: optimistic.due_date, priority: optimistic.priority, completed: false, completed_at: null, sort_order: todos.length }); }
    catch { toast({ title: "Failed to save", variant: "destructive" }); load(); }
  };

  const handleToggleTodo = async (t: StudyTodo) => {
    setTodos(prev => prev.map(x => x.id === t.id ? { ...x, completed: !x.completed, completed_at: !x.completed ? new Date().toISOString() : null } : x));
    try { await updateTodo(t.id, { completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }); } catch { load(); }
  };

  const handleSaveTodoEdit = async (id: string) => {
    if (!editText.trim()) return;
    setTodos(prev => prev.map(x => x.id === id ? { ...x, task: editText.trim() } : x));
    setEditTodo(null);
    try { await updateTodo(id, { task: editText.trim() }); } catch { load(); }
  };

  const handleDeleteTodo = async (id: string) => {
    setTodos(prev => prev.filter(x => x.id !== id));
    toast({ title: "Task deleted" });
    try { await delTodoApi(id); } catch { load(); }
  };

  /* ── Tab config ────────────────────────────────────────────────────── */
  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: "overview", label: "Dashboard", icon: BarChart3 },
    { key: "sessions", label: "Sessions", icon: BookOpen, count: sessions.length },
    { key: "goals",    label: "Goals",    icon: Target,   count: goals.filter(g => !g.completed).length },
    { key: "todos",    label: "Todos",    icon: ListTodo,  count: todos.filter(t => !t.completed).length },
  ];

  if (!userId) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <GraduationCap className="h-16 w-16 text-muted-foreground/30" />
      <h2 className="text-2xl font-bold">Sign in to use Study Planner</h2>
      <p className="text-muted-foreground max-w-sm text-center">Your study data syncs in real-time across devices.</p>
    </div>
  );

  const pendingTodos = todos.filter(t => !t.completed);
  const doneTodos = todos.filter(t => t.completed);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse delay-500" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Study Planner</h1>
                <p className="text-violet-200 text-sm">Real-time • Synced • Personal</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {stats.currentStreak > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 gap-1.5 py-1.5 px-3 text-sm">
                  <Flame className="h-4 w-4" /> {stats.currentStreak} day streak 🔥
                </Badge>
              </motion.div>
            )}
            {onBackToDesktop && (
              <Button onClick={onBackToDesktop} variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── TABS ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-muted/40 border border-border/30 backdrop-blur-sm">
        {tabs.map(t => {
          const I = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20" : "text-muted-foreground hover:text-foreground"
              }`}>
              <I className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
              {(t.count ?? 0) > 0 && (
                <span className={`text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${tab === t.key ? "bg-white/20" : "bg-muted"}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>

        {/* ══════ OVERVIEW ══════ */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <StatCard icon={Clock} label="Total Study" value={fmtMin(stats.totalMinutes)} sub={`${stats.completedSessions} sessions`} gradient="bg-gradient-to-br from-blue-500 to-cyan-500" delay={0} />
              <StatCard icon={Flame} label="Streak" value={`${stats.currentStreak}d`} sub="consecutive" gradient="bg-gradient-to-br from-amber-500 to-orange-500" delay={0.05} />
              <StatCard icon={Target} label="Goals" value={`${stats.completedGoals}/${stats.totalGoals}`} sub={`${stats.avgGoalProgress}% avg`} gradient="bg-gradient-to-br from-violet-500 to-purple-600" delay={0.1} />
              <StatCard icon={CheckCircle2} label="Tasks Done" value={`${stats.completedTodos}/${stats.totalTodos}`} gradient="bg-gradient-to-br from-emerald-500 to-teal-500" delay={0.15} />
              <StatCard icon={Zap} label="Today" value={fmtMin(stats.todayMinutes)} sub={`${stats.todaySessions} sessions`} gradient="bg-gradient-to-br from-rose-500 to-pink-500" delay={0.2} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <FocusTimer />
              <Card className="border-border/30 bg-card/70 backdrop-blur-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-violet-400" /> This Week</CardTitle></CardHeader>
                <CardContent><WeeklyChart data={stats.weeklyMinutes} /></CardContent>
              </Card>
              <QuoteCard />
            </div>

            {/* Subject breakdown */}
            {stats.subjectBreakdown.length > 0 && (
              <Card className="border-border/30 bg-card/70 backdrop-blur-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-cyan-400" /> Subject Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.subjectBreakdown.slice(0, 5).map((s, i) => (
                      <div key={s.subject} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-32 truncate">{s.subject}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(s.minutes / stats.subjectBreakdown[0].minutes) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">{fmtMin(s.minutes)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending tasks preview */}
            <Card className="border-border/30 bg-card/70 backdrop-blur-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ListTodo className="h-4 w-4 text-amber-400" /> Pending Tasks {pendingTodos.length > 0 && <Badge variant="secondary" className="text-[10px]">{pendingTodos.length}</Badge>}</CardTitle></CardHeader>
              <CardContent>
                {pendingTodos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">All caught up! 🎉</p> : (
                  <div className="space-y-1.5">
                    {pendingTodos.slice(0, 5).map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 transition-colors group">
                        <button onClick={() => handleToggleTodo(t)}><Circle className="h-4 w-4 text-muted-foreground group-hover:text-violet-400 transition" /></button>
                        <span className="text-sm flex-1">{t.task}</span>
                        <div className={`w-2 h-2 rounded-full ${PRI[t.priority].dot}`} />
                      </div>
                    ))}
                    {pendingTodos.length > 5 && <button onClick={() => setTab("todos")} className="text-xs text-violet-400 hover:underline ml-7">+{pendingTodos.length - 5} more →</button>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══════ SESSIONS ══════ */}
        {tab === "sessions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Study Sessions</h3>
              <Button size="sm" onClick={() => setShowSF(!showSF)} className="gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-full px-4 shadow-lg shadow-violet-500/20">
                <Plus className="h-4 w-4" /> Add Session
              </Button>
            </div>

            <AnimatePresence>{showSF && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="border-violet-500/30 bg-violet-500/5">
                  <CardContent className="pt-5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Subject (e.g., Data Structures)" value={sf.subject} onChange={e => setSf({ ...sf, subject: e.target.value })} className="bg-background rounded-xl" />
                      <Input type="number" placeholder="Duration (minutes)" value={sf.duration} onChange={e => setSf({ ...sf, duration: e.target.value })} className="bg-background rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input type="date" value={sf.date} onChange={e => setSf({ ...sf, date: e.target.value })} className="bg-background rounded-xl" />
                      <Input placeholder="Notes (optional)" value={sf.notes} onChange={e => setSf({ ...sf, notes: e.target.value })} className="bg-background rounded-xl" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddSession} className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl"><Plus className="h-4 w-4 mr-1" /> Add</Button>
                      <Button variant="ghost" onClick={() => setShowSF(false)} className="rounded-xl">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}</AnimatePresence>

            {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
              : sessions.length === 0 ? <Card className="py-16"><CardContent className="flex flex-col items-center gap-3"><BookOpen className="h-12 w-12 text-muted-foreground/20" /><p className="font-semibold">No sessions yet</p><p className="text-sm text-muted-foreground">Start tracking your study time!</p></CardContent></Card>
              : <div className="space-y-2">{sessions.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: i * 0.02 }} layout>
                  <Card className={`border-border/30 transition-all hover:shadow-md ${s.completed ? "bg-emerald-500/5 border-emerald-500/20" : "hover:border-violet-500/30"}`}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleToggleSession(s)} className="shrink-0">
                          {s.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-violet-400 transition" />}
                        </motion.button>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold ${s.completed ? "line-through text-muted-foreground" : ""}`}>{s.subject}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duration}m</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          </div>
                          {editSession === s.id ? (
                            <div className="flex gap-2 mt-2">
                              <Input value={editSessionNotes} onChange={e => setEditSessionNotes(e.target.value)} className="h-7 text-xs rounded-lg" placeholder="Notes..." />
                              <Button size="sm" className="h-7 px-2" onClick={() => handleSaveSessionNotes(s.id)}><Save className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditSession(null)}><X className="h-3 w-3" /></Button>
                            </div>
                          ) : s.notes && <p className="text-xs text-muted-foreground mt-1 italic">📝 {s.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-30 hover:opacity-100" onClick={() => { setEditSession(s.id); setEditSessionNotes(s.notes ?? ""); }}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-30 hover:opacity-100 text-destructive" onClick={() => handleDeleteSession(s.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}</div>
            }
          </div>
        )}

        {/* ══════ GOALS ══════ */}
        {tab === "goals" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Study Goals</h3>
              <Button size="sm" onClick={() => setShowGF(!showGF)} className="gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-full px-4 shadow-lg shadow-violet-500/20">
                <Plus className="h-4 w-4" /> New Goal
              </Button>
            </div>

            <AnimatePresence>{showGF && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="border-violet-500/30 bg-violet-500/5">
                  <CardContent className="pt-5 space-y-3">
                    <Input placeholder="Goal title" value={gf.title} onChange={e => setGf({ ...gf, title: e.target.value })} className="bg-background rounded-xl" />
                    <Input placeholder="Description (optional)" value={gf.description} onChange={e => setGf({ ...gf, description: e.target.value })} className="bg-background rounded-xl" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input type="date" value={gf.dueDate} onChange={e => setGf({ ...gf, dueDate: e.target.value })} className="bg-background rounded-xl" />
                      <Select value={gf.priority} onValueChange={v => setGf({ ...gf, priority: v as any })}>
                        <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                      </Select>
                      <Input placeholder="Category" value={gf.category} onChange={e => setGf({ ...gf, category: e.target.value })} className="bg-background rounded-xl" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddGoal} className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl"><Plus className="h-4 w-4 mr-1" /> Create</Button>
                      <Button variant="ghost" onClick={() => setShowGF(false)} className="rounded-xl">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}</AnimatePresence>

            {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
              : goals.length === 0 ? <Card className="py-16"><CardContent className="flex flex-col items-center gap-3"><Target className="h-12 w-12 text-muted-foreground/20" /><p className="font-semibold">No goals set</p><p className="text-sm text-muted-foreground">Create goals to stay motivated!</p></CardContent></Card>
              : <div className="space-y-3">{goals.map((g, i) => {
                const days = daysLeft(g.due_date);
                const over = isOverdue(g.due_date) && !g.completed;
                return (
                  <motion.div key={g.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} layout>
                    <Card className={`border-border/30 transition-all hover:shadow-md ${g.completed ? "bg-emerald-500/5 border-emerald-500/20" : over ? "border-rose-500/30" : "hover:border-violet-500/30"}`}>
                      <CardContent className="py-4 px-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleToggleGoal(g)} className="shrink-0 mt-0.5">
                            {g.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-violet-400 transition" />}
                          </motion.button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-semibold ${g.completed ? "line-through text-muted-foreground" : ""}`}>{g.title}</p>
                              <Badge variant="outline" className={`text-[10px] ${PRI[g.priority].cls}`}>{PRI[g.priority].label}</Badge>
                              {g.category && <Badge variant="secondary" className="text-[10px]">{g.category}</Badge>}
                            </div>
                            {g.description && <p className="text-xs text-muted-foreground mt-1">{g.description}</p>}
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(g.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                              {over ? <span className="text-rose-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {Math.abs(days)}d overdue</span>
                                : !g.completed && <span>{days === 0 ? "Due today!" : `${days}d left`}</span>}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-30 hover:opacity-100 text-destructive shrink-0" onClick={() => handleDeleteGoal(g.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {!g.completed && (
                          <div className="pl-8 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-bold text-violet-400">{g.progress}%</span>
                            </div>
                            <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                              <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                initial={{ width: 0 }} animate={{ width: `${g.progress}%` }} transition={{ duration: 0.4 }} />
                            </div>
                            <div className="flex gap-1.5">
                              {[10, 25, 50, 75, 100].map(v => (
                                <motion.button key={v} whileTap={{ scale: 0.9 }} onClick={() => handleGoalProgress(g, v)}
                                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${g.progress >= v ? "bg-violet-500/20 border-violet-500/30 text-violet-400 font-bold" : "border-border/50 text-muted-foreground hover:border-violet-500/30 hover:text-violet-400"}`}>
                                  {v}%
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}</div>
            }
          </div>
        )}

        {/* ══════ TODOS ══════ */}
        {tab === "todos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Todo List</h3>
              <Button size="sm" onClick={() => setShowTF(!showTF)} className="gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 rounded-full px-4 shadow-lg shadow-violet-500/20">
                <Plus className="h-4 w-4" /> Add Task
              </Button>
            </div>

            <AnimatePresence>{showTF && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Card className="border-violet-500/30 bg-violet-500/5">
                  <CardContent className="pt-5 space-y-3">
                    <Input placeholder="What do you need to do?" value={tf.task} onChange={e => setTf({ ...tf, task: e.target.value })} className="bg-background rounded-xl" onKeyDown={e => e.key === "Enter" && handleAddTodo()} autoFocus />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input type="date" value={tf.dueDate} onChange={e => setTf({ ...tf, dueDate: e.target.value })} className="bg-background rounded-xl" />
                      <Select value={tf.priority} onValueChange={v => setTf({ ...tf, priority: v as any })}>
                        <SelectTrigger className="bg-background rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddTodo} className="flex-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl"><Plus className="h-4 w-4 mr-1" /> Add</Button>
                      <Button variant="ghost" onClick={() => setShowTF(false)} className="rounded-xl">Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}</AnimatePresence>

            {loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
              : todos.length === 0 ? <Card className="py-16"><CardContent className="flex flex-col items-center gap-3"><ListTodo className="h-12 w-12 text-muted-foreground/20" /><p className="font-semibold">No tasks yet</p><p className="text-sm text-muted-foreground">Add your first task to get organized!</p></CardContent></Card>
              : <div className="space-y-4">
                {pendingTodos.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Pending ({pendingTodos.length})</p>
                    {pendingTodos.map((t, i) => {
                      const over = isOverdue(t.due_date);
                      return (
                        <motion.div key={t.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }} layout>
                          <Card className={`border-border/30 hover:shadow-md transition-all ${over ? "border-rose-500/20" : "hover:border-violet-500/30"}`}>
                            <CardContent className="py-2.5 px-4">
                              <div className="flex items-center gap-3">
                                <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleToggleTodo(t)} className="shrink-0">
                                  <Circle className="h-5 w-5 text-muted-foreground hover:text-violet-400 transition" />
                                </motion.button>
                                <div className="flex-1 min-w-0">
                                  {editTodo === t.id ? (
                                    <div className="flex gap-2">
                                      <Input value={editText} onChange={e => setEditText(e.target.value)} className="h-7 text-sm rounded-lg" onKeyDown={e => e.key === "Enter" && handleSaveTodoEdit(t.id)} autoFocus />
                                      <Button size="sm" className="h-7 px-2" onClick={() => handleSaveTodoEdit(t.id)}><Save className="h-3 w-3" /></Button>
                                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditTodo(null)}><X className="h-3 w-3" /></Button>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm font-medium">{t.task}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-xs ${over ? "text-rose-400" : "text-muted-foreground"}`}>{new Date(t.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                                        {over && <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-3.5">Overdue</Badge>}
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <div className={`w-2 h-2 rounded-full ${PRI[t.priority].dot}`} />
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100" onClick={() => { setEditTodo(t.id); setEditText(t.task); }}>
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-30 hover:opacity-100 text-destructive" onClick={() => handleDeleteTodo(t.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                {doneTodos.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Completed ({doneTodos.length})</p>
                    {doneTodos.map(t => (
                      <Card key={t.id} className="border-border/20 bg-muted/20">
                        <CardContent className="py-2 px-4">
                          <div className="flex items-center gap-3">
                            <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleToggleTodo(t)}><CheckCircle2 className="h-5 w-5 text-emerald-500" /></motion.button>
                            <p className="text-sm line-through text-muted-foreground flex-1">{t.task}</p>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-20 hover:opacity-100 text-destructive" onClick={() => handleDeleteTodo(t.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            }
          </div>
        )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}