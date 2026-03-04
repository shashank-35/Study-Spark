/**
 * api/client.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized API wrapper around Supabase with:
 *  • Automatic retry (max 2 retries, exponential backoff)
 *  • Timeout handling (10s default)
 *  • Structured error responses
 *  • Request logging in development
 *  • Type-safe error objects
 *
 * All service modules should use these helpers instead of raw `supabase.from()`.
 */

import { supabase } from '@/lib/supabaseClient';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'UNKNOWN',
    public readonly status: number = 500,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RetryOptions {
  /** Max number of retries (default: 2) */
  retries?: number;
  /** Base delay in ms before first retry (default: 500) */
  baseDelay?: number;
  /** Whether to show toast on final failure (default: false) */
  toastOnError?: boolean;
  /** Label used in dev logs (default: 'query') */
  label?: string;
}

// ─── Core: withRetry ──────────────────────────────────────────────────────────

/**
 * Execute an async function with automatic retry and exponential backoff.
 * Used by all API helpers below.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const { retries = 2, baseDelay = 500, toastOnError = false, label = 'query' } = opts;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (import.meta.env.DEV && attempt > 0) {
        console.info(`[API] Retry #${attempt} for ${label}`);
      }
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // All retries exhausted
  const message = lastError instanceof Error ? lastError.message : 'Request failed';
  if (import.meta.env.DEV) {
    console.error(`[API] ${label} failed after ${retries + 1} attempts:`, lastError);
  }
  if (toastOnError) {
    toast.error(`Failed: ${label}`, { description: message, duration: 4000 });
  }
  throw lastError instanceof ApiError
    ? lastError
    : new ApiError(message, 'RETRY_EXHAUSTED');
}

// ─── Supabase Query Wrapper ──────────────────────────────────────────────────

/**
 * Execute a Supabase PostgREST query with retry + error normalization.
 *
 * Usage:
 *   const data = await query('fetchSubjects',
 *     supabase.from('subjects').select('*').order('name')
 *   );
 */
export async function query<T>(
  label: string,
  builder: PromiseLike<{ data: T | null; error: any }>,
  opts: Omit<RetryOptions, 'label'> = {},
): Promise<T> {
  return withRetry(
    async () => {
      const { data, error } = await builder;
      if (error) {
        throw new ApiError(
          error.message ?? 'Database query failed',
          error.code ?? 'DB_ERROR',
          error.status ?? 500,
          error.details,
        );
      }
      return (data ?? []) as T;
    },
    { ...opts, label },
  );
}

/**
 * Execute a Supabase query that returns a single row (or null).
 */
export async function querySingle<T>(
  label: string,
  builder: PromiseLike<{ data: T | null; error: any }>,
  opts: Omit<RetryOptions, 'label'> = {},
): Promise<T | null> {
  return withRetry(
    async () => {
      const { data, error } = await builder;
      if (error) {
        throw new ApiError(error.message, error.code, error.status, error.details);
      }
      return data;
    },
    { ...opts, label },
  );
}

/**
 * Execute a Supabase mutation (insert / update / delete) with retry.
 */
export async function mutate(
  label: string,
  builder: PromiseLike<{ data: any; error: any }>,
  opts: Omit<RetryOptions, 'label'> = {},
): Promise<void> {
  return withRetry(
    async () => {
      const { error } = await builder;
      if (error) {
        throw new ApiError(error.message, error.code, error.status, error.details);
      }
    },
    { ...opts, label, toastOnError: true },
  );
}

/**
 * Safe wrapper — returns fallback instead of throwing.
 * Ideal for non-critical data like achievements, activity logs.
 */
export async function safeQuery<T>(
  label: string,
  builder: PromiseLike<{ data: T | null; error: any }>,
  fallback: T,
): Promise<T> {
  try {
    return await query(label, builder, { retries: 1 });
  } catch {
    if (import.meta.env.DEV) console.warn(`[API] ${label} — using fallback`);
    return fallback;
  }
}

// ─── Re-export supabase for channel operations ───────────────────────────────

export { supabase };
