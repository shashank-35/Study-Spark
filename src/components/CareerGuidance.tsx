
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, TrendingUp, Star, Target, Users, Building, Globe, Code, Home, ArrowLeft } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "@/lib/supabaseClient";

/* ─── Skill mapping ─────────────────────────────────────────────────────── */
// Maps subject name keywords → skill category
const SUBJECT_TO_SKILL: Record<string, string> = {
  "c programming": "Programming Languages",
  "programming in c": "Programming Languages",
  "c++": "Programming Languages",
  "java": "Programming Languages",
  "python": "Programming Languages",
  "oop": "Programming Languages",
  "database": "Database Management",
  "dbms": "Database Management",
  "sql": "Database Management",
  "web": "Web Technologies",
  "html": "Web Technologies",
  "css": "Web Technologies",
  "javascript": "Web Technologies",
  "react": "Web Technologies",
  "data structure": "Problem Solving",
  "algorithm": "Problem Solving",
  "dsa": "Problem Solving",
  "mathematics": "Problem Solving",
  "discrete": "Problem Solving",
  "network": "Communication",
  "operating": "Problem Solving",
  "software engineering": "Project Management",
  "project": "Project Management",
};

function mapSubjectToSkill(subjectName: string): string {
  const lower = subjectName.toLowerCase();
  for (const [keyword, skill] of Object.entries(SUBJECT_TO_SKILL)) {
    if (lower.includes(keyword)) return skill;
  }
  return "Programming Languages"; // Fallback
}

