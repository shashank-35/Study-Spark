/**
 * dashboardService.ts
 * Real-time Supabase queries for the home dashboard:
 *   user stats, achievements, activity feed, streaks, progress
 */

import { supabase } from './supabaseClient';

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
  type: 'quiz_completed' | 'material_added' | 'session_completed' | 'achievement_earned' | 'subject_started';
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

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  // Run all four queries in parallel — each wrapped to avoid crashing on missing tables
  const safe = <T>(p: Promise<{ data: T | null; error: any }>): Promise<{ data: T | null; error: any }> =>
    p.catch(() => ({ data: null, error: null }));

  const [subjectsRes, progressRes, sessionsRes, quizRes] = await Promise.all([
    safe(supabase.from('subjects').select('id')),
    safe(supabase.from('student_progress').select('progress_percent').eq('user_id', userId)),
    safe(supabase.from('study_sessions')
      .select('date, duration, actual_duration, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('date', { ascending: false })),
    safe(supabase.from('quiz_attempts').select('score, total').eq('user_id', userId)),
  ]);

  const subjects = subjectsRes.data;
  const progress = progressRes.data;
  const sessions = sessionsRes.data;
  const quizzes = (quizRes as any).data;

  const totalSubjects = subjects?.length ?? 0;
  const progressArr = (progress ?? []).map((p: any) => p.progress_percent ?? 0);
  const completedSubjects = progressArr.filter((p: number) => p >= 100).length;
  const overallProgress = progressArr.length > 0
    ? Math.round(progressArr.reduce((a: number, b: number) => a + b, 0) / Math.max(totalSubjects, 1))
    : 0;

  // Study sessions → streak + minutes
  const completedSessions = sessions ?? [];
  const totalStudyMinutes = completedSessions.reduce(
    (sum: number, s: any) => sum + (s.actual_duration ?? s.duration ?? 0), 0
  );

  // Streak
  let currentStreak = 0;
  if (completedSessions.length) {
    const dates = new Set(completedSessions.map((s: any) => s.date));
    const check = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = check.toISOString().split('T')[0];
      if (dates.has(ds)) { currentStreak++; check.setDate(check.getDate() - 1); }
      else if (i === 0) { check.setDate(check.getDate() - 1); }
      else break;
    }
  }

  // Quizzes (from quiz_attempts: score is raw correct count, total is question count)
  let quizzesCompleted = 0;
  let avgQuizScore = 0;
  if (quizzes && quizzes.length) {
    quizzesCompleted = quizzes.length;
    const pcts = quizzes.map((q: any) =>
      q.total > 0 ? Math.round(((q.score ?? 0) / q.total) * 100) : 0
    );
    avgQuizScore = Math.round(pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length);
  }

  return { totalSubjects, completedSubjects, overallProgress, currentStreak, totalStudyMinutes, quizzesCompleted, avgQuizScore };
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function fetchAchievements(userId: string): Promise<Achievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export async function fetchActivityFeed(userId: string, limit = 20): Promise<ActivityItem[]> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  } catch {
    // Fallback: build feed from study_sessions
    try {
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('id, subject, date, duration, completed, created_at')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      return (sessions ?? []).map((s: any) => ({
        id: s.id,
        user_id: userId,
        type: 'session_completed' as const,
        title: `Completed ${s.subject} session`,
        description: `${s.duration} min study session`,
        created_at: s.created_at,
      }));
    } catch { return []; }
  }
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

// ─── Fetch Quiz Attempts ──────────────────────────────────────────────────────

export async function fetchQuizAttempts(userId: string, limit = 20): Promise<QuizAttemptRow[]> {
  try {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('id, user_id, quiz_id, score, total, started_at, completed_at, quizzes(title, subjects(name))')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((a: any) => ({
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
  } catch (e) {
    console.warn('fetchQuizAttempts error:', e);
    return [];
  }
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

export function subscribeToDashboard(userId: string, onChange: () => void) {
  const tables = ['student_progress', 'study_sessions', 'study_goals', 'study_todos'];
  const channels = tables.map((table, i) =>
    supabase
      .channel(`dash_${table}_${userId}_${i}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` }, onChange)
      .subscribe()
  );
  return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
}
