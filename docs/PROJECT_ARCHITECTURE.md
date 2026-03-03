# Study Spark — Project Architecture

This document describes the Study Spark project structure, how the frontend and backend interact, the main components and their responsibilities, data flows for uploading and processing files, API endpoints, environment variables, local development instructions, and troubleshooting tips.

## Table of contents

- Project overview
- Repository structure
- Frontend: key components and how they work
- Backend: server structure and endpoints
- Data flows
  - File upload flow (PDF/DOC/TXT)
  - Chat flow (Gemini AI)
- Environment variables and secrets
- Development: running and debugging
- Common issues & troubleshooting
- Next steps & suggested improvements

---

## Project overview

Study Spark is a React + TypeScript frontend with an Express backend. The app allows users to upload study materials (PDF, DOC, DOCX, TXT), extracts text from those files, generates study questions and embeddings, and provides a chatbot interface powered by Google Gemini for AI-assisted study and Q&A.

Frontend responsibilities
- UI and user interactions (file upload, chat widget, progress dashboard, subject selector)
- Calls backend API endpoints for upload, chat, and subject/files
- Displays AI responses and extracted questions

Backend responsibilities
- Receive file uploads and parse supported formats (pdf-parse, multer)
- Call Gemini API for chat generations and Q/A
- Maintain lightweight local data store under `server/data/files.json`
- Serve API endpoints under `/api` (upload, chat, subjects, health)

---

## Repository structure (top-level)

- `src/` — Frontend React + TypeScript source
  - `components/` — All React components (chatbot, uploader, dashboard, etc.)
  - `hooks/` — Reusable hooks
  - `lib/` — Utility helpers (storage, utils)
  - `pages/` — Route entry points
- `public/` — Static assets served by Vite
- `server/` — Express backend
  - `index.js` — Main server entry (API routes, file handling, Gemini integration)
  - `data/` — Simple JSON database (`files.json`) and uploaded files
- `package.json` — Scripts and dependencies
- `README.md` — Basic setup and usage

---

## Frontend — Key components and responsibilities

Files are under `src/components/`. Below are the most important components and what they do.

- `StudySparkChatbot.tsx`
  - Main chatbot UI and orchestrator for sending user messages and uploaded file context to the backend.
  - Opens a chat drawer/modal. Provides an "Upload Notes" button that triggers the upload flow.
  - Displays incremental AI responses and allows follow-ups.

- `QuizGenerator.tsx`
  - Takes uploaded text content (or content retrieved from the server) and displays auto-generated quiz questions and answers.
  - Supports manual generation or regenerate actions.

- `StudyPlanner.tsx`
  - Generates study plans based on user-selected subject and available content.
  - Uses heuristics or AI calls to propose scheduled study items.

- `ProgressDashboard.tsx`
  - Shows user progress metrics across subjects (derived from local storage or server data).

- `ProfileSection.tsx`, `AuthForm.tsx`, `ClerkAuthForm.tsx`
  - Authentication UI; integrates with Clerk via `@clerk/clerk-react` when enabled.

- `SubjectSelector.tsx`
  - UI control to select subjects; fetches subject list from `/api/subjects`.

- `EnhancedHeader.tsx`, `EnhancedFooter.tsx`
  - Layout and navigation pieces.

- `AdminPanel.tsx`
  - Admin-only UI for managing uploaded files, clearing data, or testing features.

- `ui/*`
  - A set of reusable UI primitives (buttons, dialogs, inputs) derived from shadcn/ui and Radix.

Shared utilities
- `src/lib/storage.ts` — LocalStorage helpers for caching selected subject, progress, and small traces.
- `src/lib/utils.ts` — Formatting helpers, text processing, and small client-side helpers.

---

## Backend — server/index.js (high level)

The backend is an Express server located at `server/index.js`. Key responsibilities:

- Serve REST API endpoints for file upload, chat, subjects, and health check.
- Use `multer` to accept uploads (stored under `server/uploads/`).
- Parse PDF files using `pdf-parse` and TXT files by streaming text. (DOC/DOCX may use another library or be converted server-side.)
- Integrate with Google Gemini API to create AI responses.
- Maintain a minimal JSON file (`server/data/files.json`) containing metadata about uploaded files and associated extracted text.

