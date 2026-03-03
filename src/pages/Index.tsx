import { useEffect, useState, useRef } from "react";
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
  <Card className="border-border/50">
    <CardContent className="flex items-center gap-4 p-5">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </CardContent>
  </Card>
);

const SubjectSkeleton = () => (
  <div className="min-w-[260px] shrink-0 snap-start">
    <Card className="border-border/50 h-full">
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>
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
      <IndexInner
        user={user}
        signOut={signOut}
      />
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
  const [currentView, setCurrentView] = useState("dashboard");
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

  const isAdmin = userData.email === "kanadeshashank35@gmail.com";

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
    <div className="space-y-14">

      {/* ━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section>
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 dark:from-primary/80 dark:to-primary/60 p-8 md:p-10"
        >
          {/* Background glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-white/70" />
                <span className="text-xs text-white/70 font-medium tracking-wide uppercase">BCA · Semester {userData.semester}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                Welcome back, {userData.name.split(" ")[0]}
              </h1>
              <p className="text-white/70 text-sm max-w-md">
                {stats.currentStreak > 0
                  ? `You're on a ${stats.currentStreak}-day streak. Keep the momentum going!`
                  : "Start a study session today and build your streak!"}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" onClick={() => setCurrentView("subjects")} className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm gap-1.5 h-8 text-xs">
                  Continue Learning <ArrowRight className="h-3 w-3" />
                </Button>
                <Button size="sm" onClick={() => setCurrentView("quiz")} variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 border-0 h-8 text-xs">
                  Start Quiz
                </Button>
                <Button size="sm" onClick={() => setCurrentView("coding")} variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 border-0 h-8 text-xs">
                  Coding Lab
                </Button>
              </div>
            </div>

            {/* Progress ring */}
            <div className="flex items-center gap-5 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-5 border border-white/15 shrink-0">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" strokeWidth="5" stroke="white" className="opacity-20" />
                  <circle
                    cx="40" cy="40" r="34" fill="none" strokeWidth="5" stroke="white" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - (stats.overallProgress / 100))}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                  <AnimatedNumber value={stats.overallProgress} suffix="%" />
                </span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Overall Progress</p>
                <p className="text-white/60 text-xs mt-0.5">{stats.completedSubjects}/{stats.totalSubjects} subjects</p>
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ━━ QUICK STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          ) : (
            [
              { icon: Target, value: stats.overallProgress, suffix: "%", label: "Progress", color: "text-primary", bg: "bg-primary/8" },
              { icon: Flame, value: stats.currentStreak, suffix: "", label: "Day Streak", color: "text-orange-500", bg: "bg-orange-500/8" },
              { icon: Clock, value: stats.totalStudyMinutes, suffix: "", label: "Minutes Studied", color: "text-blue-500", bg: "bg-blue-500/8" },
              { icon: Brain, value: stats.quizzesCompleted, suffix: "", label: "Quizzes Done", color: "text-violet-500", bg: "bg-violet-500/8" },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}>
                <Card className="border-border/50 hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${s.color} tabular-nums`}>
                        <AnimatedNumber value={s.value} suffix={s.suffix} />
                      </p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </Section>

      {/* ━━ QUICK ACTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-4">
        <motion.h2 variants={fadeUp} className="text-lg font-semibold text-foreground">Quick Actions</motion.h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.view}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentView(action.view)}
              className="group relative bg-card border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[100px] text-left hover:border-primary/30 hover:shadow-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/8 group-hover:bg-primary/15 flex items-center justify-center transition-colors">
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
      <Section className="space-y-4">
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Curriculum Progress</h2>
          <Button variant="ghost" size="sm" onClick={() => setCurrentView("subjects")} className="text-primary hover:text-primary gap-1 text-xs h-8">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </motion.div>

        <motion.div variants={fadeUp} className="overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          <div className="flex gap-3 snap-x snap-mandatory" style={{ minWidth: "min-content" }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SubjectSkeleton key={i} />)
            ) : subjects.length === 0 ? (
              <div className="flex-1 py-16 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No subjects found yet</p>
                <Button size="sm" variant="outline" onClick={() => setCurrentView("subjects")} className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Start your first subject
                </Button>
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
                    className="min-w-[270px] shrink-0 snap-start"
                  >
                    <Card className="border-border/50 h-full hover:shadow-sm hover:border-primary/20 transition-all duration-200 cursor-pointer" onClick={() => setCurrentView("subjects")}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{subject.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Sem {subject.semester} · {subject.credits} credits</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border ${status.color}`}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-primary rounded-full"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-muted-foreground">
                              {subject.difficulty}
                              {totalUnits > 0 && <> · {completedUnits}/{totalUnits} units</>}
                            </span>
                            <span className="text-xs font-medium text-primary tabular-nums">{pct}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </Section>

      {/* ━━ ACHIEVEMENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-4">
        <motion.h2 variants={fadeUp} className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Achievements
        </motion.h2>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 min-w-[200px] rounded-xl" />
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <motion.div variants={fadeUp} className="py-10 text-center border border-dashed border-border rounded-xl">
            <Trophy className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
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
                  whileHover={{ y: -2 }}
                  className="min-w-[220px] shrink-0 snap-start"
                >
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-sm hover:border-primary/20 transition-all h-full">
                    <CardContent className="p-5 space-y-2">
                      <span className="text-2xl">{a.icon || "🏆"}</span>
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                      <p className="text-[10px] text-muted-foreground/60">
                        {new Date(a.earned_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </Section>

      {/* ━━ ACTIVITY FEED ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-4">
        <motion.h2 variants={fadeUp} className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Recent Activity
        </motion.h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <motion.div variants={fadeUp} className="py-10 text-center border border-dashed border-border rounded-xl">
            <Activity className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-border transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
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

      {/* ━━ BCA SUCCESS TIPS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Section className="space-y-4">
        <motion.h2 variants={fadeUp} className="text-lg font-semibold text-foreground">Study Tips</motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tips.map((tip, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}>
              <Card className="border-border/50 hover:border-primary/20 hover:shadow-sm transition-all duration-200">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{tip.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>


    </div>
  );

  /* ────────────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EnhancedHeader
        user={userData}
        onLogout={handleLogout}
        onBackToDesktop={() => setCurrentView("dashboard")}
        onProfileClick={() => setCurrentView("profile")}
        onSearchNavigate={handleSearchNavigate}
        onViewNotifications={() => setCurrentView("notifications")}
        onNotificationNavigate={(link) => {
          // Map notification links to views
          if (link.startsWith("/subjects")) setCurrentView("subjects");
          else if (link.startsWith("/quiz")) setCurrentView("quiz");
          else if (link.startsWith("/coding")) setCurrentView("coding");
          else setCurrentView("dashboard");
        }}
      />

      <main className="flex-1 container mx-auto px-4 lg:px-6 py-8">
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
