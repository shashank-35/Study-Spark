import { memo } from "react";
import { motion } from "framer-motion";
import { Brain, Code2, BarChart3, Play } from "lucide-react";
import { useTilt3D, useSectionReveal, type PerfProfile } from "@/hooks/useLandingPerf";

const demos = [
  {
    icon: Brain,
    title: "Start Quiz",
    description: "AI-generated quizzes that adapt to your knowledge level",
    gradient: "from-purple-600 to-blue-600",
  },
  {
    icon: Code2,
    title: "Practice Coding",
    description: "Write, run & test code in our browser-based IDE",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "Visual dashboards for subjects, quizzes & coding stats",
    gradient: "from-orange-500 to-amber-600",
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

/* ═══════════════════════════════════════════════════════════════════════ */
/*  DEMO SECTION — Optimized                                              */
/*  • useTilt3D (rAF-throttled) instead of raw mousemove                  */
/*  • lighter glass (backdrop-blur-sm + gradient overlay)                 */
/*  • 3D disabled on mobile/low-end                                      */
/* ═══════════════════════════════════════════════════════════════════════ */

function DemoSection({ perf }: { perf: PerfProfile }) {
  const { ref: sectionRef, visible: isInView } = useSectionReveal(0.12);

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            See It In Action
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Interactive Learning Tools
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
            Get a taste of what StudySpark offers — start learning from day one.
          </p>
        </div>

        {/* Demo Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {demos.map((demo) => (
            <DemoCard key={demo.title} {...demo} disabled3d={perf.isMobile || perf.isLowEnd} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default memo(DemoSection);

/* ── Demo Card ──────────────────────────────────────────────────────── */

function DemoCard({
  icon: Icon,
  title,
  description,
  gradient,
  disabled3d,
}: (typeof demos)[0] & { disabled3d: boolean }) {
  const { ref, onMouseMove, onMouseLeave } = useTilt3D(6, disabled3d);

  return (
    <motion.div variants={cardVariants}>
      <div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="group relative rounded-3xl overflow-hidden cursor-default transition-shadow duration-300 ease-out hover:shadow-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Subtle glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-white/0 pointer-events-none" />

        <div className="relative p-8 flex flex-col items-center text-center">
          {/* Icon circle */}
          <div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
          >
            <Icon className="h-10 w-10 text-white" />
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {description}
          </p>

          {/* Mini CTA */}
          <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium text-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <Play className="h-3.5 w-3.5" />
            Try it now
          </div>
        </div>
      </div>
    </motion.div>
  );
}