Typical route behaviors

- `GET /api/health`
  - Returns a simple JSON: { status: 'ok' }

- `GET /api/subjects`
  - Returns subject list (extracted from `files.json` or a static list).

- `GET /api/subjects/:subject/files`
  - Returns files for a subject including metadata and preview text.

- `POST /api/upload`
  - Accepts `multipart/form-data` (field `file`, `subject`), saves the file, extracts text, updates `files.json`, and returns processing metadata.

- `POST /api/chat`
  - Accepts messages and optional `fileIds` or `subject`, constructs a prompt including context (extracted text or question-answer pairs), calls the Gemini API, and returns streaming or final text response.

---

## Data flows

### File upload flow (user uploads PDF/DOC/TXT)

1. User in the frontend clicks "Upload Notes" and picks a file + selects a subject.
2. Frontend sends a `POST /api/upload` multipart request with the file and metadata.
3. Backend `multer` middleware saves the file under `server/uploads/`.
4. Backend extracts text using `pdf-parse` for PDFs or plain read for TXT files. (DOC/DOCX handling: either using a converter or skipping unsupported types.)
5. Backend updates `server/data/files.json` with metadata:
   - id, originalName, path, subject, uploadDate, extractedText snippet, tokenCount estimation
6. Backend optionally calls an internal generator to create suggested study questions from the text (or store the text for on-demand question generation).
7. Frontend polls or receives a response with the file metadata and shows a preview / available actions (Generate Quiz, Ask Chatbot, etc.).

### Chat flow (user asks a question)

1. Frontend sends `POST /api/chat` with message, selected subject, and optionally file IDs to include as context.
2. Backend composes a prompt by concatenating relevant extracted text (maybe trimmed to fit token budget) and the user message.
3. Backend calls Google Gemini API using the configured key and model.
4. Gemini returns a response. The backend relays that back to the frontend (supports streaming if implemented).
5. Frontend displays the AI response. If follow-ups occur, the conversation history is appended.

---

## Environment variables and secrets

The following environment variables are expected (set in the environment or `.env`):

- `GEMINI_API_KEY` — Google Gemini API key (required for chat features).
- `GEMINI_API_URL` — Optional override for Gemini API endpoint.
- `PORT` — Backend port (defaults to 8787)

Note: The project currently logs a Gemini API key in the console on startup. Keep your key secret and consider using server-side environment management.

---

## Development & running the app

Prerequisites
- Node.js v16+ (v18+ recommended)

Install dependencies

```powershell
cd <repo-root>
npm install
```

Run both servers (frontend + backend)

```powershell
npm run dev:all
```

Run frontend only

```powershell
npm run dev
```

Run backend only

```powershell
npm run api
```

Open the frontend at the Vite URL (terminal will show it; typically `http://localhost:8080/`). Backend API listens on `http://localhost:8787`.

---

## Common issues & troubleshooting

- Port conflicts: Kill existing processes on ports 5173/8080 (Vite) or 8787 (API) and retry.
- PDF parsing errors: `pdf-parse` may throw for malformed or encrypted PDFs. Validate files client-side first.
- Missing Gemini API key: Chat endpoints will fail without `GEMINI_API_KEY`. See `server/index.js` to configure.
- Large files: The upload limit may block very large files; check multer limits and adjust.
- CORS: If accessing the API from a different origin, enable CORS in `server/index.js`.

---

## Next steps & suggestions

- Add unit tests for backend parsing functions and API endpoints.
- Add integration tests for upload + chat flows (use a small PDF fixture and a mocked Gemini response).
- Move secrets to environment variables and remove logging of secrets.
- Add rate-limiting and authentication for API endpoints.
- Improve DOC/DOCX parsing by integrating `mammoth` or `officeparser`.

---

## Contact

If you want, I can:
- Generate a visual architecture diagram (Mermaid) and add it to this document.
- Add a small `docs/quick-start.md` with one-click commands for Windows PowerShell.
- Create tests for the backend upload endpoint.

Tell me which of these you'd like next.