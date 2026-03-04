/**
 * useProgressContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around React Query hooks that provides the same context
 * interface consumed by existing components.
 *
 * Architecture:
 *   Database → api/dashboard.ts → React Query cache → this context → components
 *
 * All data fetching + caching is handled by React Query.
 * All realtime → cache invalidation is handled by useRealtimeInvalidation.
 * This context only:
 *   1. Composes the individual React Query hooks into one value
 *   2. Exposes mutation helpers (optimistic bookmark/progress/quiz)
 *   3. Provides the same ProgressContextValue interface for backward compat
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSubjects,
  useResourceCounts,
  useDashboardStats,
  useUserProgress,
  useBookmarkedIds,
  useAchievements,
  useActivityFeed,
  useQuizAttempts,
  useToggleBookmark,
  useRecordQuizCompletion,
  useTouchSubjectAccess,
  useRealtimeInvalidation,
  queryKeys,
  DEFAULT_STATS,
} from '@/hooks/queries';

import type {
  DashboardStats,
  SubjectRow,
  StudentProgress,
  Achievement,
  ActivityItem,
  QuizAttemptRow,
} from '@/hooks/queries';

// ─── Types ────────────────────────────────────────────────────────────────────

export type { SubjectRow, StudentProgress, DashboardStats, Achievement, ActivityItem, QuizAttemptRow };

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

const ProgressContext = createContext<ProgressContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProgressProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  // ── React Query data hooks ───────────────────────────────────────────

  const { data: subjects = [], isLoading: subjectsLoading, error: subjectsError } = useSubjects();
  const { data: resourceCounts = {}, isLoading: rcLoading } = useResourceCounts();
  const { data: stats = DEFAULT_STATS, isLoading: statsLoading } = useDashboardStats(userId);
  const { data: progressMap = {}, isLoading: progressLoading } = useUserProgress(userId);
  const { data: bookmarkedIds = new Set<string>(), isLoading: bookmarksLoading } = useBookmarkedIds(userId);
  const { data: achievements = [], isLoading: achievementsLoading } = useAchievements(userId);
  const { data: activity = [], isLoading: activityLoading } = useActivityFeed(userId);
  const { data: quizAttempts = [], isLoading: quizLoading } = useQuizAttempts(userId);

  // ── Realtime → cache invalidation (mounted once here) ────────────────

  useRealtimeInvalidation(userId);

  // ── Derived loading / error ──────────────────────────────────────────

  const loading = subjectsLoading || rcLoading || statsLoading || progressLoading
    || bookmarksLoading || achievementsLoading || activityLoading || quizLoading;

  const error = subjectsError ? (subjectsError as Error).message : null;

  // ── Mutations ────────────────────────────────────────────────────────

  const toggleBookmarkMutation = useToggleBookmark(userId);
  const quizCompletionMutation = useRecordQuizCompletion(userId);
  const touchAccessMutation = useTouchSubjectAccess(userId);

  // ── Action wrappers (same signatures as before) ──────────────────────

  const refetch = useCallback(async () => {
    if (!userId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all(userId) }),
    ]);
  }, [userId, queryClient]);

  const updateProgressOptimistic = useCallback(
    (subjectId: string, patch: Partial<StudentProgress>) => {
      if (!userId) return;
      const key = queryKeys.dashboard.progress(userId);
      queryClient.setQueryData<Record<string, StudentProgress>>(key, (old) => ({
        ...old,
        [subjectId]: {
          ...old?.[subjectId],
          user_id: userId,
          subject_id: subjectId,
          progress_percent: old?.[subjectId]?.progress_percent ?? 0,
          last_resource_id: old?.[subjectId]?.last_resource_id ?? null,
          last_accessed_at: old?.[subjectId]?.last_accessed_at ?? new Date().toISOString(),
          ...patch,
        },
      }));
    },
    [userId, queryClient],
  );

  const toggleBookmarkOptimistic = useCallback(
    async (subjectId: string) => {
      if (!userId) return;
      const isBookmarked = bookmarkedIds.has(subjectId);
      await toggleBookmarkMutation.mutateAsync({ subjectId, isBookmarked });
    },
    [userId, bookmarkedIds, toggleBookmarkMutation],
  );

  const recordQuizCompletion = useCallback(
    async (opts: {
      quizId: number | null;
      subjectId: string;
      subjectName: string;
      score: number;
      total: number;
      answers: boolean[];
    }) => {
      await quizCompletionMutation.mutateAsync(opts);
    },
    [quizCompletionMutation],
  );

  const touchSubjectAccess = useCallback(
    async (subjectId: string) => {
      await touchAccessMutation.mutateAsync(subjectId);
    },
    [touchAccessMutation],
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
      refetch,
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
      refetch,
      updateProgressOptimistic,
      toggleBookmarkOptimistic,
      recordQuizCompletion,
      touchSubjectAccess,
    ],
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
