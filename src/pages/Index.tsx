import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Target,
  Trophy,
  Calendar,
  Brain,
  TrendingUp,
  Code,
  Briefcase,
  User,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  GraduationCap,
  Zap,
  ChevronRight,
  Activity,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { motion, useInView } from "framer-motion";
import StudyPlanner from "@/components/StudyPlanner";
import SubjectSelector from "@/components/SubjectSelector";
import QuizGenerator from "@/components/QuizGenerator";
import ProgressDashboard from "@/components/ProgressDashboard";
import CodingLab from "@/components/CodingLab";
import CareerGuidance from "@/components/CareerGuidance";
import ClerkAuthForm from "@/components/ClerkAuthForm";
import EnhancedHeader from "@/components/EnhancedHeader";
import EnhancedFooter from "@/components/EnhancedFooter";
import ProfileSection from "@/components/ProfileSection";
import NotificationPage from "@/pages/NotificationPage";
import { seedStudentFromClerkUser } from "@/lib/storage";
import { ProgressProvider, useProgress } from "@/hooks/useProgressContext";
import { createWelcomeNotification } from "@/lib/notificationService";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { SubjectRow } from "@/lib/subjectService";
import type { SearchCategory } from "@/lib/searchService";

/* ── Animation Variants ─────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

/* ── Skeleton Helpers ───────────────────────────────────────────────────── */
const StatSkeleton = () => (
  <div className="glass-card p-5 flex items-center gap-4">
    <Skeleton className="h-12 w-12 rounded-xl" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
);

const SubjectSkeleton = () => (
  <div className="min-w-[260px] shrink-0 snap-start">
    <div className="glass-card h-full p-5 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  </div>
);

/* ── Animated Counter ───────────────────────────────────────────────────── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ── Section Wrapper ────────────────────────────────────────────────────── */
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
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

/* ══════════════════════════════════════════════════════════════════════════ */
/*  INDEX PAGE                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

const Index = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading StudySpark…</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return <ClerkAuthForm />;

  return (
    <ProgressProvider userId={user.id}>
      <ErrorBoundary>
        <IndexInner
          user={user}
          signOut={signOut}
        />
      </ErrorBoundary>
    </ProgressProvider>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
/*  INDEX INNER (has access to ProgressProvider)                            */
/* ══════════════════════════════════════════════════════════════════════════ */

interface UserData { name: string; email: string; semester: string; college: string; }

