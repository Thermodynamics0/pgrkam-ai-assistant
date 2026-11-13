import { useEffect, useState } from 'react'
import { getCourses } from '../services/api'
import { t } from '../i18n'
import { Loading, ErrorBox } from '../components/States'

export default function Courses({ lang }) {
  const [courses, setCourses] = useState([])
  const [state, setState] = useState('loading')
  const load = async () => {
    setState('loading')
    try { setCourses(await getCourses()); setState('ok') } catch { setState('error') }
  }
  useEffect(() => { load() }, [])

  if (state === 'loading') return <Loading text={t(lang, 'thinking')} />
  if (state === 'error') return <ErrorBox lang={lang} onRetry={load} />
  return (
    <section className="mx-auto grid max-w-5xl gap-4 py-6 md:grid-cols-2">
      {courses.map((c) => (
        <article key={c.id} className="rounded-lg border border-line bg-white p-4">
          <h3 className="font-display text-lg font-semibold">{c.title}</h3>
          <p className="text-sm text-ink/60">{c.provider} · {c.category}</p>
          <p className="mt-2 text-sm">{c.description}</p>
          {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-pine underline">{t(lang, 'openCourse')}</a>}
        </article>
      ))}
    </section>
  )
}
