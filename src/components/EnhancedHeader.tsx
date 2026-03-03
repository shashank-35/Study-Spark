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
}

const EnhancedHeader = ({ user, onLogout, onBackToDesktop, onProfileClick, onSearchNavigate, onViewNotifications, onNotificationNavigate }: EnhancedHeaderProps) => {
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
            ? "bg-white/70 dark:bg-zinc-950/70 shadow-[0_1px_3px_rgba(0,0,0,.08)] backdrop-blur-xl border-b border-border/40"
            : "bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md border-b border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-14 gap-3">

            {/* Logo */}
            <button
              onClick={onBackToDesktop}
              className="flex items-center gap-2 shrink-0 group outline-none"
              aria-label="Go home"
            >
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm"
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
              <span className="hidden sm:block text-[15px] font-semibold tracking-tight text-foreground">
                StudySpark
              </span>
            </button>

            {/* Search trigger (desktop) */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex flex-1 max-w-md mx-6 items-center gap-2 h-8 px-3 bg-muted/50 hover:bg-muted/80 border border-transparent hover:border-border/50 rounded-lg transition-all duration-200 group cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-sm text-muted-foreground/60 flex-1 text-left">Search subjects, notes, quizzes…</span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border/60 bg-background/80 px-1.5 text-[10px] font-mono text-muted-foreground select-none">
                Ctrl K
              </kbd>
            </button>

            {/* Right actions */}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg" aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setIsChatbotOpen(!isChatbotOpen)} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg relative" aria-label="AI Assistant">
                <MessageCircle className="h-4 w-4" />
                {isChatbotOpen && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-500 rounded-full" />}
              </Button>

              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg relative"
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
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 ml-1" aria-label="User menu">
                      <Avatar className="h-7 w-7 border border-border">
                        <AvatarImage src={clerkUser.imageUrl} alt={clerkUser.fullName || "User"} />
                        <AvatarFallback className="bg-primary text-white text-xs font-medium">{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 p-0" align="end">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium truncate">{clerkUser.fullName || clerkUser.firstName || "Student"}</p>
                      <p className="text-xs text-muted-foreground truncate">{clerkUser.emailAddresses[0]?.emailAddress}</p>
                    </div>
                    <div className="p-1">
                      <DropdownMenuItem className="cursor-pointer rounded-md gap-2" onClick={onProfileClick}>
                        <User className="h-3.5 w-3.5" /> Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-md gap-2">
                        <Trophy className="h-3.5 w-3.5" /> Achievements
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-md gap-2">
                        <Settings className="h-3.5 w-3.5" /> Settings
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <div className="p-1">
                      <DropdownMenuItem className="cursor-pointer rounded-md gap-2 text-destructive focus:text-destructive" onClick={onLogout}>
                        <LogOut className="h-3.5 w-3.5" /> Log out
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" className="h-8 ml-1 text-xs">Sign In</Button>
              )}

              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-muted-foreground ml-0.5" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile search trigger */}
          <div className="md:hidden pb-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 w-full h-8 px-3 bg-muted/50 rounded-lg"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="text-sm text-muted-foreground/60">Search…</span>
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="md:hidden overflow-hidden border-t border-border/40">
                <div className="py-2 space-y-0.5">
                  <Button variant="ghost" size="sm" onClick={() => { setIsChatbotOpen(true); setMobileMenuOpen(false); }} className="w-full justify-start gap-2 text-muted-foreground h-9">
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
