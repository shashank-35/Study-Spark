import { memo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Brain, BarChart3, Code2 } from "lucide-react";
import { useTilt3D, useSectionReveal, type PerfProfile } from "@/hooks/useLandingPerf";

const features = [
  {
    icon: BookOpen,
    title: "Structured Semester Learning",
    description:
      "Complete BCA curriculum organized by semester, subjects, and units — study at your own pace with curated materials.",
    gradient: "from-purple-500 to-blue-500",
  },
  {
    icon: Brain,
    title: "AI Quiz & Coding Practice",
    description:
      "AI-generated quizzes test your understanding. Built-in coding problems sharpen your programming skills.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Real-Time Progress Tracking",
    description:
      "Visual dashboards show exactly where you stand — subject-wise, quiz-wise, and overall semester performance.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Code2,
    title: "Live Coding Labs",
    description:
      "Write, run, and test code in real-time. Practice data structures, algorithms, and semester-specific coding problems.",
    gradient: "from-green-500 to-emerald-500",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

/* ── Feature Card with throttled 3D tilt ─────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  disabled3d,
}: (typeof features)[0] & { disabled3d: boolean }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt3D(5, disabled3d);

  return (
    <motion.div variants={cardVariants}>
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="group relative p-6 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 transition-shadow duration-300 ease-out hover:shadow-lg cursor-default"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Glow border on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none border border-purple-300/30 dark:border-purple-500/20" />

        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-md`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  FEATURES SECTION — Optimized                                          */
/*  • Removed GSAP ScrollTrigger — using IntersectionObserver           */
/*  • Illustration uses CSS float animation instead of Framer infinite  */
/*  • 3D tilt via rAF-throttled useTilt3D hook                          */
/*  • Lighter backdrop-blur-sm                                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function FeaturesSection({ perf }: { perf: PerfProfile }) {
  const { ref: sectionRef, visible: isInView } = useSectionReveal(0.12);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 px-4 sm:px-6 overflow-hidden"
    >
      {/* Subtle bg gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/50 dark:via-purple-900/10 to-transparent -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Why StudySpark?
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Everything You Need to Excel
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
            A purpose-built platform that transforms how BCA students learn, practice, and grow.
          </p>
        </div>

        {/* Illustration + Feature Grid */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — Illustration (CSS-only animation) */}
          <div
            className={`flex items-center justify-center transition-all duration-700 delay-200 ease-out ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              {/* Main card — CSS float animation */}
              <div
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-2xl animate-float"
              >
                <div className="absolute inset-4 rounded-2xl bg-white/10 flex flex-col items-center justify-center gap-3 text-white p-6">
                  <BookOpen className="h-12 w-12" />
                  <span className="text-2xl font-bold">StudySpark</span>
                  <span className="text-sm opacity-80">Learn • Practice • Grow</span>
                </div>
              </div>
              {/* Sub-cards — CSS float-slow */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-xl flex items-center justify-center animate-float-slow">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                <Code2 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Right — Feature Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid gap-5"
          >
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} disabled3d={perf.isMobile || perf.isLowEnd} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default memo(FeaturesSection);
