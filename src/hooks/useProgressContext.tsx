/**
 * useProgressContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Global progress state shared across all views (Dashboard, SubjectSelector,
 * ProgressDashboard, etc.).
 *
 * Holds:
 *  • progressMap   — per-subject student_progress rows
 *  • dashboardStats — aggregated stats (overall %, quizzes done, avg score…)
 *  • subjects / resourceCounts / bookmarkedIds
 *  • achievements / activity feed
 *
 * Provides:
 *  • Supabase Realtime subscriptions (student_progress, quiz_results,
 *    quiz_attempts, study_sessions, bookmarks)
 *  • refetch()  — manual full re-fetch
 *  • optimistic helpers for progress & bookmarks
 *  • recordQuizCompletion() — save quiz result + optimistic UI update
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  fetchSubjects,
  fetchResourceCounts,
  fetchUserProgress,
  fetchBookmarkedIds,
  upsertProgress,
  toggleBookmark,
  type SubjectRow,
  type StudentProgress,
} from '@/lib/subjectService';
import {
  fetchDashboardStats,
  fetchAchievements,
  fetchActivityFeed,
  fetchQuizAttempts,
  type DashboardStats,
  type Achievement,
  type ActivityItem,
  type QuizAttemptRow,
} from '@/lib/dashboardService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgressContextValue {
  // Data
  subjects: SubjectRow[];
  resourceCounts: Record<string, number>;
  progressMap: Record<string, StudentProgress>;
  bookmarkedIds: Set<string>;
  stats: DashboardStats;
  achievements: Achievement[];
  activity: ActivityItem[];
  quizAttempts: QuizAttemptRow[];

  // State
  loading: boolean;
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
  updateProgressOptimistic: (subjectId: string, patch: Partial<StudentProgress>) => void;
  toggleBookmarkOptimistic: (subjectId: string) => Promise<void>;
  recordQuizCompletion: (opts: {
    quizId: number | null;
    subjectId: string;
    subjectName: string;
    score: number;
    total: number;
    answers: boolean[];
  }) => Promise<void>;
  touchSubjectAccess: (subjectId: string) => Promise<void>;
}

const DEFAULT_STATS: DashboardStats = {
  totalSubjects: 0,
  completedSubjects: 0,
  overallProgress: 0,
  currentStreak: 0,
  totalStudyMinutes: 0,
  quizzesCompleted: 0,
  avgQuizScore: 0,
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProgressProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [resourceCounts, setResourceCounts] = useState<Record<string, number>>({});
  const [progressMap, setProgressMap] = useState<Record<string, StudentProgress>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce helper — avoid spamming refetch on rapid realtime events
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Full load ──────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      // Use Promise.allSettled so one failing query doesn't block everything
      const results = await Promise.allSettled([
        fetchSubjects(),
        fetchResourceCounts(),
        fetchUserProgress(userId),
        fetchBookmarkedIds(userId),
        fetchDashboardStats(userId),
        fetchAchievements(userId),
        fetchActivityFeed(userId),
        fetchQuizAttempts(userId),
      ]);

      const val = <T,>(r: PromiseSettledResult<T>, fallback: T): T =>
        r.status === 'fulfilled' ? r.value : fallback;

      // Log any failures for debugging
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const labels = ['subjects', 'resourceCounts', 'userProgress', 'bookmarks', 'dashStats', 'achievements', 'activity', 'quizAttempts'];
          console.warn(`[ProgressContext] ${labels[i]} failed:`, r.reason);
        }
      });

      setSubjects(val(results[0] as PromiseSettledResult<typeof subjects>, []));
      setResourceCounts(val(results[1] as PromiseSettledResult<typeof resourceCounts>, {}));
      setProgressMap(val(results[2] as PromiseSettledResult<typeof progressMap>, {}));
      setBookmarkedIds(val(results[3] as PromiseSettledResult<typeof bookmarkedIds>, new Set()));
      setStats(val(results[4] as PromiseSettledResult<typeof stats>, DEFAULT_STATS));
      setAchievements(val(results[5] as PromiseSettledResult<typeof achievements>, []));
      setActivity(val(results[6] as PromiseSettledResult<typeof activity>, []));
      setQuizAttempts(val(results[7] as PromiseSettledResult<typeof quizAttempts>, []));
      setError(null);
    } catch (e: any) {
      console.error('[ProgressContext] load error:', e);
      setError(e?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    load();
  }, [load]);

  // ── Debounced refetch (called by realtime listeners) ──────────────────

  const debouncedRefetch = useCallback(() => {
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(() => {
      load();
    }, 400); // 400ms debounce
  }, [load]);

  // ── Realtime subscriptions ────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;

    const tables = [
      'student_progress',
      'quiz_results',
      'quiz_attempts',
      'study_sessions',
      'bookmarks',
    ];

    const channels = tables.map((table, i) =>
      supabase
        .channel(`progress_ctx_${table}_${userId}_${i}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `user_id=eq.${userId}`,
          },
          () => {
            debouncedRefetch();
          }
        )
        .subscribe()
    );

    // Also listen for new subjects / materials (no user filter)
    const subjectChannel = supabase
      .channel(`progress_ctx_subjects_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subjects' },
        () => debouncedRefetch()
      )
      .subscribe();

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
      supabase.removeChannel(subjectChannel);
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    };
  }, [userId, debouncedRefetch]);

  // ── Optimistic progress update ────────────────────────────────────────

  const updateProgressOptimistic = useCallback(
    (subjectId: string, patch: Partial<StudentProgress>) => {
      setProgressMap((prev) => ({
        ...prev,
        [subjectId]: {
          ...prev[subjectId],
          user_id: userId ?? '',
          subject_id: subjectId,
          progress_percent: prev[subjectId]?.progress_percent ?? 0,
          last_resource_id: prev[subjectId]?.last_resource_id ?? null,
          last_accessed_at: prev[subjectId]?.last_accessed_at ?? new Date().toISOString(),
          ...patch,
        },
      }));
    },
    [userId]
  );

  // ── Touch subject access (updates last_accessed_at + upserts to DB) ──

  const touchSubjectAccess = useCallback(
    async (subjectId: string) => {
      if (!userId) return;
      const now = new Date().toISOString();
      const existing = progressMap[subjectId];

      // Optimistic
      updateProgressOptimistic(subjectId, { last_accessed_at: now });

      try {
        await upsertProgress({
          user_id: userId,
          subject_id: subjectId,
          progress_percent: existing?.progress_percent ?? 0,
          last_resource_id: existing?.last_resource_id ?? null,
          last_accessed_at: now,
        });
      } catch (e) {
        console.error('[ProgressContext] touchSubjectAccess error:', e);
      }
    },
    [userId, progressMap, updateProgressOptimistic]
  );

  // ── Bookmark toggle (optimistic + DB) ─────────────────────────────────

  const toggleBookmarkOptimistic = useCallback(
    async (subjectId: string) => {
      if (!userId) return;
      const isBookmarked = bookmarkedIds.has(subjectId);

      // Optimistic
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        isBookmarked ? next.delete(subjectId) : next.add(subjectId);
        return next;
      });

      try {
        await toggleBookmark(userId, subjectId, isBookmarked);
      } catch {
        // Revert
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          isBookmarked ? next.add(subjectId) : next.delete(subjectId);
          return next;
        });
      }
    },
    [userId, bookmarkedIds]
  );

  // ── Record quiz completion (save to DB + optimistic stats update) ─────

  const recordQuizCompletion = useCallback(
    async ({
      quizId,
      subjectId,
      subjectName,
      score,
      total,
      answers,
    }: {
      quizId: number | null;
      subjectId: string;
      subjectName: string;
      score: number;
      total: number;
      answers: boolean[];
    }) => {
      if (!userId) return;

      const pct = total > 0 ? Math.round((score / total) * 100) : 0;

      // Optimistic stats update
      setStats((prev) => ({
        ...prev,
        quizzesCompleted: prev.quizzesCompleted + 1,
        avgQuizScore: Math.round(
          (prev.avgQuizScore * prev.quizzesCompleted + pct) /
            (prev.quizzesCompleted + 1)
        ),
      }));

      // Optimistic quiz attempt prepend (immediate UI update)
      const now = new Date().toISOString();
      const optimisticAttempt: QuizAttemptRow = {
        id: `optimistic_${Date.now()}`,
        user_id: userId,
        quiz_id: quizId,
        score,
        total,
        started_at: now,
        completed_at: now,
        quiz_title: 'Quiz',
        subject_name: subjectName,
      };
      setQuizAttempts((prev) => [optimisticAttempt, ...prev]);

      try {
        // Insert into quiz_attempts
        await supabase.from('quiz_attempts').insert({
          user_id: userId,
          quiz_id: quizId,
          score,
          total,
          answers,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });

        // Insert into quiz_results (used by dashboardService stats)
        const { error } = await supabase.from('quiz_results').insert({
          user_id: userId,
          subject: subjectName,
          score: pct,
          total,
          created_at: new Date().toISOString(),
        });
        if (error) console.warn('[ProgressContext] quiz_results insert:', error.message);

        // Log activity
        try {
          await supabase.from('activity_logs').insert({
            user_id: userId,
            type: 'quiz_completed',
            title: `Completed quiz: ${subjectName}`,
            description: `Scored ${score}/${total} (${pct}%)`,
            metadata: { quiz_id: quizId, subject_id: subjectId, score, total },
          });
        } catch {
          // activity_logs may not exist
        }
      } catch (e) {
        console.error('[ProgressContext] recordQuizCompletion error:', e);
        // Revert optimistic
        setStats((prev) => ({
          ...prev,
          quizzesCompleted: Math.max(0, prev.quizzesCompleted - 1),
          avgQuizScore:
            prev.quizzesCompleted > 1
              ? Math.round(
                  (prev.avgQuizScore * prev.quizzesCompleted - pct) /
                    (prev.quizzesCompleted - 1)
                )
              : 0,
        }));
        throw e; // let caller handle toast
      }
    },
    [userId]
  );

  // ── Context value (memoized) ──────────────────────────────────────────

  const value = useMemo<ProgressContextValue>(
    () => ({
      subjects,
      resourceCounts,
      progressMap,
      bookmarkedIds,
      stats,
      achievements,
      activity,
      quizAttempts,
      loading,
      error,
      refetch: load,
      updateProgressOptimistic,
      toggleBookmarkOptimistic,
      recordQuizCompletion,
      touchSubjectAccess,
    }),
    [
      subjects,
      resourceCounts,
      progressMap,
      bookmarkedIds,
      stats,
      achievements,
      activity,
      quizAttempts,
      loading,
      error,
      load,
      updateProgressOptimistic,
      toggleBookmarkOptimistic,
      recordQuizCompletion,
      touchSubjectAccess,
    ]
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress() must be used within <ProgressProvider>');
  }
  return ctx;
}

export default ProgressContext;
