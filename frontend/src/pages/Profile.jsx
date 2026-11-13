import { useEffect, useState } from 'react'
import { getProfile, saveProfile } from '../services/api'
import { t } from '../i18n'
import { Loading, ErrorBox } from '../components/States'

const FIELDS = [
  ['name', 'name'], ['education', 'education'], ['skills', 'skills'],
  ['experience', 'experience'], ['preferred_location', 'prefLocation'], ['preferred_job_type', 'prefType'],
]

export default function Profile({ lang, userId }) {
  const [p, setP] = useState(null)
  const [state, setState] = useState('loading')
  const [saved, setSaved] = useState(false)

  const load = async () => {
    setState('loading')
    try { setP(await getProfile(userId)); setState('ok') } catch { setState('error') }
  }
  useEffect(() => { load() }, [])

  async function submit(e) {
    e.preventDefault(); setSaved(false)
    try { await saveProfile(userId, p); setSaved(true) } catch { setState('error') }
  }

  if (state === 'loading') return <Loading text={t(lang, 'thinking')} />
  if (state === 'error') return <ErrorBox lang={lang} onRetry={load} />
  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 py-6">
      {FIELDS.map(([key, label]) => (
        <label key={key} className="block">
          <span className="mb-1 block text-sm font-medium">{t(lang, label)}</span>
          <input value={Array.isArray(p[key]) ? p[key].join(', ') : p[key] ?? ''} onChange={(e) => setP({ ...p, [key]: e.target.value })}
            className="w-full rounded-lg border border-line bg-white px-3 py-2" />
        </label>
      ))}
      <button className="rounded-lg bg-pine px-5 py-2.5 font-medium text-white hover:bg-pine-dark">{t(lang, 'saveProfile')}</button>
      {saved && <p role="status" className="text-sm text-pine">{t(lang, 'saved')}</p>}
    </form>
  )
}
