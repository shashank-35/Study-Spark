/**
 * CodingLab.tsx  — Main Coding Lab Feature
 *
 * Layout:
 *   ┌──────────────┬──────────────────────────────┬────────────────┐
 *   │  ProblemList │  Problem desc + Code Editor  │ Output         │
 *   │  (left)      │  (center)                    │ SubmissionList │
 *   │              │                              │ (right)        │
 *   └──────────────┴──────────────────────────────┴────────────────┘
 *
 * Features implemented:
 *   - Monaco Editor with language selection and boilerplate
 *   - Real code execution via /api/execute (Judge0)
 *   - Custom stdin input
 *   - Supabase-backed problems CRUD
 *   - Submissions stored in Supabase + realtime feed
 *   - AI Hint via Gemini  (/api/chat)
 *   - Statistics bar (total / solved / success-rate)
 *   - Auto-save code per problem in localStorage
 *   - Tab bar: Description | Test Cases | AI Hint
 *   - Execution time display
 */

import { useEffect, useCallback, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Zap,
  ArrowLeft,
  Lightbulb,
  Code2,
  CheckCircle2,
  BarChart2,
  Terminal,
  Loader2,
} from "lucide-react";

import CodeEditor, { LANG_COLOR } from "@/components/CodeEditor";
import ProblemList from "@/components/ProblemList";
import SubmissionList from "@/components/SubmissionList";

import {
  type CodingProblem,
  type Language,
  type ExecuteResult,
  getProblems,
  saveSubmission,
  executeCode,
  computeStats,
  BOILERPLATES,
} from "@/lib/codingLabService";

// ── Storage helpers ────────────────────────────────────────────────────────
const STORAGE_KEY = (problemId: string, lang: Language) =>
  `codinglab_code_${problemId}_${lang}`;

function loadSavedCode(problemId: string, lang: Language, fallback: string) {
  return localStorage.getItem(STORAGE_KEY(problemId, lang)) ?? fallback;
}

function persistCode(problemId: string, lang: Language, code: string) {
  localStorage.setItem(STORAGE_KEY(problemId, lang), code);
}

// ── Props ──────────────────────────────────────────────────────────────────
interface CodingLabProps {
  onBackToDesktop?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CodingLab({ onBackToDesktop }: CodingLabProps) {
  const { user } = useUser();
  const userId   = user?.id ?? "anonymous";

  // ── State ────────────────────────────────────────────────────────────
  const [problems, setProblems]               = useState<CodingProblem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState<CodingProblem | null>(null);
  const [language, setLanguage]               = useState<Language>("javascript");
  const [code, setCode]                       = useState("");
  const [stdin, setStdin]                     = useState("");
  const [running, setRunning]                 = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [output, setOutput]                   = useState<ExecuteResult | null>(null);
  const [aiHint, setAiHint]                   = useState("");
  const [hintLoading, setHintLoading]         = useState(false);
  const [activeTab, setActiveTab]             = useState("description");

  // Track which problem ids have been solved this session
  const [solvedIds, setSolvedIds]             = useState<Set<string>>(new Set());

  // Submissions feed ref (used to refresh list after submit)
  const submissionListKey = useRef(0);

  // ── Fetch problems on mount ───────────────────────────────────────────
  const loadProblems = useCallback(async () => {
    try {
      const data = await getProblems();
      setProblems(data);
      if (data.length > 0 && !selectedProblem) {
        selectProblem(data[0], "javascript");
      }
    } catch (err) {
      console.error("CodingLab: failed to load problems:", err);
    } finally {
      setLoadingProblems(false);
    }
  }, []);

  useEffect(() => { loadProblems(); }, [loadProblems]);

  // Realtime: refresh problems when admin modifies them
  useEffect(() => {
    const channel = supabase
      .channel('coding_problems_realtime_lab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coding_problems' }, () => {
        loadProblems();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadProblems]);

  // ── Select a problem & load its code ─────────────────────────────────
  const selectProblem = (problem: CodingProblem, lang: Language = language) => {
    setSelectedProblem(problem);
    setOutput(null);
    setAiHint("");
    setActiveTab("description");

    const boiler = (problem.boilerplate?.[lang]) ?? BOILERPLATES[lang];
    const saved  = loadSavedCode(problem.id, lang, boiler);
    setCode(saved);
    setLanguage(lang);
  };

  // ── Language change ───────────────────────────────────────────────────
  const handleLanguageChange = (newLang: Language) => {
    if (!selectedProblem) return;
    setLanguage(newLang);
    const boiler = selectedProblem.boilerplate?.[newLang] ?? BOILERPLATES[newLang];
    const saved  = loadSavedCode(selectedProblem.id, newLang, boiler);
    setCode(saved);
    setOutput(null);
  };

  // ── Code change + auto-save ───────────────────────────────────────────
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (selectedProblem) {
      persistCode(selectedProblem.id, language, newCode);
    }
  };

  // ── Run code ──────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setOutput(null);
    setActiveTab("output");

    try {
      const result = await executeCode(language, code, stdin);
      setOutput(result);
    } catch (err) {
      setOutput({
        output: "",
        error: (err as Error).message,
        status: "error",
      });
    } finally {
      setRunning(false);
    }
  };

