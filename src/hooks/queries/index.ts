/**
 * hooks/queries/index.ts — barrel export for all React Query hooks.
 */

export { queryKeys } from './keys';
export { useRealtimeInvalidation } from './useRealtimeInvalidation';

export {
  // Query hooks
  useSubjects,
  useResourceCounts,
  useDashboardStats,
  useUserProgress,
  useBookmarkedIds,
  useAchievements,
  useActivityFeed,
  useQuizAttempts,
  useWeeklyActivity,
  useProfileRow,
  // Mutation hooks
  useUpsertProgress,
  useToggleBookmark,
  useRecordQuizCompletion,
  useTouchSubjectAccess,
  useUpdateProfile,
  // Constants
  DEFAULT_STATS,
} from './useDashboardQueries';

// Re-export types
export type {
  DashboardStats,
  SubjectRow,
  StudentProgress,
  Achievement,
  ActivityItem,
  QuizAttemptRow,
  WeeklyDay,
  ProfileRow,
} from './useDashboardQueries';
