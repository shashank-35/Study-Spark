/**
 * SubmissionList.tsx
 *
 * Right-panel component.
 * Displays recent submissions with status badges and realtime updates
 * streamed via Supabase postgres_changes.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi } from "lucide-react";
import {
  type CodingSubmission,
  type Language,
  type CodingProblem,
  getSubmissions,
  subscribeToSubmissions,
} from "@/lib/codingLabService";
import { LANG_COLOR } from "@/components/CodeEditor";

// ── Status badge config ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  accepted: { label: "Accepted",  bg: "bg-green-100  text-green-800  border-green-300"  },
  error:    { label: "Error",     bg: "bg-red-100    text-red-800    border-red-300"    },
  running:  { label: "Running…",  bg: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  unknown:  { label: "Unknown",   bg: "bg-gray-100   text-gray-600   border-gray-300"   },
};

// ── Props ──────────────────────────────────────────────────────────────────
interface SubmissionListProps {
  userId?: string;
  /** Filter by a selected problem */
  problemId?: string | null;
  /** Passed so we can show problem titles from cache without extra fetch */
  problems: CodingProblem[];
}

// ── Component ──────────────────────────────────────────────────────────────
export default function SubmissionList({
  userId,
  problemId,
  problems,
}: SubmissionListProps) {
  const [submissions, setSubmissions] = useState<CodingSubmission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [filterProblem, setFilterProblem]   = useState<string | null>(
    problemId ?? null
  );

  // Sync external filter changes
  useEffect(() => {
    setFilterProblem(problemId ?? null);
  }, [problemId]);

  // ── Fetch helper ──────────────────────────────────────────────────────
  const fetchSubmissions = async () => {
    setLoading(true);
    const data = await getSubmissions({
      userId,
      problemId: filterProblem ?? undefined,
      limit: 20,
    });
    setSubmissions(data);
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filterProblem]);

  // ── Realtime subscription ─────────────────────────────────────────────
  useEffect(() => {
    const channel = subscribeToSubmissions((newSub) => {
      // Prepend new submission from realtime channel
      setSubmissions((prev) => {
        // avoid duplicates
        if (prev.some((s) => s.id === newSub.id)) return prev;
        return [newSub, ...prev].slice(0, 20);
      });
    });

    channel.subscribe((status) => {
      setRealtimeActive(status === "SUBSCRIBED");
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // ── Helper: find problem title ────────────────────────────────────────
  const problemTitle = (sub: CodingSubmission) => {
    if (sub.coding_problems?.title) return sub.coding_problems.title;
    return problems.find((p) => p.id === sub.problem_id)?.title ?? "—";
  };

  // ── Rendered submissions (filtered client-side when toggled) ──────────
  const visible = filterProblem
    ? submissions.filter((s) => s.problem_id === filterProblem)
    : submissions;

  return (
    <Card className="h-full flex flex-col shadow-md border-gray-200">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="font-bold text-gray-800 flex items-center gap-2">
            📋 Recent Submissions
            {realtimeActive && (
              <span
                title="Realtime active"
                className="flex items-center gap-1 text-[10px] font-normal text-green-600 bg-green-50 border border-green-200 px-1.5 rounded-full"
              >
                <Wifi className="h-2.5 w-2.5" />
                live
              </span>
            )}
          </span>
          <Button
            size="icon"
            variant="ghost"
            onClick={fetchSubmissions}
            className="h-7 w-7 text-gray-500 hover:text-violet-600"
            title="Refresh submissions"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>

        {/* Problem filter chips */}
        <div className="flex gap-1.5 flex-wrap mt-1">
          <button
            onClick={() => setFilterProblem(null)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors
              ${filterProblem === null
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-gray-100 text-gray-600 border-gray-300 hover:border-violet-400"
              }`}
          >
            All
          </button>
          {problems.slice(0, 5).map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterProblem(p.id === filterProblem ? null : p.id)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors max-w-[120px] truncate
                ${filterProblem === p.id
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-gray-100 text-gray-600 border-gray-300 hover:border-violet-400"
                }`}
              title={p.title}
            >
              {p.title.length > 14 ? p.title.slice(0, 12) + "…" : p.title}
            </button>
          ))}
        </div>
      </CardHeader>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <CardContent className="flex-1 overflow-y-auto pb-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-violet-400" />
            <span className="ml-2 text-sm text-gray-400">Loading…</span>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">
            No submissions yet. Submit your first solution!
          </p>
        ) : (
          visible.map((sub) => {
            const statusCfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.unknown;
            return (
              <div
                key={sub.id}
                className="p-3 rounded-xl border border-gray-200 bg-white hover:border-violet-300 transition-colors space-y-1.5"
              >
                {/* Problem name + status */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800 truncate leading-tight flex-1">
                    {problemTitle(sub)}
                  </p>
                  <Badge className={`text-[10px] px-1.5 py-0 border shrink-0 ${statusCfg.bg}`}>
                    {statusCfg.label}
                  </Badge>
                </div>

                {/* Language + time */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 border ${LANG_COLOR[sub.language as Language] ?? ""}`}
                  >
                    {sub.language.toUpperCase()}
                  </Badge>

                  {sub.execution_time != null && (
                    <span className="text-[11px] text-gray-500">
                      ⚡ {sub.execution_time}s
                    </span>
                  )}

                  <span className="text-[11px] text-gray-400 ml-auto">
                    {new Date(sub.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Output snippet (truncated) */}
                {sub.output && (
                  <pre className="text-[11px] bg-gray-50 rounded p-1.5 font-mono text-gray-600 overflow-x-auto max-h-16 border border-gray-200">
                    {sub.output.slice(0, 200)}
                    {sub.output.length > 200 ? "…" : ""}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
