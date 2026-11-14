const SESSION_TOKEN_KEY = 'token'

export class ChatApiError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.name = 'ChatApiError'
    this.code = code
    this.status = status
  }
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

  async function sendMessage({ message, language = 'en' } = {}) {
    if (typeof message !== 'string' || !message.trim()) {
      throw new ChatApiError('VALIDATION_ERROR', 'Please enter a message before sending.')
    }

    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    let response
    try {
      response = await fetchImpl(`${apiBase}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: message.trim(), language }),
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
