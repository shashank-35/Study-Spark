/**
 * studyPlannerService.ts
 * Supabase CRUD + Realtime + Optimistic helpers for Study Planner.
 */

import { supabase } from './supabaseClient';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StudySession {
    id: string;
    user_id: string;
    subject: string;
    duration: number;
    actual_duration: number | null;
    date: string;
    start_time: string | null;
    notes: string | null;
    completed: boolean;
    created_at: string;
    updated_at: string;
}

export interface StudyGoal {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    due_date: string;
    progress: number;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    category: string | null;
    created_at: string;
    updated_at: string;
}

export interface StudyTodo {
    id: string;
    user_id: string;
    task: string;
    due_date: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    completed_at: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

// ── Sessions CRUD ──────────────────────────────────────────────────────────────

export async function fetchSessions(userId: string): Promise<StudySession[]> {
    const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
    if (error) { console.error('fetchSessions:', error); return []; }
    return data ?? [];
}

export async function addSession(session: Omit<StudySession, 'id' | 'created_at' | 'updated_at'>): Promise<StudySession | null> {
    const { data, error } = await supabase
        .from('study_sessions')
        .insert([session])
        .select()
        .single();
    if (error) { console.error('addSession:', error); throw error; }
    return data;
}

export async function updateSession(id: string, updates: Partial<StudySession>): Promise<StudySession | null> {
    const { data, error } = await supabase
        .from('study_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) { console.error('updateSession:', error); throw error; }
    return data;
}

export async function deleteSession(id: string): Promise<void> {
    const { error } = await supabase.from('study_sessions').delete().eq('id', id);
    if (error) { console.error('deleteSession:', error); throw error; }
}

// ── Goals CRUD ─────────────────────────────────────────────────────────────────

export async function fetchGoals(userId: string): Promise<StudyGoal[]> {
    const { data, error } = await supabase
        .from('study_goals')
        .select('*')
        .eq('user_id', userId)
        .order('completed', { ascending: true })
        .order('due_date', { ascending: true });
    if (error) { console.error('fetchGoals:', error); return []; }
    return data ?? [];
}

export async function addGoal(goal: Omit<StudyGoal, 'id' | 'created_at' | 'updated_at'>): Promise<StudyGoal | null> {
    const { data, error } = await supabase
        .from('study_goals')
        .insert([goal])
        .select()
        .single();
    if (error) { console.error('addGoal:', error); throw error; }
    return data;
}

export async function updateGoal(id: string, updates: Partial<StudyGoal>): Promise<StudyGoal | null> {
    const { data, error } = await supabase
        .from('study_goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) { console.error('updateGoal:', error); throw error; }
    return data;
}

export async function deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from('study_goals').delete().eq('id', id);
    if (error) { console.error('deleteGoal:', error); throw error; }
}

// ── Todos CRUD ─────────────────────────────────────────────────────────────────

export async function fetchTodos(userId: string): Promise<StudyTodo[]> {
    const { data, error } = await supabase
        .from('study_todos')
        .select('*')
        .eq('user_id', userId)
        .order('completed', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('due_date', { ascending: true });
    if (error) { console.error('fetchTodos:', error); return []; }
    return data ?? [];
}

export async function addTodo(todo: Omit<StudyTodo, 'id' | 'created_at' | 'updated_at'>): Promise<StudyTodo | null> {
    const { data, error } = await supabase
        .from('study_todos')
        .insert([todo])
        .select()
        .single();
    if (error) { console.error('addTodo:', error); throw error; }
    return data;
}

export async function updateTodo(id: string, updates: Partial<StudyTodo>): Promise<StudyTodo | null> {
    const { data, error } = await supabase
        .from('study_todos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) { console.error('updateTodo:', error); throw error; }
    return data;
}

export async function deleteTodo(id: string): Promise<void> {
    const { error } = await supabase.from('study_todos').delete().eq('id', id);
    if (error) { console.error('deleteTodo:', error); throw error; }
}

// ── Realtime ───────────────────────────────────────────────────────────────────

export function subscribeToSessions(userId: string, cb: () => void) {
    const ch = supabase
        .channel(`sp_sessions_${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${userId}` }, cb)
        .subscribe();
    return () => { supabase.removeChannel(ch); };
}

export function subscribeToGoals(userId: string, cb: () => void) {
    const ch = supabase
        .channel(`sp_goals_${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_goals', filter: `user_id=eq.${userId}` }, cb)
        .subscribe();
    return () => { supabase.removeChannel(ch); };
}

export function subscribeToTodos(userId: string, cb: () => void) {
    const ch = supabase
        .channel(`sp_todos_${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_todos', filter: `user_id=eq.${userId}` }, cb)
        .subscribe();
    return () => { supabase.removeChannel(ch); };
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export interface PlannerStats {
    totalMinutes: number;
    completedSessions: number;
    totalSessions: number;
    completedGoals: number;
    totalGoals: number;
    avgGoalProgress: number;
    completedTodos: number;
    totalTodos: number;
    currentStreak: number;
    todaySessions: number;
    todayMinutes: number;
    weeklyMinutes: number[];   // last 7 days [Mon..Sun or chronological]
    subjectBreakdown: { subject: string; minutes: number }[];
}

export function computeStats(
    sessions: StudySession[],
    goals: StudyGoal[],
    todos: StudyTodo[]
): PlannerStats {
    const today = new Date().toISOString().split('T')[0];
    const completedSessions = sessions.filter(s => s.completed);
    const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.actual_duration ?? s.duration), 0);
    const todayCompleted = completedSessions.filter(s => s.date === today);
    const todayMinutes = todayCompleted.reduce((sum, s) => sum + (s.actual_duration ?? s.duration), 0);
    const todaySessions = sessions.filter(s => s.date === today).length;

    // Weekly minutes (last 7 days)
    const weeklyMinutes: number[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayMins = completedSessions
            .filter(s => s.date === dateStr)
            .reduce((sum, s) => sum + (s.actual_duration ?? s.duration), 0);
        weeklyMinutes.push(dayMins);
    }

    // Subject breakdown
    const subjectMap = new Map<string, number>();
    completedSessions.forEach(s => {
        subjectMap.set(s.subject, (subjectMap.get(s.subject) ?? 0) + (s.actual_duration ?? s.duration));
    });
    const subjectBreakdown = Array.from(subjectMap.entries())
        .map(([subject, minutes]) => ({ subject, minutes }))
        .sort((a, b) => b.minutes - a.minutes);

    const completedGoals = goals.filter(g => g.completed).length;
    const avgGoalProgress = goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
        : 0;
    const completedTodos = todos.filter(t => t.completed).length;

    // Streak
    let streak = 0;
    const sessionDates = new Set(completedSessions.map(s => s.date));
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (sessionDates.has(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    return {
        totalMinutes,
        completedSessions: completedSessions.length,
        totalSessions: sessions.length,
        completedGoals,
        totalGoals: goals.length,
        avgGoalProgress,
        completedTodos,
        totalTodos: todos.length,
        currentStreak: streak,
        todaySessions,
        todayMinutes,
        weeklyMinutes,
        subjectBreakdown,
    };
}

// ── Motivational quotes ────────────────────────────────────────────────────────

export const MOTIVATIONAL_QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Study hard what interests you the most in the most undisciplined way.", author: "Richard Feynman" },
    { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
    { text: "The beautiful thing about learning is that no one can take it from you.", author: "B.B. King" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "There is no substitute for hard work.", author: "Thomas Edison" },
];

export function getRandomQuote() {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}
