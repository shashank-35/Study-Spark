/**
 * hooks/queries/useDashboardQueries.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * React Query hooks for all dashboard/profile data domains.
 *
 * Each hook:
 *  - Uses `useQuery` with centralized query keys (from keys.ts)
 *  - Calls unified API functions (from api/dashboard.ts)
 *  - Configures appropriate staleTime / gcTime per domain
 *
 * Realtime cache invalidation is handled by useRealtimeInvalidation.ts
 * (mounted once at the provider level), NOT inside each hook.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import {
  fetchSubjects,
  fetchResourceCounts,
  fetchUserProgress,
  upsertProgress,
  fetchBookmarkedIds,
  toggleBookmark,
  fetchDashboardStats,
  fetchAchievements,
  fetchActivityFeed,
  fetchQuizAttempts,
  fetchWeeklyActivity,
  fetchProfile,
  upsertProfile,
  type DashboardStats,
  type SubjectRow,
  type StudentProgress,
  type Achievement,
  type ActivityItem,
  type QuizAttemptRow,
  type WeeklyDay,
  type ProfileRow,
} from '@/api/dashboard';
import { supabase } from '@/api/client';
import type { UseMutationOptions } from '@tanstack/react-query';

// ─── Default stats (used before first fetch completes) ────────────────────────

export const DEFAULT_STATS: DashboardStats = {
  totalSubjects: 0,
  completedSubjects: 0,
  overallProgress: 0,
  currentStreak: 0,
  totalStudyMinutes: 0,
  quizzesCompleted: 0,
  avgQuizScore: 0,
};

// ─── Stale / cache time constants ─────────────────────────────────────────────

const STALE = {
  /** Subjects rarely change — 5 min stale is fine */
  SUBJECTS: 5 * 60 * 1000,
  /** Stats/progress — refresh after 2 min */
  STATS: 2 * 60 * 1000,
  /** Activity feed — 1 min */
  ACTIVITY: 60 * 1000,
  /** Profile — 3 min */
  PROFILE: 3 * 60 * 1000,
} as const;

// ─── Subject hooks ────────────────────────────────────────────────────────────

export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects.list(),
    queryFn: fetchSubjects,
    staleTime: STALE.SUBJECTS,
    placeholderData: [] as SubjectRow[],
  });
}

export function useResourceCounts() {
  return useQuery({
    queryKey: queryKeys.subjects.resourceCounts(),
    queryFn: fetchResourceCounts,
    staleTime: STALE.SUBJECTS,
    placeholderData: {} as Record<string, number>,
  });
}

// ─── Dashboard hooks ──────────────────────────────────────────────────────────

export function useDashboardStats(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(userId ?? ''),
    queryFn: () => fetchDashboardStats(userId!),
    enabled: !!userId,
    staleTime: STALE.STATS,
    placeholderData: DEFAULT_STATS,
  });
}

export function useUserProgress(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.progress(userId ?? ''),
    queryFn: () => fetchUserProgress(userId!),
    enabled: !!userId,
    staleTime: STALE.STATS,
    placeholderData: {} as Record<string, StudentProgress>,
  });
}

export function useBookmarkedIds(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.bookmarks(userId ?? ''),
    queryFn: () => fetchBookmarkedIds(userId!),
    enabled: !!userId,
    staleTime: STALE.STATS,
    placeholderData: new Set<string>(),
  });
}

export function useAchievements(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.achievements(userId ?? ''),
    queryFn: () => fetchAchievements(userId!),
    enabled: !!userId,
    staleTime: STALE.ACTIVITY,
    placeholderData: [] as Achievement[],
  });
}

export function useActivityFeed(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(userId ?? ''),
    queryFn: () => fetchActivityFeed(userId!),
    enabled: !!userId,
    staleTime: STALE.ACTIVITY,
    placeholderData: [] as ActivityItem[],
  });
}

export function useQuizAttempts(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.quizAttempts(userId ?? ''),
    queryFn: () => fetchQuizAttempts(userId!),
    enabled: !!userId,
    staleTime: STALE.STATS,
    placeholderData: [] as QuizAttemptRow[],
  });
}

export function useWeeklyActivity(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard.weeklyActivity(userId ?? ''),
    queryFn: () => fetchWeeklyActivity(userId!),
    enabled: !!userId,
    staleTime: STALE.ACTIVITY,
    placeholderData: [] as WeeklyDay[],
  });
}

// ─── Profile hooks ────────────────────────────────────────────────────────────

