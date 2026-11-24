# PGRKAM Employment Assistant: Frontend

React, Vite and Tailwind frontend with English, Hindi and Punjabi interfaces.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The Vite development server proxies `/api` to the backend at `http://localhost:5001` by default. Start the backend separately; see the root README for PostgreSQL, Gemini and backend setup.

## Configuration

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Public backend API base URL including `/api`; leave blank in development to use the proxy. |
| `VITE_API_PROXY_TARGET` | Local backend origin used by Vite's `/api` proxy. |
| `VITE_USE_MOCK` | Defaults to `false`; when enabled, labeled fictional job/course preview data is used. |

All `VITE_*` values are public. Never put Gemini keys, JWT secrets, or database credentials in the frontend environment.

The chat always uses the real backend endpoint; there is no mock successful AI response. Anonymous chat is available. If a valid session token exists, the frontend sends it as a Bearer token and the backend uses its verified identity for personalization.

The website includes Home, Assistant, Jobs (database and optional Jooble live results), Courses, Recommendations, Profile, Login and Registration pages. Candidate registration cannot assign privileged roles.
