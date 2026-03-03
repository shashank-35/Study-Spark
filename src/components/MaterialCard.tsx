/**
 * MaterialCard.tsx
 * A polished card/row for a single study material.
 * Shows file icon (type-aware), title, file size, upload date, and View/Download buttons.
 * Uses Framer Motion for smooth entrance and hover effects.
 */

import { type Variants, motion } from 'framer-motion';
import {
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Presentation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  type Material,
  formatFileSize,
  formatUploadDate,
  getMaterialViewUrl,
  isPdf,
  isPreviewable,
  downloadMaterial,
} from '@/lib/materialService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MaterialCardProps {
  material: Material;
  /** Called when the user clicks "View" (for PDF preview or image) */
  onPreview?: (material: Material) => void;
  /** Entrance animation index for staggering */
  index?: number;
}

// ─── File icon helper ─────────────────────────────────────────────────────────

const FILE_ICON_MAP: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pdf: { icon: FileText, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  doc: { icon: FileType, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  docx: { icon: FileType, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  txt: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800/50' },
  ppt: { icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  pptx: { icon: Presentation, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  xls: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
  xlsx: { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
  png: { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  jpg: { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  jpeg: { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  gif: { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  webp: { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  svg: { icon: FileImage, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
};

const DEFAULT_ICON = { icon: File, color: 'text-muted-foreground', bg: 'bg-muted/50' };

function getFileIconConfig(fileType: string) {
  return FILE_ICON_MAP[fileType.toLowerCase()] ?? DEFAULT_ICON;
}

// ─── Material type badge colors ───────────────────────────────────────────────

const MATERIAL_TYPE_COLORS: Record<string, string> = {
  Notes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Assignment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Important: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

// ─── Animation variants ──────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MaterialCard({ material, onPreview, index = 0 }: MaterialCardProps) {
  const iconConfig = getFileIconConfig(material.file_type);
  const Icon = iconConfig.icon;
  const canPreview = isPreviewable(material) && !!getMaterialViewUrl(material);
  const isPdfFile = isPdf(material);

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="group/mat flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-border hover:shadow-sm transition-all duration-200"
    >
      {/* Left: Icon + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* File type icon */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconConfig.bg}`}
        >
          <Icon className={`h-5 w-5 ${iconConfig.color}`} />
        </div>

        {/* Text info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-medium truncate leading-tight" title={material.title}>
              {material.title}
            </p>
            {material.material_type && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-4 shrink-0 border-0 font-medium ${
                  MATERIAL_TYPE_COLORS[material.material_type] ?? 'bg-muted text-muted-foreground'
                }`}
              >
                {material.material_type}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {formatFileSize(material.file_size)}
            </span>
            <span className="text-xs text-muted-foreground/50">&bull;</span>
            <span className="text-xs text-muted-foreground">
              {material.file_type.toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground/50">&bull;</span>
            <span className="text-xs text-muted-foreground">
              {formatUploadDate(material.uploaded_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/mat:opacity-100 sm:opacity-60 transition-opacity">
        {canPreview && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => onPreview?.(material)}
            title={isPdfFile ? 'Preview PDF' : 'View file'}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isPdfFile ? 'Preview' : 'View'}
            </span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs hover:bg-muted"
          onClick={() => downloadMaterial(material)}
          title="Download file"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download</span>
        </Button>
      </div>
    </motion.div>
  );
}
