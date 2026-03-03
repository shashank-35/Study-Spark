/**
 * Dashboard – Admin overview with stat cards, charts, recent activity.
 * Updates in realtime via parent data refresh.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  FileText,
  Brain,
  Users,
  Code,
  ClipboardList,
  TrendingUp,
  Activity,
  Plus,
  Upload,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import {
  getDashboardStats,
  getRecentMaterials,
  getRecentQuizAttempts,
  type DashboardStats,
  type AdminMaterial,
  type QuizAttempt,
} from '@/lib/adminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  onNavigate: (section: string) => void;
  refreshKey: number;
}

export default function Dashboard({ onNavigate, refreshKey }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<AdminMaterial[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, m, a] = await Promise.all([
          getDashboardStats(),
          getRecentMaterials(5),
          getRecentQuizAttempts(5),
        ]);
        setStats(s);
        setRecentMaterials(m);
        setRecentAttempts(a);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  // Mock chart data (will be live when you have real data)
  const monthlyData = [
    { month: 'Sep', materials: 8, students: 12 },
    { month: 'Oct', materials: 15, students: 18 },
    { month: 'Nov', materials: 12, students: 25 },
    { month: 'Dec', materials: 20, students: 30 },
    { month: 'Jan', materials: 18, students: 35 },
    { month: 'Feb', materials: stats?.totalMaterials ?? 22, students: stats?.totalStudents ?? 40 },
  ];

  const statCards = [
    { icon: BookOpen, label: 'Total Subjects', value: stats?.totalSubjects ?? 0, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { icon: FileText, label: 'Study Materials', value: stats?.totalMaterials ?? 0, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
    { icon: Brain, label: 'Total Quizzes', value: stats?.totalQuizzes ?? 0, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
    { icon: Users, label: 'Active Students', value: stats?.totalStudents ?? 0, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
    { icon: Code, label: 'Code Submissions', value: stats?.totalSubmissions ?? 0, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
    { icon: ClipboardList, label: 'Quiz Attempts', value: stats?.totalQuizAttempts ?? 0, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/60">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your Study Spark platform</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onNavigate('subjects')}>
            <Plus className="h-3.5 w-3.5" /> Add Subject
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onNavigate('materials')}>
            <Upload className="h-3.5 w-3.5" /> Upload Material
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => onNavigate('quizzes')}>
            <Brain className="h-3.5 w-3.5" /> Create Quiz
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className={`border ${card.border} shadow-card card-hover`}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materials per month */}
        <Card className="border-border/60 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Materials Added Per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="materials" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Active students */}
        <Card className="border-border/60 shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-green-500" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="students"
                  stroke="hsl(160, 70%, 45%)"
                  fill="url(#colorStudents)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <Card className="border-border/60 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-primary" />
                Latest Uploads
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary" onClick={() => onNavigate('materials')}>
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentMaterials.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No materials uploaded yet</p>
            ) : (
              recentMaterials.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.title || m.file_name}</p>
                      <p className="text-xs text-muted-foreground">{m.subject_name} · {(m.file_size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    {new Date(m.uploaded_at).toLocaleDateString()}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Quiz Attempts */}
        <Card className="border-border/60 shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-purple-500" />
                Recent Student Activity
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary" onClick={() => onNavigate('students')}>
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No student activity yet</p>
            ) : (
              recentAttempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                      <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Quiz Attempt</p>
                      <p className="text-xs text-muted-foreground">Score: {a.score}/{a.total} · User: {a.user_id.slice(0, 8)}…</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    {new Date(a.started_at).toLocaleDateString()}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
