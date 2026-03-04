/**
 * QuizPlayer – Plays admin-created quizzes from Supabase for a specific subject.
 * Features: animated transitions, timer, score tracking, answer review, progress bar.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Brain, Clock, Trophy, Target, CheckCircle, XCircle, RefreshCw,
  ArrowLeft, ArrowRight, ListChecks, Loader2, Sparkles, Home,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useProgress } from '@/hooks/useProgressContext';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────
interface Quiz {
  id: number;
  title: string;
  description: string;
  time_limit: number;
  is_active: boolean;
  subject_id: string;
}

interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  order_no: number;
}

interface QuizPlayerProps {
  subjectId: string;
  subjectName: string;
  onBack: () => void;
  onBackToDesktop?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────
export default function QuizPlayer({ subjectId, subjectName, onBack, onBackToDesktop }: QuizPlayerProps) {
  const { recordQuizCompletion } = useProgress();

  // Data
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Quiz state
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<{ selected: number; correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [saving, setSaving] = useState(false);
  const savedRef = useRef(false);

  // ─── Load quizzes for this subject ────────────────────────────────
  const loadSubjectQuizzes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data ?? []);
    } catch (e) {
      console.error('Failed to load quizzes:', e);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { loadSubjectQuizzes(); }, [loadSubjectQuizzes]);

  // Realtime: refresh quizzes when admin changes them
  useEffect(() => {
    const channel = supabase
      .channel(`quiz_player_realtime_${subjectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => {
        loadSubjectQuizzes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [subjectId, loadSubjectQuizzes]);

  // ─── Load questions for selected quiz ─────────────────────────────
  const loadQuestions = useCallback(async (quiz: Quiz) => {
    setQuestionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_no', { ascending: true });

      if (error) throw error;
      setQuestions(data ?? []);
      setSelectedQuiz(quiz);
    } catch (e) {
      console.error('Failed to load questions:', e);
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  // ─── Timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up
          setFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, finished]);

  // ─── Save quiz result to Supabase when finished ───────────────────
  useEffect(() => {
    if (!finished || savedRef.current || answers.length === 0) return;
    savedRef.current = true;
    const correctCount = answers.filter((a) => a.correct).length;

    setSaving(true);
    recordQuizCompletion({
      quizId: selectedQuiz?.id ?? null,
      subjectId,
      subjectName,
      score: correctCount,
      total: questions.length,
      answers: answers.map((a) => a.correct),
    })
      .then(() => toast.success('Quiz result saved!'))
      .catch((e) => {
        console.warn('Failed to save quiz result:', e);
        toast.error('Failed to save quiz result');
      })
      .finally(() => setSaving(false));
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Actions ──────────────────────────────────────────────────────
  const startQuiz = () => {
    setStarted(true);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setAnswers([]);
    setFinished(false);
    setTimeLeft((selectedQuiz?.time_limit ?? 30) * 60);
  };

  const selectAnswer = (idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
  };

  const confirmAnswer = () => {
    if (selectedAnswer === null) return;
    const q = questions[currentIdx];
    const correct = selectedAnswer === q.correct_answer;
    setAnswers((prev) => [...prev, { selected: selectedAnswer, correct }]);
    setAnswered(true);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const restartQuiz = () => {
    setStarted(false);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setAnswers([]);
    setFinished(false);
    savedRef.current = false;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const score = answers.filter((a) => a.correct).length;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const getScoreColor = (p: number) => {
    if (p >= 80) return 'text-green-600 dark:text-green-400';
    if (p >= 60) return 'text-blue-600 dark:text-blue-400';
    if (p >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreMessage = (p: number) => {
    if (p >= 90) return "Outstanding! You've mastered this topic! 🌟";
    if (p >= 70) return "Great job! Your concepts are strong! 🎉";
    if (p >= 50) return "Good effort! Keep practicing! 💪";
    return "Don't worry, review the explanations and try again! 📚";
  };

  // ─── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ─── No quizzes available ─────────────────────────────────────────
  if (quizzes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{subjectName} – Quiz</h2>
            <p className="text-sm text-muted-foreground">No quizzes available yet</p>
          </div>
        </div>
        <Card className="border-border/60">
          <CardContent className="py-16 text-center">
            <Brain className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-1">No Quizzes Yet</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              The admin hasn't added any quizzes for {subjectName} yet. Check back later!
            </p>
            <Button variant="outline" className="mt-4" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Quiz selection (list of quizzes for this subject) ────────────
  if (!selectedQuiz || !started) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                {subjectName} – Quizzes
              </h2>
              <p className="text-sm text-muted-foreground">{quizzes.length} quiz{quizzes.length > 1 ? 'zes' : ''} available</p>
            </div>
          </div>
          {onBackToDesktop && (
            <Button variant="outline" size="sm" onClick={onBackToDesktop}>
              <Home className="h-4 w-4 mr-1.5" /> Desktop
            </Button>
          )}
        </div>

        {/* Quiz cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card
                className="border-border/60 shadow-card cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all group"
                onClick={() => loadQuestions(quiz)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base group-hover:text-primary transition-colors">{quiz.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{quiz.description || 'Test your knowledge'}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" /> {quiz.time_limit} min
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ListChecks className="h-3.5 w-3.5" /> MCQ
                    </span>
                  </div>
                  {selectedQuiz?.id === quiz.id && !questionsLoading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pt-3 border-t border-border/40"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">{questions.length} questions loaded</span>
                        <Badge variant="outline" className="text-xs">{quiz.time_limit} min limit</Badge>
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 text-white gap-2"
                        onClick={(e) => { e.stopPropagation(); startQuiz(); }}
                      >
                        <Sparkles className="h-4 w-4" /> Start Quiz
                      </Button>
                    </motion.div>
                  )}
                  {selectedQuiz?.id === quiz.id && questionsLoading && (
                    <div className="flex items-center justify-center py-4 mt-3 border-t border-border/40">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading questions…</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Results screen ───────────────────────────────────────────────
  if (finished) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-blue-600/5 overflow-hidden">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-3 drop-shadow-lg" />
              </motion.div>
              <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
              <CardDescription>{selectedQuiz.title}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-5 pb-6">
              <div className={`text-5xl font-bold ${getScoreColor(percentage)}`}>
                {score}/{questions.length}
              </div>
              <div className="text-xl font-semibold text-foreground">{percentage}%</div>
              <Progress value={percentage} className="h-3 max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground">{getScoreMessage(percentage)}</p>

              {saving && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving result…
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Button onClick={restartQuiz} className="gap-1.5 bg-gradient-to-r from-primary to-blue-600 text-white">
                  <RefreshCw className="h-4 w-4" /> Try Again
                </Button>
                <Button variant="outline" onClick={() => { setSelectedQuiz(null); setStarted(false); }}>
                  Other Quizzes
                </Button>
                <Button variant="ghost" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Answer Review */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Answer Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.map((q, idx) => {
              const ans = answers[idx];
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl border ${
                    ans?.correct
                      ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/40'
                      : 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {ans?.correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1.5">{q.question}</p>
                      {ans && !ans.correct && (
                        <p className="text-xs text-red-600 dark:text-red-400 mb-0.5">
                          Your answer: {q.options[ans.selected]}
                        </p>
                      )}
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✓ Correct: {q.options[q.correct_answer]}
                      </p>
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground mt-1.5 italic">💡 {q.explanation}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Active quiz ──────────────────────────────────────────────────
  const currentQ = questions[currentIdx];
  const progressPercent = ((currentIdx + 1) / questions.length) * 100;
  const isTimeLow = timeLeft < 60;

  return (
    <div className="space-y-5 max-w-2xl mx-auto animate-fade-in">
      {/* Progress header */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2.5">
            <Badge variant="outline" className="text-xs">
              Question {currentIdx + 1} of {questions.length}
            </Badge>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">{selectedQuiz.title}</span>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                isTimeLow
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}>
                <Clock className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="border-border/60 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg leading-relaxed">{currentQ.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === currentQ.correct_answer;
                let optionClass = 'border-border/60 hover:border-primary/40 hover:bg-primary/5';

                if (answered) {
                  if (isCorrect) {
                    optionClass = 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-700';
                  } else if (isSelected && !isCorrect) {
                    optionClass = 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700';
                  } else {
                    optionClass = 'border-border/30 opacity-50';
                  }
                } else if (isSelected) {
                  optionClass = 'border-primary bg-primary/10 ring-2 ring-primary/20';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => selectAnswer(idx)}
                    disabled={answered}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${optionClass}`}
                  >
                    <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                      answered && isCorrect
                        ? 'border-green-500 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                        : answered && isSelected && !isCorrect
                        ? 'border-red-500 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        : isSelected
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border text-muted-foreground'
                    }`}>
                      {answered && isCorrect ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : answered && isSelected && !isCorrect ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        String.fromCharCode(65 + idx)
                      )}
                    </span>
                    <span className="text-sm text-foreground">{opt}</span>
                  </button>
                );
              })}

              {/* Explanation after answer */}
              {answered && currentQ.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-800/40"
                >
                  <p className="text-xs text-blue-700 dark:text-blue-400">💡 {currentQ.explanation}</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { setFinished(true); if (timerRef.current) clearInterval(timerRef.current); }}>
          End Quiz
        </Button>
        {!answered ? (
          <Button
            onClick={confirmAnswer}
            disabled={selectedAnswer === null}
            className="gap-1.5 bg-gradient-to-r from-primary to-blue-600 text-white"
          >
            Confirm Answer
          </Button>
        ) : (
          <Button onClick={nextQuestion} className="gap-1.5">
            {currentIdx + 1 === questions.length ? 'See Results' : 'Next Question'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
