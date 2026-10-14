# LearnPath Study Planner

A local study workspace that turns YouTube playlists into learning tracks, lessons, practice resources, and project suggestions. A React/TypeScript course player sits on a FastAPI backend with SQLite persistence.

## Features

- Create learning tracks with prerequisites and daily study targets.
- Import playlists, organize lessons into units, and resume the last selected lesson.
- Mark videos and practice items complete; track section progress and study streaks.
- Browse transcripts, practice resources, and portfolio project suggestions.
- Use optional Gemini-assisted planning or a local heuristic fallback.
- Navigate a responsive course library with keyboard-accessible tabs and dialogs.

## Start locally

Use Python 3.14 and Node.js 22.12+ (Node 24 LTS is suitable).

```bash
git clone https://github.com/CodeAcc2007-dev/learnpath-study-planner.git
cd learnpath-study-planner
python -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
cd frontend
npm ci
cd ..
```

In one terminal:

```bash
source .venv/bin/activate
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another:

```bash
cd frontend
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. Vite proxies `/api` to the backend. A new local database is created automatically; the public repository contains no personal course database or credentials.

## Configuration

The application works without a Gemini key using heuristic grouping and default practice suggestions. For optional remote planning, set `GEMINI_API_KEY` and a model available to your account in `backend/.env`. Playlist metadata and transcript availability depend on YouTube. Existing data remains local; Gemini receives selected titles, description/transcript snippets when that optional feature is configured.

`LEARNPATH_DB_PATH` selects a different SQLite file. `LEARNPATH_API_TARGET` changes the frontend development proxy target. Keep the app on localhost: this release has no user authentication and is intended for personal local use.

## Verify

```bash
cd backend
GEMINI_API_KEY='' GOOGLE_API_KEY='' ../.venv/bin/python -m pytest tests -q
cd ../frontend
npm run lint
npm run build
```

The backend suite covers health, track/prerequisite behavior, streak logging, mocked playlist import, practice completion, and offline project suggestions. It does not establish current availability of YouTube extraction or Gemini. Production frontend build and lint are checked separately.

## Optional reading catalog

The PDF reader implementation is retained, but the personal course binding is disabled in the public configuration. Supplied book excerpts are not distributed. To attach your own authorized PDFs, place them under `frontend/public/course-resources/` and configure `frontend/src/data/ml-readings.json` with your course ID, topic URLs, and lesson mappings. Core course, lesson, and progress features do not require this catalog.

## Source and scope

`backend/app/` contains the API and planner; `frontend/src/` contains the interface. [Component provenance](docs/21st/README.md) records the adapted 21st.dev/Radix UI source. This repository packages the finished local application; hosting, authentication, and broader deployment remain future work.
