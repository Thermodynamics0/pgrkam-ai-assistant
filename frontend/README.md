# PGRKAM Employment Assistant — Frontend

React + Vite + Tailwind v4.

    npm install
    npm run dev        # http://localhost:5173

- `.env` -> `VITE_USE_MOCK=true` runs on sample data (no backend needed).
- Set `VITE_USE_MOCK=false` once the Express backend runs on port 5000 (Vite proxies `/api`).
- For deployment set `VITE_API_URL` to the deployed backend's `/api` URL.
- All API calls live in `src/services/api.js`; UI text in `src/i18n.js` (en/hi/pa).
