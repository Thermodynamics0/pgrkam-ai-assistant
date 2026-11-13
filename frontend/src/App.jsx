import { useState } from 'react'
import { LANGS, t } from './i18n'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Jobs from './pages/Jobs'
import Profile from './pages/Profile'
import Courses from './pages/Courses'

const NAV = ['home', 'chat', 'jobs', 'courses', 'profile']
const USER_ID = '101' // TODO: replace with real login/user id once the backend has auth

export default function App() {
  const [page, setPage] = useState('home')
  const [lang, setLang] = useState('en')
  const [pending, setPending] = useState('')

  const askChat = (msg) => { setPending(msg); setPage('chat') }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button onClick={() => setPage('home')} className="font-display text-lg font-bold text-pine">{t(lang, 'appName')}</button>
          <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language" className="rounded-lg border border-line bg-white px-2 py-1.5">
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4" aria-label="Main">
          {NAV.map((n) => (
            <button key={n} onClick={() => setPage(n)} aria-current={page === n ? 'page' : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${page === n ? 'border-marigold text-pine' : 'border-transparent text-ink/70 hover:text-pine'}`}>
              {t(lang, n)}
            </button>
          ))}
        </nav>
      </header>
      <main className="px-4">
        {page === 'home' && <Home lang={lang} go={setPage} askChat={askChat} />}
        {page === 'chat' && <Chat lang={lang} userId={USER_ID} initialMessage={pending} clearInitial={() => setPending('')} />}
        {page === 'jobs' && <Jobs lang={lang} />}
        {page === 'courses' && <Courses lang={lang} />}
        {page === 'profile' && <Profile lang={lang} userId={USER_ID} />}
      </main>
    </div>
  )
}
