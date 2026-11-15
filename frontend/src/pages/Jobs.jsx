import { useEffect, useState } from 'react'
import { getJobs, getLiveJobs } from '../services/api'
import { t } from '../i18n'
import JobCard from '../components/JobCard'
import { Loading, ErrorBox } from '../components/States'

const CATEGORIES = ['AI', 'Data', 'IT', 'Government']

export default function Jobs({ lang }) {
  // ── Database jobs (existing) ───────────────────────────────────────────────
  const [filters, setFilters] = useState({ q: '', location: '', category: '' })
  const [jobs, setJobs] = useState([])
  const [state, setState] = useState('loading')

  async function load(f = filters) {
    setState('loading')
    try {
      const response = await getJobs(f)
      const jobsArray = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : Array.isArray(response?.jobs)
        ? response.jobs
        : []
      setJobs(jobsArray)
      setState('ok')
    } catch {
      setJobs([])
      setState('error')
    }
  }
  useEffect(() => { load() }, [])
  const jobList = Array.isArray(jobs) ? jobs : []
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value })
  const field = 'rounded-lg border border-line bg-white px-3 py-2'

  // ── Live jobs (Jooble) ────────────────────────────────────────────────────
  const [liveFilters, setLiveFilters] = useState({ keywords: '', location: '' })
  const [liveJobs, setLiveJobs] = useState([])
  const [liveState, setLiveState] = useState('idle') // idle | loading | ok | error

  async function loadLive(f = liveFilters) {
    setLiveState('loading')
    try {
      const response = await getLiveJobs(f)
      const arr = Array.isArray(response?.data) ? response.data : []
      setLiveJobs(arr)
      setLiveState('ok')
    } catch {
      setLiveJobs([])
      setLiveState('error')
    }
  }

  const setLive = (k) => (e) => setLiveFilters({ ...liveFilters, [k]: e.target.value })

  return (
    <section className="mx-auto max-w-5xl py-6 space-y-10">

      {/* ── Database Jobs ───────────────────────────────────────────────── */}
      <div>
        <form onSubmit={(e) => { e.preventDefault(); load() }} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <input className={field} placeholder={t(lang, 'search')} aria-label={t(lang, 'search')} value={filters.q} onChange={set('q')} />
          <input className={field} placeholder={t(lang, 'location')} aria-label={t(lang, 'location')} value={filters.location} onChange={set('location')} />
          <select className={field} aria-label={t(lang, 'category')} value={filters.category} onChange={set('category')}>
            <option value="">{t(lang, 'category')}: {t(lang, 'all')}</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button className="rounded-lg bg-pine px-5 py-2 font-medium text-white hover:bg-pine-dark">{t(lang, 'find')}</button>
        </form>
        <div className="mt-6">
          {state === 'loading' && <Loading text={t(lang, 'thinking')} />}
          {state === 'error' && <ErrorBox lang={lang} onRetry={() => load()} />}
          {state === 'ok' && (jobList.length === 0
            ? <p className="py-8 text-center text-ink/60">{t(lang, 'noJobs')}</p>
            : <div className="grid gap-4 md:grid-cols-2">{jobList.map((j) => <JobCard key={j.id} job={j} lang={lang} />)}</div>)}
        </div>
      </div>

      {/* ── Live Jobs (Jooble) ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-line bg-sky-50/40 p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t(lang, 'liveJobs')}</h2>
            <p className="mt-0.5 text-sm text-ink/60">{t(lang, 'liveJobsDesc')}</p>
          </div>
          <a
            href="https://www.pgrkam.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-pine px-3 py-1.5 text-sm font-medium text-pine hover:bg-pine/10"
          >
            {t(lang, 'pgrkamPortal')} ↗
          </a>
        </div>

        {/* Live search bar */}
        <form
          onSubmit={(e) => { e.preventDefault(); loadLive() }}
          className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]"
        >
          <input
            className={field}
            placeholder={t(lang, 'search')}
            aria-label={t(lang, 'search')}
            value={liveFilters.keywords}
            onChange={setLive('keywords')}
          />
          <input
            className={field}
            placeholder={t(lang, 'location')}
            aria-label={t(lang, 'location')}
            value={liveFilters.location}
            onChange={setLive('location')}
          />
          <button className="rounded-lg bg-pine px-5 py-2 font-medium text-white hover:bg-pine-dark">
            {t(lang, 'find')}
          </button>
        </form>

        {/* Results */}
        <div className="mt-5">
          {liveState === 'idle' && (
            <p className="py-6 text-center text-sm text-ink/50">
              {t(lang, 'liveJobsDesc')}
            </p>
          )}
          {liveState === 'loading' && <Loading text={t(lang, 'thinking')} />}
          {liveState === 'error' && <ErrorBox lang={lang} onRetry={() => loadLive()} />}
          {liveState === 'ok' && (
            liveJobs.length === 0
              ? <p className="py-6 text-center text-sm text-ink/60">{t(lang, 'noLiveJobs')}</p>
              : <div className="grid gap-4 md:grid-cols-2">
                  {liveJobs.map((job) => (
                    <div key={job.id} className="rounded-xl border border-line bg-white p-4 shadow-sm flex flex-col gap-2">
                      {/* Badge */}
                      <span className="inline-block self-start rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {t(lang, 'externalSource')}
                      </span>

                      <h3 className="font-semibold text-ink leading-snug">{job.title}</h3>

                      {job.company && (
                        <p className="text-sm text-ink/70">{job.company}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
                        {job.location && <span>📍 {job.location}</span>}
                        {job.employmentType && <span>🕐 {job.employmentType}</span>}
                        {job.updatedAt && (
                          <span>🗓 {new Date(job.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-sm text-ink/70 line-clamp-3">{job.description}</p>
                      )}

                      {job.sourceUrl && (
                        <a
                          href={job.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-auto inline-block rounded-lg bg-pine px-4 py-1.5 text-sm font-medium text-white hover:bg-pine-dark text-center"
                        >
                          {t(lang, 'applyNow')} ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-xs text-ink/40 text-center">
          ⚠️ {t(lang, 'liveJobsDisclaimer')}
        </p>
      </div>

    </section>
  )
}
