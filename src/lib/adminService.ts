/**
 * Admin Service – Supabase CRUD + Realtime helpers
 * Compatible with the existing schema_upgrade.sql (UUID-based subjects/units)
 * and new admin_migration.sql tables (quizzes, quiz_questions, etc.)
 */
import { supabase } from './supabaseClient';

// ─── Type Definitions ───────────────────────────────────────────────

export interface AdminSubject {
  id: string;             // UUID from schema_upgrade.sql
  name: string;           // primary column in schema_upgrade
  subject_name: string;   // synced alias used by supabaseClient.ts
  semester: number;
  credits: number;
  difficulty: string;
  description?: string;
  progress?: number;
  completion?: number;
  next_topic?: string;
  est_time?: string;
  level?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminUnit {
  id: string;             // UUID
  subject_id: string;     // UUID ref → subjects
  title: string;
  order_no: number;
  created_at?: string;
  updated_at?: string;
  // Joined
  subject_name?: string;
}

export interface AdminMaterial {
  id: string;             // UUID
  subject_id: string | null;
  unit_id: string | null;
  subject_name: string;
  title: string;
  file_name: string;
  file_size: number;
  file_url: string;
  file_data?: string;
  file_type: string;
  material_type: string;
  uploaded_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminQuiz {
  id: number;             // BIGSERIAL (new table)
  subject_id: string;     // UUID ref → subjects
  unit_id: string | null;
  title: string;
  description: string;
  time_limit: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined
  subject_name?: string;
  question_count?: number;
}

export interface AdminQuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  order_no: number;
  created_at?: string;
}

export interface StudentInfo {
  user_id: string;
  email?: string;
  name?: string;
  last_active?: string;
  subjects_count?: number;
  quiz_attempts_count?: number;
  coding_submissions_count?: number;
  avg_score?: number;
}

export interface CodingSubmission {
  id: number;
  user_id: string;
  problem_title: string;
  language: string;
  code: string;
  status: string;
  results: Record<string, unknown>;
  submitted_at: string;
}

export interface QuizAttempt {
  id: number;
  user_id: string;
  quiz_id: number;
  score: number;
  total: number;
  answers: unknown[];
  started_at: string;
  completed_at: string | null;
  // Joined
  quiz_title?: string;
}

export interface AdminSettings {
  id: number;
  platform_name: string;
  enable_quiz: boolean;
  enable_coding_lab: boolean;
  enable_ai_chat: boolean;
  upload_limit_mb: number;
  allowed_file_types: string[];
  updated_at?: string;
}

export interface DashboardStats {
  totalSubjects: number;
  totalMaterials: number;
  totalQuizzes: number;
  totalStudents: number;
  totalSubmissions: number;
  totalQuizAttempts: number;
}

// ─── Dashboard ──────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  // Each count query is safe: if table doesn't exist yet, count will be 0
  const results = await Promise.allSettled([
    supabase.from('subjects').select('id', { count: 'exact', head: true }),
    supabase.from('study_materials').select('id', { count: 'exact', head: true }),
    supabase.from('quizzes').select('id', { count: 'exact', head: true }),
    supabase.from('student_progress').select('user_id', { count: 'exact', head: true }),
    supabase.from('coding_submissions').select('id', { count: 'exact', head: true }),
    supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }),
  ]);

  const getCount = (r: PromiseSettledResult<any>) =>
    r.status === 'fulfilled' ? (r.value.count ?? 0) : 0;

  return {
    totalSubjects: getCount(results[0]),
    totalMaterials: getCount(results[1]),
    totalQuizzes: getCount(results[2]),
    totalStudents: getCount(results[3]),
    totalSubmissions: getCount(results[4]),
    totalQuizAttempts: getCount(results[5]),
  };
}

export async function getRecentMaterials(limit = 5): Promise<AdminMaterial[]> {
  const { data, error } = await supabase
    .from('study_materials')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AdminMaterial[];
}

export async function getRecentQuizAttempts(limit = 5): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) {
    // Table might not exist yet
    console.warn('quiz_attempts table may not exist yet:', error.message);
    return [];
  }
  return (data ?? []) as QuizAttempt[];
}

// ─── Subjects ───────────────────────────────────────────────────────
// Your existing table has `name` column. We also sync `subject_name`.

export async function getAdminSubjects(): Promise<AdminSubject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('semester', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  // Ensure subject_name is always populated (from name)
  return (data ?? []).map((s: any) => ({
    ...s,
    subject_name: s.subject_name || s.name || '',
    name: s.name || s.subject_name || '',
  })) as AdminSubject[];
}

