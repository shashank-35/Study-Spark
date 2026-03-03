/**
 * codingLabService.ts
 *
 * All Supabase CRUD and realtime operations for the Coding Lab.
 * Tables used: coding_problems, coding_submissions
 */

import { supabase } from "./supabaseClient";

// ── Types ─────────────────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";
export type Language   = "javascript" | "python" | "cpp" | "java";
export type Status     = "accepted" | "error" | "running" | "unknown";

export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  tags: string[];
  /** Language → starter code */
  boilerplate: Partial<Record<Language, string>>;
  test_cases: TestCase[];
  created_at?: string;
}

export interface CodingSubmission {
  id: string;
  user_id: string;
  problem_id: string | null;
  language: Language;
  code: string;
  output: string;
  status: Status;
  execution_time?: number | null;
  created_at: string;
  /** Joined from coding_problems */
  coding_problems?: { title: string } | null;
}

// ── Default boilerplate templates ─────────────────────────────────────────

export const BOILERPLATES: Record<Language, string> = {
  javascript: `// JavaScript – Node.js
// Write your solution below
function solution() {
  // Your code here
  console.log("Hello, World!");
}

solution();`,

  python: `# Python 3
# Write your solution below
def solution():
    # Your code here
    print("Hello, World!")

solution()`,

  cpp: `// C++ (GCC 9)
#include <iostream>
using namespace std;

int main() {
    // Your code here
    cout << "Hello, World!" << endl;
    return 0;
}`,

  java: `// Java (OpenJDK 13)
public class Solution {
    public static void main(String[] args) {
        // Your code here
        System.out.println("Hello, World!");
    }
}`,
};

// ── Problems CRUD ─────────────────────────────────────────────────────────

/** Fetch all coding problems ordered by newest first */
export async function getProblems(): Promise<CodingProblem[]> {
  const { data, error } = await supabase
    .from("coding_problems")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getProblems: ${error.message}`);
  return (data ?? []) as CodingProblem[];
}

/** Add a new problem; returns the inserted row */
export async function addProblem(
  problem: Omit<CodingProblem, "id" | "created_at">
): Promise<CodingProblem> {
  const { data, error } = await supabase
    .from("coding_problems")
    .insert([problem])
    .select();

  if (error) throw new Error(`addProblem: ${error.message}`);
  return data![0] as CodingProblem;
}

/** Partially update a problem by id */
export async function updateProblem(
  id: string,
  updates: Partial<Omit<CodingProblem, "id" | "created_at">>
): Promise<CodingProblem> {
  const { data, error } = await supabase
    .from("coding_problems")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) throw new Error(`updateProblem: ${error.message}`);
  return data![0] as CodingProblem;
}

/** Delete a problem by id */
export async function deleteProblem(id: string): Promise<void> {
  const { error } = await supabase
    .from("coding_problems")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`deleteProblem: ${error.message}`);
}

// ── Submissions ───────────────────────────────────────────────────────────

/**
 * Insert a submission directly from the frontend (fast path).
 * Falls back gracefully if Supabase is not configured.
 */
export async function saveSubmission(
  submission: Omit<CodingSubmission, "id" | "created_at">
): Promise<CodingSubmission | null> {
  try {
    const { data, error } = await supabase
      .from("coding_submissions")
      .insert([submission])
      .select();

    if (error) throw error;
    return data![0] as CodingSubmission;
  } catch (err) {
    console.error("saveSubmission failed (Supabase may not be configured):", err);
    return null;
  }
}

/**
 * Fetch up to `limit` recent submissions.
 * Optionally filter by userId or problemId.
 */
export async function getSubmissions(options?: {
  userId?: string;
  problemId?: string;
  limit?: number;
}): Promise<CodingSubmission[]> {
  let query = supabase
    .from("coding_submissions")
    .select("*, coding_problems(title)")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 20);

  if (options?.userId)    query = query.eq("user_id", options.userId);
  if (options?.problemId) query = query.eq("problem_id", options.problemId);

  const { data, error } = await query;
  if (error) {
    console.error("getSubmissions:", error.message);
    return [];
  }
  return (data ?? []) as CodingSubmission[];
}

// ── Realtime subscription ─────────────────────────────────────────────────

/**
 * Subscribe to INSERT events on coding_submissions.
 * Returns the channel so the caller can unsubscribe on cleanup.
 *
 * @param onNew  Callback fired when a new row is inserted
 */
export function subscribeToSubmissions(
  onNew: (submission: CodingSubmission) => void
) {
  const channel = supabase
    .channel("coding_submissions_realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "coding_submissions" },
      (payload) => {
        onNew(payload.new as CodingSubmission);
      }
    )
    .subscribe();

  return channel;
}

// ── Code execution (via backend) ──────────────────────────────────────────

const API_BASE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "http://localhost:8787";

export interface ExecuteResult {
  output: string;
  error: string;
  status: "accepted" | "error";
  statusDescription?: string;
  time?: number;
  memory?: number;
}

/**
 * Execute code via /api/execute and return the result.
 * @param language  One of: javascript | python | cpp | java
 * @param code      Source code to execute
 * @param stdin     Optional standard input for the program
 */
export async function executeCode(
  language: Language,
  code: string,
  stdin?: string
): Promise<ExecuteResult> {
  const res = await fetch(`${API_BASE}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code, stdin }),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      output: "",
      error: text || `HTTP ${res.status}`,
      status: "error",
    };
  }

  return res.json() as Promise<ExecuteResult>;
}

// ── Statistics helpers ────────────────────────────────────────────────────

export interface LabStats {
  total: number;
  solved: number;
  easy: number;
  medium: number;
  hard: number;
  successRate: number;
}

/** Compute per-user stats from the submissions list and problem list */
export function computeStats(
  problems: CodingProblem[],
  submissions: CodingSubmission[],
  userId?: string
): LabStats {
  const mySubs = userId
    ? submissions.filter((s) => s.user_id === userId)
    : submissions;

  const solvedIds = new Set(
    mySubs.filter((s) => s.status === "accepted").map((s) => s.problem_id)
  );

  const total    = problems.length;
  const solved   = solvedIds.size;
  const easy     = problems.filter((p) => p.difficulty === "easy").length;
  const medium   = problems.filter((p) => p.difficulty === "medium").length;
  const hard     = problems.filter((p) => p.difficulty === "hard").length;
  const successRate =
    mySubs.length > 0
      ? Math.round((mySubs.filter((s) => s.status === "accepted").length / mySubs.length) * 100)
      : 0;

  return { total, solved, easy, medium, hard, successRate };
}
