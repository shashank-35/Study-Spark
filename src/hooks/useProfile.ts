/**
 * useProfile.ts
 * Central hook for the profile page — fetches all profile data from Supabase,
 * provides loading / error states, and subscribes to real-time changes.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  fetchProfile,
  fetchAcademicStats,
  fetchSubjectProgress,
  fetchProfileActivity,
  fetchProfileAchievements,
  subscribeProfile,
} from '@/lib/profileService';
import type {
  ProfileRow,
  AcademicStats,
  SubjectProgress,
  ProfileActivity,
  ProfileAchievement,
} from '@/lib/profileService';

export interface ProfileData {
  profile: ProfileRow | null;
  stats: AcademicStats;
  subjects: SubjectProgress[];
  activity: ProfileActivity[];
  achievements: ProfileAchievement[];
}

const DEFAULT_STATS: AcademicStats = {
  totalSubjects: 0,
  completedSubjects: 0,
  overallProgress: 0,
  currentStreak: 0,
  totalStudyMinutes: 0,
  quizzesCompleted: 0,
  avgQuizScore: 0,
};

export function useProfile(userId: string | undefined) {
  const [data, setData] = useState<ProfileData>({
    profile: null,
    stats: DEFAULT_STATS,
    subjects: [],
    activity: [],
    achievements: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [profile, stats, subjects, activity, achievements] = await Promise.all([
        fetchProfile(userId),
        fetchAcademicStats(userId),
        fetchSubjectProgress(userId),
        fetchProfileActivity(userId),
        fetchProfileAchievements(userId),
      ]);
      setData({ profile, stats, subjects, activity, achievements });
      setError(null);
    } catch (e: any) {
      console.error('useProfile load error:', e);
      setError(e.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeProfile(userId, () => { load(); });
    return unsub;
  }, [userId, load]);

  return { ...data, loading, error, refetch: load };
}
