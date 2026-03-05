import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  Trophy,
  Moon,
  Sun,
  Sparkles,
  Menu,
  X,
  MessageCircle,
  BookOpen,
  Brain,
  Code,
  Calendar,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import StudySparkChatbot from "./StudySparkChatbot";
import SearchModal from "./SearchModal";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";
import type { SearchCategory } from "@/lib/searchService";

interface EnhancedHeaderProps {
  user?: { name: string; email: string; semester: string; college: string };
  onLogout?: () => void;
  onBackToDesktop?: () => void;
  onProfileClick?: () => void;
  onSearchNavigate?: (category: SearchCategory, id: string) => void;
  onViewNotifications?: () => void;
  onNotificationNavigate?: (link: string) => void;
  onNavigate?: (view: string) => void;
}

const EnhancedHeader = ({ user, onLogout, onBackToDesktop, onProfileClick, onSearchNavigate, onViewNotifications, onNotificationNavigate, onNavigate }: EnhancedHeaderProps) => {
  const { user: clerkUser } = useUser();
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const notifRef = useRef<HTMLDivElement>(null);

  // Notifications hook
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    markRead,
    markAllRead,
    remove: removeNotif,
  } = useNotifications(clerkUser?.id);

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearchNavigate = useCallback(
    (category: SearchCategory, id: string) => {
      onSearchNavigate?.(category, id);
    },
    [onSearchNavigate],
  );

  const initials = (clerkUser?.fullName || clerkUser?.firstName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          scrolled
            ? "bg-white/70 dark:bg-zinc-950/80 shadow-glass backdrop-blur-xl border-b border-white/30 dark:border-white/[0.06]"
            : "bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 gap-3">

            {/* Logo */}
            <button
              onClick={onBackToDesktop}
              className="flex items-center gap-2.5 shrink-0 group outline-none"
              aria-label="Go home"
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: 3 }}
                whileTap={{ scale: 0.94 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/20"
              >
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </motion.div>
              <span className="hidden sm:block text-[15px] font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                StudySpark
              </span>
            </button>

            {/* Search trigger (desktop) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex flex-1 max-w-md mx-6 items-center gap-2.5 h-9 px-3.5 bg-white/50 dark:bg-white/[0.04] hover:bg-white/70 dark:hover:bg-white/[0.06] border border-white/40 dark:border-white/[0.08] hover:border-primary/20 rounded-xl backdrop-blur-sm transition-all duration-200 group cursor-pointer shadow-sm"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 group-hover:text-primary/60 transition-colors" />
              <span className="text-sm text-muted-foreground/50 flex-1 text-left">Search subjects, notes, quizzes…</span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded-md border border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-1.5 text-[10px] font-mono text-muted-foreground/60 select-none">
                Ctrl K
              </kbd>
            </button>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setIsChatbotOpen(!isChatbotOpen)} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06] relative" aria-label="AI Assistant">
                <MessageCircle className="h-4 w-4" />
                {isChatbotOpen && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full ring-2 ring-white dark:ring-zinc-900" />}
              </Button>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06] relative"
                  aria-label="Notifications"
                  onClick={() => setNotifOpen((p) => !p)}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 z-50"
                    >
                      <NotificationDropdown
                        notifications={notifications}
                        unreadCount={unreadCount}
                        loading={notifLoading}
                        onMarkRead={markRead}
                        onMarkAllRead={markAllRead}
                        onDelete={removeNotif}
                        onNavigate={(link) => {
                          setNotifOpen(false);
                          onNotificationNavigate?.(link);
                        }}
                        onViewAll={() => {
                          setNotifOpen(false);
                          onViewNotifications?.();
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {clerkUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-1" aria-label="User menu">
                      <Avatar className="h-8 w-8 border-2 border-white/50 dark:border-white/10 shadow-sm">
                        <AvatarImage src={clerkUser.imageUrl} alt={clerkUser.fullName || "User"} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 p-0 glass-card" align="end">
                    <div className="px-4 py-3 border-b border-white/20 dark:border-white/[0.06]">
                      <p className="text-sm font-semibold truncate">{clerkUser.fullName || clerkUser.firstName || "Student"}</p>
                      <p className="text-xs text-muted-foreground truncate">{clerkUser.emailAddresses[0]?.emailAddress}</p>
                    </div>
                    <div className="p-1">
                      <DropdownMenuItem className="cursor-pointer rounded-xl gap-2.5 hover:bg-primary/5" onClick={onProfileClick}>
                        <User className="h-3.5 w-3.5" /> Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-xl gap-2.5 hover:bg-primary/5">
                        <Trophy className="h-3.5 w-3.5" /> Achievements
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-xl gap-2.5 hover:bg-primary/5">
                        <Settings className="h-3.5 w-3.5" /> Settings
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator className="bg-white/20 dark:bg-white/[0.06]" />
                    <div className="p-1">
                      <DropdownMenuItem className="cursor-pointer rounded-xl gap-2.5 text-destructive focus:text-destructive hover:bg-destructive/5" onClick={onLogout}>
                        <LogOut className="h-3.5 w-3.5" /> Log out
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" className="h-8 ml-1 text-xs">Sign In</Button>
              )}

              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-muted-foreground ml-0.5 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile search trigger */}
          <div className="md:hidden pb-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 w-full h-9 px-3.5 bg-white/50 dark:bg-white/[0.04] border border-white/40 dark:border-white/[0.08] rounded-xl backdrop-blur-sm"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <span className="text-sm text-muted-foreground/50">Search…</span>
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="md:hidden overflow-hidden border-t border-white/20 dark:border-white/[0.06]">
                <div className="py-2 space-y-0.5">
                  <Button variant="ghost" size="sm" onClick={() => { onNavigate?.("dashboard"); setMobileMenuOpen(false); }} className="w-full justify-start gap-2.5 text-muted-foreground h-9 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]">
                    <BookOpen className="h-4 w-4" /> Dashboard
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { onNavigate?.("subjects"); setMobileMenuOpen(false); }} className="w-full justify-start gap-2.5 text-muted-foreground h-9 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]">
                    <BookOpen className="h-4 w-4" /> Subjects
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { onNavigate?.("quiz"); setMobileMenuOpen(false); }} className="w-full justify-start gap-2.5 text-muted-foreground h-9 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]">
                    <Brain className="h-4 w-4" /> Quiz
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { onNavigate?.("coding"); setMobileMenuOpen(false); }} className="w-full justify-start gap-2.5 text-muted-foreground h-9 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]">
                    <Code className="h-4 w-4" /> Coding Lab
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { onNavigate?.("planner"); setMobileMenuOpen(false); }} className="w-full justify-start gap-2.5 text-muted-foreground h-9 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]">
                    <Calendar className="h-4 w-4" /> Study Planner
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { onNavigate?.("progress"); setMobileMenuOpen(false); }} className="w-full justify-start gap-2.5 text-muted-foreground h-9 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]">
                    <TrendingUp className="h-4 w-4" /> Analytics
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { onNavigate?.("career"); setMobileMenuOpen(false); }} className="w-full justify-start gap-2.5 text-muted-foreground h-9 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]">
                    <Briefcase className="h-4 w-4" /> Careers
                  </Button>
                  <div className="border-t border-white/20 dark:border-white/[0.06] my-1" />
                  <Button variant="ghost" size="sm" onClick={() => { setIsChatbotOpen(true); setMobileMenuOpen(false); }} className="w-full justify-start gap-2.5 text-muted-foreground h-9 rounded-xl hover:bg-white/50 dark:hover:bg-white/[0.06]">
                    <MessageCircle className="h-4 w-4" /> AI Assistant
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <StudySparkChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {/* Global Search Modal */}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />
    </>
  );
};

export default EnhancedHeader;
