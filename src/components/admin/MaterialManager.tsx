/**
 * MaterialManager – Upload, list, delete study materials
 * with file upload progress and Supabase Storage integration.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  Search,
  FileText,
  Upload,
  Download,
  Filter,
  File,
  FileType,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAdminMaterials,
  getAdminSubjects,
  getUnits,
  createMaterial,
  deleteAdminMaterial,
  uploadFileToStorage,
  type AdminMaterial,
  type AdminSubject,
  type AdminUnit,
} from '@/lib/adminService';

interface MaterialManagerProps {
  refreshKey: number;
}

export default function MaterialManager({ refreshKey }: MaterialManagerProps) {
  const [materials, setMaterials] = useState<AdminMaterial[]>([]);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Upload dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    subject_id: '' as string,
    unit_id: '' as string,
    title: '',
    material_type: 'Notes',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [m, s, u] = await Promise.all([
        getAdminMaterials(),
        getAdminSubjects(),
        getUnits(),
      ]);
      setMaterials(m);
      setSubjects(s);
      setUnits(u);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filtered = materials.filter((m) => {
    const matchSearch =
      m.file_name.toLowerCase().includes(search.toLowerCase()) ||
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject_name?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subjectFilter === 'all' || m.subject_id === subjectFilter;
    return matchSearch && matchSubject;
  });

  const filteredUnits = units.filter(u => u.subject_id === uploadForm.subject_id);

  const openUploadDialog = () => {
    setUploadForm({
      subject_id: subjects[0]?.id ?? '',
      unit_id: '',
      title: '',
      material_type: 'Notes',
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.error('Please select a file'); return; }
    if (!uploadForm.subject_id) { toast.error('Select a subject'); return; }

    const maxMB = 10;
    if (selectedFile.size > maxMB * 1024 * 1024) {
      toast.error(`File size must be under ${maxMB} MB`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (storage upload doesn't provide granular progress in supabase-js)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 85));
      }, 300);

      let fileUrl = '';
      try {
        fileUrl = await uploadFileToStorage(selectedFile);
      } catch {
        // If storage is not set up, fall back to base64
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(selectedFile);
        });
        fileUrl = base64;
      }

      clearInterval(progressInterval);
      setUploadProgress(90);

      const subjectName = subjects.find(s => s.id === uploadForm.subject_id)?.subject_name ?? '';

      await createMaterial({
        subject_id: uploadForm.subject_id,
        unit_id: uploadForm.unit_id && uploadForm.unit_id !== 'none' ? uploadForm.unit_id : null,
        subject_name: subjectName,
        title: uploadForm.title || selectedFile.name,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_url: fileUrl,
        file_type: selectedFile.name.split('.').pop() || 'pdf',
        material_type: uploadForm.material_type,
        uploaded_at: new Date().toISOString(),
      });

      setUploadProgress(100);
      toast.success('Material uploaded successfully');
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAdminMaterial(deleteId);
      toast.success('Material deleted');
      setDeleteId(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'Notes': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Assignment': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Important': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Study Materials
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{materials.length} materials uploaded</p>
        </div>
        <Button onClick={openUploadDialog} className="gap-1.5">
          <Upload className="h-4 w-4" /> Upload Material
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search materials…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.subject_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Materials Grid */}
      {filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <File className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No materials found</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={openUploadDialog}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Upload your first material
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} className="border-border/60 shadow-card card-hover group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <FileType className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{m.title || m.file_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.file_name}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">{m.subject_name}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${typeColor(m.material_type)}`}>
                        {m.material_type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{formatSize(m.file_size)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {new Date(m.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/40">
                  {m.file_url && (
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground hover:text-primary" asChild>
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3" /> Download
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground hover:text-destructive ml-auto"
                    onClick={() => setDeleteId(m.id)}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Study Material</DialogTitle>
            <DialogDescription>Upload a file for students to access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select
                value={String(uploadForm.subject_id)}
                onValueChange={(v) => setUploadForm({ ...uploadForm, subject_id: v, unit_id: '' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredUnits.length > 0 && (
              <div className="space-y-2">
                <Label>Unit (optional)</Label>
                <Select
                  value={String(uploadForm.unit_id)}
                  onValueChange={(v) => setUploadForm({ ...uploadForm, unit_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No unit</SelectItem>
                    {filteredUnits.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="Material title (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={uploadForm.material_type} onValueChange={(v) => setUploadForm({ ...uploadForm, material_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Notes">Notes</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Important">Important</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File *</Label>
              <div
                className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
                {selectedFile ? (
                  <div className="flex items-center gap-3 justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Click to select file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, TXT • Max 10 MB</p>
                  </>
                )}
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={uploading}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this study material. Students will no longer be able to access it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
