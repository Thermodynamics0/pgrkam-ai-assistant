import { useState } from 'react'
import { t } from '../i18n'

const PORTAL = 'https://www.pgrkam.com' // fallback when a job has no direct link

export default function JobCard({ job, lang }) {
  const [open, setOpen] = useState(false)
  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-snug">{job.title}</h3>
          <p className="text-sm text-ink/70">{job.company}</p>
        </div>
        {job.category && <span className="shrink-0 rounded bg-marigold/20 px-2 py-0.5 text-xs font-medium">{job.category}</span>}
      </div>
      {job.description && <p className={`mt-2 text-sm text-ink/80 ${open ? '' : 'line-clamp-2'}`}>{job.description}</p>}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {job.location && <><dt className="text-ink/60">{t(lang, 'location')}</dt><dd>{job.location}</dd></>}
        {job.employmentType && <><dt className="text-ink/60">{t(lang, 'employmentType')}</dt><dd>{job.employmentType}</dd></>}
        {job.qualification && <><dt className="text-ink/60">{t(lang, 'qualification')}</dt><dd>{job.qualification}</dd></>}
        {job.salary && <><dt className="text-ink/60">{t(lang, 'salary')}</dt><dd>{job.salary}</dd></>}
      </dl>
      <div className="mt-3 flex items-center gap-4 text-sm">
        <button onClick={() => setOpen(!open)} aria-expanded={open} className="font-medium text-pine underline">
          {t(lang, open ? 'hideDetails' : 'showDetails')}
        </button>
        {open && (
          <a href={job.url || PORTAL} target="_blank" rel="noreferrer" className="rounded bg-pine px-3 py-1 font-medium text-white">
            {t(lang, 'applyOnPortal')}
          </a>
        )}
      </div>
    </article>
  )
}
