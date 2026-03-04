/**
 * hooks/queries/keys.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized React Query key factory.
 * Ensures consistent cache key structure across the entire app.
 *
 * Pattern: [domain, scope?, ...params]
 */

export const queryKeys = {
  // ── Subjects ─────────────────────────────────────────────
  subjects: {
    all: ['subjects'] as const,
    list: () => [...queryKeys.subjects.all, 'list'] as const,
    resourceCounts: () => [...queryKeys.subjects.all, 'resourceCounts'] as const,
  },

  // ── Dashboard / Stats ────────────────────────────────────
  dashboard: {
    all: (userId: string) => ['dashboard', userId] as const,
    stats: (userId: string) => [...queryKeys.dashboard.all(userId), 'stats'] as const,
    progress: (userId: string) => [...queryKeys.dashboard.all(userId), 'progress'] as const,
    bookmarks: (userId: string) => [...queryKeys.dashboard.all(userId), 'bookmarks'] as const,
    achievements: (userId: string) => [...queryKeys.dashboard.all(userId), 'achievements'] as const,
    activity: (userId: string) => [...queryKeys.dashboard.all(userId), 'activity'] as const,
    quizAttempts: (userId: string) => [...queryKeys.dashboard.all(userId), 'quizAttempts'] as const,
    weeklyActivity: (userId: string) => [...queryKeys.dashboard.all(userId), 'weeklyActivity'] as const,
  },

  // ── Profile ──────────────────────────────────────────────
  profile: {
    all: (userId: string) => ['profile', userId] as const,
    row: (userId: string) => [...queryKeys.profile.all(userId), 'row'] as const,
  },

  // ── Quizzes ──────────────────────────────────────────────
  quizzes: {
    all: ['quizzes'] as const,
    list: () => [...queryKeys.quizzes.all, 'list'] as const,
    bySubject: (subjectId: string) => [...queryKeys.quizzes.all, 'subject', subjectId] as const,
  },

  // ── Coding ───────────────────────────────────────────────
  coding: {
    all: ['coding'] as const,
    problems: () => [...queryKeys.coding.all, 'problems'] as const,
  },
} as const;
