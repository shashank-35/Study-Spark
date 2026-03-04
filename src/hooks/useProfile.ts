/**
 * useProfile.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central hook for the profile page — backed by React Query.
 *
 * Uses the SAME React Query cache as the dashboard (via shared query keys),
 * so stats/subjects/achievements are never out of sync.
 */

import {
  useDashboardStats,
  useSubjects,
  useUserProgress,
  useAchievements,
  useActivityFeed,
  useProfileRow,
  DEFAULT_STATS,
  type ProfileRow,
  type SubjectRow,
  type DashboardStats,
  type Achievement,
  type ActivityItem,
  type StudentProgress,
} from '@/hooks/queries';

export interface SubjectProgressItem {
  subject_id: string;
  subject_name: string;
  semester: number;
  progress_percent: number;
  status: 'Not Started' | 'In Progress' | 'Completed';
  last_accessed_at: string | null;
}

export interface ProfileData {
  profile: ProfileRow | null;
  stats: DashboardStats;
  subjects: SubjectProgressItem[];
  activity: ActivityItem[];
  achievements: Achievement[];
}

export function useProfile(userId: string | undefined) {
  const { data: profile, isLoading: profileLoading } = useProfileRow(userId);
  const { data: stats = DEFAULT_STATS, isLoading: statsLoading } = useDashboardStats(userId);
  const { data: subjectRows = [], isLoading: subjectsLoading } = useSubjects();
  const { data: progressMap = {}, isLoading: progressLoading } = useUserProgress(userId);
  const { data: activity = [], isLoading: activityLoading } = useActivityFeed(userId);
  const { data: achievements = [], isLoading: achievementsLoading } = useAchievements(userId);

  // Transform subjects + progress into SubjectProgressItem[]
  const subjects: SubjectProgressItem[] = subjectRows.map((s: SubjectRow) => {
    const pct = (progressMap as Record<string, StudentProgress>)[s.id]?.progress_percent ?? 0;
    return {
      subject_id: s.id,
      subject_name: s.name,
      semester: s.semester,
      progress_percent: pct,
      status: pct >= 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started',
      last_accessed_at: (progressMap as Record<string, StudentProgress>)[s.id]?.last_accessed_at ?? null,
    };
  });

  const loading = profileLoading || statsLoading || subjectsLoading
    || progressLoading || activityLoading || achievementsLoading;

  return {
    profile: profile ?? null,
    stats,
    subjects,
    activity,
    achievements: achievements.map((a: Achievement) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      earned_at: a.earned_at,
    })),
    loading,
    error: null as string | null,
    refetch: () => {}, // React Query handles refetch automatically
  };
}
