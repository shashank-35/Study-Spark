/**
 * AdminPage – Main admin page that combines layout + all admin sections.
 * Handles routing between sections, realtime subscriptions, and Clerk role gate.
 */
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import Dashboard from '@/components/admin/Dashboard';
import SubjectManager from '@/components/admin/SubjectManager';
import UnitManager from '@/components/admin/UnitManager';
import MaterialManager from '@/components/admin/MaterialManager';
import QuizManager from '@/components/admin/QuizManager';
import StudentManager from '@/components/admin/StudentManager';
import Settings from '@/components/admin/Settings';
import NotificationManager from '@/components/admin/NotificationManager';
import { subscribeToAdminChanges } from '@/lib/adminService';
import { Shield, Sparkles, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Check admin access via Clerk role or email whitelist
  const isAdmin = (() => {
    if (!user) return false;
    const role = user.publicMetadata?.role;
    if (role === 'admin') return true;
    // Fallback: email whitelist (customize as needed)
    const adminEmails = ['kanadeshashank35@gmail.com'];
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    return adminEmails.includes(userEmail ?? '');
  })();

  // Realtime subscription – refreshes all sections on any DB change
  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const sub = subscribeToAdminChanges(triggerRefresh);
    setRealtimeConnected(true);

    return () => {
      sub.unsubscribe();
      setRealtimeConnected(false);
    };
  }, [isAdmin, triggerRefresh]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-glow animate-pulse-glow">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <p className="text-lg font-semibold text-foreground">Loading Admin Panel…</p>
          <div className="flex gap-1.5 justify-center">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Authentication Required</h1>
          <p className="text-sm text-muted-foreground">
            Please sign in to access the admin panel.
          </p>
          <Button onClick={() => navigate('/')}>Go to Sign In</Button>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You don't have admin privileges. Contact your administrator to get the <code className="px-1.5 py-0.5 bg-muted rounded text-xs">admin</code> role
            assigned in Clerk.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  // Render active section
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} refreshKey={refreshKey} />;
      case 'subjects':
        return <SubjectManager refreshKey={refreshKey} />;
      case 'units':
        return <UnitManager refreshKey={refreshKey} />;
      case 'materials':
        return <MaterialManager refreshKey={refreshKey} />;
      case 'quizzes':
        return <QuizManager refreshKey={refreshKey} />;
      case 'students':
        return <StudentManager refreshKey={refreshKey} />;
      case 'settings':
        return <Settings refreshKey={refreshKey} />;
      case 'notifications':
        return <NotificationManager refreshKey={refreshKey} />;
      default:
        return <Dashboard onNavigate={setActiveSection} refreshKey={refreshKey} />;
    }
  };

  return (
    <AdminLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onBackToHome={() => navigate('/')}
      realtimeConnected={realtimeConnected}
    >
      {renderSection()}
    </AdminLayout>
  );
}
