import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Clock, Trophy, Target, CheckCircle, X, RefreshCw, Code, Database, Globe, Coffee, ArrowLeft, Zap, BarChart3, Eye, Flame, ChevronRight, Timer } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useProgress } from "@/hooks/useProgressContext";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface QuizRow {
  id: number;
  subject_id: string | null;
  title: string;
  description: string;
  time_limit: number;
  subject_name?: string;
}

interface QuestionRow {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  order_no: number;
}

/* ─── Fallback Hardcoded Questions (used only when DB has none) ─────── */

const FALLBACK_SUBJECTS = [
  { name: "Programming in C", icon: <Code className="h-8 w-8" />, color: "from-blue-500 to-blue-600" },
  { name: "Java & OOP", icon: <Coffee className="h-8 w-8" />, color: "from-orange-500 to-orange-600" },
  { name: "Database Management", icon: <Database className="h-8 w-8" />, color: "from-green-500 to-green-600" },
  { name: "Web Development", icon: <Globe className="h-8 w-8" />, color: "from-pink-500 to-pink-600" },
];

const FALLBACK_QUIZZES: Record<string, { question: string; options: string[]; correct: number; explanation: string }[]> = {
  "Programming in C": [
    { question: "What is the correct syntax to declare a pointer in C?", options: ["int *p;", "int p*;", "pointer int p;", "*int p;"], correct: 0, explanation: "In C, pointers are declared using the asterisk (*) before the variable name: int *p;" },
    { question: "Which header file is required for printf() function?", options: ["<stdlib.h>", "<string.h>", "<stdio.h>", "<math.h>"], correct: 2, explanation: "The printf() function is declared in <stdio.h> (standard input/output header file)." },
    { question: "What does '&' operator do in C?", options: ["Logical AND", "Address of operator", "Bitwise AND", "Reference operator"], correct: 1, explanation: "The '&' operator in C is the address-of operator, used to get the memory address of a variable." },
  ],
  "Java & OOP": [
    { question: "Which of these is NOT a pillar of Object-Oriented Programming?", options: ["Encapsulation", "Inheritance", "Polymorphism", "Compilation"], correct: 3, explanation: "The four pillars of OOP are Encapsulation, Inheritance, Polymorphism, and Abstraction." },
    { question: "What is the correct way to create an object in Java?", options: ["MyClass obj = new MyClass();", "MyClass obj = MyClass();", "new MyClass obj;", "create MyClass obj;"], correct: 0, explanation: "In Java, objects are created using the 'new' keyword: MyClass obj = new MyClass();" },
    { question: "Which keyword is used for inheritance in Java?", options: ["implements", "extends", "inherits", "super"], correct: 1, explanation: "The 'extends' keyword is used for class inheritance in Java." },
  ],
  "Database Management": [
    { question: "What does SQL stand for?", options: ["Structured Query Language", "Standard Query Language", "Simple Query Language", "System Query Language"], correct: 0, explanation: "SQL stands for Structured Query Language, used for managing relational databases." },
    { question: "Which SQL command is used to retrieve data?", options: ["GET", "SELECT", "FETCH", "RETRIEVE"], correct: 1, explanation: "SELECT is the SQL command used to retrieve data from database tables." },
    { question: "What is a primary key?", options: ["A key that opens the database", "A unique identifier for each record", "The first column in a table", "A password for database access"], correct: 1, explanation: "A primary key is a unique identifier that ensures each record in a table can be uniquely identified." },
  ],
  "Web Development": [
    { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"], correct: 0, explanation: "HTML stands for HyperText Markup Language." },
    { question: "Which CSS property changes text color?", options: ["font-color", "text-color", "color", "foreground-color"], correct: 2, explanation: "The 'color' property in CSS is used to set the color of text." },
    { question: "What does DOM stand for?", options: ["Document Object Model", "Data Object Management", "Dynamic Object Method", "Document Oriented Model"], correct: 0, explanation: "DOM stands for Document Object Model." },
  ],
};

/* ─────────────────────────────────────────────────────────────────────────── */

const QuizGenerator = ({ onBackToDesktop }: { onBackToDesktop?: () => void }) => {
  const { user } = useUser();
  const userId = user?.id;
  const { recordQuizCompletion } = useProgress();

  /* ── State ── */
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [dbQuizzes, setDbQuizzes] = useState<QuizRow[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizRow | null>(null);
  const [selectedFallbackSubject, setSelectedFallbackSubject] = useState<string | null>(null);
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correct: number; explanation: string }[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  /* ── New Gamification State ── */
  const [timeLeft, setTimeLeft] = useState(30); // per-question countdown
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]); // seconds per question
  const questionStartRef = useRef<number>(Date.now());
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]); // track actual selected indices
  const [points, setPoints] = useState(0); // gamified point score
  const [showCelebration, setShowCelebration] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const usesFallback = dbQuizzes.length === 0;

  /* ── Load quizzes from DB ── */
  const loadQuizzes = useCallback(async () => {
    setLoadingQuizzes(true);
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id, subject_id, title, description, time_limit, subjects(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows: QuizRow[] = (data ?? []).map((q: any) => ({
        id: q.id,
        subject_id: q.subject_id,
        title: q.title,
        description: q.description ?? "",
        time_limit: q.time_limit ?? 30,
        subject_name: q.subjects?.name ?? "General",
      }));
      setDbQuizzes(rows);
    } catch {
      setDbQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  }, []);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);

  // Realtime: refresh quiz list when quizzes are added/updated/deleted
  useEffect(() => {
    const channel = supabase
      .channel('quiz_generator_quizzes_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => {
        loadQuizzes();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadQuizzes]);

  /* ── Load questions for a DB quiz ── */
  const loadQuestions = useCallback(async (quizId: number) => {
    setLoadingQuestions(true);
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("id, question, options, correct_answer, explanation, order_no")
        .eq("quiz_id", quizId)
        .order("order_no", { ascending: true });

      if (error) throw error;

      setQuestions(
        (data ?? []).map((q: any) => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          correct: q.correct_answer ?? 0,
          explanation: q.explanation ?? "",
        }))
      );
    } catch {
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  /* ── Select a quiz ── */
  const handleSelectDbQuiz = async (quiz: QuizRow) => {
    setSelectedQuiz(quiz);
    setSelectedFallbackSubject(null);
    await loadQuestions(quiz.id);
    setQuizStarted(false);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
  };

  const handleSelectFallbackSubject = (name: string) => {
    setSelectedFallbackSubject(name);
    setSelectedQuiz(null);
    setQuestions(
      FALLBACK_QUIZZES[name]?.map((q) => ({ ...q })) ?? []
    );
    setQuizStarted(false);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
    setStartTime(new Date());
    setStreak(0);
    setBestStreak(0);
    setPoints(0);
    setQuestionTimes([]);
    setSelectedAnswers([]);
    setShowAnswerFeedback(false);
    setShowCelebration(false);
    setTimeLeft(30);
    questionStartRef.current = Date.now();
  };

  // Refs for timer closures to always see latest state
  const currentQuestionRef = useRef(currentQuestion);
  currentQuestionRef.current = currentQuestion;
  const questionsLenRef = useRef(questions.length);
  questionsLenRef.current = questions.length;

  const advanceQuestion = useCallback(() => {
    setShowAnswerFeedback(false);
    if (currentQuestionRef.current + 1 < questionsLenRef.current) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setTimeLeft(30);
      questionStartRef.current = Date.now();
    } else {
      setShowResult(true);
      setShowCelebration(true);
    }
  }, []);

  const handleTimeUp = useCallback(() => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    setQuestionTimes(prev => [...prev, elapsed]);
    setSelectedAnswers(prev => [...prev, -1]);
    setAnswers(prev => [...prev, false]);
    setStreak(0);
    setLastAnswerCorrect(false);
    setShowAnswerFeedback(true);
    setTimeout(() => advanceQuestion(), 1500);
  }, [advanceQuestion]);

  /* ── Per-question Countdown Timer ── */
  useEffect(() => {
    if (!quizStarted || showResult || showAnswerFeedback) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [quizStarted, currentQuestion, showResult, showAnswerFeedback, handleTimeUp]);

  const handleAnswerSelect = (idx: number) => {
    if (showAnswerFeedback) return; // prevent re-click during feedback
    setSelectedAnswer(idx);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null || showAnswerFeedback) return;

    // Stop timer
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    const isCorrect = selectedAnswer === questions[currentQuestion].correct;

    // Calculate points: base 100, time bonus up to 50
    const timeBonus = isCorrect ? Math.max(0, Math.round((30 - elapsed) / 30 * 50)) : 0;
    const streakBonus = isCorrect ? Math.min(streak, 4) * 25 : 0;
    const questionPoints = isCorrect ? 100 + timeBonus + streakBonus : 0;

    const newStreak = isCorrect ? streak + 1 : 0;
    const newBestStreak = Math.max(bestStreak, newStreak);
    const newAnswers = [...answers, isCorrect];
    const newScore = isCorrect ? score + 1 : score;

    setAnswers(newAnswers);
    setScore(newScore);
    setSelectedAnswers(prev => [...prev, selectedAnswer]);
    setQuestionTimes(prev => [...prev, elapsed]);
    setStreak(newStreak);
    setBestStreak(newBestStreak);
    setPoints(prev => prev + questionPoints);
    setLastAnswerCorrect(isCorrect);
    setShowAnswerFeedback(true);

    // Show feedback briefly then advance
    setTimeout(() => {
      setShowAnswerFeedback(false);
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setTimeLeft(30);
        questionStartRef.current = Date.now();
      } else {
        setShowResult(true);
        setShowCelebration(true);
        saveQuizResult(newScore, questions.length, newAnswers);
      }
    }, 1200);
  };

  /* ── Save result via shared ProgressContext ── */
  const saveQuizResult = async (finalScore: number, total: number, finalAnswers: boolean[]) => {
    if (!userId) return;
    setSaving(true);
    try {
      const subjectName = selectedQuiz?.subject_name || selectedFallbackSubject || "General";
      await recordQuizCompletion({
        quizId: selectedQuiz?.id ?? null,
        subjectId: selectedQuiz?.subject_id ?? '',
        subjectName,
        score: finalScore,
        total,
        answers: finalAnswers,
      });
      toast.success("Quiz result saved!");
    } catch (e) {
      console.warn("Failed to save quiz result:", e);
      toast.error("Failed to save quiz result");
    } finally {
      setSaving(false);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizStarted(false);
    setStartTime(null);
    setStreak(0);
    setBestStreak(0);
    setPoints(0);
    setQuestionTimes([]);
    setSelectedAnswers([]);
    setShowAnswerFeedback(false);
    setShowCelebration(false);
    setTimeLeft(30);
  };

  const getScoreMessage = (pct: number) => {
    if (pct >= 90) return { message: "Outstanding! You nailed it! 🌟", color: "text-green-600 dark:text-green-400" };
    if (pct >= 70) return { message: "Great job! Solid knowledge! 🎉", color: "text-blue-600 dark:text-blue-400" };
    if (pct >= 50) return { message: "Good effort! Keep practicing! 💪", color: "text-yellow-600 dark:text-yellow-400" };
    return { message: "Don't worry, practice makes perfect! 📚", color: "text-orange-600 dark:text-orange-400" };
  };

  const quizTitle = selectedQuiz?.title || selectedFallbackSubject || "Quiz";

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Quiz Selection                                               */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (!selectedQuiz && !selectedFallbackSubject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title text-2xl">Quiz Time 🧠</h2>
            <p className="text-muted-foreground text-sm mt-1 ml-5">Test your knowledge with real-time quizzes</p>
          </div>
          {onBackToDesktop && (
            <Button onClick={onBackToDesktop} variant="outline" size="sm" className="gap-2 rounded-xl border-white/40 dark:border-white/[0.08] hover:border-primary/30 hover:text-primary hover:bg-primary/5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
        </div>

        {loadingQuizzes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-6 space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-full" /><Skeleton className="h-9 w-full" /></div>
            ))}
          </div>
        ) : (
          <>
            {/* DB Quizzes */}
            {dbQuizzes.length > 0 && (
              <>
                <h3 className="section-title">Available Quizzes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dbQuizzes.map((q) => (
                    <div
                      key={q.id}
                      className="glass-card cursor-pointer hover:border-primary/30 transition-all p-6"
                      onClick={() => handleSelectDbQuiz(q)}
                    >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-500/5 flex items-center justify-center shrink-0 shadow-sm">
                            <Brain className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground">{q.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{q.subject_name} · {q.time_limit} min</p>
                          </div>
                        </div>
                        {q.description && <p className="text-sm text-muted-foreground mb-3">{q.description}</p>}
                        <button className="btn-gradient w-full">
                          <Brain className="h-4 w-4" /> Start Quiz
                        </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Fallback / Practice Quizzes */}
            <h3 className="section-title mt-4">
              {dbQuizzes.length > 0 ? "Practice Quizzes" : "Quick Practice Quizzes"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FALLBACK_SUBJECTS.map((sub, i) => (
                <div
                  key={i}
                  className="glass-card cursor-pointer hover:border-primary/30 transition-all p-6 text-center"
                  onClick={() => handleSelectFallbackSubject(sub.name)}
                >
                    <div className="mb-3 flex justify-center text-primary">{sub.icon}</div>
                    <h4 className="font-semibold text-foreground mb-1">{sub.name}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{FALLBACK_QUIZZES[sub.name]?.length ?? 0} questions</p>
                    <button className={`btn-gradient w-full !bg-gradient-to-r !from-${sub.color.split(' ')[0].replace('from-', '')} !to-${sub.color.split(' ')[1].replace('to-', '')}`} style={{background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`}}>
                      <Brain className="h-4 w-4" /> Start
                    </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Loading Questions                                            */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (loadingQuestions) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-60" />
        <div className="glass-card p-8 space-y-4">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Quiz Result                                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (showResult) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const scoreMsg = getScoreMessage(percentage);
    const totalTime = questionTimes.reduce((a, b) => a + b, 0);
    const avgTime = questions.length > 0 ? Math.round(totalTime / questions.length) : 0;
    // Find weak topics — wrong answers
    const wrongIndices = answers.map((a, i) => (!a ? i : -1)).filter(i => i >= 0);

    return (
      <div className="space-y-5 animate-fade-in">
        {/* Celebration header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="gradient-card p-8 text-center text-white relative overflow-hidden"
        >
          {/* Animated confetti dots */}
          {showCelebration && percentage >= 50 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#fbbf24', '#a78bfa', '#34d399', '#f472b6', '#60a5fa'][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: '-8px',
                  }}
                  animate={{
                    y: [0, window.innerHeight * 0.6],
                    x: [0, (Math.random() - 0.5) * 200],
                    opacity: [1, 0],
                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                  }}
                  transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5, ease: "easeOut" }}
                />
              ))}
            </div>
          )}

          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Trophy className="h-16 w-16 text-yellow-300 mx-auto mb-3 drop-shadow-lg" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-1">Quiz Complete! 🎉</h2>
          <p className="text-white/70 text-sm">{quizTitle}</p>

          {/* Score circle */}
          <div className="mt-6 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-28 h-28 mx-auto rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 flex flex-col items-center justify-center"
            >
              <span className="text-4xl font-bold tabular-nums">{score}/{questions.length}</span>
              <span className="text-sm font-medium text-white/80">{percentage}%</span>
            </motion.div>
          </div>

          <p className={`text-base font-medium text-white/90 mb-1`}>{scoreMsg.message}</p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-300" />
              <p className="text-xl font-bold tabular-nums">{points}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Points</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <Flame className="h-4 w-4 mx-auto mb-1 text-orange-300" />
              <p className="text-xl font-bold tabular-nums">{bestStreak}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Best Streak</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <Timer className="h-4 w-4 mx-auto mb-1 text-cyan-300" />
              <p className="text-xl font-bold tabular-nums">{avgTime}s</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Avg Time</p>
            </div>
          </div>

          {saving && <p className="text-xs text-white/50 mt-3 animate-pulse">Saving result…</p>}

          <div className="flex justify-center gap-3 pt-5">
            <button onClick={handleRestartQuiz} className="btn-gradient !bg-white/20 backdrop-blur-sm border border-white/30">
              <RefreshCw className="h-4 w-4" /> Retry Quiz
            </button>
            <Button variant="outline" onClick={() => { setSelectedQuiz(null); setSelectedFallbackSubject(null); }} className="rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white">
              Choose Another
            </Button>
          </div>
        </motion.div>

        {/* Performance Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-5 pb-4 border-b border-white/20 dark:border-white/[0.06]">
            <h3 className="section-title flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Performance Analytics</h3>
          </div>
          <div className="p-5">
            {/* Accuracy bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Accuracy</span>
                <span className="font-semibold text-foreground">{percentage}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 dark:bg-white/[0.06] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${percentage >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : percentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}
                />
              </div>
            </div>

            {/* Time per question chart */}
            {questionTimes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Time per Question (seconds)</p>
                <div className="flex items-end gap-1 h-16">
                  {questionTimes.map((t, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.min(100, (t / 30) * 100)}%` }}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.05 }}
                      className={`flex-1 rounded-t ${answers[i] ? 'bg-green-500/60' : 'bg-red-500/60'} min-h-[4px] relative group cursor-default`}
                      title={`Q${i + 1}: ${t}s — ${answers[i] ? 'Correct' : 'Wrong'}`}
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t}s</span>
                    </motion.div>
                  ))}
                </div>
                <div className="flex gap-1 mt-1">
                  {questionTimes.map((_, i) => (
                    <span key={i} className="flex-1 text-center text-[8px] text-muted-foreground/50">{i + 1}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Weak areas */}
            {wrongIndices.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-orange-500" /> Areas to Review
                </p>
                <div className="space-y-1.5">
                  {wrongIndices.slice(0, 5).map(idx => (
                    <p key={idx} className="text-xs text-muted-foreground truncate">
                      • Q{idx + 1}: {questions[idx]?.question.slice(0, 80)}…
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Answer Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-5 pb-4 border-b border-white/20 dark:border-white/[0.06]">
            <h3 className="section-title flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Answer Review</h3>
            <p className="text-sm text-muted-foreground mt-1 ml-6">Review your answers and explanations</p>
          </div>
          <div className="p-5 space-y-3">
            {questions.map((q, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.04 }}
                className="p-4 rounded-xl glass-card-subtle"
              >
                <div className="flex items-start gap-3">
                  {answers[idx] ? (
                    <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-red-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <X className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground mb-1">{q.question}</p>
                    {!answers[idx] && selectedAnswers[idx] >= 0 && (
                      <p className="text-xs text-red-500/80 mb-0.5">
                        Your answer: {q.options[selectedAnswers[idx]]}
                      </p>
                    )}
                    <p className="text-xs text-green-600 dark:text-green-400 mb-0.5">
                      Correct: {q.options[q.correct]}
                    </p>
                    <p className="text-xs text-muted-foreground">{q.explanation}</p>
                    <span className="text-[10px] text-muted-foreground/50 mt-1 inline-block">⏱ {questionTimes[idx] ?? '—'}s</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Pre-quiz Info                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (!quizStarted) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="gradient-card p-8 text-center text-white">
          <div className="text-4xl mb-3">🧠</div>
          <h2 className="text-2xl font-bold mb-1">{quizTitle}</h2>
          <p className="text-white/70 text-sm">
            {selectedQuiz?.description || "Test your knowledge!"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-2xl font-bold tabular-nums">{questions.length}</p>
              <p className="text-xs text-white/60">Questions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-2xl font-bold tabular-nums">
                ~{Math.max(1, Math.ceil(questions.length * 1.5))}
              </p>
              <p className="text-xs text-white/60">Minutes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-2xl font-bold">BCA</p>
              <p className="text-xs text-white/60">Level</p>
            </div>
          </div>

          <div className="space-y-3 mt-6">
            <button onClick={handleStartQuiz} disabled={questions.length === 0} className="btn-gradient w-full !bg-white/20 backdrop-blur-sm border border-white/30 disabled:opacity-50">
              <Brain className="h-5 w-5" /> Start Quiz
            </button>
            <Button variant="outline" onClick={() => { setSelectedQuiz(null); setSelectedFallbackSubject(null); }} className="w-full rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white">
              Choose Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Active Question                                              */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const timerColor = timeLeft > 15 ? "text-green-500" : timeLeft > 5 ? "text-yellow-500" : "text-red-500";
  const timerBarPct = (timeLeft / 30) * 100;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top HUD — Progress, Score, Streak, Timer */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <Badge variant="outline" className="text-xs rounded-lg border-white/40 dark:border-white/[0.08] tabular-nums">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>

          <div className="flex items-center gap-3">
            {/* Streak badge */}
            <AnimatePresence>
              {streak >= 2 && (
                <motion.div
                  key="streak"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex items-center gap-1 bg-orange-500/15 text-orange-500 rounded-full px-2.5 py-1"
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold tabular-nums">{streak} Streak!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Score */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-yellow-500" />
              <span className="font-semibold tabular-nums">{points}</span>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-1 text-xs font-bold tabular-nums ${timerColor}`}>
              <Timer className="h-3.5 w-3.5" />
              {timeLeft}s
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-track h-2 relative">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Timer bar */}
        <div className="h-1 mt-1.5 rounded-full bg-white/10 dark:bg-white/[0.04] overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors duration-500 ${timeLeft > 15 ? 'bg-green-500/60' : timeLeft > 5 ? 'bg-yellow-500/60' : 'bg-red-500/80'}`}
            initial={false}
            animate={{ width: `${timerBarPct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">{quizTitle}</p>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
          className="glass-card overflow-hidden"
        >
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold leading-relaxed text-foreground">{currentQ.question}</h3>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === currentQ.correct;
              // During feedback phase, show green/red
              let optionStyle = "glass-card-subtle hover:border-primary/20 hover:bg-primary/5";
              if (showAnswerFeedback) {
                if (isCorrect) {
                  optionStyle = "bg-green-500/15 border-green-500/40 ring-1 ring-green-500/20";
                } else if (isSelected && !isCorrect) {
                  optionStyle = "bg-red-500/15 border-red-500/40 ring-1 ring-red-500/20";
                } else {
                  optionStyle = "glass-card-subtle opacity-50";
                }
              } else if (isSelected) {
                optionStyle = "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-primary/20";
              }

              return (
                <motion.button
                  key={idx}
                  whileHover={!showAnswerFeedback ? { scale: 1.01 } : undefined}
                  whileTap={!showAnswerFeedback ? { scale: 0.99 } : undefined}
                  className={`w-full p-4 rounded-xl text-left flex items-center transition-all duration-200 ${optionStyle}`}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={showAnswerFeedback}
                >
                  <span className={`mr-3 text-sm font-bold w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    showAnswerFeedback && isCorrect ? "bg-green-500/20 text-green-500" :
                    showAnswerFeedback && isSelected && !isCorrect ? "bg-red-500/20 text-red-500" :
                    isSelected && !showAnswerFeedback ? "bg-white/20" : "bg-primary/10 text-primary"
                  }`}>
                    {showAnswerFeedback && isCorrect ? <CheckCircle className="h-4 w-4" /> :
                     showAnswerFeedback && isSelected && !isCorrect ? <X className="h-4 w-4" /> :
                     String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm">{option}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Answer feedback toast */}
          <AnimatePresence>
            {showAnswerFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mx-6 mb-5 p-3 rounded-xl text-center text-sm font-medium ${
                  lastAnswerCorrect
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}
              >
                {lastAnswerCorrect ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Correct! {streak >= 2 ? `🔥 ${streak} streak!` : ""}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <X className="h-4 w-4" /> {timeLeft <= 0 ? "Time's up!" : "Not quite."} The answer is: {currentQ.options[currentQ.correct]}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => { setSelectedQuiz(null); setSelectedFallbackSubject(null); if (timerRef.current) clearInterval(timerRef.current); }} className="rounded-xl border-white/40 dark:border-white/[0.08] hover:border-primary/30">
          Exit Quiz
        </Button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNextQuestion}
          disabled={selectedAnswer === null || showAnswerFeedback}
          className="btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQuestion + 1 === questions.length ? "Finish Quiz" : "Next"} <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default QuizGenerator;
