/**
 * StudentManager – View students, their progress, quiz attempts, coding submissions.
 */
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Users,
  User,
  BookOpen,
  Brain,
  Code,
  Clock,
  BarChart3,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getStudentsList,
  getStudentQuizAttempts,
  getStudentCodingSubmissions,
  type StudentInfo,
  type QuizAttempt,
  type CodingSubmission,
} from '@/lib/adminService';
// Also import local storage students for hybrid display
import { getStudents, type StudentRecord } from '@/lib/storage';

interface StudentManagerProps {
  refreshKey: number;
}

export default function StudentManager({ refreshKey }: StudentManagerProps) {
  const [dbStudents, setDbStudents] = useState<StudentInfo[]>([]);
  const [localStudents, setLocalStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Profile viewer
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [codingSubmissions, setCodingSubmissions] = useState<CodingSubmission[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const db = await getStudentsList();
      setDbStudents(db);
    } catch (e) {
      console.error(e);
    }
    // Also get local storage students
    setLocalStudents(getStudents());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  // Merge: show DB students + local students that aren't duplicates
  const allStudents = [
    ...dbStudents.map((s) => ({
      id: s.user_id,
      name: s.name || s.user_id.slice(0, 12),
      email: s.email || '',
      last_active: s.last_active,
      subjects_count: s.subjects_count ?? 0,
      quiz_attempts_count: s.quiz_attempts_count ?? 0,
      coding_submissions_count: s.coding_submissions_count ?? 0,
      avg_score: s.avg_score ?? 0,
      source: 'supabase' as const,
    })),
    ...localStudents
      .filter((ls) => !dbStudents.find((ds) => ds.user_id === ls.id))
      .map((ls) => ({
        id: ls.id,
        name: ls.name,
        email: ls.email,
        last_active: ls.lastActive,
        subjects_count: 0,
        quiz_attempts_count: 0,
        coding_submissions_count: 0,
        avg_score: ls.progress ?? 0,
        source: 'local' as const,
      })),
  ];

  const filtered = allStudents.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const viewProfile = async (userId: string) => {
    setSelectedUser(userId);
    setProfileOpen(true);
    setProfileLoading(true);
    try {
      const [qa, cs] = await Promise.all([
        getStudentQuizAttempts(userId),
        getStudentCodingSubmissions(userId),
      ]);
      setQuizAttempts(qa);
      setCodingSubmissions(cs);
    } catch (e) {
      console.error(e);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Student Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{allStudents.length} students registered</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, email, or ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Student Table */}
      <Card className="border-border/60 shadow-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/60 bg-muted/30">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subjects</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quiz Attempts</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code Submissions</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Score</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Active</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No students found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email || student.id.slice(0, 16) + '…'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">{student.subjects_count}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">{student.quiz_attempts_count}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Code className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">{student.coding_submissions_count}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            student.avg_score >= 70
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
                              : student.avg_score >= 40
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          {student.avg_score.toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {student.last_active ? new Date(student.last_active).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-muted-foreground hover:text-primary"
                          onClick={() => viewProfile(student.id)}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Student Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Student Profile
            </DialogTitle>
            <DialogDescription>User ID: {selectedUser}</DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="quizzes" className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quizzes" className="gap-1 text-xs">
                  <Brain className="h-3.5 w-3.5" /> Quiz Attempts ({quizAttempts.length})
                </TabsTrigger>
                <TabsTrigger value="coding" className="gap-1 text-xs">
                  <Code className="h-3.5 w-3.5" /> Code Submissions ({codingSubmissions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="quizzes" className="space-y-3 mt-3">
                {quizAttempts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No quiz attempts</p>
                ) : (
                  quizAttempts.map((a) => (
                    <div key={a.id} className="p-3 rounded-xl bg-muted/40 border border-border/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{a.quiz_title || `Quiz #${a.quiz_id}`}</p>
                          <p className="text-xs text-muted-foreground">
                            Score: {a.score}/{a.total} · {new Date(a.started_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            (Number(a.score) / (Number(a.total) || 1)) * 100 >= 70
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          {a.total > 0 ? ((Number(a.score) / Number(a.total)) * 100).toFixed(0) : 0}%
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="coding" className="space-y-3 mt-3">
                {codingSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No coding submissions</p>
                ) : (
                  codingSubmissions.map((s) => (
                    <div key={s.id} className="p-3 rounded-xl bg-muted/40 border border-border/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.problem_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.language} · {new Date(s.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            s.status === 'passed'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : s.status === 'failed'
                              ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}
                        >
                          {s.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
