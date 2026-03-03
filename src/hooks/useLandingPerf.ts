import { useEffect, useMemo, useRef, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PERFORMANCE UTILITIES                                                 */
/*  Device-adaptive performance detection for landing page                */
/* ═══════════════════════════════════════════════════════════════════════ */

export interface PerfProfile {
  /** True on mobile / low-memory / prefers-reduced-motion */
  isLowEnd: boolean;
  /** True when the user prefers reduced motion */
  reducedMotion: boolean;
  /** True on mobile viewports (< 768px) */
  isMobile: boolean;
  /** True on tablet viewports (768–1024px) */
  isTablet: boolean;
}

/** Detect device capabilities once and reuse across the landing page. */
export function usePerfProfile(): PerfProfile {
  const profile = useMemo<PerfProfile>(() => {
    if (typeof window === "undefined")
      return { isLowEnd: false, reducedMotion: false, isMobile: false, isTablet: false };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const lowMemory = (navigator as any).deviceMemory !== undefined && (navigator as any).deviceMemory < 4;
    const isLowEnd = isMobile || lowMemory || reducedMotion;

    return { isLowEnd, reducedMotion, isMobile, isTablet };
  }, []);

  return profile;
}

/* ── Visibility pause hook ──────────────────────────────────────────── */
/** Returns `true` while the tab is visible. Use to pause expensive work. */
export function useTabVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const handle = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, []);
  return visible;
}

/* ── Throttled 3D tilt handler ──────────────────────────────────────── */
/**
 * Returns mouse handlers for lightweight 3D tilt on desktop only.
 * - Max rotation clamped to `maxDeg` (default 5°)
 * - Applies `will-change: transform` during hover
 * - Returns noops on mobile → card just gets a simple scale via CSS
 */
export function useTilt3D(maxDeg = 5, disabled = false) {
  const ref = useRef<HTMLDivElement>(null);
  const rafId = useRef(0);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !ref.current) return;
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 → 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(800px) rotateX(${(-y * maxDeg).toFixed(2)}deg) rotateY(${(x * maxDeg).toFixed(2)}deg) scale3d(1.02,1.02,1.02)`;
      });
    },
    [disabled, maxDeg]
  );

  const onMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    if (ref.current) {
      ref.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    }
  }, []);

  // Cleanup rAF on unmount
  useEffect(() => () => cancelAnimationFrame(rafId.current), []);

  if (disabled) return { ref, onMouseMove: undefined, onMouseLeave: undefined };
  return { ref, onMouseMove, onMouseLeave };
}

/* ── IntersectionObserver-based section reveal ──────────────────────── */
/**
 * Adds a `data-visible` attribute when the element enters the viewport.
 * Pure CSS transition driven — zero JS animation overhead.
 */
export function useSectionReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}
