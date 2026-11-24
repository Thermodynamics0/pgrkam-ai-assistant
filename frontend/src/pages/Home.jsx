import { useState } from 'react'
import { t } from '../i18n'

const quickLinks = [
  { key: 'jobs', title: 'browseJobs', description: 'browseJobsIntro', image: '/images/jobs-illustration.svg' },
  { key: 'courses', title: 'learnSkills', description: 'learnSkillsIntro', image: '/images/skills-illustration.svg' },
  { key: 'chat', title: 'talkAssistant', description: 'talkAssistantIntro', image: '/images/assistant-illustration.svg' },
]

export default function Home({ lang, go, askChat }) {
  const [q, setQ] = useState('')
  return (
    <section className="mx-auto max-w-5xl py-7 sm:py-12">
      <div className="hero-card relative isolate overflow-hidden rounded-[2rem] border border-line bg-white shadow-[0_24px_80px_-50px_rgba(74,24,69,.45)]">
        <div aria-hidden="true" className="hero-orb hero-orb-one" />
        <div aria-hidden="true" className="hero-orb hero-orb-two" />
        <div className="relative grid gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:px-14 lg:py-16">
          <div className="hero-enter">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ead1e0] bg-[#fff9fc] px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-pine">
              <span className="h-2 w-2 rounded-full bg-marigold" />{t(lang, 'homeEyebrow')}
            </p>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]">
              {t(lang, 'heroTitle')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink/70 sm:text-lg">{t(lang, 'heroSub')}</p>
            <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) askChat(q) }} className="mt-8 flex flex-col gap-2 rounded-2xl border border-line bg-white p-2 shadow-[0_12px_35px_-24px_rgba(42,18,48,.4)] sm:flex-row">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t(lang, 'askPlaceholder')} aria-label={t(lang, 'ask')}
                className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-ink outline-none placeholder:text-ink/45 focus-visible:ring-2 focus-visible:ring-marigold" />
              <button className="rounded-xl bg-pine px-5 py-3 font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-pine-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marigold">
                {t(lang, 'ask')} <span aria-hidden="true" className="ml-1">→</span>
              </button>
            </form>
            <p className="mt-3 text-xs text-ink/55">{t(lang, 'homeLanguageNote')}</p>
          </div>

          <aside className="hero-enter hero-enter-late relative mx-auto w-full max-w-sm rounded-[1.6rem] bg-gradient-to-br from-[#742050] via-[#8e1f5b] to-[#512048] p-6 text-white shadow-xl sm:p-8">
            <div aria-hidden="true" className="absolute right-5 top-5 grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/10 text-2xl">✦</div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-white/70">PGRKAM</p>
            <img src="/images/career-growth.svg" alt="" width="520" height="390" fetchPriority="high" className="mx-auto my-3 h-40 w-full max-w-[17rem] object-contain sm:h-44" />
            <h2 className="max-w-[15rem] font-display text-2xl font-bold leading-tight">{t(lang, 'homePanelTitle')}</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">{t(lang, 'homePanelSub')}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {['English', 'हिन्दी', 'ਪੰਜਾਬੀ'].map((language) => (
                <span key={language} className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium">{language}</span>
              ))}
            </div>
            <div aria-hidden="true" className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#f8bd58] to-[#fff0ca]" />
            </div>
          </aside>
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {quickLinks.map((item, index) => (
          <button key={item.key} onClick={() => go(item.key)} className="hero-enter quick-link-card rounded-2xl border border-line bg-white p-5 text-left transition duration-200 hover:-translate-y-1 hover:border-pine/30 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-marigold" style={{ animationDelay: `${180 + index * 90}ms` }}>
            <img src={item.image} alt="" width="120" height="96" loading="lazy" decoding="async" className="h-16 w-20 object-contain" />
            <span className="mt-4 block font-display text-lg font-bold text-ink">{t(lang, item.title)}</span>
            <span className="mt-1 block text-sm leading-6 text-ink/65">{t(lang, item.description)}</span>
            <span aria-hidden="true" className="mt-3 inline-block font-semibold text-pine">{t(lang, 'explore')} →</span>
          </button>
        ))}
      </div>
    </section>
  )
}
