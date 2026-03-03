# Admin Guide — Folder Structure & Admin Features

This document gives a concise view of the project's folder structure with focus on files relevant to administrators, and describes admin-side features, API endpoints, and common maintenance tasks.

## Quick folder overview

Root
- `package.json` — scripts and dependencies
- `README.md` — quick setup and usage
- `docs/` — documentation (this file)

Frontend
- `src/`
  - `components/` — React components; see `AdminPanel.tsx` for administration UI
  - `hooks/` — reusable hooks
  - `lib/` — local utilities such as `storage.ts` and `utils.ts`
  - `pages/` — routing entry points

Backend
- `server/`
  - `index.js` — main Express server and API routes
  - `uploads/` — uploaded files (PDF, TXT, DOC) stored on disk
  - `data/`
    - `files.json` — metadata for uploaded files (id, subject, path, extractedText)

Other
- `public/` — static assets
- `dist/` or build artifacts (after `npm run build`)

---

## Admin features (UI + server)

Admin area is exposed via `src/components/AdminPanel.tsx`. The admin features include:

1. View uploaded files
   - Lists all files in `server/data/files.json` with metadata (filename, subject, upload date, snippet).
   - Preview extracted text or download the original file from `server/uploads/`.

2. Delete/remove files
   - Remove a file entry from `files.json` and delete the corresponding file from `server/uploads/`.
   - Backend route (example): `DELETE /api/admin/files/:id` (if implemented). If not present, deletion may be performed by editing `server/data/files.json` directly.

3. Re-process a file
   - Trigger re-extraction of text for a chosen file (useful if parsing failed or you updated parsing rules).
   - Example endpoint (if implemented): `POST /api/admin/reprocess/:id` which extracts text again and updates `files.json`.

4. Clear all data (reset)
   - Remove all entries in `files.json` and delete files under `server/uploads/`.
   - Be careful: destructive action. Ensure backups exist.

5. Test Gemini integration
   - Admin UI may have a test area to send sample prompts to the Gemini API and view responses.
   - Useful for verifying API key and model compatibility.

6. View server logs / status
   - Health endpoint: `GET /api/health` (should return `{ status: 'ok' }`).
   - Optionally expose `GET /api/admin/logs` if you want to view recent server logs via the UI.

---

## Admin endpoints (common patterns)

If the project doesn't already expose admin endpoints, consider adding the following to `server/index.js` protected by basic auth or role-based checks:

- `GET /api/admin/files` — List all files and metadata
- `GET /api/admin/files/:id` — Get file metadata and extracted text
- `DELETE /api/admin/files/:id` — Delete file and metadata
- `POST /api/admin/reprocess/:id` — Re-run extraction for the file
- `POST /api/admin/clear` — Delete all files and reset `files.json`

Protect these endpoints using authentication (Clerk or another provider) or at least an admin token.

---

## Maintenance commands (PowerShell)

Kill servers on default ports and restart dev servers:

```powershell
cd 'c:\Users\SHASHANK\Desktop\spark-up-learning-main (1)\spark-up-learning-main'
npx kill-port 5173 8787 --silent; npm run dev:all
```

Install or update dependencies:

```powershell
npm install
npm audit fix
```

Backup data:

```powershell
# Copy server/data and server/uploads to a backup folder
$backup = "C:\backup\study-spark-$(Get-Date -Format yyyyMMddHHmmss)"
New-Item -Path $backup -ItemType Directory -Force
Copy-Item -Path server\data -Destination $backup -Recurse
Copy-Item -Path server\uploads -Destination $backup -Recurse
```

---

## Recommendations for admins

- Protect admin endpoints with authentication and don't expose the raw `files.json` for modification from the client.
- Rotate Gemini API keys regularly and store them securely (use environment variables or a secrets manager).
- Implement file size limits and validate file types client-side before upload.
- Implement role-based UI so normal users can't access admin features.

---

If you'd like, I can:
- Add the admin endpoints to `server/index.js` and wire them to `AdminPanel.tsx` with basic auth.
- Add a confirmation modal for destructive actions in `AdminPanel.tsx`.
- Create an automated backup script to snapshot `server/data` and `server/uploads`.

Tell me which one to implement next.