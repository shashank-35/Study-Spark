/**
 * searchService.ts
 *
 * Supabase queries for the Global Smart Search.
 * Searches across: subjects, study_materials, quizzes, coding_problems
 */

import { supabase } from "./supabaseClient";

// ── Result Types ──────────────────────────────────────────────────────────

export type SearchCategory = "subjects" | "materials" | "quizzes" | "coding";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;        // e.g. subject name, semester, tags
  category: SearchCategory;
  semester?: number;
  extra?: Record<string, unknown>;
}

export interface GroupedResults {
  subjects: SearchResult[];
  materials: SearchResult[];
  quizzes: SearchResult[];
  coding: SearchResult[];
}

// ── Constants ─────────────────────────────────────────────────────────────

const PER_CATEGORY_LIMIT = 5;

// ── Search Functions ──────────────────────────────────────────────────────

async function searchSubjects(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, semester, difficulty")
    .ilike("name", `%${query}%`)
    .limit(PER_CATEGORY_LIMIT);

  if (error) {
    console.error("searchSubjects error:", error);
    return [];
  }

  return (data ?? []).map((s) => ({
    id: String(s.id),
    title: s.name,
    subtitle: `Semester ${s.semester} · ${s.difficulty ?? ""}`,
    category: "subjects" as const,
    semester: s.semester,
  }));
}

async function searchMaterials(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("study_materials")
    .select("id, file_name, file_type, subject_name, uploaded_at")
    .ilike("file_name", `%${query}%`)
    .order("uploaded_at", { ascending: false })
    .limit(PER_CATEGORY_LIMIT);

  if (error) {
    console.error("searchMaterials error:", error);
    return [];
  }

  return (data ?? []).map((m) => ({
    id: String(m.id),
    title: m.file_name,
    subtitle: `${m.subject_name ?? "General"} · ${(m.file_type ?? "").toUpperCase()}`,
    category: "materials" as const,
  }));
}

async function searchQuizzes(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, description, subject_id, is_active")
    .ilike("title", `%${query}%`)
    .eq("is_active", true)
    .limit(PER_CATEGORY_LIMIT);

  if (error) {
    console.error("searchQuizzes error:", error);
    return [];
  }

  return (data ?? []).map((q) => ({
    id: String(q.id),
    title: q.title,
    subtitle: q.description ?? "Quiz",
    category: "quizzes" as const,
  }));
}

async function searchCodingProblems(query: string): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("coding_problems")
    .select("id, title, difficulty, tags")
    .ilike("title", `%${query}%`)
    .limit(PER_CATEGORY_LIMIT);

  if (error) {
    console.error("searchCodingProblems error:", error);
    return [];
  }

  return (data ?? []).map((p) => ({
    id: String(p.id),
    title: p.title,
    subtitle: `${p.difficulty ?? ""} · ${(p.tags ?? []).slice(0, 3).join(", ")}`,
    category: "coding" as const,
  }));
}

// ── Combined Search ───────────────────────────────────────────────────────

export async function globalSearch(query: string): Promise<GroupedResults> {
  const [subjects, materials, quizzes, coding] = await Promise.all([
    searchSubjects(query),
    searchMaterials(query),
    searchQuizzes(query),
    searchCodingProblems(query),
  ]);

  return { subjects, materials, quizzes, coding };
}

// ── Popular / Suggested ───────────────────────────────────────────────────

export async function fetchPopularSubjects(): Promise<SearchResult[]> {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, name, semester, difficulty")
    .order("name", { ascending: true })
    .limit(6);

  if (error) {
    console.error("fetchPopularSubjects error:", error);
    return [];
  }

  return (data ?? []).map((s) => ({
    id: String(s.id),
    title: s.name,
    subtitle: `Semester ${s.semester}`,
    category: "subjects" as const,
    semester: s.semester,
  }));
}

// ── Recent Searches (localStorage) ────────────────────────────────────────

const RECENT_KEY = "studyspark_recent_searches";
const MAX_RECENT = 8;

export function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter((q) => q !== query);
  recent.unshift(query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

export function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY);
}
