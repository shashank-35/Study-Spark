import { useEffect, useRef, useCallback, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  FileText,
  Brain,
  Code,
  Search,
  Clock,
  TrendingUp,
  X,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch, type FilterType } from "@/hooks/useSearch";
import type { SearchResult, SearchCategory } from "@/lib/searchService";

// ── Constants ─────────────────────────────────────────────────────────────

const CATEGORY_META: Record<SearchCategory, { label: string; icon: typeof BookOpen; color: string }> = {
  subjects: { label: "Subjects", icon: BookOpen, color: "text-blue-500 bg-blue-500/10" },
  materials: { label: "Materials", icon: FileText, color: "text-emerald-500 bg-emerald-500/10" },
  quizzes: { label: "Quizzes", icon: Brain, color: "text-purple-500 bg-purple-500/10" },
  coding: { label: "Coding", icon: Code, color: "text-orange-500 bg-orange-500/10" },
};

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "subjects", label: "Subjects" },
  { key: "materials", label: "Notes" },
  { key: "quizzes", label: "Quizzes" },
  { key: "coding", label: "Coding" },
];

// ── Highlight matched text ────────────────────────────────────────────────

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5 font-semibold">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

// ── Result Item ───────────────────────────────────────────────────────────

interface ResultItemProps {
  result: SearchResult;
  query: string;
  isActive: boolean;
  onSelect: (r: SearchResult) => void;
  onHover: () => void;
}

