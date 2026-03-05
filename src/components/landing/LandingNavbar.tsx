import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Progress", href: "#progress" },
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Contact", href: "#contact" },
];

/* ═══════════════════════════════════════════════════════════════════════ */
/*  LANDING NAVBAR — Modern SaaS style                                    */
/*  • Center nav links                                                    */
/*  • Glassmorphism on scroll                                             */
/*  • CTA: "Get Started" rounded-full with gradient + hover glow         */
/* ═══════════════════════════════════════════════════════════════════════ */

function LandingNavbar({
  onSignup,
}: {
  onSignup: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm shadow-blue-500/5 dark:shadow-none border-b border-blue-100/60 dark:border-gray-800/60"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
            <GraduationCap className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">StudySpark</span>
        </a>

        {/* Center Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100/60 dark:hover:bg-white/10 transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden lg:flex items-center">
          <Button
            onClick={onSignup}
            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold px-6 py-2.5 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all duration-200"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            Get Started
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 pb-1">
                <Button
                  onClick={() => { setMobileOpen(false); onSignup(); }}
                  className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default memo(LandingNavbar);
