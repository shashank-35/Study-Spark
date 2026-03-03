/**
 * Settings – Admin platform settings with toggle controls.
 */
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Globe,
  Brain,
  Code,
  MessageSquare,
  Upload,
  FileText,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAdminSettings,
  updateAdminSettings,
  type AdminSettings,
} from '@/lib/adminService';

interface SettingsProps {
  refreshKey: number;
}

export default function Settings({ refreshKey }: SettingsProps) {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local form state
  const [form, setForm] = useState({
    platform_name: '',
    enable_quiz: true,
    enable_coding_lab: true,
    enable_ai_chat: true,
    upload_limit_mb: 10,
    allowed_file_types: ['pdf', 'doc', 'docx', 'txt'],
  });

  const load = useCallback(async () => {
    try {
      const s = await getAdminSettings();
      setSettings(s);
      setForm({
        platform_name: s.platform_name,
        enable_quiz: s.enable_quiz,
        enable_coding_lab: s.enable_coding_lab,
        enable_ai_chat: s.enable_ai_chat,
        upload_limit_mb: s.upload_limit_mb,
        allowed_file_types: s.allowed_file_types ?? ['pdf', 'doc', 'docx', 'txt'],
      });
    } catch (e) {
      console.error(e);
      // Use defaults if table doesn't exist yet
      toast.error('Could not load settings — using defaults');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleSave = async () => {
    if (!settings) {
      toast.error('Settings not loaded');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAdminSettings(settings.id, form);
      setSettings(updated);
      toast.success('Settings saved successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleFileType = (type: string) => {
    const current = form.allowed_file_types;
    if (current.includes(type)) {
      setForm({ ...form, allowed_file_types: current.filter((t) => t !== type) });
    } else {
      setForm({ ...form, allowed_file_types: [...current, type] });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" /> Platform Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure how Study Spark works</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" /> General
            </CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input
                value={form.platform_name}
                onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
                placeholder="Study Spark"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Last Updated</Label>
              <p className="text-sm text-foreground">
                {settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" /> Feature Toggles
            </CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Quiz System</p>
                  <p className="text-xs text-muted-foreground">Allow students to take quizzes</p>
                </div>
              </div>
              <Switch
                checked={form.enable_quiz}
                onCheckedChange={(v) => setForm({ ...form, enable_quiz: v })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Code className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Coding Lab</p>
                  <p className="text-xs text-muted-foreground">In-browser code editor</p>
                </div>
              </div>
              <Switch
                checked={form.enable_coding_lab}
                onCheckedChange={(v) => setForm({ ...form, enable_coding_lab: v })}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">AI Chat</p>
                  <p className="text-xs text-muted-foreground">AI-powered study assistant</p>
                </div>
              </div>
              <Switch
                checked={form.enable_ai_chat}
                onCheckedChange={(v) => setForm({ ...form, enable_ai_chat: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload Settings */}
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-primary" /> Upload Settings
            </CardTitle>
            <CardDescription>Configure file upload limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Maximum File Size (MB)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.upload_limit_mb}
                onChange={(e) => setForm({ ...form, upload_limit_mb: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Maximum file size students and admins can upload</p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Allowed File Types</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'csv', 'json'].map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleFileType(type)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      form.allowed_file_types.includes(type)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-muted/40 border-border/60 text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <FileText className="h-3 w-3 inline-block mr-1" />
                    .{type}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="border-border/60 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" /> Security
            </CardTitle>
            <CardDescription>Admin access and authentication info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Clerk Authentication</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Admin access is restricted to users with the <code className="px-1 py-0.5 rounded bg-muted text-xs">admin</code> role
                in Clerk public metadata.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                To grant admin access, go to your Clerk Dashboard → Users → select user → Public Metadata → add:
              </p>
              <pre className="text-xs bg-muted/50 rounded-lg p-3 border border-border/40 overflow-x-auto">
{`{
  "role": "admin"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