function SearchResultItem({ result, query, isActive, onSelect, onHover }: ResultItemProps) {
  const meta = CATEGORY_META[result.category];
  const Icon = meta.icon;

  return (
    <button
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left group ${
        isActive
          ? "bg-primary/10 dark:bg-primary/15"
          : "hover:bg-muted/60"
      }`}
      onClick={() => onSelect(result)}
      onMouseEnter={onHover}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          <HighlightText text={result.title} query={query} />
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{result.subtitle}</p>
      </div>
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0 border-border/60 text-muted-foreground font-normal hidden sm:flex">
        {meta.label}
      </Badge>
      {isActive && (
        <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:block" />
      )}
    </button>
  );
}

// ── Skeleton Results ──────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when a result is selected — pass the category + id for navigation */
  onNavigate: (category: SearchCategory, id: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function SearchModal({ open, onClose, onNavigate }: SearchModalProps) {
  const {
    query,
    setQuery,
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
  } = useSearch();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setActiveIndex(-1);
    }
  }, [open, setQuery, setActiveIndex]);

  // Global Escape key listener
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc, true);
    return () => window.removeEventListener("keydown", handleEsc, true);
  }, [open, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-search-item]");
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Keyboard navigation (arrow keys + enter)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex(Math.min(activeIndex + 1, totalCount - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(Math.max(activeIndex - 1, -1));
        return;
      }
      if (e.key === "Enter" && activeIndex >= 0 && flatResults[activeIndex]) {
        e.preventDefault();
        const r = flatResults[activeIndex];
        selectResult(r);
        onNavigate(r.category, r.id);
        onClose();
      }
    },
    [activeIndex, totalCount, flatResults, onClose, selectResult, onNavigate, setActiveIndex],
  );

  const handleResultSelect = useCallback(
    (r: SearchResult) => {
      selectResult(r);
      onNavigate(r.category, r.id);
      onClose();
    },
    [selectResult, onNavigate, onClose],
  );

  const handleRecentClick = useCallback(
    (q: string) => {
      setQuery(q);
    },
    [setQuery],
  );

  const showInitial = query.trim().length < 2 && !loading;
  const showNoResults = !loading && query.trim().length >= 2 && totalCount === 0;

  // Group results by category for "All" view
  const groupedSections = (() => {
    if (filter !== "all") return null;
    const categories: SearchCategory[] = ["subjects", "materials", "quizzes", "coding"];
    let runningIdx = 0;
    return categories
      .map((cat) => {
        const items = flatResults.filter((r) => r.category === cat);
        const startIdx = runningIdx;
        runningIdx += items.length;
        return { cat, items, startIdx };
      })
      .filter((s) => s.items.length > 0);
  })();

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            className="fixed inset-0 z-[101] flex items-start justify-center pt-[12vh] sm:pt-[15vh] px-4"
          >
            <div
              className="w-full max-w-xl bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden flex flex-col max-h-[70vh]"
              onKeyDown={handleKeyDown}
            >
              {/* ── Search Input ──────────────────────────────────────── */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <Search className="h-5 w-5 text-muted-foreground/60 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search subjects, notes, quizzes, coding…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-foreground text-[15px] placeholder:text-muted-foreground/50 outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {query && (
                  <button onClick={() => setQuery("")} className="p-1 rounded-md hover:bg-muted transition-colors">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* ── Filter Tabs ──────────────────────────────────────── */}
              <div className="flex items-center gap-1 px-4 py-2 border-b border-border/40 overflow-x-auto no-scrollbar">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setFilter(f.key); setActiveIndex(-1); }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                      filter === f.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* ── Results Area ──────────────────────────────────────── */}
              <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 space-y-1">

                {/* Loading */}
                {loading && (
                  <div className="space-y-1">
                    {[...Array(4)].map((_, i) => <ResultSkeleton key={i} />)}
                  </div>
                )}

                {/* Initial state (no query) */}
                {showInitial && (
                  <div className="space-y-4 py-1">
                    {/* Recent searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-3 mb-1.5">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> Recent
                          </span>
                          <button
                            onClick={clearRecent}
                            className="text-[11px] text-muted-foreground/60 hover:text-destructive transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 px-3">
                          {recentSearches.map((q, i) => (
                            <button
                              key={i}
                              onClick={() => handleRecentClick(q)}
                              className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-xs text-foreground transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular subjects */}
                    {popularSubjects.length > 0 && (
                      <div>
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-3 mb-1.5">
                          <TrendingUp className="h-3 w-3" /> Popular Subjects
                        </span>
                        {popularSubjects.map((s) => (
                          <SearchResultItem
                            key={s.id}
                            result={s}
                            query=""
                            isActive={false}
                            onSelect={handleResultSelect}
                            onHover={() => {}}
                          />
                        ))}
                      </div>
                    )}

                    {recentSearches.length === 0 && popularSubjects.length === 0 && (
                      <div className="text-center py-10">
                        <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Start typing to search across StudySpark</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Subjects, notes, quizzes, coding problems</p>
                      </div>
                    )}
                  </div>
                )}

                {/* No results */}
                {showNoResults && (
                  <div className="text-center py-10">
                    <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No results found for "<span className="font-medium text-foreground">{query}</span>"</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Try different keywords or a broader search</p>
                  </div>
                )}

                {/* Results — grouped by category */}
                {!loading && !showInitial && !showNoResults && filter === "all" && groupedSections && (
                  <>
                    {groupedSections.map(({ cat, items, startIdx }) => {
                      const meta = CATEGORY_META[cat];
                      return (
                        <div key={cat} className="mb-2">
                          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-3 py-1">
                            <meta.icon className="h-3 w-3" /> {meta.label}
                          </span>
                          {items.map((r, i) => (
                            <SearchResultItem
                              key={r.id}
                              result={r}
                              query={query}
                              isActive={activeIndex === startIdx + i}
                              onSelect={handleResultSelect}
                              onHover={() => setActiveIndex(startIdx + i)}
                              data-search-item
                            />
                          ))}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Results — single category filter */}
                {!loading && !showInitial && !showNoResults && filter !== "all" && (
                  <>
                    {flatResults.map((r, i) => (
                      <SearchResultItem
                        key={r.id}
                        result={r}
                        query={query}
                        isActive={activeIndex === i}
                        onSelect={handleResultSelect}
                        onHover={() => setActiveIndex(i)}
                        data-search-item
                      />
                    ))}
                  </>
                )}
              </div>

              {/* ── Footer / Keyboard Hints ──────────────────────────── */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <kbd className="inline-flex h-4 w-4 items-center justify-center rounded border border-border/60 bg-background text-[10px]">
                      <ArrowUp className="h-2.5 w-2.5" />
                    </kbd>
                    <kbd className="inline-flex h-4 w-4 items-center justify-center rounded border border-border/60 bg-background text-[10px]">
                      <ArrowDown className="h-2.5 w-2.5" />
                    </kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <kbd className="inline-flex h-4 items-center justify-center rounded border border-border/60 bg-background text-[10px] px-1">
                      ↵
                    </kbd>
                    Open
                  </span>
                </div>
                {totalCount > 0 && (
                  <span className="text-[11px] text-muted-foreground">{totalCount} result{totalCount !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
