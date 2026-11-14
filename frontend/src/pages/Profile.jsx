import { useEffect, useState } from 'react'
import { getProfile, saveProfile } from '../services/api'
import { t } from '../i18n'
import { Loading, ErrorBox } from '../components/States'

// Backend CandidateProfile fields: location, education, skills (string[]), experienceYears.
// The form exposes these using the keys below, plus a read-only name from the User object.
const FIELDS = [
  // [formKey, i18nKey, editable]
  ['name', 'name', false],
  ['education', 'education', true],
  ['skills', 'skills', true],          // shown/edited as comma-separated string
  ['experience', 'experience', true],  // maps to experienceYears on save
  ['preferred_location', 'prefLocation', true],
]

function buildFormState(user) {
  // user: { id, name, email, role, profile: { location, education, skills, experienceYears } | null }
  const p = user?.profile ?? {}
  return {
    name: user?.name ?? '',
    education: p.education ?? '',
    skills: Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills ?? ''),
    experience: String(p.experienceYears ?? ''),
    preferred_location: p.location ?? '',
  }
}

export default function Profile({ lang, userId }) {
  const [form, setForm] = useState(null)
  const [state, setState] = useState('loading')
  const [saved, setSaved] = useState(false)

  const load = async () => {
    setState('loading')
    try {
      const user = await getProfile(userId)
      setForm(buildFormState(user))
      setState('ok')
    } catch {
      setState('error')
    }
  }
  useEffect(() => { load() }, [])

  async function submit(e) {
    e.preventDefault()
    setSaved(false)
    try {
      await saveProfile(userId, form)
      setSaved(true)
    } catch {
      setState('error')
    }
  }

  if (state === 'loading') return <Loading text={t(lang, 'thinking')} />
  if (state === 'error') return <ErrorBox lang={lang} onRetry={load} />
  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 py-6">
      {FIELDS.map(([key, label, editable]) => (
        <label key={key} className="block">
          <span className="mb-1 block text-sm font-medium">{t(lang, label)}</span>
          <input
            value={form[key] ?? ''}
            readOnly={!editable}
            onChange={editable ? (e) => setForm({ ...form, [key]: e.target.value }) : undefined}
            className={`w-full rounded-lg border border-line bg-white px-3 py-2${!editable ? ' opacity-60 cursor-default' : ''}`}
          />
        </label>
      ))}
      <button className="rounded-lg bg-pine px-5 py-2.5 font-medium text-white hover:bg-pine-dark">{t(lang, 'saveProfile')}</button>
      {saved && <p role="status" className="text-sm text-pine">{t(lang, 'saved')}</p>}
    </form>
  )
}
