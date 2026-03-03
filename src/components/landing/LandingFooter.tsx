import { GraduationCap, Heart } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  LANDING FOOTER                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function LandingFooter() {
  return (
    <footer className="relative py-12 px-4 sm:px-6 border-t border-purple-200/30 dark:border-white/10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-foreground/80">StudySpark</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Contact</a>
        </div>

        {/* Copyright */}
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          Made with <Heart className="h-3.5 w-3.5 text-red-400 fill-red-400" /> for BCA students
        </p>
      </div>
    </footer>
  );
}
