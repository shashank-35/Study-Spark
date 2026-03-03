import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Brain, Code2, BarChart3, ArrowRight, Layers } from "lucide-react";
import { useSectionReveal, type PerfProfile } from "@/hooks/useLandingPerf";

const tabs = [
  {
    id: "subjects",
    label: "Subjects",
    icon: BookOpen,
    color: "from-purple-500 to-blue-500",
    title: "Structured Semester Subjects",
    description:
      "Every BCA subject organized beautifully by semester. Open any subject to access units, notes, PDFs, and study materials curated just for you.",
    items: ["Data Structures & Algorithms", "Database Management", "Web Technologies", "Operating Systems", "Software Engineering"],
  },
  {
    id: "quiz",
    label: "Quiz Engine",
    icon: Brain,
    color: "from-blue-500 to-cyan-500",
    title: "AI-Powered Quiz Engine",
    description:
      "Generate quizzes on any topic instantly. AI adapts difficulty to your level. Track scores, review answers, and improve over time.",
    items: ["AI-Generated Questions", "Multiple Difficulty Levels", "Instant Feedback", "Score History", "Topic-Wise Analysis"],
  },
  {
    id: "coding",
    label: "Coding Lab",
    icon: Code2,
    color: "from-green-500 to-emerald-500",
    title: "Interactive Coding Lab",
    description:
      "Write, compile, and run code directly in the browser. Practice C, Java, Python, and more with real-world problems.",
    items: ["Browser-Based IDE", "Multiple Languages", "Auto-Evaluation", "Practice Problems", "Code Submissions"],
  },
  {
    id: "progress",
    label: "Progress",
    icon: BarChart3,
    color: "from-orange-500 to-amber-500",
    title: "Real-Time Progress",
    description:
      "Visual dashboards track your learning journey. See completion rates, quiz performance, and coding streaks at a glance.",
    items: ["Subject Progress Bars", "Quiz Analytics", "Coding Streak Tracker", "Semester Overview", "Achievement Badges"],
  },
];

const tabContentVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  ECOSYSTEM SECTION — Optimized                                         */
/*  • Lighter backdrop-blur-sm                                            */
/*  • Simpler AnimatePresence (no heavy rotateX)                         */
/*  • Visual card uses CSS animation instead of JS infinite loop         */
/*  • IntersectionObserver reveal                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

function EcosystemSection({ perf }: { perf: PerfProfile }) {
  const [activeTab, setActiveTab] = useState("subjects");
  const { ref: sectionRef, visible: isInView } = useSectionReveal(0.12);
  const active = tabs.find((t) => t.id === activeTab)!;

  return (
    <section
      id="ecosystem"
      ref={sectionRef}
      className="relative py-24 md:py-32 px-4 sm:px-6 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/60 via-blue-50/40 to-transparent dark:from-purple-900/20 dark:via-blue-900/10 dark:to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div
          className={`text-center mb-14 transition-all duration-700 ease-out ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3">
            <Layers className="h-4 w-4" />
            Full Ecosystem
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your Complete BCA Learning Ecosystem
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
            Subjects → Units → Materials → Quiz → Coding Lab → Progress — one seamless platform.
          </p>
        </div>

        {/* Big Card */}
        <div
          className={`relative rounded-3xl overflow-hidden bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 shadow-xl shadow-purple-500/5 transition-all duration-700 delay-200 ease-out ${
            isInView ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
          }`}
        >
          {/* Inner gradient bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${active.color} transition-colors duration-300`} />

          <div className="p-6 sm:p-10">
            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-2 mb-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r " + tab.color + " text-white shadow-lg scale-105"
                        : "bg-white/50 dark:bg-white/5 text-muted-foreground hover:bg-white/80 dark:hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid md:grid-cols-2 gap-8 items-center"
              >
                {/* Info */}
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">
                    {active.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {active.description}
                  </p>
                  <ul className="space-y-2.5">
                    {active.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-foreground/80"
                      >
                        <ArrowRight className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual card — CSS float animation */}
                <div className="flex justify-center">
                  <div
                    className={`w-64 h-72 rounded-2xl bg-gradient-to-br ${active.color} shadow-2xl flex flex-col items-center justify-center text-white p-6 ${
                      perf.isLowEnd ? "" : "animate-float"
                    }`}
                  >
                    <active.icon className="h-14 w-14 mb-4" />
                    <span className="text-xl font-bold">{active.label}</span>
                    <span className="text-sm opacity-80 mt-2 text-center">
                      {active.description.slice(0, 60)}…
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(EcosystemSection);
