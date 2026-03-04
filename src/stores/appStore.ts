/**
 * stores/appStore.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Zustand store for CLIENT-SIDE state that:
 *  • Is NOT server data (that lives in React Query cache)
 *  • Needs to persist or be shared across components
 *
 * Holds:
 *  • Current view navigation state
 *  • Profile overrides (semester, college — persisted to localStorage)
 *  • UI preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileOverrides {
  name?: string;
  semester?: string;
  college?: string;
}

interface AppState {
  // Navigation
  currentView: string;
  setCurrentView: (view: string) => void;

  // Profile overrides (persisted to localStorage)
  profileOverrides: ProfileOverrides;
  updateProfileOverrides: (updates: Partial<ProfileOverrides>) => void;

  // Computed user data helper
  getUserData: (clerkUser: {
    fullName?: string | null;
    firstName?: string | null;
    emailAddresses: { emailAddress: string }[];
  } | null) => { name: string; email: string; semester: string; college: string };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Navigation ──────────────────────────────────────
      currentView: 'dashboard',
      setCurrentView: (view) => set({ currentView: view }),

      // ── Profile Overrides ───────────────────────────────
      profileOverrides: {},
      updateProfileOverrides: (updates) =>
        set((state) => ({
          profileOverrides: { ...state.profileOverrides, ...updates },
        })),

      // ── Computed User Data ──────────────────────────────
      getUserData: (clerkUser) => {
        const overrides = get().profileOverrides;
        return {
          name: overrides.name || clerkUser?.fullName || clerkUser?.firstName || 'Student',
          email: clerkUser?.emailAddresses[0]?.emailAddress || '',
          semester: overrides.semester || '5',
          college: overrides.college || 'University',
        };
      },
    }),
    {
      name: 'studyspark-app-store',
      partialize: (state) => ({
        profileOverrides: state.profileOverrides,
        // Don't persist currentView — always start on dashboard
      }),
    },
  ),
);
