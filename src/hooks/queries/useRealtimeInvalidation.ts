/**
 * hooks/queries/useRealtimeInvalidation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central Supabase Realtime → React Query cache bridge.
 *
 * Instead of each component independently subscribing and refetching,
 * this single hook:
 *  1. Opens precisely-filtered Supabase Realtime channels
 *  2. On any change → invalidates the matching React Query cache keys
 *  3. React Query's stale/refetch logic then handles the actual refresh
 *
 * This achieves:
 *  ✅ Deduplicated subscriptions (one per table, not per component)
 *  ✅ Automatic cache invalidation → all consuming components re-render
 *  ✅ No manual refetch logic in components
 *  ✅ Proper cleanup on unmount
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/client';
import { queryKeys } from './keys';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribe to all relevant Supabase Realtime channels for a user.
 * Invalidates the correct React Query cache keys on each change.
 *
 * Mount this ONCE at the app level (inside ProgressProvider or top-level).
 */
export function useRealtimeInvalidation(userId: string | undefined) {
  const queryClient = useQueryClient();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Debounce helper to batch rapid events
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const invalidateDebounced = (keys: readonly (readonly string[])[]) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        keys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key as any });
        });
      }, 300);
    };

    // ── User-scoped tables ──────────────────────────────────────────────

    const userTableConfig = [
      {
        table: 'student_progress',
        invalidate: () => invalidateDebounced([
          queryKeys.dashboard.stats(userId),
          queryKeys.dashboard.progress(userId),
        ]),
      },
      {
        table: 'study_sessions',
        invalidate: () => invalidateDebounced([
          queryKeys.dashboard.stats(userId),
          queryKeys.dashboard.weeklyActivity(userId),
          queryKeys.profile.all(userId),
        ]),
      },
      {
        table: 'quiz_attempts',
        invalidate: () => invalidateDebounced([
          queryKeys.dashboard.stats(userId),
          queryKeys.dashboard.quizAttempts(userId),
        ]),
      },
      {
        table: 'quiz_results',
        invalidate: () => invalidateDebounced([
          queryKeys.dashboard.stats(userId),
          queryKeys.dashboard.quizAttempts(userId),
        ]),
      },
      {
        table: 'bookmarks',
        invalidate: () => invalidateDebounced([
          queryKeys.dashboard.bookmarks(userId),
        ]),
      },
      {
        table: 'achievements',
        invalidate: () => invalidateDebounced([
          queryKeys.dashboard.achievements(userId),
          queryKeys.profile.all(userId),
        ]),
      },
      {
        table: 'activity_logs',
        invalidate: () => invalidateDebounced([
          queryKeys.dashboard.activity(userId),
          queryKeys.profile.all(userId),
        ]),
      },
      {
        table: 'study_goals',
        invalidate: () => invalidateDebounced([
          queryKeys.dashboard.stats(userId),
        ]),
      },
      {
        table: 'study_todos',
        invalidate: () => invalidateDebounced([
          queryKeys.dashboard.stats(userId),
        ]),
      },
      {
        table: 'profiles',
        invalidate: () => invalidateDebounced([
          queryKeys.profile.row(userId),
        ]),
      },
    ];

    const channels: RealtimeChannel[] = userTableConfig.map(({ table, invalidate }, i) =>
      supabase
        .channel(`rq_${table}_${userId}_${i}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
          invalidate,
        )
        .subscribe(),
    );

    // ── Global tables (no user filter) ──────────────────────────────────

    const subjectsChannel = supabase
      .channel(`rq_subjects_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subjects' },
        () => invalidateDebounced([
          queryKeys.subjects.list(),
          queryKeys.dashboard.stats(userId),
        ]),
      )
      .subscribe();

    const quizzesChannel = supabase
      .channel(`rq_quizzes_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quizzes' },
        () => invalidateDebounced([queryKeys.quizzes.list()]),
      )
      .subscribe();

    const codingChannel = supabase
      .channel(`rq_coding_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coding_problems' },
        () => invalidateDebounced([queryKeys.coding.problems()]),
      )
      .subscribe();

    channels.push(subjectsChannel, quizzesChannel, codingChannel);
    channelsRef.current = channels;

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      channels.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [userId, queryClient]);
}
