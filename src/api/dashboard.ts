/**
 * api/dashboard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized API functions for ALL dashboard/profile stats.
 * Single source of truth — eliminates the duplicated stats logic between
 * `dashboardService.ts` and `profileService.ts`.
 *
 * Every function uses the retry-enabled `query` / `safeQuery` wrapper.
 */

import { supabase, query, safeQuery } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalSubjects: number;
  completedSubjects: number;
  overallProgress: number;
  currentStreak: number;
  totalStudyMinutes: number;
  quizzesCompleted: number;
  avgQuizScore: number;
}

export interface SubjectRow {
  id: string;
  name: string;
  semester: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  credits: number;
  updated_at: string;
}

export interface StudentProgress {
  id?: string;
  user_id: string;
  subject_id: string;
  progress_percent: number;
  last_resource_id: string | null;
  last_accessed_at: string;
  completed_units?: number;
  total_units?: number;
}

export interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface ActivityItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface QuizAttemptRow {
  id: string;
  user_id: string;
  quiz_id: number | null;
  score: number;
  total: number;
  started_at: string;
  completed_at: string;
  quiz_title: string;
  subject_name: string;
}

export interface WeeklyDay {
  day: string;
  date: string;
  minutes: number;
  sessions: number;
}

export interface ProfileRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  semester: number;
  college: string;
  learning_goal: string;
  joined_at: string;
  updated_at: string;
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export async function fetchSubjects(): Promise<SubjectRow[]> {
  const data = await query<any[]>(
    'fetchSubjects',
    supabase.from('subjects').select('*'),
  );

  const rows = data.map((row: any) => ({
    id: String(row.id),
    name: row.name ?? row.subject_name ?? 'Untitled',
    semester: row.semester ?? 1,
    difficulty: (row.difficulty ?? row.level ?? 'Beginner') as SubjectRow['difficulty'],
    credits: row.credits ?? 4,
    updated_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  }));

  rows.sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name));
  return rows;
}

