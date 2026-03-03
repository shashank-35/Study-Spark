/**
 * SubjectSelector.tsx
 * BCA Subject Section - User view only (no upload/delete).
 * Features: search & filter, progress tracking, bookmarks, unit-wise structure,
 * "continue where you left off" banner, skeleton loading, empty states,
 * framer-motion animations, Supabase realtime, optimized PDF viewer,
 * and integrated QuizPlayer for admin-created MCQs.
 */

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "@clerk/clerk-react";
import {
  ArrowLeft, BookmarkCheck, BookOpen, ChevronDown, Code2,
  FileText, Home, Loader2, Play,
  Search, Star, X,
} from "lucide-react";
import QuizPlayer from "@/components/QuizPlayer";
import SubjectMaterials from "@/components/SubjectMaterials";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProgress } from "@/hooks/useProgressContext";

// local services
import {
  type SubjectRow,
  type StudentProgress,
} from "@/lib/subjectService";
import SubjectCard from "@/components/SubjectCard";

// --- Sort helpers ---

type SortOption = 'semester' | 'name' | 'last_accessed' | 'progress';

function sortSubjects(
  subjects: SubjectRow[],
  progressMap: Record<string, StudentProgress>,
  sortBy: SortOption
): SubjectRow[] {
  return [...subjects].sort((a, b) => {
    if (sortBy === 'last_accessed') {
      const ta = progressMap[a.id]?.last_accessed_at ?? '';
      const tb = progressMap[b.id]?.last_accessed_at ?? '';
      return tb.localeCompare(ta);
    }
    if (sortBy === 'progress') {
      const pa = progressMap[a.id]?.progress_percent ?? 0;
      const pb = progressMap[b.id]?.progress_percent ?? 0;
      return pb - pa;
    }
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return a.semester - b.semester || a.name.localeCompare(b.name);
  });
}

// --- Skeleton card ---

