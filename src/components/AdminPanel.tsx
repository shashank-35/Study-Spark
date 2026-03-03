import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  BookOpen, 
  Settings, 
  BarChart3, 
  Shield, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Brain,
  Code,
  Database,
  Globe,
  Cpu,
  Home,
  RefreshCw,
  File
} from "lucide-react";

import { 
  getStudents,
  deleteStudentById,
  resetStudentProgress,
  resetAllProgress,
  StudentRecord,
  upsertStudent
} from "@/lib/storage";
import {
  getSubjects,
  addSubject,
  updateSubject,
  deleteSubject,
  getStudyMaterials,
  addStudyMaterial,
  deleteStudyMaterial,
  subscribeToStudyMaterials,
  StudyMaterial
} from "@/lib/supabaseClient";

interface Subject {
  id: number;
  subject_name: string;
  description: string;
  progress: number;
  completion: number;
  next_topic: string;
  est_time: string;
  level: string;
  created_at: string;
  updated_at: string;
  // Additional properties for admin display
  name?: string;
  students?: number;
  quizzes?: number;
  avgScore?: number;
}

interface AdminPanelProps {
  onBackToDesktop: () => void;
}

const AdminPanel = ({ onBackToDesktop }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [selectedMaterialSubject, setSelectedMaterialSubject] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setStudents(getStudents());
    refresh();
    window.addEventListener("studySpark_students_updated", refresh as EventListener);
    return () => window.removeEventListener("studySpark_students_updated", refresh as EventListener);
  }, []);

  // Load study materials from Supabase
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const materials = await getStudyMaterials();
        setStudyMaterials(materials);
      } catch (error) {
        console.error('Error loading materials:', error);
      }
    };
    loadMaterials();

    // Subscribe to real-time changes
    const subscription = subscribeToStudyMaterials((materials) => {
      setStudyMaterials(materials);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    // Fetch subjects on component mount
    const loadSubjects = async () => {
      try {
        const data = await getSubjects();
        setSubjects(data || []);
      } catch (error) {
        console.error('Error loading subjects:', error);
        alert('Failed to load subjects');
      }
    };
    loadSubjects();
  }, []);

  const analytics = useMemo(() => {
    const totalStudents = students.length;
    const avgCompletion = totalStudents
      ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / totalStudents)
      : 0;
    const activeToday = students.filter((s) => {
      if (!s.lastActive) return false;
      const last = new Date(s.lastActive).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      return Date.now() - last < dayMs;
    }).length;
    return {
      totalStudents,
      activeToday,
      totalQuizzes: 0,
      avgCompletion,
    };
  }, [students]);

  const handleDelete = (id: string) => {
    deleteStudentById(id);
    setStudents(getStudents());
  };

  const handleReset = (id: string) => {
    resetStudentProgress(id);
    setStudents(getStudents());
  };

  const handleResetAll = () => {
    resetAllProgress();
    setStudents(getStudents());
  };

  const handleAddSubject = async () => {
    const subject_name = window.prompt("Enter subject name:");
    if (!subject_name) return;

    const description = window.prompt("Enter subject description:");
    if (!description) return;

    const level = window.prompt("Enter level (Beginner/Intermediate/Advanced):", "Beginner");
    if (!level) return;

    try {
      const newSubject = await addSubject({
        subject_name,
        description,
        level,
        progress: 0,
        completion: 0,
        next_topic: '',
        est_time: '2 weeks'
      });
      setSubjects([...subjects, newSubject]);
      alert('Subject added successfully!');
    } catch (error) {
      console.error('Error adding subject:', error);
      if (error.message.includes('Authentication required')) {
        alert('⚠️ Authentication Required\n\nTo add subjects, you need to:\n1. Log in as an admin user\n2. Or disable Row Level Security (RLS) in Supabase\n\nFor development, you can disable RLS in your Supabase dashboard:\n• Go to Table Editor → subjects\n• Disable Row Level Security');
      } else {
        alert('Failed to add subject: ' + error.message);
      }
    }
  };

  const handleEditSubject = async (subject) => {
    const subject_name = window.prompt("Edit subject name:", subject.subject_name);
    if (!subject_name) return;

    const description = window.prompt("Edit description:", subject.description);
    if (!description) return;

    const level = window.prompt("Edit level (Beginner/Intermediate/Advanced):", subject.level);
    if (!level) return;

    try {
      const updatedSubject = await updateSubject(subject.id, {
        ...subject,
        subject_name,
        description,
        level,
        updated_at: new Date().toISOString()
      });
      setSubjects(subjects.map(s => s.id === subject.id ? updatedSubject : s));
      alert('Subject updated successfully!');
    } catch (error) {
      console.error('Error updating subject:', error);
      if (error.message.includes('Authentication required')) {
        alert('⚠️ Authentication Required\n\nTo edit subjects, you need to:\n1. Log in as an admin user\n2. Or disable Row Level Security (RLS) in Supabase\n\nFor development, you can disable RLS in your Supabase dashboard:\n• Go to Table Editor → subjects\n• Disable Row Level Security');
      } else {
        alert('Failed to update subject: ' + error.message);
      }
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await deleteSubject(id);
      setSubjects(subjects.filter(s => s.id !== id));
      alert('Subject deleted successfully!');
    } catch (error) {
      console.error('Error deleting subject:', error);
      if (error.message.includes('Authentication required')) {
        alert('⚠️ Authentication Required\n\nTo delete subjects, you need to:\n1. Log in as an admin user\n2. Or disable Row Level Security (RLS) in Supabase\n\nFor development, you can disable RLS in your Supabase dashboard:\n• Go to Table Editor → subjects\n• Disable Row Level Security');
      } else {
        alert('Failed to delete subject');
      }
    }
  };

  const handleEditStudent = (student: StudentRecord) => {
    const newName = window.prompt("Edit name", student.name || "");
    if (newName === null) return;
    const newEmail = window.prompt("Edit email", student.email || "");
    if (newEmail === null) return;
    const newSemester = window.prompt("Edit semester (1-6)", student.semester || "5");
    if (newSemester === null) return;
    const updated: StudentRecord = {
      ...student,
      name: newName.trim() || student.name,
      email: newEmail.trim() || student.email,
      semester: newSemester.trim() || student.semester,
    };
    upsertStudent(updated);
    setStudents(getStudents());
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Admin Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Admin Control Panel</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage Study Spark platform and student progress</p>
        </div>
        <Button
          onClick={onBackToDesktop}
          variant="outline"
          size="sm"
          className="gap-2 border-border/60 hover:border-primary hover:text-primary hover:bg-primary/5"
        >
          <Home className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, value: analytics.totalStudents, label: "Total Students", color: "text-primary", bg: "bg-primary/10" },
          { icon: CheckCircle, value: analytics.activeToday, label: "Active Today", color: "text-success", bg: "bg-success/10" },
          { icon: Brain, value: analytics.totalQuizzes, label: "Total Quizzes", color: "text-accent", bg: "bg-accent/10" },
          { icon: TrendingUp, value: `${analytics.avgCompletion}%`, label: "Avg Completion", color: "text-focus", bg: "bg-focus/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-border/60 shadow-card card-hover">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: CheckCircle, color: "text-success bg-success/10", title: "New student registration", desc: "Arjun Sharma joined BCA program", time: "2 min ago" },
                  { icon: Brain, color: "text-primary bg-primary/10", title: "Quiz completed", desc: "15 students completed Java OOP quiz", time: "1 hour ago" },
                  { icon: Upload, color: "text-focus bg-focus/10", title: "Content uploaded", desc: "New C Programming notes added", time: "3 hours ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">{item.time}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200">Server maintenance scheduled</p>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">System will be down for 2 hours on Sunday</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="font-medium text-sm text-blue-800 dark:text-blue-200">Database backup completed</p>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300">All student data safely backed up</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Student Management</h3>
            <Button className="flex items-center space-x-2" onClick={handleResetAll} variant="outline">
              <Plus className="h-4 w-4" />
              <span>Reset All Progress</span>
            </Button>
          </div>
          
          <Card className="border-border/60">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border/60 bg-secondary/30">
                    <tr>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semester</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Active</th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No students registered yet</td>
                      </tr>
                    ) : students.map((student) => (
                      <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-sm text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="border-border/60 text-xs">Sem {student.semester}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${student.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-primary">{student.progress || 0}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">{new Date(student.lastActive).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEditStudent(student)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-focus" onClick={() => handleReset(student.id)}>
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(student.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Subject Management</h3>
            <Button className="flex items-center space-x-2" onClick={handleAddSubject}>
              <Plus className="h-4 w-4" />
              <span>Add Subject</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{subject.subject_name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditSubject(subject)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteSubject(subject.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{subject.students || 0}</p>
                      <p className="text-sm text-gray-600">Students</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{subject.quizzes || 0}</p>
                      <p className="text-sm text-gray-600">Quizzes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{subject.avgScore || 0}%</p>
                      <p className="text-sm text-gray-600">Avg Score</p>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Study Materials Management</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50">
                {studyMaterials.length} material{studyMaterials.length !== 1 ? 's' : ''} uploaded
              </Badge>
            </div>
          </div>

          {/* Materials by Subject */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subject List */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {subjects.map((subject) => {
                      const materialCount = studyMaterials.filter(
                        (m) => m.subject_name === subject.subject_name
                      ).length;
                      return (
                        <Button
                          key={subject.id}
                          variant={selectedMaterialSubject === subject.subject_name ? "default" : "outline"}
                          className="w-full justify-between"
                          onClick={() => setSelectedMaterialSubject(subject.subject_name)}
                        >
                          <span className="truncate">{subject.subject_name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {materialCount}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Materials Upload and List */}
            <div className="lg:col-span-2 space-y-4">
              {selectedMaterialSubject ? (
                <>
                  {/* Upload Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Upload Material for {selectedMaterialSubject}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                        <input
                          type="file"
                          id="material-upload"
                          accept=".pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && file.type.includes('pdf')) {
                              const reader = new FileReader();
                              reader.onload = async (event) => {
                                try {
                                  const fileData = event.target?.result as string;
                                  await addStudyMaterial({
                                    subject_name: selectedMaterialSubject || '',
                                    file_name: file.name,
                                    file_size: file.size,
                                    uploaded_at: new Date().toISOString(),
                                    file_data: fileData,
                                    file_type: 'pdf',
                                  });
                                } catch (error) {
                                  console.error('Error uploading material:', error);
                                  alert('Failed to upload material. Please try again.');
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm font-medium text-gray-700 mb-2">Upload PDF Study Material</p>
                        <p className="text-xs text-gray-500 mb-4">Click to select a PDF file</p>
                        <Button
                          onClick={() => document.getElementById('material-upload')?.click()}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Choose PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Materials List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Materials for {selectedMaterialSubject}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {studyMaterials.filter((m) => m.subject_name === selectedMaterialSubject).length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No materials uploaded yet</p>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {studyMaterials
                            .filter((m) => m.subject_name === selectedMaterialSubject)
                            .map((material) => (
                              <div key={material.id} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      <p className="font-medium text-sm">{material.file_name}</p>
                                    </div>
                                    <p className="text-xs text-gray-600">
                                      {(material.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(material.uploaded_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-700"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = material.file_data || '';
                                        link.download = material.file_name;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={async () => {
                                        try {
                                          await deleteStudyMaterial(material.id);
                                        } catch (error) {
                                          console.error('Error deleting material:', error);
                                          alert('Failed to delete material. Please try again.');
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-500 py-8">Select a subject to manage materials</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Content Management</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <input
                type="file"
                id="content-upload"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => {
                    console.log('Uploading file:', file.name);
                    // Simulate upload
                    setTimeout(() => {
                      alert(`Successfully uploaded: ${file.name}`);
                    }, 1000);
                  });
                }}
              />
              <Button 
                className="flex items-center space-x-2"
                onClick={() => document.getElementById('content-upload')?.click()}
              >
                <Upload className="h-4 w-4" />
                <span>Upload Content</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-dashed border-2 border-muted hover:border-primary transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Study Notes</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload PDF notes and materials</p>
                <input
                  type="file"
                  id="notes-upload"
                  multiple
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                      console.log('Uploading notes:', file.name);
                      setTimeout(() => alert(`Notes uploaded: ${file.name}`), 500);
                    });
                  }}
                />
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('notes-upload')?.click()}
                >
                  Upload Notes
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-dashed border-2 border-muted hover:border-secondary transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Quiz Questions</h3>
                <p className="text-sm text-muted-foreground mb-4">Create and manage quiz questions</p>
                <input
                  type="file"
                  id="quiz-upload"
                  multiple
                  accept=".json,.csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                      console.log('Uploading quiz:', file.name);
                      setTimeout(() => alert(`Quiz uploaded: ${file.name}`), 500);
                    });
                  }}
                />
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('quiz-upload')?.click()}
                >
                  Add Questions
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-dashed border-2 border-muted hover:border-accent transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Code className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Code Examples</h3>
                <p className="text-sm text-muted-foreground mb-4">Upload programming examples</p>
                <input
                  type="file"
                  id="code-upload"
                  multiple
                  accept=".c,.java,.py,.js,.html,.css,.cpp"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => {
                      console.log('Uploading code:', file.name);
                      setTimeout(() => alert(`Code uploaded: ${file.name}`), 500);
                    });
                  }}
                />
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('code-upload')?.click()}
                >
                  Add Code
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h3 className="text-lg font-semibold">Platform Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform Name</label>
                  <Input defaultValue="Study Spark - BCA Edition" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Semester</label>
                  <Input defaultValue="1" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quiz Time Limit (minutes)</label>
                  <Input defaultValue="30" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage system notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Email Notifications</label>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quiz Reminders</label>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Progress Reports</label>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <Button>Update Notifications</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;