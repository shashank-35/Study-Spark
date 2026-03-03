/**
 * POST /api/execute
 *
 * Executes user code via the Judge0 API (RapidAPI hosted).
 * Set JUDGE0_API_KEY in your .env to enable real execution.
 * Without the key the route returns a clear configuration error.
 *
 * Supported languages:  javascript | python | cpp | java
 */

import fetch from "node-fetch";

// ── Judge0 language IDs ────────────────────────────────────────────────────
const LANGUAGE_IDS = {
  javascript: 63,  // Node.js 12.14.0
  python: 71,      // Python 3.8.1
  cpp: 54,         // C++ (GCC 9.2.0)
  java: 62,        // Java (OpenJDK 13.0.1)
};

const ALLOWED_LANGUAGES = Object.keys(LANGUAGE_IDS);
const MAX_CODE_SIZE = 10_000; // characters

// ── Helper: call Judge0 with base64 encoding off and wait=true ─────────────
async function callJudge0(language, code, stdin = "") {
  const JUDGE0_BASE =
    process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
  const rapidKey = process.env.JUDGE0_API_KEY;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (rapidKey) {
    // RapidAPI hosted Judge0
    headers["X-RapidAPI-Key"] = rapidKey;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  }

  const body = JSON.stringify({
    language_id: LANGUAGE_IDS[language],
    source_code: code,
    stdin: stdin || "",
  });

  // Use wait=true so we get the result in one round-trip
  const res = await fetch(
    `${JUDGE0_BASE}/submissions?base64_encoded=false&wait=true`,
    { method: "POST", headers, body }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Judge0 responded with ${res.status}: ${text}`);
  }

  return res.json();
}

// ── Route registration ────────────────────────────────────────────────────
export default function registerExecuteRoute(app) {
  /**
   * POST /api/execute
   * Body: { language: string, code: string, stdin?: string }
   */
  app.post("/api/execute", async (req, res) => {
    try {
      const { language, code, stdin } = req.body;

      // ── Validate inputs ────────────────────────────────────────────────
      if (!language || !code) {
        return res.status(400).json({
          error: '"language" and "code" are required.',
          output: "",
          status: "error",
        });
      }

      if (!ALLOWED_LANGUAGES.includes(language)) {
        return res.status(400).json({
          error: `Unsupported language "${language}". Allowed: ${ALLOWED_LANGUAGES.join(", ")}.`,
          output: "",
          status: "error",
        });
      }

      if (code.length > MAX_CODE_SIZE) {
        return res.status(400).json({
          error: `Code exceeds maximum size of ${MAX_CODE_SIZE} characters.`,
          output: "",
          status: "error",
        });
      }

      // ── Check API key ──────────────────────────────────────────────────
      if (!process.env.JUDGE0_API_KEY) {
        return res.status(503).json({
          error:
            "Code execution is not configured. Add JUDGE0_API_KEY to your .env file. " +
            "Get a free key at https://rapidapi.com/judge0-official/api/judge0-ce",
          output: "",
          status: "error",
        });
      }

      // ── Execute via Judge0 ─────────────────────────────────────────────
      const result = await callJudge0(language, code, stdin || "");

      /*
        Judge0 status IDs:
          1  – In Queue
          2  – Processing
          3  – Accepted   ✅
          4  – Wrong Answer
          5  – Time Limit Exceeded
          6  – Compilation Error
          7  – Runtime Error (SIGSEGV)
          8  – Runtime Error (SIGXFSZ)
          9  – Runtime Error (SIGFPE)
          10 – Runtime Error (SIGABRT)
          11 – Runtime Error (NZEC)
          12 – Runtime Error (Other)
          13 – Internal Error
          14 – Exec Format Error
      */
      const statusId = result.status?.id ?? 0;
      const accepted = statusId === 3;

      const output = (result.stdout ?? "").trim();
      const errorMsg = (
        result.stderr ||
        result.compile_output ||
        result.message ||
        ""
      ).trim();

      return res.json({
        output,
        error: errorMsg,
        status: accepted ? "accepted" : "error",
        statusDescription: result.status?.description ?? "Unknown",
        time: result.time,      // execution time in seconds
        memory: result.memory,  // memory in KB
      });
    } catch (err) {
      console.error("[/api/execute]", err.message);
      return res.status(500).json({
        output: "",
        error: err.message,
        status: "error",
      });
    }
  });
}
