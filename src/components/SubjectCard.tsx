/**
 * SubjectCard.tsx
 * Rich, animated subject card for the BCA Subject Section.
 * Features: progress bar, bookmark toggle, action buttons, difficulty/semester badges,
 * last studied date, resource count, Framer Motion stagger animation.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Code2,
  GraduationCap,
  Loader2,
  Play,
  Star,
  Trophy,
  FileText,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { SubjectRow, StudentProgress } from '@/lib/subjectService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SubjectCardProps {
  subject: SubjectRow;
  progress: StudentProgress | null;
  resourceCount: number;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onResume: () => void;
  onLaunchQuiz: () => void;
  onOpenCodingLab: () => void;
  /** True while the subject detail is loading after click */
  isLoading?: boolean;
  /** Card index used to stagger the entrance animation */
  index?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEMESTER_COLORS: Record<number, string> = {
  1: 'bg-sky-100 text-sky-800 border-sky-200',
  2: 'bg-violet-100 text-violet-800 border-violet-200',
  3: 'bg-amber-100 text-amber-800 border-amber-200',
  4: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  5: 'bg-rose-100 text-rose-800 border-rose-200',
  6: 'bg-orange-100 text-orange-800 border-orange-200',
};

const DIFFICULTY_CONFIG = {
  Beginner: {
    label: 'Beginner',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  Intermediate: {
    label: 'Intermediate',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  Advanced: {
    label: 'Advanced',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
} as const;

function formatLastAccessed(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(isoString).toLocaleDateString();
}

// ─── Framer Motion Variants ───────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

// ─── Component ────────────────────────────────────────────────────────────────

const SubjectCard = memo(function SubjectCard({
  subject,
  progress,
  resourceCount,
  isBookmarked,
  onToggleBookmark,
  onResume,
  onLaunchQuiz,
  onOpenCodingLab,
  isLoading = false,
  index = 0,
}: SubjectCardProps) {
  const difficulty = DIFFICULTY_CONFIG[subject.difficulty] ?? DIFFICULTY_CONFIG.Beginner;
  const semesterColor = SEMESTER_COLORS[subject.semester] ?? 'bg-gray-100 text-gray-800 border-gray-200';
  const progressValue = progress?.progress_percent ?? 0;
  const hasProgress = progressValue > 0;
  const isCompleted = progressValue === 100;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.99 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 dark:bg-card">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <CardHeader className="pb-3 gap-0">
          <div className="flex items-start justify-between gap-2">
            {/* Icon + name */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 w-10 h-10 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base leading-tight truncate" title={subject.name}>
                  {subject.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {subject.credits} credit{subject.credits !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Bookmark star */}
            <button
              onClick={onToggleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark subject'}
              className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-amber-500 transition-colors focus-visible:outline-none"
            >
              <Star
                className="h-5 w-5"
                fill={isBookmarked ? '#F59E0B' : 'none'}
                stroke={isBookmarked ? '#F59E0B' : 'currentColor'}
              />
            </button>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant="outline" className={`text-xs font-medium border ${semesterColor}`}>
              Sem {subject.semester}
            </Badge>
            <Badge variant="outline" className={`text-xs font-medium border ${difficulty.className}`}>
              {difficulty.label}
            </Badge>
            {isCompleted && (
              <Badge variant="outline" className="text-xs font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                <Trophy className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {resourceCount > 0 && (
              <Badge variant="outline" className="text-xs font-medium bg-primary/5 text-primary border-primary/20 ml-auto">
                <FileText className="h-3 w-3 mr-1" />
                {resourceCount}
              </Badge>
            )}
          </div>
        </CardHeader>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <CardContent className="flex-1 flex flex-col gap-4 pt-0">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-foreground">{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                <span className="font-semibold text-foreground">{resourceCount}</span> resource
                {resourceCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              {progress?.last_accessed_at ? (
                <span title={new Date(progress.last_accessed_at).toLocaleString()}>
                  {formatLastAccessed(progress.last_accessed_at)}
                </span>
              ) : (
                <span>Not started</span>
              )}
            </div>
          </div>

          {/* Units completed */}
          {(progress?.total_units ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                <span className="font-semibold text-foreground">{progress?.completed_units ?? 0}</span>/{progress?.total_units} units completed
              </span>
            </div>
          )}

          {/* Spacer pushes buttons to bottom */}
          <div className="flex-1" />

          {/* ── Action buttons ──────────────────────────────────────────── */}
          <div className="space-y-2.5">
            {/* Primary: Start / Continue Learning */}
            <Button
              onClick={onResume}
              disabled={isLoading}
              className="w-full h-9 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 active:scale-[0.98] text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isCompleted
                ? 'Review Course'
                : hasProgress
                  ? 'Continue Learning'
                  : 'Start Learning'}
            </Button>

            {/* Quiz & Code row */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onLaunchQuiz}
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 h-8"
                title="Launch Quiz"
              >
                <FileText className="h-3.5 w-3.5" />
                Quiz
              </Button>
              <Button
                onClick={onOpenCodingLab}
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 h-8"
                title="Open Coding Lab"
              >
                <Code2 className="h-3.5 w-3.5" />
                Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default SubjectCard;
