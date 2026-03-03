import { useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";

import { usePerfProfile } from "@/hooks/useLandingPerf";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import EcosystemSection from "@/components/landing/EcosystemSection";
import DemoSection from "@/components/landing/DemoSection";
import ProgressSection from "@/components/landing/ProgressSection";
import ContactSection from "@/components/landing/ContactSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  LANDING PAGE — Lightweight (no Lenis / no GSAP ticker)                */
/*  • Native browser scroll for zero-lag experience                      */
/*  • Device-adaptive perf profile passed down                           */
/* ═══════════════════════════════════════════════════════════════════════ */

function LandingPage() {
  const navigate = useNavigate();
  const perf = usePerfProfile();

  /* ── Navigation handlers ─────────────────────────────────────────── */
  const goToAuth = useCallback(
    (tab?: "signin" | "signup") => {
      navigate(`/auth${tab ? `?tab=${tab}` : ""}`);
    },
    [navigate]
  );

  const scrollToFeatures = useCallback(() => {
    const el = document.getElementById("features");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="landing-page relative">
      <LandingNavbar
        onSignup={() => goToAuth("signup")}
      />

      <HeroSection
        onExplore={scrollToFeatures}
        onStartLearning={() => goToAuth("signin")}
        perf={perf}
      />

      <div id="features">
        <FeaturesSection perf={perf} />
      </div>

      <EcosystemSection perf={perf} />

      <DemoSection perf={perf} />

      <ProgressSection />

      <ContactSection />

      <CTASection
        onSignup={() => goToAuth("signup")}
        onLogin={() => goToAuth("signin")}
        perf={perf}
      />

      <LandingFooter />
    </div>
  );
}

export default memo(LandingPage);
