import { useEffect, useState } from 'react'
import { getProfile, getRecommendations } from '../services/api'
import { t } from '../i18n'
import JobCard from '../components/JobCard'
import { Loading, ErrorBox } from '../components/States'

const asList = (v) => (Array.isArray(v) ? v : (v || '').split(',')).map((s) => s.trim()).filter(Boolean)

export default function Recommendations({ lang, userId, go }) {
  const [jobs, setJobs] = useState([])
  const [profile, setProfile] = useState(null)
  const [state, setState] = useState('loading')

  const load = async () => {
    setState('loading')
    try {
      const [p, j] = await Promise.all([getProfile(userId), getRecommendations(userId)])
      setProfile(p); setJobs(j); setState('ok')
    } catch { setState('error') }
  }
  useEffect(() => { load() }, [])

  if (state === 'loading') return <Loading text={t(lang, 'thinking')} />
  if (state === 'error') return <ErrorBox lang={lang} onRetry={load} />

  const tags = [profile?.education, ...asList(profile?.skills), profile?.preferred_location].filter(Boolean)
  const incomplete = !profile?.education && asList(profile?.skills).length === 0

  return (
    <section className="mx-auto max-w-5xl py-6">
      <h1 className="font-display text-2xl font-bold text-pine">{t(lang, 'recTitle')}</h1>
      <p className="mt-1 text-ink/70">{t(lang, 'recSub')}</p>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink/60">{t(lang, 'recBasedOn')}</span>
          {tags.map((tag) => <span key={tag} className="rounded bg-pine/10 px-2 py-0.5 text-pine">{tag}</span>)}
          <button onClick={() => go('profile')} className="underline">{t(lang, 'recEdit')}</button>
        </div>
      )}

      {incomplete && (
        <div className="mt-4 rounded-lg border border-marigold bg-marigold/10 p-4 text-sm">
          <p>{t(lang, 'recIncomplete')}</p>
          <button onClick={() => go('profile')} className="mt-2 rounded bg-pine px-3 py-1.5 font-medium text-white">{t(lang, 'profile')}</button>
        </div>
      )}

      <div className="mt-6">
        {jobs.length === 0 ? <p className="py-8 text-center text-ink/60">{t(lang, 'recEmpty')}</p> : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((j, i) => (
              <div key={j.id}>
                <p className="mb-1 text-sm font-medium text-pine">{i === 0 ? t(lang, 'recBest') : `#${i + 1}`}</p>
                <JobCard job={j} lang={lang} />
                {(j.reason || j.matchReason) && <p className="mt-1 text-sm text-ink/70">{j.reason || j.matchReason}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={load} className="mt-6 rounded-lg border border-pine px-4 py-2 font-medium text-pine">{t(lang, 'recRefresh')}</button>
    </section>
  )
}