const CareerGuidance = ({ onBackToDesktop }: { onBackToDesktop?: () => void }) => {
  const { user } = useUser();
  const userId = user?.id;

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<{ name: string; progress: number; category: string }[]>([]);
  const [avgSkillMatch, setAvgSkillMatch] = useState(0);
  const [quizCount, setQuizCount] = useState(0);

  /* ── Fetch real skill data ── */
  const loadSkills = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Fetch subject progress + quiz results in parallel
      const [progressRes, quizRes] = await Promise.all([
        supabase
          .from("student_progress")
          .select("completed_units, total_units, subjects(name)")
          .eq("user_id", userId),
        supabase
          .from("quiz_results")
          .select("subject, score")
          .eq("user_id", userId),
      ]);

      // Build a skill → scores map
      const skillScores: Record<string, number[]> = {
        "Programming Languages": [],
        "Database Management": [],
        "Web Technologies": [],
        "Problem Solving": [],
        "Communication": [],
        "Project Management": [],
      };

      // From subject progress (0-100 scale based on completion %)
      for (const row of (progressRes.data ?? []) as any[]) {
        const subjectName: string = row.subjects?.name ?? "";
        const pct = row.total_units > 0 ? Math.round((row.completed_units / row.total_units) * 100) : 0;
        const skill = mapSubjectToSkill(subjectName);
        if (skillScores[skill]) skillScores[skill].push(pct);
      }

      // From quiz results (score is already 0-100)
      for (const row of (quizRes.data ?? []) as any[]) {
        const skill = mapSubjectToSkill(row.subject ?? "");
        if (skillScores[skill]) skillScores[skill].push(row.score ?? 0);
      }

      setQuizCount(quizRes.data?.length ?? 0);

      // Compute averages
      const computed = Object.entries(skillScores).map(([name, scores]) => {
        const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const category = ["Programming Languages", "Database Management", "Web Technologies"].includes(name)
          ? "Technical"
          : ["Problem Solving"].includes(name)
          ? "Core"
          : "Soft Skills";
        return { name, progress: avg, category };
      });

      setSkills(computed);
      const allScores = computed.map((s) => s.progress).filter((p) => p > 0);
      setAvgSkillMatch(allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0);
    } catch {
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadSkills(); }, [loadSkills]);

  const careerPaths = [
    {
      title: "Software Developer",
      icon: <Code className="h-8 w-8" />,
      description: "Build applications, websites, and software solutions",
      averageSalary: "₹4-8 LPA",
      demandLevel: "High",
      skillsRequired: ["Programming", "Problem Solving", "Debugging", "Frameworks"],
      companies: ["TCS", "Infosys", "Wipro", "Accenture", "Startups"],
      growthPath: "Junior Dev → Senior Dev → Tech Lead → Architect",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Web Developer",
      icon: <Globe className="h-8 w-8" />,
      description: "Create responsive websites and web applications",
      averageSalary: "₹3-6 LPA",
      demandLevel: "Very High",
      skillsRequired: ["HTML/CSS", "JavaScript", "React/Angular", "Node.js"],
      companies: ["Google", "Microsoft", "Amazon", "Flipkart", "Agencies"],
      growthPath: "Frontend Dev → Fullstack Dev → Lead Developer",
      color: "from-green-500 to-green-600"
    },
    {
      title: "Database Administrator",
      icon: <Building className="h-8 w-8" />,
      description: "Manage and optimize database systems",
      averageSalary: "₹5-9 LPA",
      demandLevel: "Medium",
      skillsRequired: ["SQL", "Database Design", "Performance Tuning", "Backup"],
      companies: ["Oracle", "IBM", "Banks", "Healthcare", "E-commerce"],
      growthPath: "DBA → Senior DBA → Database Architect",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "System Analyst",
      icon: <TrendingUp className="h-8 w-8" />,
      description: "Analyze business requirements and design IT solutions",
      averageSalary: "₹4-7 LPA",
      demandLevel: "Medium",
      skillsRequired: ["Analysis", "Documentation", "Communication", "Process Design"],
      companies: ["Consulting Firms", "Banks", "Government", "Enterprises"],
      growthPath: "Analyst → Senior Analyst → Solution Architect",
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "Data Analyst",
      icon: <TrendingUp className="h-8 w-8" />,
      description: "Extract insights from data to drive business decisions",
      averageSalary: "₹3-6 LPA",
      demandLevel: "High",
      skillsRequired: ["Excel", "SQL", "Python/R", "Data Visualization"],
      companies: ["Analytics Firms", "Banks", "E-commerce", "Startups"],
      growthPath: "Analyst → Senior Analyst → Data Scientist",
      color: "from-pink-500 to-pink-600"
    },
    {
      title: "Network Administrator",
      icon: <Globe className="h-8 w-8" />,
      description: "Maintain and secure computer networks",
      averageSalary: "₹3-5 LPA",
      demandLevel: "Medium",
      skillsRequired: ["Networking", "Security", "Troubleshooting", "Protocols"],
      companies: ["ISPs", "Enterprises", "Government", "Telecom"],
      growthPath: "Network Admin → Network Engineer → Network Architect",
      color: "from-indigo-500 to-indigo-600"
    }
  ];

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case "Very High": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "High": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Technical": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "Core": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "Soft Skills": return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Career Guidance Hub</h2>
          <p className="text-muted-foreground text-sm mt-1">Explore your future career paths in IT!</p>
        </div>
        {onBackToDesktop && (
          <Button onClick={onBackToDesktop} variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        )}
      </div>

      {/* Career Stats — dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Briefcase className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">6</p>
            <p className="text-xs text-muted-foreground">Career Paths</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-violet-500 mx-auto mb-2" />
            {loading ? <Skeleton className="h-8 w-16 mx-auto mb-1" /> : (
              <p className="text-2xl font-bold text-foreground tabular-nums">{avgSkillMatch}%</p>
            )}
            <p className="text-xs text-muted-foreground">Skill Match</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-pink-500 mx-auto mb-2" />
            {loading ? <Skeleton className="h-8 w-16 mx-auto mb-1" /> : (
              <p className="text-2xl font-bold text-foreground tabular-nums">{quizCount}</p>
            )}
            <p className="text-xs text-muted-foreground">Quizzes Done</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 text-center">
            <Building className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{careerPaths.length * 5}+</p>
            <p className="text-xs text-muted-foreground">Companies</p>
          </CardContent>
        </Card>
      </div>

      {/* Career Paths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {careerPaths.map((path, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer border-border/60 hover:border-primary/40 hover:shadow-md transition-all ${
              selectedPath === path.title ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => setSelectedPath(path.title)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="text-primary">{path.icon}</div>
                <div>
                  <CardTitle className="text-lg text-foreground">{path.title}</CardTitle>
                  <div className="flex space-x-2 mt-1">
                    <Badge className={getDemandColor(path.demandLevel)} variant="secondary">
                      {path.demandLevel} Demand
                    </Badge>
                    <Badge variant="outline" className="text-green-600 dark:text-green-400">
                      {path.averageSalary}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <CardDescription>{path.description}</CardDescription>
              
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground">Key Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {path.skillsRequired.map((skill, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-foreground">Top Companies:</p>
                <div className="flex flex-wrap gap-1">
                  {path.companies.slice(0, 3).map((company, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{company}</Badge>
                  ))}
                  {path.companies.length > 3 && (
                    <Badge variant="secondary" className="text-xs">+{path.companies.length - 3} more</Badge>
                  )}
                </div>
              </div>

              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-sm font-semibold text-foreground mb-1">Career Growth:</p>
                <p className="text-xs text-muted-foreground">{path.growthPath}</p>
              </div>

              <Button className={`w-full bg-gradient-to-r ${path.color} hover:opacity-90 text-white`} size="sm">
                <Target className="h-4 w-4 mr-1" /> Explore Path
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skills Assessment — dynamic from Supabase */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Star className="h-5 w-5 mr-2" />
            Your Skill Assessment
          </CardTitle>
          <CardDescription>Based on your subject progress &amp; quiz results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))
          ) : skills.every((s) => s.progress === 0) ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <p>No data yet. Complete quizzes and subject progress to see your skill assessment!</p>
            </div>
          ) : (
            skills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-foreground">{skill.name}</span>
                    <Badge className={getCategoryColor(skill.category)} variant="secondary">
                      {skill.category}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground tabular-nums">{skill.progress}%</span>
                </div>
                <Progress value={skill.progress} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Target className="h-5 w-5 mr-2" />
            Recommended Next Steps
          </CardTitle>
          <CardDescription>Actions to boost your career readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start space-x-3 p-3 bg-muted/40 rounded-lg border border-border/40">
              <Code className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">Build a Portfolio</p>
                <p className="text-xs text-muted-foreground">Create 3-5 projects showcasing your skills</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-muted/40 rounded-lg border border-border/40">
              <Users className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">Network & Connect</p>
                <p className="text-xs text-muted-foreground">Join tech communities and attend events</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-muted/40 rounded-lg border border-border/40">
              <Star className="h-5 w-5 text-violet-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">Get Certified</p>
                <p className="text-xs text-muted-foreground">Pursue relevant industry certifications</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-muted/40 rounded-lg border border-border/40">
              <Briefcase className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-foreground">Gain Experience</p>
                <p className="text-xs text-muted-foreground">Apply for internships and entry-level roles</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPath && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/10">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Ready to pursue {selectedPath}?</h3>
            <p className="text-muted-foreground mb-4">Let's create a personalized roadmap for your career!</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button>Create Roadmap</Button>
              <Button variant="outline">Find Mentors</Button>
              <Button variant="outline">Job Opportunities</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CareerGuidance;
