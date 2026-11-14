import { useState } from 'react'
import { login, register } from '../services/api'
import { t } from '../i18n'

// POST /api/auth/login  → { success, token, data: { id, name, email, role } }
// POST /api/auth/register → { success, token, data: { id, name, email, role } }

export default function Login({ lang, onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [fields, setFields] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      let body
      if (mode === 'login') {
        body = await login({ email: fields.email, password: fields.password })
      } else {
        if (!fields.name.trim()) { setError(t(lang, 'registerError')); setBusy(false); return }
        body = await register({ name: fields.name, email: fields.email, password: fields.password })
      }
      // Both endpoints return { success, token, data: { id, name, email, role } }
      // The session is stored inside login()/register() — just pass the user up.
      if (body?.success && body?.data) {
        onAuth(body.data)
      } else {
        setError(mode === 'login' ? t(lang, 'loginError') : t(lang, 'registerError'))
      }
    } catch (err) {
      // 409 Conflict = email already registered; 401 = wrong credentials
      setError(mode === 'login' ? t(lang, 'loginError') : t(lang, 'registerError'))
    } finally {
      setBusy(false)
    }
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError('')
    setFields({ name: '', email: '', password: '' })
  }

  return (
    <section className="mx-auto max-w-sm py-16 px-4">
      <h1 className="font-display text-2xl font-bold text-pine mb-6">
        {mode === 'login' ? t(lang, 'loginTitle') : t(lang, 'registerTitle')}
      </h1>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === 'register' && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t(lang, 'nameLabel')}</span>
            <input
              type="text"
              value={fields.name}
              onChange={set('name')}
              required
              autoComplete="name"
              className="w-full rounded-lg border border-line bg-white px-3 py-2"
              placeholder="Your full name"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t(lang, 'emailLabel')}</span>
          <input
            type="email"
            value={fields.email}
            onChange={set('email')}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-line bg-white px-3 py-2"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">{t(lang, 'passwordLabel')}</span>
          <input
            type="password"
            value={fields.password}
            onChange={set('password')}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="w-full rounded-lg border border-line bg-white px-3 py-2"
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-lg bg-brick/10 px-3 py-2 text-sm text-brick">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-pine px-5 py-2.5 font-medium text-white hover:bg-pine-dark disabled:opacity-60"
        >
          {busy
            ? (mode === 'login' ? t(lang, 'loggingIn') : t(lang, 'registering'))
            : (mode === 'login' ? t(lang, 'loginBtn') : t(lang, 'registerBtn'))}
        </button>
      </form>

      <button
        onClick={switchMode}
        className="mt-4 w-full text-center text-sm text-ink/70 hover:text-pine underline-offset-2 hover:underline"
      >
        {mode === 'login' ? t(lang, 'switchToRegister') : t(lang, 'switchToLogin')}
      </button>
    </section>
  )
}