function SubjectCardSkeleton() {
  return (
    <Card className="flex flex-col border border-border/60 shadow-sm h-72">
      <CardHeader className="pb-3 gap-0">
        <div className="flex items-start gap-3">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="flex gap-1.5 mt-3">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 pt-0">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex-1" />
        <Skeleton className="h-8 w-full rounded-md" />
        <Skeleton className="h-8 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-1.5">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main component ---

const SubjectSelector = ({
  onBackToDesktop,
  onLaunchQuiz,
  onOpenCodingLab,
}: {
  onBackToDesktop?: () => void;
  /** Optional: called when student clicks "Quiz" on a subject */
  onLaunchQuiz?: (subjectId: string, subjectName: string) => void;
  /** Optional: called when student clicks "Code" on a subject */
  onOpenCodingLab?: (subjectId: string, subjectName: string) => void;
}) => {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const { toast } = useToast();

  // -- Shared data from ProgressContext --
  const {
    subjects,
    resourceCounts,
    progressMap,
    bookmarkedIds,
    loading,
    toggleBookmarkOptimistic,
    touchSubjectAccess,
  } = useProgress();

  // -- UI state --
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('semester');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // -- Detail dialog --
  const [detailSubject, setDetailSubject] = useState<SubjectRow | null>(null);

  // -- Quiz state --
  const [quizSubject, setQuizSubject] = useState<{ id: string; name: string } | null>(null);

  // -- Derived: filtered + sorted subjects --
  const displaySubjects = useMemo(() => {
    let list = subjects;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (semesterFilter !== 'all') {
      list = list.filter((s) => s.semester === semesterFilter);
    }
    if (showBookmarksOnly) {
      list = list.filter((s) => bookmarkedIds.has(s.id));
    }

    return sortSubjects(list, progressMap, sortBy);
  }, [subjects, search, semesterFilter, showBookmarksOnly, bookmarkedIds, sortBy, progressMap]);

  // -- Derived: "continue where you left off" --
  const lastAccessedSubject = useMemo(() => {
    const entries = Object.entries(progressMap);
    if (entries.length === 0) return null;
    const latest = entries.sort(([, a], [, b]) =>
      b.last_accessed_at.localeCompare(a.last_accessed_at)
    )[0];
    return subjects.find((s) => s.id === latest[0]) ?? null;
  }, [progressMap, subjects]);

  // -- Derived: recently studied (up to 3 subjects with progress, sorted by last_accessed) --
  const recentlyStudied = useMemo(() => {
    return subjects
      .filter((s) => progressMap[s.id]?.last_accessed_at)
      .sort((a, b) =>
        (progressMap[b.id]?.last_accessed_at ?? '').localeCompare(
          progressMap[a.id]?.last_accessed_at ?? ''
        )
      )
      .slice(0, 3);
  }, [subjects, progressMap]);

  // -- Event handlers --

  /** Open the detail dialog for a subject. */
  const openSubjectDetail = useCallback(
    (subject: SubjectRow) => {
      setDetailSubject(subject);
    },
    []
  );

  const handleResume = useCallback(
    async (subject: SubjectRow) => {
      openSubjectDetail(subject);
      touchSubjectAccess(subject.id);
    },
    [openSubjectDetail, touchSubjectAccess]
  );

  const handleToggleBookmark = useCallback(
    async (subjectId: string) => {
      if (!userId) {
        toast({ title: 'Sign in to bookmark subjects', variant: 'destructive' });
        return;
      }
      try {
        await toggleBookmarkOptimistic(subjectId);
      } catch {
        toast({ title: 'Failed to update bookmark', variant: 'destructive' });
      }
    },
    [userId, toggleBookmarkOptimistic, toast]
  );

  const handleLaunchQuiz = useCallback(
    (subject: SubjectRow) => {
      // Open inline quiz player with real MCQs from Supabase
      setQuizSubject({ id: subject.id, name: subject.name });
    },
    []
  );

  const handleOpenCodingLab = useCallback(
    (subject: SubjectRow) => {
      if (onOpenCodingLab) { onOpenCodingLab(subject.id, subject.name); return; }
      toast({ title: `Coding Lab - ${subject.name}`, description: 'Navigate to the Coding Lab tab.' });
    },
    [onOpenCodingLab, toast]
  );

  // --- Render ---

  // If quiz mode is active, render QuizPlayer
  if (quizSubject) {
    return (
      <QuizPlayer
        subjectId={quizSubject.id}
        subjectName={quizSubject.name}
        onBack={() => setQuizSubject(null)}
        onBackToDesktop={onBackToDesktop}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* -- Page header -- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">BCA Subject Library</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Master your BCA curriculum with structured learning paths
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onBackToDesktop && (
            <Button onClick={onBackToDesktop} variant="outline" size="sm">
              <Home className="h-4 w-4 mr-1.5" />
              Desktop
            </Button>
          )}
        </div>
      </div>

      {/* -- Continue where you left off -- */}
      {!loading && lastAccessedSubject && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-blue-600/5">
            <CardContent className="py-4 px-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
                  <Play className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Continue where you left off
                  </p>
                  <p className="font-semibold text-base leading-tight">{lastAccessedSubject.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Sem {lastAccessedSubject.semester} &bull;{' '}
                    {progressMap[lastAccessedSubject.id]?.progress_percent ?? 0}% complete
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleResume(lastAccessedSubject)}
                size="sm"
                className="flex-shrink-0 bg-primary hover:bg-primary/90 text-white font-semibold gap-1.5"
              >
                <Play className="h-3.5 w-3.5" />
                Continue Learning
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* -- Recently studied strip -- */}
      {!loading && recentlyStudied.length > 1 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Recently studied
          </p>
          <div className="flex flex-wrap gap-2">
            {recentlyStudied.map((s) => (
              <button
                key={s.id}
                onClick={() => handleResume(s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-card text-sm hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">{s.name}</span>
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  {progressMap[s.id]?.progress_percent ?? 0}%
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -- Filters toolbar -- */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Semester filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 1, 2, 3, 4, 5, 6] as const).map((sem) => (
            <button
              key={sem}
              onClick={() => setSemesterFilter(sem as number | 'all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                semesterFilter === sem
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border/60 text-muted-foreground hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              {sem === 'all' ? 'All' : `Sem ${sem}`}
            </button>
          ))}
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-40 text-xs h-9">
            <ChevronDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semester">Semester</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="last_accessed">Recently Accessed</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
          </SelectContent>
        </Select>

        {/* Bookmarks toggle */}
        <Button
          variant={showBookmarksOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowBookmarksOnly((v) => !v)}
          className="gap-1.5"
          title={showBookmarksOnly ? 'Show all subjects' : 'Show bookmarks only'}
        >
          {showBookmarksOnly ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Star className="h-4 w-4" />
          )}
          <span className="hidden sm:inline text-xs">Bookmarks</span>
        </Button>
      </div>

      {/* -- Subject grid -- */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SubjectCardSkeleton key={i} />
          ))}
        </div>
      ) : displaySubjects.length === 0 ? (
        /* Empty state */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="py-16">
            <CardContent className="flex flex-col items-center text-center gap-3">
              <BookOpen className="h-14 w-14 text-muted-foreground/40" />
              <p className="text-lg font-semibold">No subjects found</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {search || semesterFilter !== 'all' || showBookmarksOnly
                  ? 'Try adjusting your search or filters.'
                  : 'Subjects will appear here once added by an admin.'}
              </p>
              {(search || semesterFilter !== 'all' || showBookmarksOnly) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(''); setSemesterFilter('all'); setShowBookmarksOnly(false); }}
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {displaySubjects.map((subject, idx) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                progress={progressMap[subject.id] ?? null}
                resourceCount={resourceCounts[subject.id] ?? 0}
                isBookmarked={bookmarkedIds.has(subject.id)}
                onToggleBookmark={() => handleToggleBookmark(subject.id)}
                onResume={() => handleResume(subject)}
                onLaunchQuiz={() => handleLaunchQuiz(subject)}
                onOpenCodingLab={() => handleOpenCodingLab(subject)}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* -- Subject Detail Dialog -- */}
      <Dialog open={!!detailSubject} onOpenChange={(open) => !open && setDetailSubject(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailSubject && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <DialogTitle className="text-xl">{detailSubject.name}</DialogTitle>
                    <DialogDescription className="flex flex-wrap gap-2 mt-1.5">
                      <Badge variant="outline" className="text-xs">Sem {detailSubject.semester}</Badge>
                      <Badge variant="outline" className="text-xs">{detailSubject.difficulty}</Badge>
                      <Badge variant="outline" className="text-xs">{detailSubject.credits} credits</Badge>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Progress summary */}
              {progressMap[detailSubject.id] && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Your progress</span>
                    <span className="font-semibold">
                      {progressMap[detailSubject.id].progress_percent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${progressMap[detailSubject.id].progress_percent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Study Materials Section (unit-wise, with preview + download) */}
              <SubjectMaterials
                subjectId={detailSubject.id}
                subjectName={detailSubject.name}
              />

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t mt-4">
                <Button
                  onClick={() => handleLaunchQuiz(detailSubject)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  Launch Quiz
                </Button>
                <Button
                  onClick={() => handleOpenCodingLab(detailSubject)}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                >
                  <Code2 className="h-4 w-4" />
                  Coding Lab
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setDetailSubject(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default SubjectSelector;
