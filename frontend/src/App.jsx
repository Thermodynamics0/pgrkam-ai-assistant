import { useEffect, useState } from 'react'
import { LANGS, t } from './i18n'
import { getStoredUser, logout } from './services/api'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Jobs from './pages/Jobs'
import Profile from './pages/Profile'
import Courses from './pages/Courses'
import Login from './pages/Login'
import Recommendations from './pages/Recommendations'

// Nav items visible to everyone
const PUBLIC_NAV = ['home', 'chat', 'jobs', 'courses']
// Nav items only shown when logged in
const AUTH_NAV = ['recommendations', 'profile']

export default function App() {
  // Restore session from localStorage on first render (persist across page refresh).
  const [user, setUser] = useState(() => getStoredUser())
  const [page, setPage] = useState('home')
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || 'en' } catch { return 'en' }
  })
  const changeLang = (l) => {
    setLang(l)
    try { localStorage.setItem('lang', l) } catch { /* storage unavailable */ }
  }
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  useEffect(() => {
    const onSessionExpired = () => handleAuthError()
    globalThis.addEventListener?.('pgrkam:session-expired', onSessionExpired)
    return () => globalThis.removeEventListener?.('pgrkam:session-expired', onSessionExpired)
  }, [])
  const [pending, setPending] = useState('')
  // sessionExpired: shown when a protected API call returns 401
  const [sessionExpired, setSessionExpired] = useState(false)

  const NAV = user ? [...PUBLIC_NAV, ...AUTH_NAV] : [...PUBLIC_NAV, 'login']

  // Called by Login page on successful login/register
  function handleAuth(userData) {
    setUser(userData)
    setSessionExpired(false)
    setPage('home')
  }

  // Called by the logout button
  function handleLogout() {
    logout()
    setUser(null)
    setPage('home')
  }

  // Called by Profile/Recommendations when they receive a 401/403
  function handleAuthError() {
    logout()
    setUser(null)
    setSessionExpired(true)
    setPage('login')
  }

  const askChat = (msg) => { setPending(msg); setPage('chat') }

  // Guard: if a protected page is visited without login, redirect to login
  const effectivePage = (() => {
    if ((page === 'profile' || page === 'recommendations') && !user) return 'login'
    return page
  })()

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button onClick={() => setPage('home')} className="font-display text-lg font-bold text-pine">
            {t(lang, 'appName')}
          </button>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden text-sm text-ink/60 sm:inline">
                {t(lang, 'loggedInAs')} <strong>{user.name}</strong>
              </span>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink/70 hover:border-brick hover:text-brick"
              >
                {t(lang, 'logout')}
              </button>
            )}
            <select
              value={lang}
              onChange={(e) => changeLang(e.target.value)}
              aria-label="Language"
              className="rounded-lg border border-line bg-white px-2 py-1.5"
            >
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4" aria-label="Main">
          {NAV.map((n) => (
            <button key={n} onClick={() => setPage(n)} aria-current={effectivePage === n ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${effectivePage === n ? 'border-marigold text-pine' : 'border-transparent text-ink/70 hover:text-pine'}`}>
              {t(lang, n)}
            </button>
          ))}
        </nav>
      </header>

      {/* Session-expired banner */}
      {sessionExpired && (
        <div role="alert" className="bg-brick/10 px-4 py-2 text-center text-sm text-brick">
          {t(lang, 'sessionExpired')}
        </div>
      )}

      {import.meta.env.VITE_USE_MOCK === 'true' && (
        <div role="status" className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-950">
          Demo preview data is enabled. Sample jobs and courses are fictional.
        </div>
      )}

      <main className="px-4">
        {effectivePage === 'home' && <Home lang={lang} go={setPage} askChat={askChat} />}
        {effectivePage === 'chat' && <Chat lang={lang} initialMessage={pending} clearInitial={() => setPending('')} />}
        {effectivePage === 'jobs' && <Jobs lang={lang} />}
        {effectivePage === 'courses' && <Courses lang={lang} />}
        {effectivePage === 'login' && <Login lang={lang} onAuth={handleAuth} />}
        {effectivePage === 'recommendations' && user && (
          <Recommendations lang={lang} userId={user.id} go={setPage} onAuthError={handleAuthError} />
        )}
        {effectivePage === 'profile' && user && (
          <Profile lang={lang} userId={user.id} onAuthError={handleAuthError} />
        )}
      </main>
    </div>
  )
}
