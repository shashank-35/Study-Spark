/**
 * UnitManager – CRUD for units with drag-to-reorder and subject association.
 */
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
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
  Edit,
  Trash2,
  Search,
  Layers,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getAdminSubjects,
  type AdminUnit,
  type AdminSubject,
} from '@/lib/adminService';

interface UnitManagerProps {
  refreshKey: number;
}

const EMPTY_FORM = { subject_id: '', title: '', order_no: 1 };

export default function UnitManager({ refreshKey }: UnitManagerProps) {
  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Modal
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, s] = await Promise.all([getUnits(), getAdminSubjects()]);
      setUnits(u);
      setSubjects(s);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filtered = units.filter((u) => {
    const matchSearch = u.title.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subjectFilter === 'all' || u.subject_id === subjectFilter;
    return matchSearch && matchSubject;
  });

  const openAddDialog = () => {
    setForm({ ...EMPTY_FORM, subject_id: subjects[0]?.id ?? '' });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEditDialog = (unit: AdminUnit) => {
    setForm({ subject_id: unit.subject_id, title: unit.title, order_no: unit.order_no });
    setEditingId(unit.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.subject_id) { toast.error('Select a subject'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateUnit(editingId, form);
        toast.success('Unit updated');
      } else {
        await createUnit(form);
        toast.success('Unit created');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUnit(deleteId);
      toast.success('Unit deleted');
      setDeleteId(null);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const moveUnit = async (unit: AdminUnit, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? unit.order_no - 1 : unit.order_no + 1;
    if (newOrder < 1) return;
    try {
      await updateUnit(unit.id, { order_no: newOrder });
      load();
    } catch {
      toast.error('Failed to reorder');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" /> Unit Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{units.length} units across {subjects.length} subjects</p>
        </div>
        <Button onClick={openAddDialog} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Unit
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search units…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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

      {/* Unit List */}
      <Card className="border-border/60 shadow-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/60 bg-muted/30">
                <tr>
                  <th className="w-10 p-4"></th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit Title</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <Layers className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No units found</p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={openAddDialog}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add your first unit
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((unit) => (
                    <tr key={unit.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4 text-muted-foreground">
                        <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="border-primary/30 text-primary text-xs w-8 justify-center">
                            {unit.order_no}
                          </Badge>
                          <div className="flex flex-col gap-0.5 ml-1">
                            <button onClick={() => moveUnit(unit, 'up')} className="text-muted-foreground hover:text-primary p-0.5">
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button onClick={() => moveUnit(unit, 'down')} className="text-muted-foreground hover:text-primary p-0.5">
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-sm text-foreground">{unit.title}</td>
                      <td className="p-4">
                        <Badge variant="secondary" className="text-xs">{unit.subject_name}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(unit)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(unit.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
            <DialogDescription>{editingId ? 'Update the unit details.' : 'Create a new unit under a subject.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={String(form.subject_id)} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Introduction to Pointers" />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input type="number" min={1} value={form.order_no} onChange={(e) => setForm({ ...form, order_no: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unit</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the unit. This action cannot be undone.</AlertDialogDescription>
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
