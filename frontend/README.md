# PGRKAM Employment Assistant: Frontend

React + Vite + Tailwind v4. Supports English, Hindi and Punjabi.

## Run

    npm install
    npm run dev        # http://localhost:5173

## Environment (`.env`, copy from `.env.example`)

| Variable | Meaning |
| --- | --- |
| `VITE_USE_MOCK` | `true` runs on built-in sample data, no backend needed |
| `VITE_API_URL` | Backend base URL for production, e.g. `https://api.example.com/api`. Leave empty in dev (Vite proxies `/api` to port 5000) |

## Pages

Home, Assistant (chat), Jobs, For you (recommendations), Courses, My profile.

## API contract (all calls live in `src/services/api.js`)

| Method | Endpoint | Request | Response used by the UI |
| --- | --- | --- | --- |
| POST | `/api/chat` | `{ userId, message, language }` | `{ reply, language, jobs[], sources[] }` |
| GET | `/api/jobs?q=&location=&category=` | n/a | `{ jobs[] }` or `jobs[]` |
| POST | `/api/recommendations` | `{ userId }` | `{ jobs[] }` or `jobs[]`, best match first; optional `reason` per job |
| GET / PUT | `/api/profile/:id` | profile fields | `{ profile }` or the profile |
| GET | `/api/courses` | n/a | `{ courses[] }` or `courses[]` |

Profile fields: `name, education, skills, experience, preferred_location, preferred_job_type`.
Job fields: `id, title, company, location, category, qualification, salary, description, url?`.
