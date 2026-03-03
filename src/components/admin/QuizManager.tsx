/**
 * QuizManager – Create quizzes, add MCQ questions, edit/delete.
 * Includes a quiz builder form and question list editor.
 */
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Brain,
  ListChecks,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAdminQuizzes,
  getAdminSubjects,
  getUnits,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  type AdminQuiz,
  type AdminQuizQuestion,
  type AdminSubject,
  type AdminUnit,
} from '@/lib/adminService';

interface QuizManagerProps {
  refreshKey: number;
}

const EMPTY_QUIZ = {
  subject_id: '' as string,
  unit_id: null as string | null,
  title: '',
  description: '',
  time_limit: 30,
  is_active: true,
};

const EMPTY_QUESTION = {
  question: '',
  options: ['', '', '', ''],
  correct_answer: 0,
  explanation: '',
  order_no: 1,
};

export default function QuizManager({ refreshKey }: QuizManagerProps) {
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>([]);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Quiz Dialog
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [quizForm, setQuizForm] = useState(EMPTY_QUIZ);
  const [saving, setSaving] = useState(false);
  const [deleteQuizId, setDeleteQuizId] = useState<number | null>(null);

  // Question Editor
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>([]);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
  const [deleteQuestionId, setDeleteQuestionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [q, s, u] = await Promise.all([
        getAdminQuizzes(),
        getAdminSubjects(),
        getUnits(),
      ]);
      setQuizzes(q);
      setSubjects(s);
      setUnits(u);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const loadQuestions = async (quizId: number) => {
    try {
      const q = await getQuizQuestions(quizId);
      setQuestions(q);
      setSelectedQuizId(quizId);
    } catch (e) {
      toast.error('Failed to load questions');
    }
  };

  const filtered = quizzes.filter(
    (q) =>
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.subject_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Quiz CRUD
  const openAddQuiz = () => {
    setQuizForm({ ...EMPTY_QUIZ, subject_id: subjects[0]?.id ?? '' });
    setEditingQuizId(null);
    setQuizDialogOpen(true);
  };

  const openEditQuiz = (quiz: AdminQuiz) => {
    setQuizForm({
      subject_id: quiz.subject_id,
      unit_id: quiz.unit_id,
      title: quiz.title,
      description: quiz.description,
      time_limit: quiz.time_limit,
      is_active: quiz.is_active,
    });
    setEditingQuizId(quiz.id);
    setQuizDialogOpen(true);
  };

  const handleSaveQuiz = async () => {
    if (!quizForm.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (editingQuizId) {
        await updateQuiz(editingQuizId, quizForm);
        toast.success('Quiz updated');
      } else {
        await createQuiz(quizForm);
        toast.success('Quiz created');
      }
      setQuizDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deleteQuizId) return;
    try {
      await deleteQuiz(deleteQuizId);
      toast.success('Quiz deleted');
      setDeleteQuizId(null);
      if (selectedQuizId === deleteQuizId) {
        setSelectedQuizId(null);
        setQuestions([]);
      }
      load();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  // Question CRUD
  const openAddQuestion = () => {
    setQuestionForm({ ...EMPTY_QUESTION, order_no: questions.length + 1 });
    setEditingQuestionId(null);
    setQuestionDialogOpen(true);
  };

  const openEditQuestion = (q: AdminQuizQuestion) => {
    setQuestionForm({
      question: q.question,
      options: [...q.options],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      order_no: q.order_no,
    });
    setEditingQuestionId(q.id);
    setQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.question.trim()) { toast.error('Question text is required'); return; }
    if (questionForm.options.some(o => !o.trim())) { toast.error('All options are required'); return; }
    if (!selectedQuizId) return;

    setSaving(true);
    try {
      if (editingQuestionId) {
        await updateQuizQuestion(editingQuestionId, questionForm);
        toast.success('Question updated');
      } else {
        await createQuizQuestion({ ...questionForm, quiz_id: selectedQuizId });
        toast.success('Question added');
      }
      setQuestionDialogOpen(false);
      loadQuestions(selectedQuizId);
      load(); // refresh question counts
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestionId || !selectedQuizId) return;
    try {
      await deleteQuizQuestion(deleteQuestionId);
      toast.success('Question deleted');
      setDeleteQuestionId(null);
      loadQuestions(selectedQuizId);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> Quiz Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{quizzes.length} quizzes created</p>
        </div>
        <Button onClick={openAddQuiz} className="gap-1.5">
          <Plus className="h-4 w-4" /> Create Quiz
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search quizzes…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Two-column layout: Quiz list + Question editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz List */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quizzes</h2>
          {filtered.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-10 text-center">
                <Brain className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No quizzes found</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={openAddQuiz}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Create first quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            filtered.map((quiz) => (
              <Card
                key={quiz.id}
                className={`border-border/60 shadow-card card-hover cursor-pointer transition-all ${
                  selectedQuizId === quiz.id ? 'ring-2 ring-primary border-primary/40' : ''
                }`}
                onClick={() => loadQuestions(quiz.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground">{quiz.title}</p>
                        {quiz.is_active ? (
                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900/20 dark:text-zinc-400">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{quiz.description || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-[10px]">{quiz.subject_name}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <ListChecks className="h-3 w-3" /> {quiz.question_count} questions
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {quiz.time_limit} min
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); openEditQuiz(quiz); }}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteQuizId(quiz.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Question Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Questions {selectedQuizId ? `(${questions.length})` : ''}
            </h2>
            {selectedQuizId && (
              <Button size="sm" variant="outline" className="gap-1" onClick={openAddQuestion}>
                <Plus className="h-3.5 w-3.5" /> Add Question
              </Button>
            )}
          </div>

          {!selectedQuizId ? (
            <Card className="border-border/60">
              <CardContent className="py-10 text-center">
                <HelpCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a quiz to view and manage its questions</p>
              </CardContent>
            </Card>
          ) : questions.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-10 text-center">
                <ListChecks className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No questions yet</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={openAddQuestion}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add first question
                </Button>
              </CardContent>
            </Card>
          ) : (
            questions.map((q, idx) => (
              <Card key={q.id} className="border-border/60 shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                      <div className="space-y-1 mt-2">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                              oi === q.correct_answer
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                : 'bg-muted/50 text-muted-foreground'
                            }`}
                          >
                            {oi === q.correct_answer ? (
                              <CheckCircle className="h-3 w-3 shrink-0" />
                            ) : (
                              <XCircle className="h-3 w-3 shrink-0 opacity-40" />
                            )}
                            {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground mt-2 italic">💡 {q.explanation}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEditQuestion(q)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteQuestionId(q.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingQuizId ? 'Edit Quiz' : 'Create New Quiz'}</DialogTitle>
            <DialogDescription>{editingQuizId ? 'Update your quiz details.' : 'Set up a new quiz for students.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="e.g., OOP Concepts Quiz" />
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={String(quizForm.subject_id)} onValueChange={(v) => setQuizForm({ ...quizForm, subject_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} placeholder="Quiz description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Time Limit (min)</Label>
                <Input type="number" min={1} value={quizForm.time_limit} onChange={(e) => setQuizForm({ ...quizForm, time_limit: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch checked={quizForm.is_active} onCheckedChange={(v) => setQuizForm({ ...quizForm, is_active: v })} />
                  <span className="text-sm text-muted-foreground">{quizForm.is_active ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuiz} disabled={saving}>{saving ? 'Saving…' : editingQuizId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuestionId ? 'Edit Question' : 'Add Question'}</DialogTitle>
            <DialogDescription>MCQ question with 4 options.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Question *</Label>
              <Textarea value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} placeholder="Enter your question" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Options *</Label>
              {questionForm.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      idx === questionForm.correct_answer
                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'border-border text-muted-foreground hover:border-primary'
                    }`}
                    onClick={() => setQuestionForm({ ...questionForm, correct_answer: idx })}
                    title="Mark as correct"
                  >
                    {String.fromCharCode(65 + idx)}
                  </button>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Click the letter circle to set the correct answer</p>
            </div>
            <div className="space-y-2">
              <Label>Explanation (optional)</Label>
              <Input value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} placeholder="Why this is the correct answer" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveQuestion} disabled={saving}>{saving ? 'Saving…' : editingQuestionId ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Quiz */}
      <AlertDialog open={!!deleteQuizId} onOpenChange={(open) => !open && setDeleteQuizId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the quiz and all its questions.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuiz} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Question */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={(open) => !open && setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this question from the quiz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
