/**
 * ProblemList.tsx
 *
 * Left-panel component.  Displays problems with difficulty badges,
 * solved status, and full CRUD (add / edit / delete) forms.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  CheckCircle2,
  Circle,
  ChevronDown,
} from "lucide-react";
import {
  type CodingProblem,
  type Difficulty,
  type Language,
  addProblem,
  updateProblem,
  deleteProblem,
  BOILERPLATES,
} from "@/lib/codingLabService";

// ── Difficulty helpers ─────────────────────────────────────────────────────
const DIFF_COLOR: Record<Difficulty, string> = {
  easy:   "bg-green-100 text-green-800  border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  hard:   "bg-red-100 text-red-800   border-red-300",
};

// Languages supported in the form
const LANGS: Language[] = ["javascript", "python", "cpp", "java"];

// ── Blank form state ───────────────────────────────────────────────────────
const blank = (): Omit<CodingProblem, "id" | "created_at"> => ({
  title: "",
  description: "",
  difficulty: "easy",
  tags: [],
  boilerplate: { ...BOILERPLATES },
  test_cases: [],
});

// ── Props ──────────────────────────────────────────────────────────────────
interface ProblemListProps {
  problems: CodingProblem[];
  selectedId: string | null;
  solvedIds: Set<string>;
  onSelect: (problem: CodingProblem) => void;
  onProblemsChange: (updated: CodingProblem[]) => void;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ProblemList({
  problems,
  selectedId,
  solvedIds,
  onSelect,
  onProblemsChange,
}: ProblemListProps) {
  // Filter state
  const [diffFilter, setDiffFilter] = useState<Difficulty | "all">("all");

  // Create / Edit form state
  type FormMode = "none" | "create" | "edit";
  const [formMode, setFormMode] = useState<FormMode>("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blank());
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Filtered list ────────────────────────────────────────────────────
  const visible = problems.filter(
    (p) => diffFilter === "all" || p.difficulty === diffFilter
  );

  // ── Open create form ─────────────────────────────────────────────────
  const openCreate = () => {
    setForm(blank());
    setTagInput("");
    setEditingId(null);
    setFormMode("create");
    setError("");
  };

  // ── Open edit form ───────────────────────────────────────────────────
  const openEdit = (p: CodingProblem) => {
    setForm({
      title:       p.title,
      description: p.description,
      difficulty:  p.difficulty,
      tags:        [...p.tags],
      boilerplate: { ...BOILERPLATES, ...p.boilerplate },
      test_cases:  [...p.test_cases],
    });
    setTagInput(p.tags.join(", "));
    setEditingId(p.id);
    setFormMode("edit");
    setError("");
  };

  const closeForm = () => {
    setFormMode("none");
    setEditingId(null);
    setError("");
  };

  // ── Save (create or update) ──────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }

    setSaving(true);
    setError("");

    // Merge tag input into tags array
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (formMode === "create") {
        const created = await addProblem({ ...form, tags });
        onProblemsChange([created, ...problems]);
      } else if (editingId) {
        const updated = await updateProblem(editingId, { ...form, tags });
        onProblemsChange(problems.map((p) => (p.id === editingId ? updated : p)));
      }
      closeForm();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this problem permanently?")) return;
    try {
      await deleteProblem(id);
      onProblemsChange(problems.filter((p) => p.id !== id));
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <Card className="h-full flex flex-col shadow-md border-gray-200">
      {/* Header */}
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="font-bold text-gray-800">
            📚 Problems
            <Badge variant="secondary" className="ml-2 text-xs">
              {problems.length}
            </Badge>
          </span>
          <Button
            size="sm"
            onClick={openCreate}
            className="bg-violet-600 hover:bg-violet-700 h-7 px-2"
            title="Add problem"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </CardTitle>

        {/* Difficulty filter chips */}
        <div className="flex gap-1.5 flex-wrap mt-1">
          {(["all", "easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDiffFilter(d)}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors
                ${diffFilter === d
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-gray-100 text-gray-600 border-gray-300 hover:border-violet-400"
                }`}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto pr-1 space-y-2 pb-4">
        {/* ── Create / Edit form ─────────────────────────────── */}
        {formMode !== "none" && (
          <div className="space-y-2 p-3 bg-violet-50 rounded-xl border border-violet-200 mb-2">
            <p className="text-xs font-semibold text-violet-700">
              {formMode === "create" ? "New Problem" : "Edit Problem"}
            </p>

            <Input
              placeholder="Title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="text-sm h-8"
            />

            <textarea
              placeholder="Description *"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full text-sm p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
            />

            {/* Difficulty */}
            <div className="flex gap-2 items-center">
              <span className="text-xs text-gray-600 shrink-0">Difficulty:</span>
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setForm({ ...form, difficulty: d })}
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors
                    ${form.difficulty === d
                      ? DIFF_COLOR[d] + " font-bold"
                      : "bg-gray-100 text-gray-500 border-gray-300"
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Tags */}
            <Input
              placeholder="Tags (comma-separated)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="text-sm h-8"
            />

            {/* Boilerplate per language */}
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 flex items-center gap-1">
                <ChevronDown className="h-3 w-3" /> Boilerplate code (optional)
              </summary>
              <div className="mt-2 space-y-2">
                {LANGS.map((lang) => (
                  <div key={lang}>
                    <p className="text-[11px] text-gray-500 mb-0.5 uppercase">{lang}</p>
                    <textarea
                      value={form.boilerplate[lang] ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          boilerplate: { ...form.boilerplate, [lang]: e.target.value },
                        })
                      }
                      rows={3}
                      className="w-full font-mono text-xs p-2 border rounded-md bg-gray-900 text-green-400 resize-y"
                    />
                  </div>
                ))}
              </div>
            </details>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-xs h-7"
              >
                <Save className="h-3 w-3 mr-1" />
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={closeForm}
                disabled={saving}
                className="text-xs h-7"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Problem cards ──────────────────────────────────── */}
        {visible.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">
            No problems yet — add one!
          </p>
        ) : (
          visible.map((problem) => (
            <div
              key={problem.id}
              onClick={() => onSelect(problem)}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all group
                ${selectedId === problem.id
                  ? "border-violet-500 bg-violet-50 shadow-sm"
                  : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                }`}
            >
              <div className="flex items-start justify-between gap-1">
                {/* Title + status icon */}
                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                  {solvedIds.has(problem.id) ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  )}
                  <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                    {problem.title}
                  </p>
                </div>

                {/* Edit / Delete buttons (visible on hover / selected) */}
                <div
                  className={`flex gap-1 shrink-0 transition-opacity
                    ${selectedId === problem.id
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                    }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-blue-500 hover:bg-blue-50"
                    onClick={() => openEdit(problem)}
                    title="Edit"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-red-500 hover:bg-red-50"
                    onClick={(e) => handleDelete(problem.id, e)}
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Badges: difficulty + language tags */}
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge className={`text-[10px] px-1.5 py-0 border ${DIFF_COLOR[problem.difficulty]}`}>
                  {problem.difficulty}
                </Badge>
                {problem.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 text-gray-500 border-gray-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
