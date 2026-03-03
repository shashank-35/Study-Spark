import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Clock, Trophy, Target, CheckCircle, X, RefreshCw, Code, Database, Globe, Coffee, Home, ArrowLeft } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useProgress } from "@/hooks/useProgressContext";

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
  };

  const handleAnswerSelect = (idx: number) => setSelectedAnswer(idx);

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    const isCorrect = selectedAnswer === questions[currentQuestion].correct;
    const newAnswers = [...answers, isCorrect];
    const newScore = isCorrect ? score + 1 : score;
    setAnswers(newAnswers);
    setScore(newScore);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
      saveQuizResult(newScore, questions.length, newAnswers);
    }
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
            <h2 className="text-2xl font-bold text-foreground">Quiz Time 🧠</h2>
            <p className="text-muted-foreground text-sm mt-1">Test your knowledge with real-time quizzes</p>
          </div>
          {onBackToDesktop && (
            <Button onClick={onBackToDesktop} variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
        </div>

        {loadingQuizzes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border/60"><CardContent className="p-6 space-y-3"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-full" /><Skeleton className="h-9 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <>
            {/* DB Quizzes */}
            {dbQuizzes.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-foreground">Available Quizzes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dbQuizzes.map((q) => (
                    <Card
                      key={q.id}
                      className="cursor-pointer border-border/60 hover:border-primary/40 hover:shadow-md transition-all"
                      onClick={() => handleSelectDbQuiz(q)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Brain className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground">{q.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{q.subject_name} · {q.time_limit} min</p>
                          </div>
                        </div>
                        {q.description && <p className="text-sm text-muted-foreground mb-3">{q.description}</p>}
                        <Button size="sm" className="w-full gap-1.5">
                          <Brain className="h-4 w-4" /> Start Quiz
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Fallback / Practice Quizzes */}
            <h3 className="text-lg font-semibold text-foreground mt-4">
              {dbQuizzes.length > 0 ? "Practice Quizzes" : "Quick Practice Quizzes"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FALLBACK_SUBJECTS.map((sub, i) => (
                <Card
                  key={i}
                  className="cursor-pointer border-border/60 hover:border-primary/40 hover:shadow-md transition-all"
                  onClick={() => handleSelectFallbackSubject(sub.name)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mb-3 flex justify-center text-primary">{sub.icon}</div>
                    <h4 className="font-semibold text-foreground mb-1">{sub.name}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{FALLBACK_QUIZZES[sub.name]?.length ?? 0} questions</p>
                    <Button size="sm" className={`w-full bg-gradient-to-r ${sub.color} hover:opacity-90 text-white`}>
                      <Brain className="h-4 w-4 mr-1" /> Start
                    </Button>
                  </CardContent>
                </Card>
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
        <Card className="border-border/60"><CardContent className="p-8 space-y-4">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </CardContent></Card>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Quiz Result                                                  */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (showResult) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const scoreMsg = getScoreMessage(percentage);

    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/10">
          <CardHeader className="text-center">
            <Trophy className="h-14 w-14 text-yellow-500 mx-auto mb-3" />
            <CardTitle className="text-2xl text-foreground">Quiz Complete!</CardTitle>
            <CardDescription>{quizTitle}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-5">
            <div className="text-5xl font-bold text-primary tabular-nums">{score}/{questions.length}</div>
            <div className="text-xl font-semibold text-foreground tabular-nums">{percentage}%</div>
            <p className={`text-base font-medium ${scoreMsg.color}`}>{scoreMsg.message}</p>
            {saving && <p className="text-xs text-muted-foreground animate-pulse">Saving result…</p>}

            <div className="flex justify-center gap-3 pt-2">
              <Button onClick={handleRestartQuiz} className="gap-1.5">
                <RefreshCw className="h-4 w-4" /> Try Again
              </Button>
              <Button variant="outline" onClick={() => { setSelectedQuiz(null); setSelectedFallbackSubject(null); }}>
                Choose Another
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Answer Review */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Answer Review</CardTitle>
            <CardDescription>Review your answers and explanations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-muted/40 border border-border/40">
                <div className="flex items-start gap-3">
                  {answers[idx] ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground mb-1">{q.question}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mb-0.5">
                      Correct: {q.options[q.correct]}
                    </p>
                    <p className="text-xs text-muted-foreground">{q.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Pre-quiz Info                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */

  if (!quizStarted) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/10">
          <CardHeader className="text-center">
            <div className="text-4xl mb-3">🧠</div>
            <CardTitle className="text-2xl text-foreground">{quizTitle}</CardTitle>
            <CardDescription>
              {selectedQuiz?.description || "Test your knowledge!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-primary tabular-nums">{questions.length}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-500 tabular-nums">
                  ~{Math.max(1, Math.ceil(questions.length * 1.5))}
                </p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">BCA</p>
                <p className="text-xs text-muted-foreground">Level</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleStartQuiz} disabled={questions.length === 0} className="w-full gap-1.5">
                <Brain className="h-5 w-5" /> Start Quiz
              </Button>
              <Button variant="outline" onClick={() => { setSelectedQuiz(null); setSelectedFallbackSubject(null); }} className="w-full">
                Choose Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER: Active Question                                              */
  /* ═══════════════════════════════════════════════════════════════════════ */

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Header */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              Question {currentQuestion + 1} of {questions.length}
            </Badge>
            <span className="text-xs text-muted-foreground">{quizTitle}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">{currentQ.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQ.options.map((option, idx) => (
            <Button
              key={idx}
              variant={selectedAnswer === idx ? "default" : "outline"}
              className={`w-full p-4 h-auto text-left justify-start ${
                selectedAnswer === idx ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"
              }`}
              onClick={() => handleAnswerSelect(idx)}
            >
              <span className="mr-3 text-sm font-bold">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => { setSelectedQuiz(null); setSelectedFallbackSubject(null); }}>
          Exit Quiz
        </Button>
        <Button onClick={handleNextQuestion} disabled={selectedAnswer === null} className="gap-1.5">
          {currentQuestion + 1 === questions.length ? "Finish Quiz" : "Next Question"}
        </Button>
      </div>
    </div>
  );
};

export default QuizGenerator;
