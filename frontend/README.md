# PGRKAM Employment Assistant — Frontend

React + Vite + Tailwind v4.

    npm install
    npm run dev        # http://localhost:5173

- `.env` -> `VITE_USE_MOCK=true` keeps the jobs, courses, and profile screens on sample data. Chat uses the real backend by default; set `VITE_USE_CHAT_MOCK=true` only to preview a sample conversation.
- The Vite development server proxies `/api` to `VITE_API_PROXY_TARGET` (defaults to `http://localhost:5001`, matching `server/.env.example`).
- For deployment set `VITE_API_URL` to the deployed backend's `/api` URL.
- All API calls live in `src/services/api.js`; UI text in `src/i18n.js` (en/hi/pa).