export async function fetchResourceCounts(): Promise<Record<string, number>> {
  const data = await safeQuery<any[]>(
    'fetchResourceCounts',
    supabase.from('study_materials').select('subject_id, id'),
    [],
  );
  const counts: Record<string, number> = {};
  data.forEach((row: any) => {
    const key = String(row.subject_id);
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return counts;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export async function fetchUserProgress(userId: string): Promise<Record<string, StudentProgress>> {
  const data = await safeQuery<any[]>(
    'fetchUserProgress',
    supabase.from('student_progress').select('*').eq('user_id', userId),
    [],
  );
  const map: Record<string, StudentProgress> = {};
  data.forEach((row: any) => { map[String(row.subject_id)] = row as StudentProgress; });
  return map;
}

export async function upsertProgress(progress: StudentProgress): Promise<void> {
  const { error } = await supabase.from('student_progress').upsert(
    {
      user_id: progress.user_id,
      subject_id: progress.subject_id,
      progress_percent: progress.progress_percent,
      last_resource_id: progress.last_resource_id,
      last_accessed_at: progress.last_accessed_at,
    },
    { onConflict: 'user_id,subject_id' },
  );
  if (error) throw error;
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function fetchBookmarkedIds(userId: string): Promise<Set<string>> {
  const data = await safeQuery<any[]>(
    'fetchBookmarkedIds',
    supabase.from('bookmarks').select('subject_id').eq('user_id', userId),
    [],
  );
  return new Set(data.map((row: any) => String(row.subject_id)));
}

export async function toggleBookmark(userId: string, subjectId: string, isBookmarked: boolean): Promise<void> {
  if (isBookmarked) {
    await supabase.from('bookmarks').delete().eq('user_id', userId).eq('subject_id', subjectId);
  } else {
    await supabase.from('bookmarks').insert({ user_id: userId, subject_id: subjectId });
  }
}

// ─── Dashboard Stats (SINGLE implementation — no more duplication) ────────────

export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  const [subjectsRes, progressRes, sessionsRes, quizAttemptsRes, quizResultsRes] =
    await Promise.allSettled([
      supabase.from('subjects').select('id'),
      supabase.from('student_progress').select('progress_percent').eq('user_id', userId),
      supabase
        .from('study_sessions')
        .select('date, duration, actual_duration, completed')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('date', { ascending: false }),
      supabase.from('quiz_attempts').select('score, total').eq('user_id', userId),
      supabase.from('quiz_results').select('score').eq('user_id', userId),
    ]);

  const val = <T>(r: PromiseSettledResult<{ data: T | null; error: any }>, fb: T): T =>
    r.status === 'fulfilled' && !r.value.error ? (r.value.data ?? fb) : fb;

  const subjects = val(subjectsRes, []) as any[];
  const progress = val(progressRes, []) as any[];
  const sessions = val(sessionsRes, []) as any[];
  const quizAttempts = val(quizAttemptsRes, []) as any[];
  const quizResults = val(quizResultsRes, []) as any[];

  const totalSubjects = subjects.length;
  const progressArr = progress.map((p: any) => p.progress_percent ?? 0);
  const completedSubjects = progressArr.filter((p: number) => p >= 100).length;
  const overallProgress = progressArr.length > 0
    ? Math.round(progressArr.reduce((a: number, b: number) => a + b, 0) / Math.max(totalSubjects, 1))
    : 0;

  // Study minutes
  const totalStudyMinutes = sessions.reduce(
    (sum: number, s: any) => sum + (s.actual_duration ?? s.duration ?? 0), 0,
  );

  // Streak
  let currentStreak = 0;
  if (sessions.length) {
    const dates = new Set(sessions.map((s: any) => s.date));
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = cursor.toISOString().split('T')[0];
      if (dates.has(ds)) { currentStreak++; cursor.setDate(cursor.getDate() - 1); }
      else if (i === 0) { cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
  }

  // Quizzes — prefer quiz_attempts (more accurate), fall back to quiz_results
  let quizzesCompleted = 0;
  let avgQuizScore = 0;
  if (quizAttempts.length) {
    quizzesCompleted = quizAttempts.length;
    const pcts = quizAttempts.map((q: any) =>
      q.total > 0 ? Math.round(((q.score ?? 0) / q.total) * 100) : 0,
    );
    avgQuizScore = Math.round(pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length);
  } else if (quizResults.length) {
    quizzesCompleted = quizResults.length;
    avgQuizScore = Math.round(
      quizResults.reduce((s: number, q: any) => s + (q.score ?? 0), 0) / quizResults.length,
    );
  }

  return { totalSubjects, completedSubjects, overallProgress, currentStreak, totalStudyMinutes, quizzesCompleted, avgQuizScore };
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function fetchAchievements(userId: string): Promise<Achievement[]> {
  return safeQuery<Achievement[]>(
    'fetchAchievements',
    supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false }),
    [],
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export async function fetchActivityFeed(userId: string, limit = 20): Promise<ActivityItem[]> {
  try {
    return await query<ActivityItem[]>(
      'fetchActivityFeed',
      supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit),
      { retries: 1 },
    );
  } catch {
    // Fallback: build feed from study_sessions
    const data = await safeQuery<any[]>(
      'fetchActivityFeed:fallback',
      supabase
        .from('study_sessions')
        .select('id, subject, date, duration, completed, created_at')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(limit),
      [],
    );
    return data.map((s: any) => ({
      id: s.id,
      user_id: userId,
      type: 'session_completed',
      title: `Completed ${s.subject} session`,
      description: `${s.duration} min study session`,
      created_at: s.created_at,
    }));
  }
}

// ─── Quiz Attempts ────────────────────────────────────────────────────────────

export async function fetchQuizAttempts(userId: string, limit = 20): Promise<QuizAttemptRow[]> {
  try {
    const data = await query<any[]>(
      'fetchQuizAttempts',
      supabase
        .from('quiz_attempts')
        .select('id, user_id, quiz_id, score, total, started_at, completed_at, quizzes(title, subjects(name))')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit),
      { retries: 1 },
    );
    return data.map((a: any) => ({
      id: a.id,
      user_id: a.user_id,
      quiz_id: a.quiz_id,
      score: a.score ?? 0,
      total: a.total ?? 0,
      started_at: a.started_at,
      completed_at: a.completed_at,
      quiz_title: a.quizzes?.title ?? 'Quiz',
      subject_name: a.quizzes?.subjects?.name ?? 'General',
    }));
  } catch {
    return [];
  }
}

// ─── Weekly Activity ──────────────────────────────────────────────────────────

export async function fetchWeeklyActivity(userId: string): Promise<WeeklyDay[]> {
  const days: WeeklyDay[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    days.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: iso,
      minutes: 0,
      sessions: 0,
    });
  }

  const data = await safeQuery<any[]>(
    'fetchWeeklyActivity',
    supabase
      .from('study_sessions')
      .select('date, duration, actual_duration')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('date', days[0].date)
      .order('date', { ascending: true }),
    [],
  );

  data.forEach((s: any) => {
    const entry = days.find((d) => d.date === s.date);
    if (entry) {
      entry.minutes += s.actual_duration ?? s.duration ?? 0;
      entry.sessions += 1;
    }
  });

  return days;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return data as ProfileRow | null;
}

export async function upsertProfile(
  userId: string,
  updates: Partial<Pick<ProfileRow, 'name' | 'semester' | 'college' | 'learning_goal' | 'avatar_url'>>,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) console.warn('upsertProfile:', error.message);
}