const IndexInner = ({
  user,
  signOut,
}: {
  user: NonNullable<ReturnType<typeof useUser>['user']>;
  signOut: ReturnType<typeof useClerk>['signOut'];
}) => {
  /* ── View state with browser-history integration ── */
  const [currentView, setCurrentViewRaw] = useState(() => {
    // Restore view from history state on initial load / popstate
    const historyView = window.history.state?.view;
    return typeof historyView === "string" ? historyView : "dashboard";
  });

  // Wrap setCurrentView to push browser history entries so Back works
  const viewStackDepth = useRef(0);
  const setCurrentView = useCallback((view: string) => {
    setCurrentViewRaw((prev) => {
      if (prev === view) return prev;
      if (view === "dashboard") {
        // Going home — replace state rather than push so user can exit from dashboard
        window.history.replaceState({ view: "dashboard" }, "");
        viewStackDepth.current = 0;
      } else {
        window.history.pushState({ view }, "");
        viewStackDepth.current += 1;
      }
      return view;
    });
  }, []);

  // Listen for browser / device back button
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const view = e.state?.view;
      if (typeof view === "string") {
        setCurrentViewRaw(view);
        viewStackDepth.current = Math.max(0, viewStackDepth.current - 1);
      } else {
        // No state → we're at the original entry. Push dashboard so we don't exit.
        if (viewStackDepth.current > 0) {
          setCurrentViewRaw("dashboard");
          viewStackDepth.current = 0;
        } else {
          // Already on dashboard with no forward history — push a guard state
          // so next back triggers popstate instead of closing
          window.history.pushState({ view: "dashboard" }, "");
          setCurrentViewRaw("dashboard");
        }
      }
    };

    // Push initial state so the first back press triggers popstate
    if (!window.history.state?.view) {
      window.history.replaceState({ view: "dashboard" }, "");
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [profileOverrides, setProfileOverrides] = useState<Partial<UserData>>(() => {
    try {
      const stored = localStorage.getItem("studyspark_profile_overrides");
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  // Persist overrides (semester, college) so they survive page reload
  const updateProfileOverrides = (d: Partial<UserData>) => {
    setProfileOverrides((prev) => {
      const next = { ...prev, ...d };
      localStorage.setItem("studyspark_profile_overrides", JSON.stringify(next));
      return next;
    });
  };

  const userData: UserData = {
    name: profileOverrides.name || user?.fullName || user?.firstName || "BCA Student",
    email: user?.emailAddresses[0]?.emailAddress || "",
    semester: profileOverrides.semester || "5",
    college: profileOverrides.college || "XYZ University",
  };

  const { stats, subjects, progressMap: progress, achievements, activity, loading } = useProgress();

  const handleLogout = async () => { await signOut(); setCurrentView("dashboard"); };

  const handleSearchNavigate = (category: SearchCategory, _id: string) => {
    const viewMap: Record<SearchCategory, string> = {
      subjects: "subjects",
      materials: "subjects",
      quizzes: "quiz",
      coding: "coding",
    };
    setCurrentView(viewMap[category] || "dashboard");
  };

  useEffect(() => {
    if (user) {
      const email = user.emailAddresses[0]?.emailAddress || null;
      const name = user.fullName || user.firstName || "BCA Student";
      seedStudentFromClerkUser({ id: user.id, name, email, semester: "5" });

      // Send a one-time welcome notification for new users
      const welcomeKey = `studyspark_welcome_sent_${user.id}`;
      if (!localStorage.getItem(welcomeKey)) {
        localStorage.setItem(welcomeKey, "1");
        createWelcomeNotification(user.id, user.firstName || undefined);
      }
    }
  }, [user]);

  const isAdmin =
    user?.publicMetadata?.role === "admin" ||
    userData.email === "kanadeshashank35@gmail.com";

  /* ── Get status for a subject ── */
  const getStatus = (s: SubjectRow) => {
    const p = progress[s.id]?.progress_percent ?? 0;
    if (p >= 100) return { label: "Completed", color: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20 border-green-200 dark:border-green-800" };
    if (p > 0) return { label: "In Progress", color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" };
    return { label: "Not Started", color: "text-zinc-500 bg-zinc-50 dark:text-zinc-400 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700" };
  };

  const quickActions = [
    { label: "Subjects", desc: "Browse BCA curriculum", icon: BookOpen, view: "subjects" },
    { label: "Quiz", desc: "Test your knowledge", icon: Brain, view: "quiz" },
    { label: "Coding Lab", desc: "Practice & build", icon: Code, view: "coding" },
    { label: "Planner", desc: "Organise your study", icon: Calendar, view: "planner" },
    { label: "Analytics", desc: "Track progress", icon: TrendingUp, view: "progress" },
    { label: "Careers", desc: "Explore IT paths", icon: Briefcase, view: "career" },
  ];

  const tips = [
    { title: "Build Real Projects", desc: "Practical coding is the #1 way to learn. Start building!" },
    { title: "Master SQL Early", desc: "Database skills are essential for every software role." },
    { title: "Stay Consistent", desc: "30 mins daily beats 5-hour weekend cramming." },
    { title: "Prepare for Placements", desc: "Begin DSA practice and resume building from 4th sem." },
  ];

  /* ────────────────────────────────────────────────────────────────────── */
  /*  DASHBOARD VIEW                                                       */
  /* ────────────────────────────────────────────────────────────────────── */
  const renderDashboard = () => (
    <div className="space-y-10 md:space-y-14">

      {/* ━━ HERO BANNER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section>
        <motion.div
          variants={fadeUp}
          className="gradient-card p-6 sm:p-8 md:p-10"
        >
          {/* Decorative orbs */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/[0.07] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-purple-300/[0.06] blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                  <GraduationCap className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs text-white/70 font-medium tracking-wider uppercase">BCA · Semester {userData.semester}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                Welcome back, <br className="hidden sm:block" />{userData.name.split(" ")[0]} <span className="inline-block animate-float text-3xl sm:text-4xl">✨</span>
              </h1>
              <p className="text-white/60 text-sm sm:text-base max-w-md leading-relaxed">
                {stats.currentStreak > 0
                  ? `You're on a ${stats.currentStreak}-day streak. Keep the momentum going!`
                  : "Start a study session today and build your streak!"}
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button onClick={() => setCurrentView("subjects")} className="btn-gradient !rounded-full !px-5 !py-2 !text-xs !shadow-lg !shadow-white/10">
                  Continue Learning <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <Button size="sm" onClick={() => setCurrentView("quiz")} variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20 rounded-full h-8 text-xs backdrop-blur-sm">
                  Start Quiz
                </Button>
              </div>
            </div>

            {/* Progress ring card */}
            <div className="flex items-center gap-5 bg-white/[0.08] backdrop-blur-md rounded-2xl px-5 sm:px-7 py-5 sm:py-6 border border-white/[0.12] shrink-0 shadow-lg shadow-black/5">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <svg className="w-20 h-20 sm:w-24 sm:h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" strokeWidth="6" stroke="white" className="opacity-10" />
                  <circle
                    cx="48" cy="48" r="40" fill="none" strokeWidth="6" stroke="white" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - (stats.overallProgress / 100))}`}
                    className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-bold text-white">
                  <AnimatedNumber value={stats.overallProgress} suffix="%" />
                </span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm sm:text-base">Overall Progress</p>
                <p className="text-white/50 text-xs mt-1">{stats.completedSubjects}/{stats.totalSubjects} subjects done</p>
                {stats.currentStreak > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Flame className="h-3.5 w-3.5 text-orange-300" />
                    <span className="text-xs text-orange-200 font-medium">{stats.currentStreak}-day streak</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ━━ QUICK STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            [
              { icon: Target, value: stats.overallProgress, suffix: "%", label: "Progress", gradient: "from-violet-500 to-purple-600", glow: "shadow-violet-500/20" },
              { icon: Flame, value: stats.currentStreak, suffix: "", label: "Day Streak", gradient: "from-orange-500 to-red-500", glow: "shadow-orange-500/20" },
              { icon: Clock, value: stats.totalStudyMinutes, suffix: "", label: "Minutes Studied", gradient: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/20" },
              { icon: Brain, value: stats.quizzesCompleted, suffix: "", label: "Quizzes Done", gradient: "from-pink-500 to-rose-500", glow: "shadow-pink-500/20" },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <div className={`glass-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-lg ${s.glow}`}>
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                    <s.icon className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                      <AnimatedNumber value={s.value} suffix={s.suffix} />
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Section>

      {/* ━━ QUICK ACTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-5">
        <motion.h2 variants={fadeUp} className="section-title">Quick Actions</motion.h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.view}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentView(action.view)}
              className="group glass-card p-4 flex flex-col items-center justify-center gap-2.5 min-h-[110px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 group-hover:from-primary/25 group-hover:to-primary/10 flex items-center justify-center transition-all duration-200 group-hover:shadow-glow-sm">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">{action.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </Section>

      {/* ━━ CURRICULUM PROGRESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-5">
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <h2 className="section-title">Curriculum Progress</h2>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("subjects")} className="text-primary hover:text-primary gap-1 text-xs h-8 rounded-full">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </motion.div>

        <motion.div variants={fadeUp} className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          <div className="flex gap-3 md:gap-4 snap-x snap-mandatory" style={{ minWidth: "min-content" }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SubjectSkeleton key={i} />)
            ) : subjects.length === 0 ? (
              <div className="flex-1 py-16 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No subjects found yet</p>
                <button onClick={() => setCurrentView("subjects")} className="btn-gradient !text-xs !px-4 !py-2 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Start your first subject
                </button>
              </div>
            ) : (
              subjects.map((subject, i) => {
                const sp = progress[subject.id];
                const pct = sp?.progress_percent ?? 0;
                const completedUnits = sp?.completed_units ?? 0;
                const totalUnits = sp?.total_units ?? 0;
                const status = getStatus(subject);
                return (
                  <motion.div
                    key={subject.id}
                    variants={fadeUp}
                    custom={i}
                    className="min-w-[240px] sm:min-w-[280px] shrink-0 snap-start"
                  >
                    <div className="glass-card h-full cursor-pointer p-5 space-y-3" onClick={() => setCurrentView("subjects")}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{subject.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Sem {subject.semester} · {subject.credits} credits</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <div className="progress-track">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="progress-fill"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-muted-foreground">
                            {subject.difficulty}
                            {totalUnits > 0 && <> · {completedUnits}/{totalUnits} units</>}
                          </span>
                          <span className="text-xs font-semibold text-primary tabular-nums">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </Section>

      {/* ━━ ACHIEVEMENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-5">
        <motion.h2 variants={fadeUp} className="section-title">
          <Trophy className="h-4.5 w-4.5 text-primary" /> Achievements
        </motion.h2>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 min-w-[220px] rounded-2xl" />
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <motion.div variants={fadeUp} className="py-12 text-center glass-card-subtle !rounded-2xl">
            <Trophy className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
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
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="min-w-[230px] shrink-0 snap-start"
                >
                  <div className="achievement-card h-full">
                    <span className="text-3xl block">{a.icon || "🏆"}</span>
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                    <p className="text-[10px] text-muted-foreground/50">
                      {new Date(a.earned_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </Section>

      {/* ━━ ACTIVITY FEED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-5">
        <motion.h2 variants={fadeUp} className="section-title">
          <Activity className="h-4.5 w-4.5 text-primary" /> Recent Activity
        </motion.h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <motion.div variants={fadeUp} className="py-12 text-center glass-card-subtle !rounded-2xl">
            <Activity className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Complete a session or quiz to see activity here</p>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="space-y-2">
            {activity.slice(0, 8).map((item, i) => {
              const Icon = item.type === 'quiz_completed' ? Brain
                : item.type === 'session_completed' ? BookOpen
                : item.type === 'achievement_earned' ? Trophy
                : item.type === 'material_added' ? Zap
                : Sparkles;
              return (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  custom={i}
                  className="activity-item"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate font-medium">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 shrink-0 tabular-nums">
                    {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </Section>

      {/* ━━ BCA SUCCESS TIPS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-5">
        <motion.h2 variants={fadeUp} className="section-title">Study Tips</motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tips.map((tip, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}>
              <div className="glass-card p-5 flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

    </div>
  );

  /* ────────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen app-bg flex flex-col">
      <EnhancedHeader
        user={userData}
        onLogout={handleLogout}
        onBackToDesktop={() => setCurrentView("dashboard")}
        onProfileClick={() => setCurrentView("profile")}
        onSearchNavigate={handleSearchNavigate}
        onViewNotifications={() => setCurrentView("notifications")}
        onNavigate={(view) => setCurrentView(view)}
        onNotificationNavigate={(link) => {
          // Map notification links to views
          if (link.startsWith("/subjects")) setCurrentView("subjects");
          else if (link.startsWith("/quiz")) setCurrentView("quiz");
          else if (link.startsWith("/coding")) setCurrentView("coding");
          else setCurrentView("dashboard");
        }}
      />

      <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {currentView === "dashboard" && renderDashboard()}
        {currentView === "subjects" && <SubjectSelector onBackToDesktop={() => setCurrentView("dashboard")} />}
        {currentView === "coding" && <CodingLab onBackToDesktop={() => setCurrentView("dashboard")} />}
        {currentView === "planner" && <StudyPlanner onBackToDesktop={() => setCurrentView("dashboard")} />}
        {currentView === "quiz" && <QuizGenerator onBackToDesktop={() => setCurrentView("dashboard")} />}
        {currentView === "progress" && <ProgressDashboard onBackToDesktop={() => setCurrentView("dashboard")} />}
        {currentView === "career" && <CareerGuidance onBackToDesktop={() => setCurrentView("dashboard")} />}
        {currentView === "notifications" && (
          <NotificationPage
            userId={user?.id}
            onBack={() => setCurrentView("dashboard")}
            onNavigate={(link) => {
              if (link.startsWith("/subjects")) setCurrentView("subjects");
              else if (link.startsWith("/quiz")) setCurrentView("quiz");
              else if (link.startsWith("/coding")) setCurrentView("coding");
              else setCurrentView("dashboard");
            }}
          />
        )}
        {currentView === "profile" && (
          <ProfileSection
            user={userData}
            isAdmin={isAdmin}
            onBackToDesktop={() => setCurrentView("dashboard")}
            onUpdateProfile={(d) => updateProfileOverrides(d)}
          />
        )}
      </main>

      <EnhancedFooter />
    </div>
  );
};

export default Index;
