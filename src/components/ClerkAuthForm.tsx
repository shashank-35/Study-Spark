import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { GraduationCap, BookOpen, Brain, Code2, BarChart3, Users } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  CLERK AUTH FORM — Two-Panel Premium Layout                            */
/*  • Left: Sign In / Sign Up form (Clerk-powered)                       */
/*  • Right: Gradient illustration panel                                  */
/*  • Fully responsive (stacked on mobile)                                */
/*  • StudySpark brand colors (#A294F9, #CDC1FF, #F5EFFF, #E5D9F2)       */
/*  • Google OAuth: uses fallbackRedirectUrl (Clerk v5 fix)              */
/* ═══════════════════════════════════════════════════════════════════════ */

const clerkAppearance = {
  elements: {
    rootBox: "w-full",
    card: "shadow-none bg-transparent p-0 w-full",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "!rounded-xl !border-2 !border-gray-200 dark:!border-gray-700 !bg-white dark:!bg-gray-800 hover:!bg-gray-50 dark:hover:!bg-gray-700 !text-gray-700 dark:!text-gray-200 !transition-all !duration-200 !py-3 hover:!shadow-md",
    socialButtonsBlockButtonText: "!text-sm !font-medium",
    socialButtonsProviderIcon: "!w-5 !h-5",
    formFieldInput:
      "!rounded-xl !border-2 !border-gray-200 dark:!border-gray-700 !bg-white dark:!bg-gray-800 !text-gray-900 dark:!text-white !py-3 !px-4 focus:!border-[#A294F9] focus:!ring-2 focus:!ring-[#A294F9]/30 !transition-all",
    formFieldLabel: "!text-gray-700 dark:!text-gray-200 !font-medium !text-sm",
    formButtonPrimary:
      "!rounded-xl !bg-gradient-to-r !from-[#A294F9] !to-[#CDC1FF] hover:!from-[#9384E8] hover:!to-[#BDB0F0] !text-white !font-semibold !py-3 !transition-all !duration-200 hover:!shadow-lg hover:!shadow-[#A294F9]/25",
    footerActionLink: "!text-[#A294F9] hover:!text-[#8B7CF6] !font-medium",
    dividerLine: "!bg-gray-200 dark:!bg-gray-700",
    dividerText: "!text-gray-400 dark:!text-gray-500 !text-sm",
    formFieldAction: "!text-[#A294F9] hover:!text-[#8B7CF6]",
    footer: "hidden",
    alert: "!rounded-xl !border-red-200 dark:!border-red-800 !bg-red-50 dark:!bg-red-900/30",
    alertText: "!text-sm !text-red-700 dark:!text-red-300",
    identityPreview:
      "!rounded-xl !border-2 !border-gray-200 dark:!border-gray-700",
  },
  variables: {
    colorPrimary: "#A294F9",
    colorBackground: "transparent",
    borderRadius: "12px",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
};

const features = [
  { icon: BookOpen, text: "Structured semester learning" },
  { icon: Brain, text: "AI-powered quizzes" },
  { icon: Code2, text: "Interactive coding labs" },
  { icon: BarChart3, text: "Real-time progress tracking" },
];

const ClerkAuthForm = () => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup") setActiveTab("signup");
    else if (tab === "signin") setActiveTab("signin");
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* ── Mobile Top Banner ──────────────────────────────────────── */}
      <div className="lg:hidden relative h-44 sm:h-52 overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#A294F9] via-[#8B7CF6] to-[#CDC1FF]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold">StudySpark</h2>
            <p className="text-sm text-white/70 mt-1">Your AI Learning Companion</p>
          </div>
        </div>
        <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/10 animate-float" />
        <div className="absolute bottom-6 right-12 w-10 h-10 rounded-xl bg-white/10 animate-float-slow" />
      </div>

      {/* ── Left Panel — Form ──────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 min-h-0 flex-1 lg:flex-none">
        <div className="w-full max-w-[420px]">
          {/* Logo — Desktop only */}
          <div className="hidden lg:flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A294F9] to-[#CDC1FF] flex items-center justify-center shadow-md shadow-[#A294F9]/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">StudySpark</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {activeTab === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {activeTab === "signin"
                ? "Sign in to continue your learning journey"
                : "Join thousands of BCA students learning smarter"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 mb-8 bg-muted/50 rounded-xl">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "signin"
                  ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === "signup"
                  ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Clerk Auth Component */}
          <div className="auth-clerk-wrapper">
            {activeTab === "signin" ? (
              <SignIn
                fallbackRedirectUrl="/"
                appearance={clerkAppearance}
              />
            ) : (
              <SignUp
                fallbackRedirectUrl="/"
                appearance={clerkAppearance}
              />
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            By continuing, you agree to StudySpark's{" "}
            <a href="#" className="text-[#A294F9] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#A294F9] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* ── Right Panel — Illustration (Desktop only) ──────────────── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-12">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#A294F9] via-[#8B7CF6] to-[#CDC1FF]" />

        {/* Floating decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-[10%] left-[10%] w-32 h-32 rounded-full bg-white/10 animate-float" />
          <div
            className="absolute top-[60%] left-[70%] w-24 h-24 rounded-full bg-white/10 animate-float-slow"
          />
          <div
            className="absolute top-[30%] right-[15%] w-16 h-16 rounded-2xl bg-white/10 animate-float"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-[20%] left-[20%] w-20 h-20 rounded-xl bg-white/10 animate-float-slow"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute top-[80%] left-[50%] w-12 h-12 rounded-full bg-white/8 animate-float"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        {/* Content Card */}
        <div className="relative z-10 text-center text-white max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8 mb-8 shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">StudySpark</h2>
            <p className="text-white/80 text-lg mb-8">
              Learn &bull; Practice &bull; Grow
            </p>

            {/* Feature list */}
            <div className="space-y-3.5 text-left">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-white/90">
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2 text-white/80">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">
              Trusted by 10,000+ BCA students
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkAuthForm;
