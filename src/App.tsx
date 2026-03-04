import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/* ── Lazy-load pages for perf ─────────────────────────────────────────── */
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Index = lazy(() => import("./pages/Index"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 min — data considered fresh
      gcTime: 10 * 60 * 1000,         // 10 min — keep in cache after unmount
      retry: 2,                        // 2 retries on failure
      refetchOnWindowFocus: true,      // fresh data when user tabs back
      refetchOnReconnect: true,        // fresh data after re-connect
    },
  },
});

/* ── Full-screen loader ───────────────────────────────────────────────── */
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-3"
      >
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
          <Sparkles className="h-6 w-6 text-white animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">Loading StudySpark…</p>
      </motion.div>
    </div>
  );
}

/* ── Smart root: landing for guests, dashboard for logged-in users ──── */
function SmartRoot() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <PageLoader />;

  // Logged-in users go straight to the dashboard (Index)
  if (user) return <Index />;

  // Guests see the premium landing page
  return <LandingPage />;
}

/* ── Protected route wrapper ──────────────────────────────────────────── */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  if (!isLoaded) return <PageLoader />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Analytics />
      <SpeedInsights />
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing (guest) or Dashboard (logged-in) */}
            <Route path="/" element={<SmartRoot />} />

            {/* Auth page */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminPage />
                </RequireAuth>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
