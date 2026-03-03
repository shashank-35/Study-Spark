import { useEffect, useState, memo } from "react";
import { useSectionReveal } from "@/hooks/useLandingPerf";

const progressData = [
  { label: "Data Structures", value: 78, color: "from-purple-500 to-blue-500" },
  { label: "Database Management", value: 65, color: "from-blue-500 to-cyan-500" },
  { label: "Web Technologies", value: 92, color: "from-green-500 to-emerald-500" },
  { label: "Operating Systems", value: 54, color: "from-orange-500 to-amber-500" },
];

const stats = [
  { label: "Overall Progress", value: 72, suffix: "%" },
  { label: "Quizzes Completed", value: 48, suffix: "" },
  { label: "Coding Problems", value: 124, suffix: "" },
  { label: "Study Hours", value: 86, suffix: "h" },
];

/* ── Animated counter (unchanged — lightweight rAF) ──────────────── */
function AnimatedCounter({
  value,
  suffix,
  inView,
}: {
  value: number;
  suffix: string;
  inView: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, value]);

  return (
    <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
      {display}
      {suffix}
    </span>
  );
}

/* ── CSS transition progress bar ─────────────────────────────────── */
function ProgressBar({
  label,
  value,
  color,
  inView,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  inView: boolean;
  delay: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{inView ? value : 0}%</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-[width] duration-1000 ease-out`}
          style={{
            width: inView ? `${value}%` : "0%",
            transitionDelay: `${delay}s`,
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PROGRESS SECTION — Optimized                                          */
/*  • Removed GSAP import entirely                                       */
/*  • Progress bars use pure CSS transitions (no Framer Motion)          */
/*  • IntersectionObserver reveal via useSectionReveal                    */
/*  • Lighter backdrop-blur-sm                                           */
/* ═══════════════════════════════════════════════════════════════════════ */

function ProgressSection() {
  const { ref: sectionRef, visible: isInView } = useSectionReveal(0.15);

  return (
    <section
      id="progress"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-4 sm:px-6 overflow-hidden"
    >
      {/* Gradient bg */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-purple-50/40 via-transparent to-blue-50/30 dark:from-purple-900/10 dark:via-transparent dark:to-blue-900/10" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Smart Tracking
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Track Every Step of Your Journey
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
            Real-time analytics so you always know exactly where you stand.
          </p>
        </div>

        {/* Stats row */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-14 transition-all duration-700 delay-200 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="text-center p-5 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10"
            >
              <AnimatedCounter value={s.value} suffix={s.suffix} inView={isInView} />
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div
          className={`rounded-3xl p-8 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 shadow-lg shadow-purple-500/5 transition-all duration-700 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          <h3 className="text-lg font-semibold mb-6 text-foreground">
            Subject Progress
          </h3>
          <div className="space-y-5">
            {progressData.map((p, i) => (
              <ProgressBar
                key={p.label}
                label={p.label}
                value={p.value}
                color={p.color}
                inView={isInView}
                delay={0.5 + i * 0.15}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(ProgressSection);
