import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Trash2,
  Play,
  Copy,
  CheckCircle2,
  Circle,
  Code2,
  BookOpen,
  TrendingUp,
  ArrowLeft,
  Edit2,
  Save,
  X,
  Zap,
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  language: "c" | "java" | "python" | "javascript";
  boilerCode: string;
  testCases: TestCase[];
  solved: boolean;
  attempts: number;
  bestTime?: number;
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  passed?: boolean;
}

interface SubmissionHistory {
  id: string;
  problemId: string;
  code: string;
  language: string;
  timestamp: Date;
  passed: boolean;
  testsPassed: number;
  totalTests: number;
}

export default function CodingLab({ onBackToDesktop }: { onBackToDesktop?: () => void }) {
  // Problems State
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistory[]>([]);

  // New Problem Form
  const [showNewProblemForm, setShowNewProblemForm] = useState(false);
  const [newProblem, setNewProblem] = useState({
    title: "",
    description: "",
    difficulty: "easy" as const,
    language: "c" as const,
    boilerCode: "",
  });

  const [testCaseInput, setTestCaseInput] = useState({ input: "", output: "" });

  // Load from localStorage on mount
  useEffect(() => {
    const savedProblems = localStorage.getItem("codingLab_problems");
    const savedHistory = localStorage.getItem("codingLab_history");

    if (savedProblems) {
      const parsed = JSON.parse(savedProblems);
      setProblems(parsed);
      if (parsed.length > 0) setSelectedProblem(parsed[0]);
    } else {
      // Load default problems
      loadDefaultProblems();
    }

    if (savedHistory) setSubmissionHistory(JSON.parse(savedHistory));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("codingLab_problems", JSON.stringify(problems));
  }, [problems]);

  useEffect(() => {
    localStorage.setItem("codingLab_history", JSON.stringify(submissionHistory));
  }, [submissionHistory]);

  // Load default problems
  const loadDefaultProblems = () => {
    const defaults: Problem[] = [
      {
        id: "1",
        title: "Sum of Two Numbers",
        description: "Write a program to find the sum of two numbers.",
        difficulty: "easy",
        language: "c",
        boilerCode: `#include <stdio.h>\n\nint main() {\n    int a = 5, b = 10;\n    // Write your code here\n    printf("%d", sum);\n    return 0;\n}`,
        testCases: [
          { id: "1", input: "5, 10", expectedOutput: "15" },
          { id: "2", input: "20, 30", expectedOutput: "50" },
        ],
        solved: false,
        attempts: 0,
      },
      {
        id: "2",
        title: "Factorial of a Number",
        description: "Calculate the factorial of a given number.",
        difficulty: "medium",
        language: "c",
        boilerCode: `#include <stdio.h>\n\nint factorial(int n) {\n    // Write your code here\n}\n\nint main() {\n    printf("%d", factorial(5));\n    return 0;\n}`,
        testCases: [
          { id: "1", input: "5", expectedOutput: "120" },
          { id: "2", input: "0", expectedOutput: "1" },
        ],
        solved: false,
        attempts: 0,
      },
      {
        id: "3",
        title: "Reverse a String",
        description: "Reverse the given string.",
        difficulty: "easy",
        language: "java",
        boilerCode: `public class Solution {\n    public static void main(String[] args) {\n        String str = "hello";\n        // Write your code here\n        System.out.println(reversed);\n    }\n}`,
        testCases: [
          { id: "1", input: "hello", expectedOutput: "olleh" },
          { id: "2", input: "java", expectedOutput: "avaj" },
        ],
        solved: false,
        attempts: 0,
      },
      {
        id: "4",
        title: "Check Prime Number",
        description: "Check if a number is prime.",
        difficulty: "medium",
        language: "python",
        boilerCode: `def is_prime(n):\n    # Write your code here\n    pass\n\nprint(is_prime(7))`,
        testCases: [
          { id: "1", input: "7", expectedOutput: "True" },
          { id: "2", input: "10", expectedOutput: "False" },
        ],
        solved: false,
        attempts: 0,
      },
    ];
    setProblems(defaults);
    setSelectedProblem(defaults[0]);
  };

  // Add new problem
  const addProblem = () => {
    if (!newProblem.title.trim() || !newProblem.description.trim()) {
      alert("Please fill in all fields");
      return;
    }

    const problem: Problem = {
      id: Date.now().toString(),
      title: newProblem.title,
      description: newProblem.description,
      difficulty: newProblem.difficulty,
      language: newProblem.language,
      boilerCode: newProblem.boilerCode,
      testCases: [],
      solved: false,
      attempts: 0,
    };

    setProblems([...problems, problem]);
    setNewProblem({
      title: "",
      description: "",
      difficulty: "easy",
      language: "c",
      boilerCode: "",
    });
    setShowNewProblemForm(false);
  };

  // Delete problem
  const deleteProblem = (id: string) => {
    setProblems(problems.filter((p) => p.id !== id));
    if (selectedProblem?.id === id) {
      setSelectedProblem(problems.find((p) => p.id !== id) || null);
    }
  };

  // Run code (simulate)
  const runCode = () => {
    if (!selectedProblem) return;

    setIsRunning(true);
    setOutput("Running...\n");

    // Simulate code execution
    setTimeout(() => {
      let results = "Test Results:\n";
      let passed = 0;

      selectedProblem.testCases.forEach((testCase, index) => {
        // Simulate test execution
        const isPass = Math.random() > 0.3; // 70% pass rate for demo
        if (isPass) passed++;

        results += `\nTest ${index + 1}: ${isPass ? "✅ PASSED" : "❌ FAILED"}\n`;
        results += `Input: ${testCase.input}\n`;
        results += `Expected: ${testCase.expectedOutput}\n`;
        if (!isPass) results += `Got: ${Math.floor(Math.random() * 100)}\n`;
      });

      results += `\n${passed}/${selectedProblem.testCases.length} tests passed`;
      setOutput(results);
      setIsRunning(false);
    }, 1500);
  };

  // Submit code
  const submitCode = () => {
    if (!selectedProblem || !code.trim()) {
      alert("Please write some code first");
      return;
    }

    setIsRunning(true);
    setOutput("Submitting...\n");

    setTimeout(() => {
      const testsPassed = Math.floor(Math.random() * (selectedProblem.testCases.length + 1));
      const allPassed = testsPassed === selectedProblem.testCases.length;

      const submission: SubmissionHistory = {
        id: Date.now().toString(),
        problemId: selectedProblem.id,
        code,
        language: selectedProblem.language,
        timestamp: new Date(),
        passed: allPassed,
        testsPassed,
        totalTests: selectedProblem.testCases.length,
      };

      setSubmissionHistory([...submissionHistory, submission]);

      if (allPassed) {
        setProblems(
          problems.map((p) =>
            p.id === selectedProblem.id
              ? { ...p, solved: true, attempts: p.attempts + 1 }
              : p
          )
        );
        setSelectedProblem({
          ...selectedProblem,
          solved: true,
          attempts: selectedProblem.attempts + 1,
        });
        setOutput(`✅ All tests passed! Problem solved!\n\n${testsPassed}/${selectedProblem.testCases.length} tests passed`);
      } else {
        setOutput(`❌ Some tests failed.\n\n${testsPassed}/${selectedProblem.testCases.length} tests passed`);
      }

      setIsRunning(false);
    }, 2000);
  };

  // Copy code
  const copyCode = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  // Statistics
  const totalProblems = problems.length;
  const solvedProblems = problems.filter((p) => p.solved).length;
  const easyProblems = problems.filter((p) => p.difficulty === "easy").length;
  const mediumProblems = problems.filter((p) => p.difficulty === "medium").length;
  const hardProblems = problems.filter((p) => p.difficulty === "hard").length;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case "c":
        return "bg-blue-100 text-blue-800";
      case "java":
        return "bg-orange-100 text-orange-800";
      case "python":
        return "bg-purple-100 text-purple-800";
      case "javascript":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">💻 Coding Lab</h1>
            <p className="text-purple-100">Practice coding problems and improve your skills</p>
          </div>
          {onBackToDesktop && (
            <Button
              onClick={onBackToDesktop}
              className="bg-white text-purple-600 hover:bg-purple-50 font-semibold"
            >
              ← Back to Desktop
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Code2 className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold">{totalProblems}</div>
                <div className="text-sm text-gray-600">Total Problems</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold">{solvedProblems}</div>
                <div className="text-sm text-gray-600">Solved</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge className="bg-green-100 text-green-800 mx-auto mb-2">
                  {easyProblems}
                </Badge>
                <div className="text-sm text-gray-600">Easy</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge className="bg-yellow-100 text-yellow-800 mx-auto mb-2">
                  {mediumProblems}
                </Badge>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge className="bg-red-100 text-red-800 mx-auto mb-2">
                  {hardProblems}
                </Badge>
                <div className="text-sm text-gray-600">Hard</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Problems List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📚 Problems</span>
                  <Button
                    size="sm"
                    onClick={() => setShowNewProblemForm(!showNewProblemForm)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* New Problem Form */}
                {showNewProblemForm && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                    <Input
                      placeholder="Problem title"
                      value={newProblem.title}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, title: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={newProblem.description}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, description: e.target.value })
                      }
                    />
                    <select
                      value={newProblem.difficulty}
                      onChange={(e) =>
                        setNewProblem({
                          ...newProblem,
                          difficulty: e.target.value as "easy" | "medium" | "hard",
                        })
                      }
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <select
                      value={newProblem.language}
                      onChange={(e) =>
                        setNewProblem({
                          ...newProblem,
                          language: e.target.value as "c" | "java" | "python" | "javascript",
                        })
                      }
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="c">C</option>
                      <option value="java">Java</option>
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                    <textarea
                      placeholder="Boiler code"
                      value={newProblem.boilerCode}
                      onChange={(e) =>
                        setNewProblem({ ...newProblem, boilerCode: e.target.value })
                      }
                      className="w-full px-2 py-1 border rounded text-sm h-20"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={addProblem}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowNewProblemForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Problems List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {problems.map((problem) => (
                    <div
                      key={problem.id}
                      onClick={() => {
                        setSelectedProblem(problem);
                        setCode(problem.boilerCode);
                        setOutput("");
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                        selectedProblem?.id === problem.id
                          ? "border-purple-600 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {problem.solved ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                            <h3 className="font-semibold text-sm">{problem.title}</h3>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getDifficultyColor(problem.difficulty)}>
                              {problem.difficulty}
                            </Badge>
                            <Badge className={getLanguageColor(problem.language)}>
                              {problem.language.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProblem(problem.id);
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-2 space-y-4">
            {selectedProblem ? (
              <>
                {/* Problem Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedProblem.title}</span>
                      {selectedProblem.solved && (
                        <Badge className="bg-green-100 text-green-800">✅ Solved</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Description</h4>
                      <p className="text-sm text-gray-700">{selectedProblem.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Test Cases</h4>
                      <div className="space-y-2">
                        {selectedProblem.testCases.map((testCase, idx) => (
                          <div key={testCase.id} className="p-2 bg-gray-50 rounded text-sm">
                            <p className="text-gray-600">
                              <strong>Test {idx + 1}:</strong> {testCase.input} → {testCase.expectedOutput}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-600">
                        <strong>Attempts:</strong> {selectedProblem.attempts}
                      </span>
                      <span className="text-gray-600">
                        <strong>Language:</strong> {selectedProblem.language.toUpperCase()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Code Editor */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Code Editor</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyCode}
                        className="text-gray-600"
                      >
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-64 p-3 border rounded font-mono text-sm bg-gray-900 text-green-400"
                      placeholder="Write your code here..."
                    />

                    <div className="flex gap-2">
                      <Button
                        onClick={runCode}
                        disabled={isRunning}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4 mr-2" /> Run Code
                      </Button>
                      <Button
                        onClick={submitCode}
                        disabled={isRunning}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Zap className="h-4 w-4 mr-2" /> Submit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Output */}
                {output && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="p-3 bg-gray-900 text-green-400 rounded font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                        {output}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 py-8">
                    Select a problem to start coding! 💻
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Submission History */}
        {submissionHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {submissionHistory.slice(-10).reverse().map((submission) => (
                  <div
                    key={submission.id}
                    className="p-3 bg-gray-50 rounded flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">
                        {problems.find((p) => p.id === submission.problemId)?.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(submission.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getLanguageColor(submission.language)}>
                        {submission.language.toUpperCase()}
                      </Badge>
                      <span className="text-sm font-semibold">
                        {submission.testsPassed}/{submission.totalTests}
                      </span>
                      {submission.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}