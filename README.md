# PGRKAM AI Assistant

A React and Express employment assistant. The chat uses a backend AI provider and retrieves relevant jobs, courses, and (when a verified candidate JWT is available) a small selection of candidate profile fields from PostgreSQL.

## AI architecture

```text
React Chat page
  -> frontend/src/services/chat-api.js (VITE_API_URL, optional Bearer token, recent history)
  -> Express POST /api/chat (request validation, per-IP rate limit, optional JWT verification)
  -> chat controller
  -> chat-context service (bounded PostgreSQL job/course search and candidate context)
  -> AI service (Gemini or the team's external AI service)
  -> structured answer, database job/course records, sources, and grounding metadata
```

The Gemini provider calls Google's official [Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview) directly from the backend. It opts out of provider-side conversation storage and sends only the recent validated user/assistant turns, retrieved PGRKAM context, and trusted backend instructions. Requests use low thinking effort to reduce latency. The primary model is configured by `GEMINI_MODEL` (default `gemini-3.8-flash`); if Google reports that model temporarily unavailable or it exceeds its attempt timeout, the service retries once with `GEMINI_FALLBACK_MODEL` (default `gemini-3.5-flash-lite`). Check Google's [current model list](https://ai.google.dev/gemini-api/docs/models) and configure supported models for your account.

The `AI_PROVIDER` setting supports:

| Value | Behavior |
| --- | --- |
| `gemini` | Calls Google Gemini through its official Interactions API. This is the default. Requires `GEMINI_API_KEY`. |
| `external` | Calls the configured `AI_SERVICE_URL`, preserving the team's separate service option. The service must accept the existing `{ message, context }` request and return text in `reply`, `response`, or `message`. |

If `AI_PROVIDER` is omitted, the backend selects `external` when `AI_SERVICE_URL` is set; otherwise it selects Gemini.

## Configure environment variables

Copy the examples to local `.env` files and replace placeholders. Never commit `.env` files or put server credentials in frontend `VITE_*` variables.

### Backend: `server/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection used by Prisma. |
| `JWT_SECRET` | Yes for auth | Secret used to sign and verify login tokens. Set a private, high-entropy value; the application has no hardcoded fallback. |
| `AI_PROVIDER` | No | `gemini` or `external`; see selection behavior above. |
| `GEMINI_API_KEY` | For Gemini | Private Google Gemini API key. It is read only by the backend. |
| `GEMINI_MODEL` | No | Gemini model ID. Defaults to `gemini-3.8-flash`; change it to another supported text model if needed. |
| `GEMINI_FALLBACK_MODEL` | No | Model used when the primary reports temporary unavailability. Defaults to `gemini-3.5-flash-lite`; set it to a supported text model or the same value as the primary to disable fallback. |
| `GEMINI_ATTEMPT_TIMEOUT_MS` | No | Time allowed for each Gemini model attempt before trying the fallback; defaults to 25,000 milliseconds. `AI_TIMEOUT_MS` remains the total request limit. |
| `AI_SERVICE_URL` | For external | URL of the team's external AI service. |
| `AI_TIMEOUT_MS` | No | Total timeout for the provider request and any fallback attempt; defaults to 60,000 milliseconds. |
| `AI_CHAT_MAX_MESSAGE_CHARS` | No | Maximum current message length; defaults to 4,000. |
| `AI_CHAT_MAX_HISTORY_MESSAGES` | No | Maximum history messages; defaults to 20. |
| `AI_CHAT_MAX_HISTORY_MESSAGE_CHARS` | No | Maximum length of one history message; defaults to 4,000. |
| `AI_CHAT_MAX_HISTORY_TOTAL_CHARS` | No | Maximum total history size; defaults to 20,000. |
| `AI_CHAT_RATE_LIMIT_MAX` | No | Chat requests per client IP per window; defaults to 10. |
| `AI_CHAT_RATE_LIMIT_WINDOW_MS` | No | Rate-limit window in milliseconds; defaults to 60,000. |
| `PORT` | No | Express port; defaults to 5001. |
| `CORS_ORIGIN` | No | Comma-separated frontend origins; defaults to the local Vite origins. Set deployed frontend origin(s) in production. |
| `JOOBLE_API_KEY` | Optional live jobs | Backend-only key for the live jobs search provider. |
| `JOOBLE_API_URL` | Optional live jobs | Jooble API base URL; use `https://jooble.org/api`. |

To obtain a Gemini API key, use the API Keys page in [Google AI Studio](https://aistudio.google.com/app/apikey) and follow Google's [API key guidance](https://ai.google.dev/gemini-api/docs/api-key). Put the key in `server/.env` as `GEMINI_API_KEY=...`, restart the backend, and keep it out of browser code, frontend environment variables, logs, and source control.

### Frontend: `frontend/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend API base URL for deployment, including `/api`; leave empty during local Vite development to use the proxy. |
| `VITE_API_PROXY_TARGET` | Local backend origin for the Vite `/api` proxy; defaults to `http://localhost:5001`. |
| `VITE_USE_MOCK` | Defaults to `false`; set `true` only to preview clearly labeled fictional job/course records. Profile and chat still use the backend. |

Frontend `VITE_*` values are public build-time settings. Never put `GEMINI_API_KEY`, `JWT_SECRET`, database credentials, or other secrets there.

## Run locally

You need Node.js 22 or newer, PostgreSQL, and an initial database. Run these steps in separate terminals.

### 1. Configure and start the backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL, a private JWT_SECRET, and GEMINI_API_KEY.
npx prisma generate
npx prisma migrate deploy
npm run db:seed # optional: adds clearly labeled fictional demo jobs/courses
npm run dev
```

The API listens on `http://localhost:5001` by default. The AI uses actual database records when relevant jobs or courses exist. The schema does not establish whether a job is open, so the assistant does not claim current vacancy status from these records.
The Jobs page can also query Jooble live results when its backend key and URL are configured; provider errors are returned without exposing credentials or raw provider messages.

### 2. Start the frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). In local development `/api` is proxied to the backend. Authentication, jobs, courses, profile and chat use backend APIs. Public registration always creates a candidate account; employers/admins must be provisioned securely outside public signup. The optional seed command creates fictional records labeled `[DEMO]`; they are never real vacancies or course offers.

## Chat API

`POST /api/chat` supports anonymous chat. Send `Authorization: Bearer <token>` to personalize a candidate request. Only a verified JWT with candidate role is used; a body `userId` is ignored. The backend loads education, skills, location, and experience only, and does not send email or password data to the AI.

Example request with a follow-up turn:

```bash
curl http://localhost:5001/api/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Which skills should I learn next?",
    "language": "en",
    "history": [
      {"role":"user","content":"I know Python and SQL."},
      {"role":"assistant","content":"Are you interested in analytics?"}
    ]
  }'
```

Supported language codes are `en`, `hi`, and `pa` (English, Hindi, Punjabi). The UI labels and response-language instruction support all three. Conversation memory is held in the current chat UI session, sent as recent alternating user/assistant messages, and cleared by **New chat**. It is not stored in a conversation database and is cleared when that chat component is closed or reloaded.

Successful response shape:

```json
{
  "success": true,
  "data": {
    "reply": "The assistant's response text",
    "language": "en",
    "jobs": [],
    "courses": [],
    "sources": [],
    "grounding": { "dataFound": false, "jobCount": 0, "courseCount": 0, "message": "No relevant job or course records were found in the PGRKAM database." },
    "timestamp": "2026-11-14T08:12:00.000Z"
  }
}
```

`jobs`, `courses`, and `sources` are separate database results, not model-invented listings. Search results are bounded (up to six jobs and six courses). Course URLs are included only when a valid HTTP(S) URL is stored in the database. The AI is instructed to distinguish records from general career guidance, not invent jobs, salaries, eligibility, deadlines, or URLs, and to recommend checking official recruitment sources for time-sensitive details.

Common errors have `{ "success": false, "code": "...", "message": "..." }` and an appropriate HTTP status. Examples include invalid input (`400`), chat rate limiting (`429`), provider timeout (`504`), and provider/configuration failures (`502`/`503`). The default chat limit is 10 requests per IP per minute; it applies to chat only.

## Tests and checks

```bash
cd server
npm test

cd ../frontend
npm run build
```

The built-in Node test runner exercises provider behavior using mocked Gemini/external responses and tests the chat route over HTTP. It does not need a Gemini key, live Gemini connection, or live PostgreSQL database. The frontend currently has no React component test runner installed; the frontend build and chat API client are checked by the available integration tests.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `AI_CONFIGURATION_ERROR` / Gemini not configured | Confirm `GEMINI_API_KEY` is set in `server/.env` and restart the backend. |
| `AI_AUTHENTICATION_FAILED` | Check that the key is valid and permitted to call the Gemini API. Never put it in frontend env. |
| `AI_RATE_LIMITED` or `CHAT_RATE_LIMITED` | Wait for the configured limit window to reset; inspect `AI_CHAT_RATE_LIMIT_MAX` and `AI_CHAT_RATE_LIMIT_WINDOW_MS`. |
| `AI_TIMEOUT` or provider unavailable | Check provider connectivity, `AI_SERVICE_URL` if using the external provider, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, and the `AI_TIMEOUT_MS`/`GEMINI_ATTEMPT_TIMEOUT_MS` limits. |
| No matching jobs or courses | Confirm `DATABASE_URL`, apply the Prisma migration, and ensure the database has relevant records. The assistant can provide clearly labeled general advice when no records match. |
| JWT login/authentication unavailable | Set `JWT_SECRET` in the backend environment and restart. The application intentionally rejects tokens when this secret is missing. |
| Frontend cannot reach API | Confirm backend port and `VITE_API_PROXY_TARGET`; for deployment set `VITE_API_URL` to the backend `/api` base URL. |

## Other API endpoints

The backend also provides authentication, jobs, candidate profiles, courses, and recommendations:

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register`, `/api/auth/login` | Public |
| `GET` | `/api/jobs` | Public |
| `POST` | `/api/jobs` | Employer or admin JWT |
| `GET` | `/api/jobs/:id` | Public |
| `GET`, `PUT` | `/api/profile/me` | Candidate JWT; uses the verified identity |
| `GET`, `PUT` | `/api/profile/:id` | JWT required; owner only |
| `GET` | `/api/courses`, `/api/courses/:id` | Public |
| `POST` | `/api/courses` | Admin JWT |
| `POST` | `/api/recommendations` | JWT required |
| `GET` | `/api/recommendations/history` | JWT required |

See [the API reference](docs/API.md) for request and response contracts.

## Known limits

- The schema has no vacancy status, employer ownership, or expiry fields. The assistant cannot verify whether a real vacancy is open; records marked `[DEMO]` are fictional examples only.
- Search intent uses English keywords plus a small Hindi/Punjabi employment vocabulary and term mapping; less common wording may still need better coverage.
- Rate-limit counters are in process memory. They reset when the backend restarts and are not shared across multiple backend instances.
- Candidate registration and sign-in are available in the app. Privileged roles are not publicly self-assignable; employer/admin accounts need secure provisioning.
- Rate limiting is per process and should be replaced with a shared store before running multiple backend instances.
- No deployment target is configured in the repository. A live deployment needs a hosting target, database, environment secrets, allowed `CORS_ORIGIN`, and a frontend `VITE_API_URL` pointing to the backend.