export async function createSubject(
  subject: Partial<AdminSubject>
): Promise<AdminSubject> {
  // Keep both name and subject_name in sync
  const insert: any = {
    name: subject.subject_name || subject.name || '',
    subject_name: subject.subject_name || subject.name || '',
    semester: subject.semester ?? 1,
    credits: subject.credits ?? 3,
    difficulty: subject.difficulty ?? 'Beginner',
    description: subject.description ?? '',
  };
  const { data, error } = await supabase
    .from('subjects')
    .insert([insert])
    .select()
    .single();
  if (error) throw error;
  return { ...data, subject_name: data.subject_name || data.name } as AdminSubject;
}

export async function updateAdminSubject(
  id: string,
  updates: Partial<AdminSubject>
): Promise<AdminSubject> {
  // Keep both columns in sync
  const patch: any = { ...updates, updated_at: new Date().toISOString() };
  if (updates.subject_name) patch.name = updates.subject_name;
  if (updates.name) patch.subject_name = updates.name;
  // Remove computed fields
  delete patch.id;
  delete patch.created_at;

  const { data, error } = await supabase
    .from('subjects')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return { ...data, subject_name: data.subject_name || data.name } as AdminSubject;
}

export async function deleteAdminSubject(id: string): Promise<void> {
  const { error } = await supabase.from('subjects').delete().eq('id', id);
  if (error) throw error;
}

// ─── Units ──────────────────────────────────────────────────────────

