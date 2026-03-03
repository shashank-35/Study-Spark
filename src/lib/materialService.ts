/**
 * materialService.ts
 * Service layer for fetching, downloading, and subscribing to study materials.
 * Supports per-subject fetching, unit grouping, pagination, and real-time updates.
 */

import { supabase } from './supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Material {
  id: string;
  subject_id: string;
  unit_id: string | null;
  subject_name: string | null;
  unit_name: string | null;
  title: string;
  file_name: string;
  file_size: number;
  file_url: string | null;
  file_data: string | null; // base64 legacy
  file_type: string;
  material_type: string | null; // Notes, Assignment, Important
  uploaded_at: string;
}

export interface MaterialGroup {
  unitId: string | null;
  unitName: string;
  orderNo: number;
  materials: Material[];
}

export interface FetchMaterialsResult {
  materials: Material[];
  total: number;
  hasMore: boolean;
}

// ─── Fetch materials for a subject ────────────────────────────────────────────

/**
 * Fetch study materials for a specific subject.
 * Supports pagination via `page` and `pageSize`.
 */
export async function fetchMaterialsBySubject(
  subjectId: string,
  page = 1,
  pageSize = 20,
): Promise<FetchMaterialsResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  const { count, error: countError } = await supabase
    .from('study_materials')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectId);

  if (countError) {
    console.warn('fetchMaterialsBySubject count error:', countError.message);
  }

  const total = count ?? 0;

  // Fetch paginated materials
  const { data, error } = await supabase
    .from('study_materials')
    .select('*')
    .eq('subject_id', subjectId)
    .order('uploaded_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const materials = normalizeMaterials(data || []);

  return {
    materials,
    total,
    hasMore: from + materials.length < total,
  };
}

/**
 * Fetch ALL materials for a subject (no pagination).
 * Use for smaller datasets or when the student needs the full list.
 */
export async function fetchAllMaterialsBySubject(
  subjectId: string,
): Promise<Material[]> {
  const { data, error } = await supabase
    .from('study_materials')
    .select('*')
    .eq('subject_id', subjectId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return normalizeMaterials(data || []);
}

// ─── Group materials by unit ──────────────────────────────────────────────────

/**
 * Groups a flat list of materials by their unit.
 * Materials without a unit go into an "General" group.
 */
export function groupMaterialsByUnit(materials: Material[]): MaterialGroup[] {
  const unitMap = new Map<string, MaterialGroup>();

  for (const mat of materials) {
    const key = mat.unit_id ?? '__general__';

    if (!unitMap.has(key)) {
      unitMap.set(key, {
        unitId: mat.unit_id,
        unitName: mat.unit_name || 'General',
        orderNo: mat.unit_id ? 1 : 999, // general goes last
        materials: [],
      });
    }

    unitMap.get(key)!.materials.push(mat);
  }

  // Try to fetch unit order from the units table
  // For now, sort by unitName alphabetically, with General last
  return Array.from(unitMap.values()).sort((a, b) => {
    if (a.unitId === null) return 1;
    if (b.unitId === null) return -1;
    return a.unitName.localeCompare(b.unitName);
  });
}

/**
 * Fetch materials grouped by unit (using the units table for ordering).
 * Falls back to flat grouping if no units exist.
 */
export async function fetchMaterialsGroupedByUnit(
  subjectId: string,
): Promise<MaterialGroup[]> {
  // Fetch units for ordering
  const { data: unitRows } = await supabase
    .from('units')
    .select('id, title, order_no')
    .eq('subject_id', subjectId)
    .order('order_no', { ascending: true });

  // Fetch all materials
  const materials = await fetchAllMaterialsBySubject(subjectId);

  if (!unitRows || unitRows.length === 0) {
    // No unit structure — return grouped by unit_name if present, else flat
    return groupMaterialsByUnit(materials);
  }

  // Build groups from the units table (preserves order)
  const groups: MaterialGroup[] = [];
  const unitMaterialMap = new Map<string, Material[]>();
  const unassigned: Material[] = [];

  for (const mat of materials) {
    if (mat.unit_id) {
      if (!unitMaterialMap.has(mat.unit_id)) {
        unitMaterialMap.set(mat.unit_id, []);
      }
      unitMaterialMap.get(mat.unit_id)!.push(mat);
    } else {
      unassigned.push(mat);
    }
  }

  for (const unit of unitRows) {
    groups.push({
      unitId: unit.id,
      unitName: unit.title,
      orderNo: unit.order_no,
      materials: unitMaterialMap.get(unit.id) || [],
    });
  }

  // Add unassigned materials as "General" group
  if (unassigned.length > 0) {
    groups.push({
      unitId: null,
      unitName: 'General',
      orderNo: 999,
      materials: unassigned,
    });
  }

  return groups;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize raw Supabase rows into the Material interface */
function normalizeMaterials(rows: any[]): Material[] {
  return rows.map((row) => ({
    id: String(row.id),
    subject_id: String(row.subject_id ?? ''),
    unit_id: row.unit_id ? String(row.unit_id) : null,
    subject_name: row.subject_name ?? null,
    unit_name: row.unit_name ?? null,
    title: row.title || row.file_name || 'Untitled',
    file_name: row.file_name || 'unknown',
    file_size: row.file_size ?? 0,
    file_url: row.file_url ?? null,
    file_data: row.file_data ?? null,
    file_type: row.file_type || extractFileType(row.file_name),
    material_type: row.material_type ?? null,
    uploaded_at: row.uploaded_at || row.created_at || new Date().toISOString(),
  }));
}

/** Extract file extension from filename */
function extractFileType(fileName: string): string {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/** Get a viewable URL for a material. Returns null if not viewable. */
export function getMaterialViewUrl(material: Material): string | null {
  // Prefer Supabase Storage public URL (http/https)
  if (material.file_url && material.file_url.startsWith('http')) {
    return material.file_url;
  }
  // Support base64 data URIs stored in either field
  if (material.file_url && material.file_url.startsWith('data:')) {
    return material.file_url;
  }
  if (material.file_data) return material.file_data;
  // Any other non-empty file_url
  if (material.file_url) return material.file_url;
  return null;
}

/** Check if a file can be previewed (PDF inline, images inline) */
export function isPreviewable(material: Material): boolean {
  const type = material.file_type.toLowerCase();
  return ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(type);
}

/** Check if a file is specifically a PDF (for embedded viewer) */
export function isPdf(material: Material): boolean {
  return material.file_type.toLowerCase() === 'pdf';
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${sizes[i]}`;
}

/** Format upload date for display */
export function formatUploadDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/** Trigger a file download */
export function downloadMaterial(material: Material): void {
  const url = material.file_url || material.file_data;
  if (!url) return;

  const a = document.createElement('a');
  a.href = url;
  a.download = material.file_name;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Realtime ─────────────────────────────────────────────────────────────────

/**
 * Subscribe to study_materials changes for a specific subject.
 * Calls `onChange` with refreshed data when any insert/update/delete occurs.
 * Returns an unsubscribe function.
 */
export function subscribeToMaterialChanges(
  subjectId: string,
  onChange: (materials: Material[]) => void,
): () => void {
  const channel = supabase
    .channel(`materials:${subjectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'study_materials',
        filter: `subject_id=eq.${subjectId}`,
      },
      async () => {
        try {
          const materials = await fetchAllMaterialsBySubject(subjectId);
          onChange(materials);
        } catch (err) {
          console.error('Realtime material refresh error:', err);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
