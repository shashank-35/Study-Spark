/**
 * PDFPreviewModal.tsx
 * Full-screen-ish dialog for previewing PDF files (and images).
 * Uses Google Docs Viewer for external URLs, iframe for direct Supabase URLs.
 * Includes loading state, fallback, open-in-new-tab, and download actions.
 */

import { useState } from 'react';
import { Download, ExternalLink, FileText, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  type Material,
  formatFileSize,
  formatUploadDate,
  getMaterialViewUrl,
  isPdf,
  downloadMaterial,
} from '@/lib/materialService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PDFPreviewModalProps {
  material: Material | null;
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PDFPreviewModal({ material, open, onClose }: PDFPreviewModalProps) {
  const [loading, setLoading] = useState(true);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setLoading(true);
    }
  };

  if (!material) return null;

  const viewUrl = getMaterialViewUrl(material);
  const pdfFile = isPdf(material);
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(
    material.file_type.toLowerCase(),
  );

  // For PDFs from external URLs, use Google Docs Viewer for reliability
  const isExternalUrl = viewUrl?.startsWith('http');
  const embedUrl =
    pdfFile && isExternalUrl
      ? `https://docs.google.com/gview?url=${encodeURIComponent(viewUrl!)}&embedded=true`
      : viewUrl;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-primary to-blue-600 text-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 shrink-0" />
                <span className="truncate">{material.title || material.file_name}</span>
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-xs mt-1 flex items-center gap-2 flex-wrap">
                <span>{formatFileSize(material.file_size)}</span>
                <span className="opacity-50">&bull;</span>
                <span>{material.file_type.toUpperCase()}</span>
                <span className="opacity-50">&bull;</span>
                <span>{formatUploadDate(material.uploaded_at)}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Preview area */}
        <div
          style={{ height: 'calc(85vh - 140px)' }}
          className="bg-gray-100 dark:bg-zinc-900 relative"
        >
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            </div>
          )}

          {(() => {
            if (!viewUrl) {
              return (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted/80 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground font-medium">
                      Cannot preview this file type
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Download the file to view it locally
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadMaterial(material)}
                    className="gap-1.5"
                  >
                    <Download className="h-4 w-4" /> Download File
                  </Button>
                </div>
              );
            }

            if (isImage) {
              return (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={viewUrl}
                    alt={material.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                    onLoad={() => setLoading(false)}
                    onError={() => setLoading(false)}
                  />
                </div>
              );
            }

            return (
              <iframe
                src={embedUrl!}
                className="w-full h-full border-0"
                title={material.title || material.file_name}
                onLoad={() => setLoading(false)}
              />
            );
          })()}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 border-t">
          <div className="flex items-center gap-2">
            {isExternalUrl && viewUrl && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-xs"
                onClick={() => window.open(viewUrl, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadMaterial(material)}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button size="sm" onClick={onClose}>
              <X className="h-4 w-4 mr-1" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