export function useProfileRow(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.profile.row(userId ?? ''),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: STALE.PROFILE,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Mutation: upsert student_progress with optimistic update.
 */
export function useUpsertProgress(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (progress: StudentProgress) => upsertProgress(progress),
    onMutate: async (progress) => {
      if (!userId) return;
      const key = queryKeys.dashboard.progress(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Record<string, StudentProgress>>(key);
      queryClient.setQueryData<Record<string, StudentProgress>>(key, (old) => ({
        ...old,
        [progress.subject_id]: { ...old?.[progress.subject_id], ...progress },
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev && userId) {
        queryClient.setQueryData(queryKeys.dashboard.progress(userId), ctx.prev);
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.progress(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(userId) });
      }
    },
  });
}

/**
 * Mutation: toggle bookmark with optimistic update.
 */
export function useToggleBookmark(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subjectId, isBookmarked }: { subjectId: string; isBookmarked: boolean }) =>
      toggleBookmark(userId!, subjectId, isBookmarked),
    onMutate: async ({ subjectId, isBookmarked }) => {
      if (!userId) return;
      const key = queryKeys.dashboard.bookmarks(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Set<string>>(key);
      queryClient.setQueryData<Set<string>>(key, (old) => {
        const next = new Set(old);
        isBookmarked ? next.delete(subjectId) : next.add(subjectId);
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev && userId) {
        queryClient.setQueryData(queryKeys.dashboard.bookmarks(userId), ctx.prev);
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.bookmarks(userId) });
      }
    },
  });
}

/**
 * Mutation: record quiz completion + optimistic stats bump.
 */
export function useRecordQuizCompletion(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
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
      if (!userId) throw new Error('Not authenticated');
      const now = new Date().toISOString();

      // Insert into quiz_attempts
      await supabase.from('quiz_attempts').insert({
        user_id: userId,
        quiz_id: quizId,
        score,
        total,
        answers,
        started_at: now,
        completed_at: now,
      });

      // Insert into quiz_results (legacy table)
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      await supabase.from('quiz_results').insert({
        user_id: userId,
        subject: subjectName,
        score: pct,
        total,
        created_at: now,
      });

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
    },
    onMutate: async ({ subjectName, score, total }) => {
      if (!userId) return;
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;

      // Optimistic stats
      const statsKey = queryKeys.dashboard.stats(userId);
      await queryClient.cancelQueries({ queryKey: statsKey });
      const prevStats = queryClient.getQueryData<DashboardStats>(statsKey);
      queryClient.setQueryData<DashboardStats>(statsKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          quizzesCompleted: old.quizzesCompleted + 1,
          avgQuizScore: Math.round(
            (old.avgQuizScore * old.quizzesCompleted + pct) / (old.quizzesCompleted + 1),
          ),
        };
      });

      // Optimistic quiz attempt
      const attKey = queryKeys.dashboard.quizAttempts(userId);
      const prevAttempts = queryClient.getQueryData<QuizAttemptRow[]>(attKey);
      queryClient.setQueryData<QuizAttemptRow[]>(attKey, (old) => {
        const now = new Date().toISOString();
        const optimistic: QuizAttemptRow = {
          id: `optimistic_${Date.now()}`,
          user_id: userId,
          quiz_id: null,
          score,
          total,
          started_at: now,
          completed_at: now,
          quiz_title: 'Quiz',
          subject_name: subjectName,
        };
        return [optimistic, ...(old ?? [])];
      });

      return { prevStats, prevAttempts };
    },
    onError: (_err, _vars, ctx) => {
      if (!userId) return;
      if (ctx?.prevStats) {
        queryClient.setQueryData(queryKeys.dashboard.stats(userId), ctx.prevStats);
      }
      if (ctx?.prevAttempts) {
        queryClient.setQueryData(queryKeys.dashboard.quizAttempts(userId), ctx.prevAttempts);
      }
    },
    onSettled: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.quizAttempts(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.activity(userId) });
    },
  });
}

/**
 * Mutation: touch subject access timestamp.
 */
export function useTouchSubjectAccess(userId: string | undefined) {
  const queryClient = useQueryClient();
  const upsertMutation = useUpsertProgress(userId);

  return useMutation({
    mutationFn: async (subjectId: string) => {
      if (!userId) throw new Error('Not authenticated');
      const progressData = queryClient.getQueryData<Record<string, StudentProgress>>(
        queryKeys.dashboard.progress(userId),
      );
      const existing = progressData?.[subjectId];
      await upsertProgress({
        user_id: userId,
        subject_id: subjectId,
        progress_percent: existing?.progress_percent ?? 0,
        last_resource_id: existing?.last_resource_id ?? null,
        last_accessed_at: new Date().toISOString(),
      });
    },
    onMutate: async (subjectId) => {
      if (!userId) return;
      const key = queryKeys.dashboard.progress(userId);
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<Record<string, StudentProgress>>(key, (old) => ({
        ...old,
        [subjectId]: {
          ...old?.[subjectId],
          user_id: userId,
          subject_id: subjectId,
          progress_percent: old?.[subjectId]?.progress_percent ?? 0,
          last_resource_id: old?.[subjectId]?.last_resource_id ?? null,
          last_accessed_at: new Date().toISOString(),
        },
      }));
    },
  });
}

/**
 * Mutation: update profile.
 */
export function useUpdateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<Pick<ProfileRow, 'name' | 'semester' | 'college' | 'learning_goal' | 'avatar_url'>>) =>
      upsertProfile(userId!, updates),
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.row(userId) });
      }
    },
  });
}

// ─── Re-export types for convenience ──────────────────────────────────────────

export type {
  DashboardStats,
  SubjectRow,
  StudentProgress,
  Achievement,
  ActivityItem,
  QuizAttemptRow,
  WeeklyDay,
  ProfileRow,
};