  // ── Submit code ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedProblem || !code.trim()) return;
    setSubmitting(true);
    setOutput(null);
    setActiveTab("output");

    try {
      // 1. Execute
      const result = await executeCode(language, code, stdin);
      setOutput(result);

      // 2. Persist to Supabase
      await saveSubmission({
        user_id:        userId,
        problem_id:     selectedProblem.id,
        language,
        code,
        output:         result.output || result.error || "",
        status:         result.status === "accepted" ? "accepted" : "error",
        execution_time: result.time ? Number(result.time) : null,
      });

      // 3. Mark solved locally if accepted
      if (result.status === "accepted") {
        setSolvedIds((prev) => new Set([...prev, selectedProblem.id]));
      }

      // 4. Refresh submission list
      submissionListKey.current += 1;
    } catch (err) {
      setOutput({
        output: "",
        error: (err as Error).message,
        status: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── AI Hint via Gemini ────────────────────────────────────────────────
  const handleHint = async () => {
    if (!selectedProblem) return;
    setHintLoading(true);
    setActiveTab("hint");
    setAiHint("");

    try {
      const res = await fetch("http://localhost:8787/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Give me a hint (not the full solution) for this coding problem:

Title: ${selectedProblem.title}

Description:
${selectedProblem.description}

My current code (${language}):
\`\`\`${language}
${code}
\`\`\`

Please give me a useful hint that guides me in the right direction without giving the answer.`,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiHint(data.content ?? "No hint available.");
      } else {
        setAiHint("⚠️ Could not fetch hint. Make sure the API server is running.");
      }
    } catch {
      setAiHint("⚠️ Could not reach the AI server. Is `npm run api` running?");
    } finally {
      setHintLoading(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = computeStats(problems, [], userId);

  // ── Loading state ─────────────────────────────────────────────────────
  if (loadingProblems) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        <span className="ml-3 text-muted-foreground">Loading Coding Lab…</span>
      </div>
    );
  }

  // ── Fallback: boilerplate for selected problem ────────────────────────
  const defaultCode = selectedProblem?.boilerplate?.[language] ?? BOILERPLATES[language];

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-background">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Code2 className="h-6 w-6" /> Coding Lab
            </h1>
            <p className="text-violet-200 text-sm mt-0.5">
              Real code execution · Supabase storage · Realtime submissions
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Stats chips */}
            <StatChip icon={<Code2 className="h-3.5 w-3.5" />} label={`${stats.total} Problems`} />
            <StatChip icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-400" />} label={`${solvedIds.size} Solved`} />
            <StatChip icon={<BarChart2 className="h-3.5 w-3.5 text-yellow-300" />} label={`G:${stats.easy}·Y:${stats.medium}·R:${stats.hard}`} />

            {onBackToDesktop && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToDesktop}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 3-column layout ───────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto p-3 sm:p-4 grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr_300px] gap-4 min-h-[calc(100vh-120px)]">

        {/* ── Left: Problem list ─────────────────────────────────── */}
        <div className="lg:min-h-0">
          <ProblemList
            problems={problems}
            selectedId={selectedProblem?.id ?? null}
            solvedIds={solvedIds}
            onSelect={(p) => selectProblem(p)}
            onProblemsChange={setProblems}
          />
        </div>

        {/* ── Center: Editor + tabs ──────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {selectedProblem ? (
            <>
              {/* Problem title + difficulty */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{selectedProblem.title}</h2>
                  <Badge
                    className={`text-[11px] border ${
                      selectedProblem.difficulty === "easy"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : selectedProblem.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : "bg-red-100 text-red-800 border-red-300"
                    }`}
                  >
                    {selectedProblem.difficulty}
                  </Badge>
                  {solvedIds.has(selectedProblem.id) && (
                    <Badge className="bg-green-100 text-green-800 border-green-300 text-[11px]">
                      ✅ Solved
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  {selectedProblem.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[11px] text-muted-foreground border-border"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tabs: Description | Output | AI Hint */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-muted rounded-lg h-8">
                  <TabsTrigger value="description" className="text-xs h-6">
                    Description
                  </TabsTrigger>
                  <TabsTrigger value="output" className="text-xs h-6 flex items-center gap-1">
                    <Terminal className="h-3 w-3" /> Output
                  </TabsTrigger>
                  <TabsTrigger value="hint" className="text-xs h-6 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" /> AI Hint
                  </TabsTrigger>
                </TabsList>

                {/* Description */}
                <TabsContent value="description">
                    <Card className="shadow-sm border-border">
                    <CardContent className="pt-4 space-y-4">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {selectedProblem.description}
                      </p>

                      {selectedProblem.test_cases.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-foreground/80 mb-2 uppercase tracking-wide">
                            Test Cases
                          </h4>
                          <div className="space-y-1.5">
                            {selectedProblem.test_cases.map((tc, i) => (
                              <div key={tc.id} className="p-2 bg-muted rounded border border-border text-xs font-mono">
                                <span className="text-muted-foreground">#{i + 1} Input: </span>
                                <span className="text-foreground">{tc.input}</span>
                                <span className="text-muted-foreground ml-2">→ Expected: </span>
                                <span className="text-foreground">{tc.expected_output}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Output */}
                <TabsContent value="output">
                  <Card className="shadow-sm border-border">
                    <CardContent className="pt-4">
                      {running || submitting ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">
                            {submitting ? "Submitting…" : "Running…"}
                          </span>
                        </div>
                      ) : output ? (
                        <div className="space-y-3">
                          {/* Status banner */}
                          <div
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium
                              ${output.status === "accepted"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                          >
                            <span>
                              {output.status === "accepted" ? "✅ Accepted" : "❌ " + (output.statusDescription ?? "Error")}
                            </span>
                            {output.time && (
                              <span className="text-xs font-normal">⚡ {output.time}s</span>
                            )}
                          </div>

                          {/* stdout */}
                          {output.output && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium">stdout</p>
                              <pre className="p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-xs overflow-x-auto max-h-48 whitespace-pre-wrap">
                                {output.output}
                              </pre>
                            </div>
                          )}

                          {/* stderr / error */}
                          {output.error && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium">stderr</p>
                              <pre className="p-3 bg-gray-900 text-red-400 rounded-lg font-mono text-xs overflow-x-auto max-h-48 whitespace-pre-wrap">
                                {output.error}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-4">
                          Run or Submit your code to see output here.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Hint */}
                <TabsContent value="hint">
                  <Card className="shadow-sm border-border">
                    <CardContent className="pt-4 space-y-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleHint}
                        disabled={hintLoading}
                        className="border-violet-300 text-violet-700 hover:bg-violet-50"
                      >
                        {hintLoading ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Lightbulb className="h-3.5 w-3.5 mr-1" />
                        )}
                        {hintLoading ? "Getting hint…" : "Get AI Hint"}
                      </Button>

                      {aiHint && (
                        <div className="prose prose-sm max-w-none text-foreground/80 bg-violet-50 dark:bg-violet-950/30 rounded-lg p-3 border border-violet-100 dark:border-violet-800 text-sm whitespace-pre-wrap leading-relaxed">
                          {aiHint}
                        </div>
                      )}

                      {!aiHint && !hintLoading && (
                        <p className="text-sm text-muted-foreground">
                          Click "Get AI Hint" to get a contextual hint from Gemini without seeing the full solution.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* ── Code Editor ─────────────────────────────────────── */}
              <CodeEditor
                code={code}
                language={language}
                onChange={handleCodeChange}
                onLanguageChange={handleLanguageChange}
                defaultCode={defaultCode}
              />

              {/* ── Custom Stdin ─────────────────────────────────────── */}
              <Card className="shadow-sm border-border">
                <CardHeader className="py-2 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-medium">
                    Custom Input (stdin)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-3">
                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    rows={2}
                    placeholder="Optional: provide stdin for your program"
                    className="w-full text-sm font-mono p-2 border border-border rounded resize-y bg-muted focus:outline-none focus:ring-2 focus:ring-violet-300 text-foreground"
                  />
                </CardContent>
              </Card>

              {/* ── Action buttons ───────────────────────────────────── */}
              <div className="flex gap-3">
                <Button
                  onClick={handleRun}
                  disabled={running || submitting || !code.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {running ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Code
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={running || submitting || !code.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Submit
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <Code2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Select a problem to start</p>
                <p className="text-sm mt-1">Choose from the list on the left</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Submissions ──────────────────────────────────── */}
        <div className="lg:min-h-0">
          <SubmissionList
            key={submissionListKey.current}
            userId={userId}
            problemId={selectedProblem?.id ?? null}
            problems={problems}
          />
        </div>
      </div>
    </div>
  );
}

// ── Small stat chip used in the header ────────────────────────────────────
function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs font-medium border border-white/20">
      {icon}
      {label}
    </div>
  );
}
