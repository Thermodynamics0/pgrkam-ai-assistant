import { t } from '../i18n'

export default function JobCard({ job, lang }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-snug">{job.title}</h3>
          <p className="text-sm text-ink/70">{job.company}</p>
        </div>
        {job.category && <span className="shrink-0 rounded bg-marigold/20 px-2 py-0.5 text-xs font-medium">{job.category}</span>}
      </div>
      {job.description && <p className="mt-2 text-sm text-ink/80">{job.description}</p>}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {job.location && <><dt className="text-ink/60">{t(lang, 'location')}</dt><dd>{job.location}</dd></>}
        {job.qualification && <><dt className="text-ink/60">{t(lang, 'qualification')}</dt><dd>{job.qualification}</dd></>}
        {job.salary && <><dt className="text-ink/60">{t(lang, 'salary')}</dt><dd>{job.salary}</dd></>}
      </dl>
    </article>
  )
}
