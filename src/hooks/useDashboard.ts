/**
 * useDashboard.ts
 * Central hook for the home dashboard — fetches all data from Supabase,
 * provides loading / empty states, and subscribes to real-time changes.
 */

import { useEffect, useState, useCallback } from 'react';
import { fetchDashboardStats, fetchAchievements, fetchActivityFeed, subscribeToDashboard } from '@/lib/dashboardService';
import { fetchSubjects, fetchUserProgress } from '@/lib/subjectService';
import type { DashboardStats, Achievement, ActivityItem } from '@/lib/dashboardService';
import type { SubjectRow, StudentProgress } from '@/lib/subjectService';

export interface DashboardData {
  stats: DashboardStats;
  subjects: SubjectRow[];
  progress: Record<string, StudentProgress>;
  achievements: Achievement[];
  activity: ActivityItem[];
}

const DEFAULT_STATS: DashboardStats = {
  totalSubjects: 0, completedSubjects: 0, overallProgress: 0,
  currentStreak: 0, totalStudyMinutes: 0, quizzesCompleted: 0, avgQuizScore: 0,
};

export function useDashboard(userId: string | undefined) {
  const [data, setData] = useState<DashboardData>({
    stats: DEFAULT_STATS, subjects: [], progress: {}, achievements: [], activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [stats, subjects, progress, achievements, activity] = await Promise.all([
        fetchDashboardStats(userId),
        fetchSubjects(),
        fetchUserProgress(userId),
        fetchAchievements(userId),
        fetchActivityFeed(userId),
      ]);
      setData({ stats, subjects, progress, achievements, activity });
      setError(null);
    } catch (e: any) {
      console.error('useDashboard load error:', e);
      setError(e.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToDashboard(userId, () => { load(); });
    return unsub;
  }, [userId, load]);

  return { ...data, loading, error, refetch: load };
}
