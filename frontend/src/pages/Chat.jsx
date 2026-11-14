import { useEffect, useRef, useState } from 'react'
import { sendMessage } from '../services/api'
import { t, LANGS } from '../i18n'
import JobCard from '../components/JobCard'

export default function Chat({ lang, initialMessage, clearInitial }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [listening, setListening] = useState(false)
  const endRef = useRef(null)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition

  async function send(text) {
    const message = text.trim()
    if (!message || loading) return
    setMessages((m) => [...m, { role: 'user', text: message }])
    setInput(''); setError(false); setLoading(true)
    try {
      const res = await sendMessage({ message, language: lang })
      setMessages((m) => [...m, {
        role: 'bot', text: res.reply, jobs: res.jobs || [], courses: res.courses || [],
        sources: res.sources || [], grounding: res.grounding,
      }])
    } catch { setError(true) }
    setLoading(false)
  }

  useEffect(() => { if (initialMessage) { send(initialMessage); clearInitial() } }, [initialMessage])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  function listen() {
    const rec = new SR()
    rec.lang = LANGS.find((l) => l.code === lang).speech
    rec.onresult = (e) => setInput(e.results[0][0].transcript)
    rec.onend = () => setListening(false)
    setListening(true); rec.start()
  }

  return (
    <section className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto py-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="space-y-2">
            {t(lang, 'suggestions').map((s) => (
              <button key={s} onClick={() => send(s)} className="block w-full rounded-lg border border-line bg-white px-4 py-3 text-left hover:border-pine">{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={m.role === 'user' ? 'max-w-[85%] rounded-lg bg-pine px-4 py-2.5 text-white' : 'w-full space-y-3'}>
              <p className={m.role === 'bot' ? 'max-w-[85%] rounded-lg border border-line bg-white px-4 py-2.5' : ''}>{m.text}</p>
              {m.jobs?.length > 0 && <div className="grid gap-3 sm:grid-cols-2">{m.jobs.map((j) => <JobCard key={j.id} job={j} lang={lang} />)}</div>}
              {m.courses?.length > 0 && (
                <section className="space-y-2" aria-label={t(lang, 'relevantCourses')}>
                  <h3 className="text-sm font-semibold">{t(lang, 'relevantCourses')}</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {m.courses.map((course) => (
                      <article key={course.id} className="rounded-lg border border-line bg-white p-4">
                        <h4 className="font-semibold">{course.title}</h4>
                        <p className="text-sm text-ink/70">{course.provider}</p>
                        {course.description && <p className="mt-2 text-sm">{course.description}</p>}
                        {course.skills?.length > 0 && <p className="mt-2 text-xs text-ink/70">{t(lang, 'skillsLabel')}: {course.skills.join(', ')}</p>}
                        {course.url && <a href={course.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm underline">{t(lang, 'openCourse')}</a>}
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {m.grounding && !m.grounding.dataFound && (
                <p className="text-xs text-ink/60">{t(lang, 'noChatMatches')}</p>
              )}
              {m.sources?.length > 0 && (
                <p className="text-xs text-ink/60">{t(lang, 'sources')}: {m.sources.map((s, k) => (
                  /^https?:/.test(s) ? <a key={k} href={s} target="_blank" rel="noreferrer" className="underline">{s}</a> : <span key={k}>{s}{k < m.sources.length - 1 ? ', ' : ''}</span>
                ))}</p>
              )}
            </div>
          </div>
        ))}
        {loading && <p role="status" className="text-sm text-ink/60">{t(lang, 'thinking')}</p>}
        {error && <p role="alert" className="text-sm text-brick">{t(lang, 'loadError')}</p>}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t border-line pt-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder={t(lang, 'typeMessage')} aria-label={t(lang, 'typeMessage')}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-4 py-2.5" />
        {SR && <button onClick={listen} disabled={listening} className="rounded-lg border border-line bg-white px-3">{listening ? '…' : t(lang, 'speak')}</button>}
        <button onClick={() => send(input)} disabled={loading} className="rounded-lg bg-pine px-5 py-2.5 font-medium text-white hover:bg-pine-dark disabled:opacity-50">{t(lang, 'send')}</button>
      </div>
    </section>
  )
}
