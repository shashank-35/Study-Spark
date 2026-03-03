/**
 * AdminLayout – Sidebar + main content area shell for the admin panel.
 * Uses a collapsible sidebar with navigation, realtime status, and dark mode.
 */
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  FileText,
  Brain,
  Users,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Bell,
  Sparkles,
  Wifi,
  WifiOff,
  Home,
  LogOut,
  Shield,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onBackToHome: () => void;
  realtimeConnected: boolean;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'units', label: 'Units', icon: Layers },
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'quizzes', label: 'Quizzes', icon: Brain },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function AdminLayout({
  children,
  activeSection,
  onSectionChange,
  onBackToHome,
  realtimeConnected,
}: AdminLayoutProps) {
  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`${
          collapsed ? 'w-[72px]' : 'w-64'
        } flex flex-col border-r border-border/60 bg-card transition-all duration-300 ease-in-out shrink-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-glow-sm">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <p className="font-bold text-sm text-foreground leading-none">Study Spark</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                    ${
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/40 px-3 py-3 space-y-2">
          {/* Realtime indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
            realtimeConnected
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}>
            {realtimeConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {!collapsed && (
              <span>{realtimeConnected ? 'Realtime Active' : 'Disconnected'}</span>
            )}
          </div>

          {/* User / Back */}
          {!collapsed && user && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">{user.fullName ?? 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.emailAddresses?.[0]?.emailAddress}</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={onBackToHome}
          >
            <Home className="h-3.5 w-3.5" />
            {!collapsed && 'Back to Home'}
          </Button>

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
