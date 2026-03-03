/**
 * subjectService.ts
 * All Supabase queries for the BCA Subject Section:
 *  - subjects, units, study_materials, student_progress, bookmarks
 */

import { supabase } from './supabaseClient';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface SubjectRow {
  id: string;
  name: string;
  semester: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  credits: number;
  updated_at: string;
}

export interface UnitRow {
  id: string;
  subject_id: string;
  title: string;
  order_no: number;
}

export interface StudyMaterialRow {
  id: string;
  subject_id?: string;
  unit_id?: string;
  subject_name?: string; // legacy field kept for backwards compat
  file_name: string;
  file_size: number;
  file_url?: string;
  file_data?: string; // base64 (legacy / small files)
  file_type: string;
  uploaded_at: string;
}

export interface UnitWithMaterials extends UnitRow {
  study_materials: StudyMaterialRow[];
}

export interface StudentProgress {
  id?: string;
  user_id: string;
  subject_id: string;
  progress_percent: number;       // 0–100
  last_resource_id: string | null; // id of last opened study_material
  last_accessed_at: string;        // ISO timestamp
  completed_units?: number;        // units marked complete
  total_units?: number;            // total units for subject
}

export interface BookmarkRow {
  id?: string;
  user_id: string;
  subject_id: string;
  created_at?: string;
}

// ─── Fetch Params ─────────────────────────────────────────────────────────────

export type FetchSubjectsParams = {
  semester?: number | 'all';
  search?: string;
  sortBy?: 'name' | 'semester' | 'last_accessed' | 'progress';
};

// ─── Subjects ─────────────────────────────────────────────────────────────────

/**
 * Fetch all subjects with optional search + semester filter.
 * Falls back gracefully if subject_name column exists (legacy schema).
 */
export async function fetchSubjects(params?: FetchSubjectsParams): Promise<SubjectRow[]> {
  // First, detect which schema we're dealing with by doing a simple select
  let query = supabase.from('subjects').select('*');

  if (params?.semester && params.semester !== 'all') {
    // Only filter by semester if we know the column exists
    query = query.eq('semester', params.semester);
  }

  if (params?.search?.trim()) {
    const q = params.search.trim();
    // Try both column names — Supabase .or() will ignore non-existent columns
    // but to be safe we catch below
    query = query.or(`name.ilike.%${q}%,subject_name.ilike.%${q}%`);
  }

  // Try with upgraded schema ordering first (semester + name)
  const { data, error } = await query;

  // If the query failed (e.g. column 'semester' doesn't exist in filter),
  // retry with a plain select
  if (error) {
    console.warn('[fetchSubjects] Initial query failed, retrying plain select:', error.message);
    const fallback = await supabase.from('subjects').select('*');
    if (fallback.error) throw fallback.error;

    return (fallback.data || []).map((row: any) => ({
      id: String(row.id),
      name: row.name ?? row.subject_name ?? 'Untitled',
      semester: row.semester ?? 1,
      difficulty: (row.difficulty ?? row.level ?? 'Beginner') as SubjectRow['difficulty'],
      credits: row.credits ?? 4,
      updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    }));
  }

  // Normalise legacy schema (subject_name → name) so the rest of the code is uniform
  const rows = (data || []).map((row: any) => ({
    id: String(row.id),
    name: row.name ?? row.subject_name ?? 'Untitled',
    semester: row.semester ?? 1,
    difficulty: (row.difficulty ?? row.level ?? 'Beginner') as SubjectRow['difficulty'],
    credits: row.credits ?? 4,
    updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  }));

  // Sort client-side to avoid column-not-found errors from .order()
  rows.sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name));
  return rows;
}

/** Resource count per subject (from study_materials). */
export async function fetchResourceCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('study_materials')
    .select('subject_id, id');

  if (error) {
    console.warn('fetchResourceCounts:', error.message);
    return {};
  }

  const counts: Record<string, number> = {};
  (data || []).forEach((row: any) => {
    const key = String(row.subject_id);
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return counts;
}

// ─── Units ────────────────────────────────────────────────────────────────────

/**
 * Fetch all units for a subject with their nested study_materials, ordered by order_no.
 */
export async function fetchUnitsWithMaterials(subjectId: string): Promise<UnitWithMaterials[]> {
  const { data, error } = await supabase
    .from('units')
    .select('*, study_materials(*)')
    .eq('subject_id', subjectId)
    .order('order_no', { ascending: true });

  if (error) throw error;

  return (data || []).map((unit: any) => ({
    ...unit,
    study_materials: (unit.study_materials || []).sort(
      (a: StudyMaterialRow, b: StudyMaterialRow) =>
        new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
    ),
  }));
}

// ─── Student Progress ─────────────────────────────────────────────────────────

/**
 * Fetch all progress rows for the logged-in user.
 * Returns a map keyed by subject_id for easy lookup.
 */
export async function fetchUserProgress(userId: string): Promise<Record<string, StudentProgress>> {
  const { data, error } = await supabase
    .from('student_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('fetchUserProgress:', error.message);
    return {};
  }

  const map: Record<string, StudentProgress> = {};
  (data || []).forEach((row: any) => {
    map[row.subject_id] = row as StudentProgress;
  });
  return map;
}

/**
 * Upsert a progress row. Uses ON CONFLICT (user_id, subject_id).
 * Always call this when a student opens a resource.
 */
export async function upsertProgress(progress: StudentProgress): Promise<void> {
  const { error } = await supabase.from('student_progress').upsert(
    {
      user_id: progress.user_id,
      subject_id: progress.subject_id,
      progress_percent: progress.progress_percent,
      last_resource_id: progress.last_resource_id,
      last_accessed_at: progress.last_accessed_at,
    },
    { onConflict: 'user_id,subject_id' }
  );
  if (error) throw error;
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

/**
 * Returns a Set of subject_ids that the user has bookmarked.
 */
export async function fetchBookmarkedIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('subject_id')
    .eq('user_id', userId);

  if (error) {
    console.warn('fetchBookmarkedIds:', error.message);
    return new Set();
  }

  return new Set((data || []).map((row: any) => String(row.subject_id)));
}

/**
 * Toggle a bookmark: removes it if `currentlyBookmarked`, adds it otherwise.
 */
export async function toggleBookmark(
  userId: string,
  subjectId: string,
  currentlyBookmarked: boolean
): Promise<void> {
  if (currentlyBookmarked) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('subject_id', subjectId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: userId, subject_id: subjectId });
    if (error) throw error;
  }
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to student_progress changes for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToProgress(
  userId: string,
  onChange: (progresses: Record<string, StudentProgress>) => void
) {
  const channel = supabase
    .channel(`progress:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'student_progress', filter: `user_id=eq.${userId}` },
      async () => {
        const updated = await fetchUserProgress(userId);
        onChange(updated);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to bookmark changes for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToBookmarks(
  userId: string,
  onChange: (bookmarkIds: Set<string>) => void
) {
  const channel = supabase
    .channel(`bookmarks:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookmarks', filter: `user_id=eq.${userId}` },
      async () => {
        const updated = await fetchBookmarkedIds(userId);
        onChange(updated);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
