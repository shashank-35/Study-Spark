/**
 * SubjectMaterials.tsx
 * Displays all study materials for a selected subject, grouped by unit.
 * Features: skeleton loading, empty state, unit-wise accordion/cards,
 * real-time updates, pagination, PDF preview integration.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import MaterialCard from '@/components/MaterialCard';
import PDFPreviewModal from '@/components/PDFPreviewModal';
import {
  type Material,
  type MaterialGroup,
  fetchMaterialsGroupedByUnit,
  subscribeToMaterialChanges,
  groupMaterialsByUnit,
  fetchAllMaterialsBySubject,
} from '@/lib/materialService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface SubjectMaterialsProps {
  subjectId: string;
  subjectName: string;
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function MaterialsSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Unit group skeletons */}
      {[1, 2].map((g) => (
        <div key={g} className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-8 rounded-full" />
          </div>
          <div className="space-y-2 pl-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/30"
              >
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-16 rounded-md" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function MaterialsEmptyState({ subjectName }: { subjectName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <h4 className="font-semibold text-base text-foreground mb-1">No materials yet</h4>
      <p className="text-sm text-muted-foreground max-w-xs">
        Study materials for <span className="font-medium">{subjectName}</span> haven't been uploaded
        yet. Check back soon!
      </p>
    </motion.div>
  );
}

// ─── Unit group component ─────────────────────────────────────────────────────

function UnitGroup({
  group,
  onPreview,
  startIndex,
  defaultExpanded,
}: {
  group: MaterialGroup;
  onPreview: (material: Material) => void;
  startIndex: number;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="border border-border/60 overflow-hidden">
        {/* Unit header (clickable to expand/collapse) */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {group.unitId ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{group.unitName}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className="text-xs tabular-nums shrink-0 font-medium"
          >
            {group.materials.length} file{group.materials.length !== 1 ? 's' : ''}
          </Badge>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Materials list */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <CardContent className="pt-0 px-3 pb-3 space-y-2">
                {group.materials.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No materials in this unit yet.
                  </p>
                ) : (
                  group.materials.map((mat, idx) => (
                    <MaterialCard
                      key={mat.id}
                      material={mat}
                      onPreview={onPreview}
                      index={startIndex + idx}
                    />
                  ))
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubjectMaterials({ subjectId, subjectName }: SubjectMaterialsProps) {
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [groups, setGroups] = useState<MaterialGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // ── Fetch materials ─────────────────────────────────────────────────────────

  const loadMaterials = useCallback(async () => {
    try {
      setError(null);
      const materialGroups = await fetchMaterialsGroupedByUnit(subjectId);
      const flat = materialGroups.flatMap((g) => g.materials);
      setAllMaterials(flat);
      setGroups(materialGroups);
    } catch (err: any) {
      console.error('Failed to load materials:', err);
      setError(err.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    setLoading(true);
    loadMaterials();
  }, [loadMaterials]);

  // ── Realtime subscription ───────────────────────────────────────────────────

  useEffect(() => {
    const unsubscribe = subscribeToMaterialChanges(subjectId, (updatedMaterials) => {
      setAllMaterials(updatedMaterials);
      // Re-group from flat list
      const newGroups = groupMaterialsByUnit(updatedMaterials);
      setGroups(newGroups);
    });

    return unsubscribe;
  }, [subjectId]);

  // ── Search filter ───────────────────────────────────────────────────────────

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;

    const q = searchQuery.toLowerCase();
    return groups
      .map((group) => ({
        ...group,
        materials: group.materials.filter(
          (mat) =>
            mat.title.toLowerCase().includes(q) ||
            mat.file_name.toLowerCase().includes(q) ||
            mat.file_type.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.materials.length > 0);
  }, [groups, searchQuery]);

  const totalMaterials = allMaterials.length;
  const filteredTotal = filteredGroups.reduce((sum, g) => sum + g.materials.length, 0);

  // ── Preview handler ─────────────────────────────────────────────────────────

  const handlePreview = useCallback((material: Material) => {
    setPreviewMaterial(material);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Study Materials
          </h3>
          {!loading && totalMaterials > 0 && (
            <Badge variant="outline" className="text-xs tabular-nums">
              {totalMaterials}
            </Badge>
          )}
        </div>
        {!loading && totalMaterials > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setLoading(true);
              loadMaterials();
            }}
            title="Refresh materials"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        )}
      </div>

      {/* Loading state */}
      {loading && <MaterialsSkeleton />}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-8">
          <p className="text-sm text-destructive mb-2">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              loadMaterials();
            }}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && totalMaterials === 0 && (
        <MaterialsEmptyState subjectName={subjectName} />
      )}

      {/* Materials content */}
      {!loading && !error && totalMaterials > 0 && (
        <div className="space-y-3">
          {/* Search bar (only show when there are enough materials) */}
          {totalMaterials > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {filteredTotal} result{filteredTotal !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <span className="sr-only">Clear</span>
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Grouped materials */}
          {filteredGroups.length === 0 && searchQuery ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No materials matching "<span className="font-medium">{searchQuery}</span>"
              </p>
            </div>
          ) : filteredGroups.length === 1 &&
            !filteredGroups[0].unitId &&
            filteredGroups[0].unitName === 'General' ? (
            // If there's only a "General" group (no units), show a flat list without accordion
            <div className="space-y-2">
              {filteredGroups[0].materials.map((mat, idx) => (
                <MaterialCard
                  key={mat.id}
                  material={mat}
                  onPreview={handlePreview}
                  index={idx}
                />
              ))}
            </div>
          ) : (
            // Show unit-wise grouped accordion cards
            <div className="space-y-3">
              {filteredGroups.map((group, groupIdx) => {
                const startIndex = filteredGroups
                  .slice(0, groupIdx)
                  .reduce((sum, g) => sum + g.materials.length, 0);
                return (
                  <UnitGroup
                    key={group.unitId ?? '__general__'}
                    group={group}
                    onPreview={handlePreview}
                    startIndex={startIndex}
                    defaultExpanded={groupIdx < 3} // Auto-expand first 3 units
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        material={previewMaterial}
        open={!!previewMaterial}
        onClose={() => setPreviewMaterial(null)}
      />
    </div>
  );
}
