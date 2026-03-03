import { Sparkles, Mail } from "lucide-react";
import { motion } from "framer-motion";

const footerLinks = [
  { label: "Subjects", href: "#subjects" },
  { label: "Coding Lab", href: "#coding" },
  { label: "Quiz", href: "#quiz" },
  { label: "Profile", href: "#profile" },
];

const legalLinks = ["Privacy Policy", "Terms of Service"];

const EnhancedFooter = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="border-t border-border bg-background mt-20"
    >
      <div className="container mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">

          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">StudySpark</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered study platform built for BCA students to learn smarter, code better, and succeed faster.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Support</h4>
            <a href="mailto:support@studyspark.ai" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-3.5 w-3.5" /> support@studyspark.ai
            </a>
            <div className="flex gap-3 pt-2">
              {["f", "𝕏", "in"].map((icon, i) => (
                <button
                  key={i}
                  className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label={`Social ${icon}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} StudySpark. All rights reserved.
          </p>
          <div className="flex gap-4">
            {legalLinks.map((link) => (
              <button key={link} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {link}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default EnhancedFooter;
