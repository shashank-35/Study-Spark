import { memo } from "react";
import { Sparkles, LogIn, ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSectionReveal, type PerfProfile } from "@/hooks/useLandingPerf";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CTA SECTION — "Ready to Upgrade Your Learning?"                       */
/*  • StudySpark brand gradient (#A294F9 → #CDC1FF)                      */
/*  • Rounded-xl card container with shadow-lg                           */
/*  • Hover animations: scale(1.05), glow effect                        */
/*  • CSS-only floating particles (hidden on low-end)                    */
/* ═══════════════════════════════════════════════════════════════════════ */

function CTASection({
  onSignup,
  onLogin,
  perf,
}: {
  onSignup: () => void;
  onLogin: () => void;
  perf: PerfProfile;
}) {
  const { ref: sectionRef, visible: isInView } = useSectionReveal(0.25);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 px-4 sm:px-6 overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 cta-gradient-bg" />

      {/* CSS-only floating particles — hidden on low-end */}
      {!perf.isLowEnd && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="cta-particle" style={{ top: '12%', left: '8%', animationDelay: '0s'   }} />
          <div className="cta-particle" style={{ top: '25%', left: '85%', animationDelay: '0.5s' }} />
          <div className="cta-particle" style={{ top: '60%', left: '15%', animationDelay: '1.2s' }} />
          <div className="cta-particle" style={{ top: '45%', left: '72%', animationDelay: '1.8s' }} />
          <div className="cta-particle" style={{ top: '78%', left: '40%', animationDelay: '2.5s' }} />
          <div className="cta-particle" style={{ top: '35%', left: '55%', animationDelay: '3.1s' }} />
          <div className="cta-particle" style={{ top: '88%', left: '92%', animationDelay: '0.8s' }} />
          <div className="cta-particle" style={{ top: '18%', left: '45%', animationDelay: '2.0s' }} />
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto">
        <div
          className={`transition-all duration-700 ease-out ${
            isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          {/* CTA Card — rounded, padded, with subtle glass effect */}
          <div className="rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-10 sm:p-14 shadow-2xl text-center">
            <Sparkles className="h-10 w-10 text-white/90 mx-auto mb-6" />

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Ready to Upgrade
              <br />
              Your Learning?
            </h2>

            <p className="text-lg text-white/75 max-w-lg mx-auto mb-10 leading-relaxed">
              Join thousands of BCA students who are already learning smarter with
              StudySpark. Start for free — no credit card required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Primary CTA — Get Started */}
              <Button
                size="lg"
                onClick={onSignup}
                className="landing-cta-btn group relative px-8 py-6 text-lg font-semibold rounded-2xl bg-white text-[#7C3AED] hover:bg-white/95 shadow-xl shadow-black/10 transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Secondary CTA — Try AI Planner */}
              <Button
                size="lg"
                variant="outline"
                onClick={onLogin}
                className="group px-8 py-6 text-lg font-semibold rounded-2xl border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 bg-transparent hover:scale-105"
              >
                <Brain className="mr-2 h-5 w-5" />
                Try AI Planner
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(CTASection);
