/**
 * profileService.ts
 * Supabase queries for the user profile page:
 *  – profile CRUD, academic stats, subject progress, activity, achievements
 */

import { supabase } from './supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface AcademicStats {
  totalSubjects: number;
  completedSubjects: number;
  overallProgress: number;   // 0-100
  currentStreak: number;
  totalStudyMinutes: number;
  quizzesCompleted: number;
  avgQuizScore: number;
}

export interface SubjectProgress {
  subject_id: string;
  subject_name: string;
  semester: number;
  progress_percent: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  last_accessed_at: string | null;
}

export interface ProfileActivity {
  id: string;
  type: 'quiz_completed' | 'material_viewed' | 'session_completed' | 'achievement_earned' | 'coding_submission';
  title: string;
  description: string;
  created_at: string;
}

export interface ProfileAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
}

// ─── Fetch Profile ────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as ProfileRow | null;
  } catch {
    return null;
  }
}

// ─── Upsert Profile ──────────────────────────────────────────────────────────

export async function upsertProfile(
  userId: string,
  updates: Partial<Pick<ProfileRow, 'name' | 'semester' | 'college' | 'learning_goal' | 'avatar_url'>>
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) console.warn('upsertProfile:', error.message);
}

// ─── Academic Stats ───────────────────────────────────────────────────────────

export async function fetchAcademicStats(userId: string): Promise<AcademicStats> {
  // Total subjects
  const { data: subjects } = await supabase.from('subjects').select('id');
  const totalSubjects = subjects?.length ?? 0;

  // User progress
  const { data: progress } = await supabase
    .from('student_progress')
    .select('progress_percent')
    .eq('user_id', userId);

  const progressArr = (progress ?? []).map((p: any) => p.progress_percent ?? 0);
  const completedSubjects = progressArr.filter((p: number) => p >= 100).length;
  const overallProgress = progressArr.length > 0
    ? Math.round(progressArr.reduce((a: number, b: number) => a + b, 0) / Math.max(totalSubjects, 1))
    : 0;

  // Sessions → streak + minutes
  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('date, duration, actual_duration, completed')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('date', { ascending: false });

  const completedSessions = sessions ?? [];
  const totalStudyMinutes = completedSessions.reduce(
    (sum: number, s: any) => sum + (s.actual_duration ?? s.duration ?? 0), 0,
  );

  let currentStreak = 0;
  if (completedSessions.length) {
    const dates = new Set(completedSessions.map((s: any) => s.date));
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const ds = cursor.toISOString().split('T')[0];
      if (dates.has(ds)) { currentStreak++; cursor.setDate(cursor.getDate() - 1); }
      else if (i === 0) { cursor.setDate(cursor.getDate() - 1); }
      else break;
    }
  }

  // Quizzes
  let quizzesCompleted = 0;
  let avgQuizScore = 0;
  try {
    const { data: quizzes } = await supabase
      .from('quiz_results')
      .select('score')
      .eq('user_id', userId);
    if (quizzes?.length) {
      quizzesCompleted = quizzes.length;
      avgQuizScore = Math.round(quizzes.reduce((s: number, q: any) => s + (q.score ?? 0), 0) / quizzes.length);
    }
  } catch { /* table may not exist */ }

  return { totalSubjects, completedSubjects, overallProgress, currentStreak, totalStudyMinutes, quizzesCompleted, avgQuizScore };
}

// ─── Subject Progress ─────────────────────────────────────────────────────────

export async function fetchSubjectProgress(userId: string): Promise<SubjectProgress[]> {
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, subject_name, semester')
    .order('semester', { ascending: true })
    .order('name', { ascending: true });

  const { data: progress } = await supabase
    .from('student_progress')
    .select('subject_id, progress_percent, last_accessed_at')
    .eq('user_id', userId);

  const progressMap: Record<string, any> = {};
  (progress ?? []).forEach((p: any) => { progressMap[String(p.subject_id)] = p; });

  return (subjects ?? []).map((s: any) => {
    const p = progressMap[String(s.id)];
    const pct = p?.progress_percent ?? 0;
    return {
      subject_id: String(s.id),
      subject_name: s.name ?? s.subject_name ?? 'Untitled',
      semester: s.semester ?? 1,
      progress_percent: pct,
      status: pct >= 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started',
      last_accessed_at: p?.last_accessed_at ?? null,
    } as SubjectProgress;
  });
}

// ─── Activity History ─────────────────────────────────────────────────────────

export async function fetchProfileActivity(userId: string, limit = 15): Promise<ProfileActivity[]> {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description ?? '',
      created_at: r.created_at,
    }));
  } catch {
    // Fallback: study_sessions
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
        type: 'session_completed' as const,
        title: `Completed ${s.subject} session`,
        description: `${s.duration} min study session`,
        created_at: s.created_at,
      }));
    } catch { return []; }
  }
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function fetchProfileAchievements(userId: string): Promise<ProfileAchievement[]> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? '',
      icon: r.icon ?? '🏆',
      earned_at: r.earned_at,
    }));
  } catch { return []; }
}

// ─── Real-time ────────────────────────────────────────────────────────────────

export function subscribeProfile(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`profile-${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'student_progress', filter: `user_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements', filter: `user_id=eq.${userId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` }, onChange)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
