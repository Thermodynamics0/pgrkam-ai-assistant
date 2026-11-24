import { useEffect, useState } from 'react'
import { getCourses } from '../services/api'
import { t } from '../i18n'
import { Loading, ErrorBox } from '../components/States'

export default function Courses({ lang }) {
  const [courses, setCourses] = useState([])
  const [state, setState] = useState('loading')

  const load = async () => {
    setState('loading')
    try {
      const response = await getCourses()
      // Backend: { success, count, data: Course[] }
      const arr = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : []
      setCourses(arr)
      setState('ok')
    } catch {
      setCourses([])
      setState('error')
    }
  }
  useEffect(() => { load() }, [])

  if (state === 'loading') return <Loading text={t(lang, 'thinking')} />
  if (state === 'error') return <ErrorBox lang={lang} onRetry={load} />
  if (state === 'ok' && courses.length === 0) {
    return <p className="py-8 text-center text-ink/60">{t(lang, 'noJobs')}</p>
  }
  return (
    <section className="mx-auto grid max-w-5xl gap-4 py-6 md:grid-cols-2">
      {courses.map((c) => (
        <article key={c.id} className="rounded-lg border border-line bg-white p-4">
          <h3 className="font-display text-lg font-semibold">{c.title}</h3>
          {(c.title?.startsWith('[DEMO]') || c.description?.startsWith('[DEMO]')) && <span className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">DEMO · fictional record</span>}
          {/* Course schema has no category field — show provider only */}
          <p className="text-sm text-ink/60">{c.provider}</p>
          {c.description && <p className="mt-2 text-sm">{c.description}</p>}
          {c.skills?.length > 0 && (
            <p className="mt-2 text-xs text-ink/60">{t(lang, 'skillsLabel')}: {c.skills.join(', ')}</p>
          )}
          {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-pine underline">{t(lang, 'openCourse')}</a>}
        </article>
      ))}
    </section>
  )
}