export async function getUnits(subjectId?: string): Promise<AdminUnit[]> {
  let query = supabase
    .from('units')
    .select('*, subjects(name, subject_name)')
    .order('order_no', { ascending: true });
  if (subjectId) query = query.eq('subject_id', subjectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((u: any) => ({
    ...u,
    subject_name: u.subjects?.subject_name || u.subjects?.name || '',
    subjects: undefined,
  })) as AdminUnit[];
}

export async function createUnit(
  unit: Omit<AdminUnit, 'id' | 'created_at' | 'updated_at' | 'subject_name'>
): Promise<AdminUnit> {
  const { data, error } = await supabase
    .from('units')
    .insert([unit])
    .select()
    .single();
  if (error) throw error;
  return data as AdminUnit;
}

export async function updateUnit(
  id: string,
  updates: Partial<AdminUnit>
): Promise<AdminUnit> {
  const { subject_name, ...rest } = updates as any;
  const { data, error } = await supabase
    .from('units')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as AdminUnit;
}

export async function deleteUnit(id: string): Promise<void> {
  const { error } = await supabase.from('units').delete().eq('id', id);
  if (error) throw error;
}

// ─── Study Materials ────────────────────────────────────────────────

export async function getAdminMaterials(subjectId?: string): Promise<AdminMaterial[]> {
  let query = supabase
    .from('study_materials')
    .select('*')
    .order('uploaded_at', { ascending: false });
  if (subjectId) query = query.eq('subject_id', subjectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AdminMaterial[];
}

export async function createMaterial(
  material: Omit<AdminMaterial, 'id' | 'created_at' | 'updated_at'>
): Promise<AdminMaterial> {
  const { data, error } = await supabase
    .from('study_materials')
    .insert([material])
    .select()
    .single();
  if (error) throw error;
  return data as AdminMaterial;
}

export async function deleteAdminMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('study_materials').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadFileToStorage(
  file: File,
  bucket = 'study-materials'
): Promise<string> {
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(safeName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl.publicUrl;
}

// ─── Quizzes ────────────────────────────────────────────────────────
// Quizzes use BIGSERIAL id but UUID subject_id → subjects

export async function getAdminQuizzes(): Promise<AdminQuiz[]> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, subjects(name, subject_name), quiz_questions(id)')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('quizzes table may not exist yet:', error.message);
    return [];
  }
  return (data ?? []).map((q: any) => ({
    ...q,
    subject_name: q.subjects?.subject_name || q.subjects?.name || '',
    question_count: q.quiz_questions?.length ?? 0,
    subjects: undefined,
    quiz_questions: undefined,
  })) as AdminQuiz[];
}

export async function createQuiz(
  quiz: Omit<AdminQuiz, 'id' | 'created_at' | 'updated_at' | 'subject_name' | 'question_count'>
): Promise<AdminQuiz> {
  const { data, error } = await supabase
    .from('quizzes')
    .insert([quiz])
    .select()
    .single();
  if (error) throw error;
  return data as AdminQuiz;
}

export async function updateQuiz(
  id: number,
  updates: Partial<AdminQuiz>
): Promise<AdminQuiz> {
  const { subject_name, question_count, ...rest } = updates as any;
  const { data, error } = await supabase
    .from('quizzes')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as AdminQuiz;
}

export async function deleteQuiz(id: number): Promise<void> {
  const { error } = await supabase.from('quizzes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Quiz Questions ─────────────────────────────────────────────────

export async function getQuizQuestions(quizId: number): Promise<AdminQuizQuestion[]> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_no', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminQuizQuestion[];
}

export async function createQuizQuestion(
  question: Omit<AdminQuizQuestion, 'id' | 'created_at'>
): Promise<AdminQuizQuestion> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .insert([question])
    .select()
    .single();
  if (error) throw error;
  return data as AdminQuizQuestion;
}

export async function updateQuizQuestion(
  id: number,
  updates: Partial<AdminQuizQuestion>
): Promise<AdminQuizQuestion> {
  const { data, error } = await supabase
    .from('quiz_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as AdminQuizQuestion;
}

export async function deleteQuizQuestion(id: number): Promise<void> {
  const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
  if (error) throw error;
}

// ─── Students ───────────────────────────────────────────────────────

export async function getStudentsList(): Promise<StudentInfo[]> {
  // Get unique users from student_progress
  const { data, error } = await supabase
    .from('student_progress')
    .select('user_id, last_accessed_at, progress_percent, score, last_accessed')
    .order('last_accessed_at', { ascending: false });

  if (error) {
    console.warn('student_progress query error:', error.message);
    return [];
  }

  // Aggregate by user_id
  const map = new Map<string, StudentInfo>();
  for (const row of data ?? []) {
    const existing = map.get(row.user_id);
    const scoreVal = Number(row.score ?? row.progress_percent ?? 0);
    const lastActive = row.last_accessed_at || row.last_accessed;
    if (!existing) {
      map.set(row.user_id, {
        user_id: row.user_id,
        last_active: lastActive,
        subjects_count: 1,
        avg_score: scoreVal,
      });
    } else {
      existing.subjects_count = (existing.subjects_count || 0) + 1;
      existing.avg_score = ((existing.avg_score || 0) + scoreVal) / 2;
    }
  }

  // Get quiz attempt & coding submission counts
  const users = Array.from(map.values());
  for (const u of users) {
    const [qa, cs] = await Promise.allSettled([
      supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', u.user_id),
      supabase.from('coding_submissions').select('id', { count: 'exact', head: true }).eq('user_id', u.user_id),
    ]);
    u.quiz_attempts_count = qa.status === 'fulfilled' ? (qa.value.count ?? 0) : 0;
    u.coding_submissions_count = cs.status === 'fulfilled' ? (cs.value.count ?? 0) : 0;
  }
  return users;
}

export async function getStudentQuizAttempts(userId: string): Promise<QuizAttempt[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('*, quizzes(title)')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  if (error) {
    console.warn('quiz_attempts query error:', error.message);
    return [];
  }
  return (data ?? []).map((a: any) => ({
    ...a,
    quiz_title: a.quizzes?.title ?? '',
    quizzes: undefined,
  })) as QuizAttempt[];
}

export async function getStudentCodingSubmissions(userId: string): Promise<CodingSubmission[]> {
  const { data, error } = await supabase
    .from('coding_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('submitted_at', { ascending: false });
  if (error) {
    console.warn('coding_submissions query error:', error.message);
    return [];
  }
  return (data ?? []) as CodingSubmission[];
}

// ─── Admin Settings ─────────────────────────────────────────────────

export async function getAdminSettings(): Promise<AdminSettings> {
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .single();
  if (error) {
    // Return defaults if table doesn't exist yet
    console.warn('admin_settings not available:', error.message);
    return {
      id: 0,
      platform_name: 'Study Spark - BCA Edition',
      enable_quiz: true,
      enable_coding_lab: true,
      enable_ai_chat: true,
      upload_limit_mb: 10,
      allowed_file_types: ['pdf', 'doc', 'docx', 'txt'],
    };
  }
  return data as AdminSettings;
}

export async function updateAdminSettings(
  id: number,
  updates: Partial<AdminSettings>
): Promise<AdminSettings> {
  const { data, error } = await supabase
    .from('admin_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as AdminSettings;
}

// ─── Realtime Subscriptions ─────────────────────────────────────────
export type RealtimeCallback = () => void;

export function subscribeToTable(table: string, callback: RealtimeCallback) {
  const channel = supabase
    .channel(`admin_${table}_changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => callback()
    )
    .subscribe();
  return channel;
}

export function subscribeToAdminChanges(callback: RealtimeCallback) {
  const tables = [
    'subjects',
    'units',
    'study_materials',
    'quizzes',
    'quiz_questions',
    'student_progress',
    'quiz_attempts',
    'coding_submissions',
    'admin_settings',
  ];
  const channels = tables.map((t) => subscribeToTable(t, callback));
  return {
    unsubscribe: () => channels.forEach((c) => c.unsubscribe()),
  };
}
