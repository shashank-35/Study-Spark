import { useState, useEffect, useRef, useCallback } from "react";
import {
  globalSearch,
  fetchPopularSubjects,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  type GroupedResults,
  type SearchResult,
  type SearchCategory,
} from "@/lib/searchService";

// ── Types ─────────────────────────────────────────────────────────────────

export type FilterType = "all" | SearchCategory;

interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: GroupedResults;
  flatResults: SearchResult[];
  loading: boolean;
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  recentSearches: string[];
  popularSubjects: SearchResult[];
  clearRecent: () => void;
  selectResult: (result: SearchResult) => void;
  /** Active index for keyboard navigation (-1 = none) */
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  totalCount: number;
}

// ── Hook ──────────────────────────────────────────────────────────────────

const EMPTY: GroupedResults = { subjects: [], materials: [], quizzes: [], coding: [] };
const DEBOUNCE_MS = 300;

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GroupedResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSubjects, setPopularSubjects] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recents & popular on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
    fetchPopularSubjects().then(setPopularSubjects).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    setLoading(true);
    setActiveIndex(-1);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(trimmed);
        setResults(data);
      } catch {
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Build flat list respecting active filter
  const flatResults = (() => {
    if (filter === "all") {
      return [
        ...results.subjects,
        ...results.materials,
        ...results.quizzes,
        ...results.coding,
      ];
    }
    return results[filter] ?? [];
  })();

  const totalCount = flatResults.length;

  const selectResult = useCallback(
    (result: SearchResult) => {
      if (query.trim()) addRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
      // The actual navigation is handled by the component consuming the hook
      void result;
    },
    [query],
  );

  const clearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    flatResults,
    loading,
    filter,
    setFilter,
    recentSearches,
    popularSubjects,
    clearRecent,
    selectResult,
    activeIndex,
    setActiveIndex,
    totalCount,
  };
}
