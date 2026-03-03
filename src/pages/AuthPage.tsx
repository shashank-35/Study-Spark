import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import ClerkAuthForm from "@/components/ClerkAuthForm";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  AUTH PAGE — Renders the Clerk sign-in / sign-up forms                 */
/*  If user is already logged in → redirect to /                          */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function AuthPage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const _tab = searchParams.get("tab"); // "signin" | "signup" — can be used to pre-select tab

  // If already logged in, bounce to dashboard
  useEffect(() => {
    if (isLoaded && user) {
      navigate("/", { replace: true });
    }
  }, [isLoaded, user, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (user) return null; // will redirect via useEffect

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <ClerkAuthForm />
    </motion.div>
  );
}
