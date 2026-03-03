/**
 * CodeEditor.tsx
 *
 * Monaco-based code editor with language selector, theme toggle,
 * and character / line counter.
 */

import { useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, RotateCcw } from "lucide-react";
import { type Language, BOILERPLATES } from "@/lib/codingLabService";

// ── Language options ───────────────────────────────────────────────────────
export const LANGUAGE_OPTIONS: { value: Language; label: string; monacoId: string }[] = [
  { value: "javascript", label: "JavaScript", monacoId: "javascript" },
  { value: "python",     label: "Python 3",   monacoId: "python"     },
  { value: "cpp",        label: "C++",        monacoId: "cpp"        },
  { value: "java",       label: "Java",       monacoId: "java"       },
];

// ── Badge colours per language ─────────────────────────────────────────────
export const LANG_COLOR: Record<Language, string> = {
  javascript: "bg-yellow-100 text-yellow-800 border-yellow-300",
  python:     "bg-blue-100 text-blue-800 border-blue-300",
  cpp:        "bg-purple-100 text-purple-800 border-purple-300",
  java:       "bg-orange-100 text-orange-800 border-orange-300",
};

// ── Props ──────────────────────────────────────────────────────────────────
interface CodeEditorProps {
  code: string;
  language: Language;
  onChange: (code: string) => void;
  onLanguageChange: (lang: Language) => void;
  /** Height of the Monaco editor area (default: 460px) */
  height?: number;
  /** If provided, the reset button restores this boilerplate */
  defaultCode?: string;
  readOnly?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CodeEditor({
  code,
  language,
  onChange,
  onLanguageChange,
  height = 460,
  defaultCode,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  // ── Language change: optionally auto-load boilerplate ──────────────────
  const handleLanguageChange = (newLang: string) => {
    const l = newLang as Language;
    onLanguageChange(l);

    // If the editor is empty or still contains the old boilerplate, replace it
    const allBoilers = Object.values(BOILERPLATES);
    if (!code.trim() || allBoilers.some((b) => b.trim() === code.trim())) {
      onChange(BOILERPLATES[l]);
    }
  };

  // ── Copy code to clipboard ─────────────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {
      // fallback for browsers without clipboard API permission
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
  };

  // ── Reset to default / boilerplate ────────────────────────────────────
  const handleReset = () => {
    onChange(defaultCode ?? BOILERPLATES[language]);
  };

  const monacoLang =
    LANGUAGE_OPTIONS.find((l) => l.value === language)?.monacoId ?? "javascript";

  const lineCount = code.split("\n").length;

  return (
    <div className="flex flex-col gap-2">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Language selector */}
        <Select value={language} onValueChange={handleLanguageChange} disabled={readOnly}>
          <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white hover:bg-gray-800 focus:ring-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            {LANGUAGE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-white focus:bg-gray-700 cursor-pointer"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stats + action buttons */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
            {lineCount} lines · {code.length} chars
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white"
            title="Copy code"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>

          {!readOnly && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white"
              title="Reset to boilerplate"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Monaco editor ────────────────────────────────────────── */}
      <div
        className="rounded-lg overflow-hidden border border-gray-700"
        style={{ height: `${height}px` }}
      >
        <Editor
          height={`${height}px`}
          language={monacoLang}
          value={code}
          theme="vs-dark"
          onChange={(val) => onChange(val ?? "")}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          options={{
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
            renderWhitespace: "boundary",
            bracketPairColorization: { enabled: true },
            suggest: { preview: true },
            readOnly,
            lineNumbers: "on",
            glyphMargin: false,
            folding: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
