## Study Spark — Quick Actions

### Overview

Study Spark is a BCA-focused learning platform combining a React + TypeScript frontend and an Express backend. It provides an AI-powered chatbot (Google Gemini), file upload and parsing (PDF/DOC/DOCX/TXT), subject-based study material management, and Supabase for persistence and realtime syncing.

Key places in the codebase:

- Frontend entry and components: [src/main.tsx](src/main.tsx)
- Chatbot UI: [src/components/StudySparkChatbot.tsx](src/components/StudySparkChatbot.tsx)
- Admin panel and uploads: [src/components/AdminPanel.tsx](src/components/AdminPanel.tsx)
- Subject selection UI: [src/components/SubjectSelector.tsx](src/components/SubjectSelector.tsx)
- Backend (upload/chat endpoints): [server/index.js](server/index.js)
- Supabase client wrapper: [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts)

---

### Quick Actions (detailed)

This section collects the most common developer and admin tasks and tells you exactly where to run them and which files to inspect when something needs adjustment.

- **Install dependencies**: Installs both frontend and backend packages.

  ```bash
  npm install
  ```

- **Start both frontend and API (dev)**: Run both Vite and Express together. Use this during local development for end-to-end testing.

  ```bash
  npm run dev:all
  ```

  - What it runs: `vite` (frontend) + `node server/index.js` (backend). See the `dev:all` script in [package.json](package.json).

- **Start frontend only** (fast UI work):

  ```bash
  npm run dev
  ```

  - Open the app in the browser at the Vite dev URL (usually `http://localhost:5173`). See [src/main.tsx](src/main.tsx) and Vite config at [vite.config.ts](vite.config.ts).

- **Start backend (API) only**: Useful to test uploads or the Gemini integration independently.

  ```bash
  npm run api
  ```

  - Backend root: [server/index.js](server/index.js). Check upload handling (`/api/upload`), `/api/chat`, and integration with the Gemini client.

- **Build for production**:

  ```bash
  npm run build
  ```

  - Produces a production-ready frontend via Vite. If you need to test a packaged backend plus static site, serve the built files and run the API.

- **Run linter**:

  ```bash
  npm run lint
  ```

- **Upload study materials (Admin UI)**

  1. Open the app and sign in as an admin via the Clerk flow (see [src/lib/clerkAuth.ts](src/lib/clerkAuth.ts)).
  2. Go to Admin Panel → Materials (UI implemented in [src/components/AdminPanel.tsx](src/components/AdminPanel.tsx)).
  3. Select a subject and click **Choose PDF** (or DOC/DOCX/TXT). The frontend posts to `/api/upload` defined in [server/index.js](server/index.js).
  4. Uploaded files are stored (see Supabase configuration in [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts)).

  - Troubleshoot: If upload fails, verify the backend is running (`npm run api`) and check server logs for `multer` or filesystem errors in [server/index.js](server/index.js).

- **Chat with uploaded content (Chatbot)**

  1. Upload a file (see previous action).
  2. Open the chatbot in the UI (component: [src/components/StudySparkChatbot.tsx](src/components/StudySparkChatbot.tsx)).
  3. The frontend will call `/api/chat` to query the Gemini API with context extracted from uploaded files. Inspect the request/response flow in [server/index.js](server/index.js).

- **Inspect or modify parsing/extraction**

  - PDF parsing and file processing use `pdf-parse` and `multer` on the server. See file handling and extraction logic in [server/index.js](server/index.js) and any utilities in [src/lib/utils.ts](src/lib/utils.ts).

- **Manage subjects and materials**

  - The UI for subjects is in [src/components/SubjectSelector.tsx](src/components/SubjectSelector.tsx) and subject cards at [src/components/SubjectCard.tsx](src/components/SubjectCard.tsx).
  - Server endpoints: `GET /api/subjects` and `GET /api/subjects/:subject/files` in [server/index.js](server/index.js). Supabase table spec is described in `README.md` (see `study_materials` table).

### Quick Action — BCA Subject Section

This section is optimized for fast discovery of BCA materials and gives admins a single place to curate semester-wise content.

- **Core features**
  - Subject catalog fed by Supabase via [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts) and rendered through [src/components/SubjectSelector.tsx](src/components/SubjectSelector.tsx).
  - Rich subject cards from [src/components/SubjectCard.tsx](src/components/SubjectCard.tsx) show tags (semester, credits, difficulty) and quick stats ($n$ resources, last updated date) pulled from Supabase metadata.
  - Inline actions: `View Notes`, `Launch Quiz`, and `Open Coding Lab` buttons route to [src/components/StudyPlanner.tsx](src/components/StudyPlanner.tsx), [src/components/QuizGenerator.tsx](src/components/QuizGenerator.tsx), and [src/components/CodingLab.tsx](src/components/CodingLab.tsx) respectively for one-click transitions.
  - Admin overrides surface inside the same grid when Clerk identifies an admin session (see [src/components/AdminPanel.tsx](src/components/AdminPanel.tsx)), exposing `Upload` and `Edit syllabus` controls without leaving context.

- **UI/UX highlights**
  - Responsive masonry grid built with the card, badge, and progress primitives in [src/components/ui/card.tsx](src/components/ui/card.tsx), [src/components/ui/badge.tsx](src/components/ui/badge.tsx), and [src/components/ui/progress.tsx](src/components/ui/progress.tsx) so the catalog remains dense on desktop while collapsing into swipeable rows on mobile.
  - Color tokens defined in [src/App.css](src/App.css) keep semester colors consistent; semantic tokens ensure accessible contrast ($WCAG\,AA$) for text on colored badges.
  - Motion: the section uses staggered fade/scale reveals via `framer-motion` helpers embedded in [src/components/SubjectSelector.tsx](src/components/SubjectSelector.tsx) to communicate hierarchy without overwhelming the user.
  - Empty states and skeleton loaders from [src/components/ui/skeleton.tsx](src/components/ui/skeleton.tsx) prevent layout shift while data streams in.

