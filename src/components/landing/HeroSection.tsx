import { memo } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Play,
  Star,
  BookOpen,
  BarChart3,
  Brain,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PerfProfile } from "@/hooks/useLandingPerf";

/* ── Animation helpers ────────────────────────────────────────────────── */
const fade = (delay: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.6, ease: "easeOut" as const },
  },
});

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.6 } },
};

/* ── CSS-only floating blobs ──────────────────────────────────────────── */
function FloatingBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <div className="hero-blob hero-blob--blue" />
      <div className="hero-blob hero-blob--purple" />
      <div className="hero-blob hero-blob--cyan" />
    </div>
  );
}

/* ── Dashboard mockup card ────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Main dashboard card */}
      <div className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-xl shadow-blue-500/10 border border-gray-100 dark:border-gray-700 p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">My Progress</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Semester 4</p>
            </div>
          </div>
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +800%
          </span>
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          {[
            { label: "Data Structures", pct: 85, color: "bg-blue-500" },
            { label: "Web Technologies", pct: 72, color: "bg-purple-500" },
            { label: "Database Management", pct: 64, color: "bg-cyan-500" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-700 dark:text-gray-200 font-medium">{item.label}</span>
                <span className="text-gray-500 dark:text-gray-400">{item.pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { icon: BookOpen, label: "Subjects", value: "12" },
            { icon: Brain, label: "Quizzes", value: "48" },
            { icon: CheckCircle2, label: "Completed", value: "156" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50">
              <stat.icon className="h-4 w-4 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Floating mini card — top right */}
      <div className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg shadow-purple-500/10 border border-gray-100 dark:border-gray-700 px-3 py-2 flex items-center gap-2 animate-float">
        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-white">Quiz Passed!</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Score: 92%</p>
        </div>
      </div>

      {/* Floating mini card — bottom left */}
      <div className="absolute -bottom-3 -left-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg shadow-blue-500/10 border border-gray-100 dark:border-gray-700 px-3 py-2 flex items-center gap-2 animate-float-slow">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900 dark:text-white">85% Overall</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Keep going!</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  HERO SECTION — Modern SaaS (Light Theme)                              */
/*  • Two-column layout: text left, dashboard right                      */
/*  • Soft gradient bg (white → light blue → light purple)               */
/*  • Floating blobs (CSS-only), dot grid pattern                        */
/*  • 5-star trust badge, dual CTAs                                      */
/*  • Performance: CSS animations, no scroll-driven effects              */
/* ═══════════════════════════════════════════════════════════════════════ */

function HeroSection({
  onExplore,
  onStartLearning,
  perf,
}: {
  onExplore: () => void;
  onStartLearning: () => void;
  perf: PerfProfile;
}) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-16 md:pt-24 md:pb-20">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-20 hero-gradient-bg" />

      {/* Subtle dot grid pattern */}
      <div className="absolute inset-0 -z-[15] hero-dot-grid opacity-40" />

      {/* Floating blobs — hidden on low-end */}
      {!perf.isLowEnd && <FloatingBlobs />}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Left Column: Text ──────────────────────────────────── */}
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center lg:text-left"
          >
            {/* Trust badge */}
            <motion.div variants={fade(0.1)} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-gray-200/60 dark:border-white/20 shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200">
                <span className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </span>
                Trusted by 10,000+ students
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fade(0.25)}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.5rem] xl:text-6xl font-bold tracking-tight leading-[1.1] mb-6 text-gray-900 dark:text-white"
            >
              Learn Smarter.
              <br />
              Track Progress.
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Achieve More.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fade(0.4)}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed"
            >
              All-in-one learning platform to manage courses, track performance,
              and stay consistent with your goals.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row items-center lg:items-start gap-3 sm:gap-4"
            >
              <motion.div variants={fade(0)}>
                <Button
                  size="lg"
                  onClick={onStartLearning}
                  className="landing-cta-btn rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base font-semibold px-8 py-6 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 transition-all duration-200"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Learning Free
                </Button>
              </motion.div>

              <motion.div variants={fade(0)}>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-sm border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-white/20 hover:border-gray-300 dark:hover:border-gray-500 text-base font-semibold px-8 py-6 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  <Play className="mr-2 h-5 w-5 text-blue-600" />
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={fade(0.8)}
              initial="hidden"
              animate="visible"
              className="mt-10 flex items-center gap-4 justify-center lg:justify-start"
            >
              {/* Avatars */}
              <div className="flex -space-x-2">
                {["bg-blue-400", "bg-purple-400", "bg-cyan-400", "bg-pink-400"].map(
                  (bg, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full ${bg} border-2 border-white flex items-center justify-center text-xs font-bold text-white`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  )
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-200">2,400+</span> students
                joined this week
              </p>
            </motion.div>
          </motion.div>

          {/* ── Right Column: Dashboard ────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
            className="hidden lg:block"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default memo(HeroSection);
