const SESSION_TOKEN_KEY = 'token'
const MAX_HISTORY_MESSAGES = 20
const MAX_HISTORY_MESSAGE_CHARS = 4000
const MAX_HISTORY_TOTAL_CHARS = 20000
const MAX_CURRENT_MESSAGE_CHARS = 4000

export class ChatApiError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.name = 'ChatApiError'
    this.code = code
    this.status = status
  }
}

export function limitConversationHistory(history) {
  if (!Array.isArray(history)) return history

  const recent = history.slice(-MAX_HISTORY_MESSAGES).map((entry) => {
    if (!entry || typeof entry.content !== 'string') return entry
    const content = entry.content.trim()
    return {
      ...entry,
      content: content.length > MAX_HISTORY_MESSAGE_CHARS
        ? `${content.slice(0, MAX_HISTORY_MESSAGE_CHARS - 1)}…`
        : content,
    }
  })

  const totalChars = () => recent.reduce((total, entry) => total + (typeof entry?.content === 'string' ? entry.content.length : 0), 0)
  while (recent.length && totalChars() > MAX_HISTORY_TOTAL_CHARS) recent.shift()
  while (recent[0]?.role === 'assistant') recent.shift()
  while (recent[recent.length - 1]?.role === 'user') recent.pop()
  return recent
}

function readSessionToken() {
  try {
    return globalThis.localStorage?.getItem(SESSION_TOKEN_KEY)?.trim() || null
  } catch {
    return null
  }
}

export function createChatApi({ baseUrl = '/api', fetchImpl = globalThis.fetch, getToken = readSessionToken } = {}) {
  const apiBase = baseUrl.replace(/\/+$/, '')

  async function sendMessage({ message, language = 'en', history = [] } = {}) {
    if (typeof message !== 'string' || !message.trim()) {
      throw new ChatApiError('VALIDATION_ERROR', 'Please enter a message before sending.')
    }
    if (message.trim().length > MAX_CURRENT_MESSAGE_CHARS) {
      throw new ChatApiError('MESSAGE_TOO_LARGE', `Messages must be ${MAX_CURRENT_MESSAGE_CHARS} characters or fewer.`)
    }

    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    let response
    try {
      response = await fetchImpl(`${apiBase}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: message.trim(), language, history: limitConversationHistory(history) }),
      })
    } catch {
      throw new ChatApiError('NETWORK_ERROR', 'Could not reach the chat service. Check your connection and try again.')
    }

    let payload
    try {
      payload = await response.json()
    } catch {
      throw new ChatApiError('INVALID_RESPONSE', 'The chat service returned an invalid response.', response.status)
    }

    if (!response.ok || payload?.success !== true) {
      throw new ChatApiError(
        payload?.code || 'CHAT_REQUEST_FAILED',
        payload?.message || `Chat request failed (${response.status}).`,
        response.status,
      )
    }

    const data = payload.data
    if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
      throw new ChatApiError('EMPTY_AI_RESPONSE', 'The assistant returned an empty response. Please try again.', response.status)
    }

    return {
      reply: data.reply.trim(),
      language: typeof data.language === 'string' ? data.language : language,
      jobs: Array.isArray(data.jobs) ? data.jobs : [],
      courses: Array.isArray(data.courses) ? data.courses : [],
      sources: Array.isArray(data.sources) ? data.sources : [],
      timestamp: data.timestamp,
      grounding: data.grounding,
    }
  }

  return { sendMessage }
}
