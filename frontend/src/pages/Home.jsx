import { useState } from 'react'
import { t } from '../i18n'

export default function Home({ lang, go, askChat }) {
  const [q, setQ] = useState('')
  return (
    <section className="mx-auto max-w-3xl py-12 sm:py-20">
      <h1 className="font-display text-4xl font-bold leading-tight text-pine sm:text-5xl">{t(lang, 'heroTitle')}</h1>
      <p className="mt-4 max-w-xl text-lg text-ink/75">{t(lang, 'heroSub')}</p>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) askChat(q) }} className="mt-8 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, 'askPlaceholder')} aria-label={t(lang, 'ask')}
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-4 py-3" />
        <button className="rounded-lg bg-pine px-5 py-3 font-medium text-white hover:bg-pine-dark">{t(lang, 'ask')}</button>
      </form>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => go('recommendations')} className="rounded-lg bg-marigold px-4 py-2.5 font-medium text-ink hover:brightness-95">{t(lang, 'recommend')}</button>
        <button onClick={() => go('jobs')} className="rounded-lg border border-pine px-4 py-2.5 font-medium text-pine">{t(lang, 'jobs')}</button>
        <button onClick={() => go('courses')} className="rounded-lg border border-pine px-4 py-2.5 font-medium text-pine">{t(lang, 'courses')}</button>
      </div>
    </section>
  )
}
