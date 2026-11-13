import { t } from '../i18n'

export const Loading = ({ text }) => (
  <p role="status" className="py-8 text-center text-ink/60">{text}</p>
)
export const ErrorBox = ({ lang, onRetry }) => (
  <div role="alert" className="rounded-lg border border-brick/40 bg-brick/5 p-4 text-sm">
    <p className="text-brick">{t(lang, 'loadError')}</p>
    {onRetry && <button onClick={onRetry} className="mt-2 rounded bg-brick px-3 py-1.5 text-white">{t(lang, 'retry')}</button>}
  </div>
)
