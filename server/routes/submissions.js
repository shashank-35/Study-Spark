/**
 * Submissions routes — proxy to Supabase for server-side insertion.
 *
 * POST /api/submissions  – store a new submission
 * GET  /api/submissions  – list submissions (query: user_id, problem_id, limit)
 *
 * The frontend also writes directly via supabaseClient for speed;
 * this backend route is available as an optional server-side path.
 */

import { createClient } from "@supabase/supabase-js";

// Prefer the service role key for server-side writes (bypasses RLS).
// Falls back to anon key if service key is not configured.
function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) in your .env file."
    );
  }

  return createClient(url, key);
}

export default function registerSubmissionsRoute(app) {
  // ── POST /api/submissions ────────────────────────────────────────────────
  app.post("/api/submissions", async (req, res) => {
    try {
      const { user_id, problem_id, language, code, output, status, execution_time } =
        req.body;

      if (!problem_id || !language || !code) {
        return res.status(400).json({
          error: '"problem_id", "language", and "code" are required.',
        });
      }

      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("coding_submissions")
        .insert([
          {
            user_id: user_id || "anonymous",
            problem_id,
            language,
            code,
            output: output ?? "",
            status: status ?? "unknown",
            execution_time: execution_time ?? null,
          },
        ])
        .select();

      if (error) throw error;

      return res.status(201).json({ submission: data?.[0], success: true });
    } catch (err) {
      console.error("[POST /api/submissions]", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/submissions ─────────────────────────────────────────────────
  app.get("/api/submissions", async (req, res) => {
    try {
      const { user_id, problem_id, limit = "10" } = req.query;

      const supabase = getSupabase();

      let query = supabase
        .from("coding_submissions")
        .select("*, coding_problems(title)")
        .order("created_at", { ascending: false })
        .limit(Math.min(Number(limit), 50)); // cap at 50

      if (user_id) query = query.eq("user_id", String(user_id));
      if (problem_id) query = query.eq("problem_id", String(problem_id));

      const { data, error } = await query;
      if (error) throw error;

      return res.json({ submissions: data ?? [] });
    } catch (err) {
      console.error("[GET /api/submissions]", err.message);
      return res.status(500).json({ error: err.message, submissions: [] });
    }
  });
}
