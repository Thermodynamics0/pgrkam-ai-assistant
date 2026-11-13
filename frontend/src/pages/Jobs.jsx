import { useEffect, useState } from 'react'
import { getJobs } from '../services/api'
import { t } from '../i18n'
import JobCard from '../components/JobCard'
import { Loading, ErrorBox } from '../components/States'

const CATEGORIES = ['AI', 'Data', 'IT', 'Government']

export default function Jobs({ lang }) {
  const [filters, setFilters] = useState({ q: '', location: '', category: '' })
  const [jobs, setJobs] = useState([])
  const [state, setState] = useState('loading')

  async function load(f = filters) {
    setState('loading')
    try { setJobs(await getJobs(f)); setState('ok') } catch { setState('error') }
  }
  useEffect(() => { load() }, [])
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value })
  const field = 'rounded-lg border border-line bg-white px-3 py-2'

  return (
    <section className="mx-auto max-w-5xl py-6">
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
        {state === 'ok' && (jobs.length === 0 ? <p className="py-8 text-center text-ink/60">{t(lang, 'noJobs')}</p>
          : <div className="grid gap-4 md:grid-cols-2">{jobs.map((j) => <JobCard key={j.id} job={j} lang={lang} />)}</div>)}
      </div>
    </section>
  )
}