- **Operational quick action**
  1. Launch the frontend (`npm run dev`) and navigate to `Subjects`.
  2. Pick a semester filter; confirm the Supabase query in [src/lib/codingLabService.ts](src/lib/codingLabService.ts) returns the expected resource count.
  3. Use the inline `Upload` button (admin-only) to add material; verify file visibility in the card stats.
  4. If styling needs tweaks, adjust the shared tokens in [src/App.css](src/App.css) or override per card in [src/components/SubjectCard.tsx](src/components/SubjectCard.tsx).

- **Supabase: local checks and realtime**

  - Connection: see [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts). Ensure `SUPABASE_URL` and `SUPABASE_KEY` environment variables are set in your `.env` or hosting platform.
  - Realtime: If realtime updates don't appear, confirm Realtime is enabled for `study_materials` in the Supabase dashboard and that client subscriptions are active in the code.

- **Common troubleshooting commands**

  ```bash
  # check node version
  node -v

  # run backend with nodemon (install nodemon globally or as dev dep)
  npx nodemon server/index.js

  # tail server logs (PowerShell)
  Get-Content -Path ./server/logs/server.log -Wait
  ```

---

### Quick admin checklist

- Ensure `SUPABASE_URL` and `SUPABASE_KEY` are configured.
- Confirm RLS/Policies in Supabase for `study_materials` match your environment (development vs production). See the SQL example in `README.md`.
- If Gemini API calls fail, verify API keys and network access and inspect [server/index.js](server/index.js) logs.

---

If you'd like, I can also:

- Add brief CLI helpers (npm script) for seeding test subjects and files.
- Create a short admin HOWTO in the Admin Panel UI.

File created: [docs/QUICK_ACTIONS.md](docs/QUICK_ACTIONS.md)

---

### Coding Lab (detailed)

The project includes an interactive in-app `Coding Lab` that lets students practice problems, run code (simulated), and track submissions. The main implementation is in `src/components/CodingPractice.tsx`.

Key features

- Problems list: Add, delete, and select problems. Default problems are seeded on first load.
- Code editor: Simple textarea with boilerplate code loaded per problem.
- Run (simulate): A `Run Code` action that simulates executing test cases and reports pass/fail for each test.
- Submit: A `Submit` action that simulates a full submission and records results in local submission history.
- Persistence: Problems and submission history persist in `localStorage` under `codingLab_problems` and `codingLab_history`.
- Languages supported: C, Java, Python, JavaScript (frontend labels only; execution is simulated).
- Test cases: Each problem includes test cases shown in the UI; runs iterate these when simulating execution.

How it works (implementation notes)

- The component is a self-contained React component using hooks and local state. See [src/components/CodingPractice.tsx](src/components/CodingPractice.tsx) for the full implementation.
- On first load, `loadDefaultProblems()` seeds example problems (sum, factorial, reverse string, prime check).
- `runCode()` simulates execution: it waits (~1.5s), randomly decides pass/fail per test (demo behavior), and prints a formatted `Output` block in the UI.
- `submitCode()` simulates a full submission: it records a `SubmissionHistory` object (id, problemId, code, language, timestamp, passed, testsPassed, totalTests) and updates problem `solved`/`attempts` if all tests passed.
- Copying code uses `navigator.clipboard.writeText()` and shows a simple alert for feedback.
- There is no backend execution sandbox by default — the execution is simulated client-side for demo purposes.

UX and controls

- Add Problem: Click the `+` button in the Problems panel to open the new-problem form.
- Select Problem: Click a problem card to load its description, boilerplate code, and test cases into the editor.
- Edit Code: Use the editor textarea to change or paste code.
- Run Code: Click `Run Code` to simulate test execution; view results in the `Output` card.
- Submit: Click `Submit` to record a submission to the history list and mark a problem solved if all tests pass.
- Recent Submissions: A `Recent Submissions` panel lists finalized submissions with basic metrics.

Limitations and recommended improvements

- Simulated execution: Currently, `runCode()` and `submitCode()` use randomness to simulate results. For real execution:
  - Add a backend sandbox service (Docker or a secure code-execution API) and an API endpoint like `/api/execute` that accepts code, language, and test cases and returns deterministic results.
  - Ensure strong isolation (containers, resource limits) and security checks to avoid code injection or denial-of-service.
- Editor experience: Replace the `textarea` with a real code editor like `Monaco Editor` or `CodeMirror` for syntax highlighting, language modes, and better UX.
- Test case editing: Add UI to add/edit/delete test cases per problem and to run single tests.
- Language-specific boilerplate: Provide clearer templates per language and sample input parsing helpers.
- Persist to backend: Optionally store problems and histories in Supabase (or your DB) to share problems across users and preserve performance data.

Files to inspect

- Implementation: [src/components/CodingPractice.tsx](src/components/CodingPractice.tsx)
- Reusable UI: `src/components/ui/*` for Card, Button, Badge, etc.

Quick dev commands (useful when working on the Coding Lab)

```bash
# start frontend for rapid editing
npm run dev

# run only the API if you add a backend executor
npm run api
```

---

Updated: Added `Coding Lab` details and implementation notes.
