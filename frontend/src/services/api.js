// Central API layer. Matches the contracts agreed with the backend/AI members.
import { mockJobs, mockCourses, mockProfile, mockChat } from './mock'
import { createChatApi } from './chat-api'

const BASE = import.meta.env.VITE_API_URL || '/api'
const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const CHAT_MOCK = import.meta.env.VITE_USE_CHAT_MOCK === 'true'
const wait = (v) => new Promise((r) => setTimeout(() => r(v), 400))
const chatApi = createChatApi({ baseUrl: BASE })

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

// POST /api/chat uses { success, data: { reply, language, jobs, courses, sources, timestamp } }.
export async function sendMessage(data) {
  if (!CHAT_MOCK) return chatApi.sendMessage(data)

  const result = await wait(mockChat(data))
  if (!result || typeof result.reply !== 'string' || !result.reply.trim()) {
    throw new Error('The sample assistant returned an empty response.')
  }
  return {
    reply: result.reply.trim(),
    language: data.language || 'en',
    jobs: Array.isArray(result.jobs) ? result.jobs : [],
    courses: Array.isArray(result.courses) ? result.courses : [],
    sources: Array.isArray(result.sources) ? result.sources : [],
    timestamp: new Date().toISOString(),
  }
}

// GET /api/jobs?location=&category=&q=  -> { success, jobs[] }
export async function getJobs(filters = {}) {
  if (MOCK) {
    const f = (s) => (s || '').toLowerCase()
    return wait(mockJobs.filter((j) => (!filters.location || f(j.location).includes(f(filters.location))) &&
      (!filters.category || j.category === filters.category) &&
      (!filters.q || f(j.title + j.description).includes(f(filters.q)))))
  }
  const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString()
  const data = await request(`/jobs${qs ? `?${qs}` : ''}`)
  return data.jobs ?? data
}

// POST /api/recommendations { userId } -> { jobs[] } (ranked)
export async function getRecommendations(userId) {
  if (MOCK) return wait(mockJobs.slice(0, 3))
  const data = await request('/recommendations', { method: 'POST', body: JSON.stringify({ userId }) })
  return data.jobs ?? data
}

// GET/PUT /api/profile/:id
export async function getProfile(id) {
  if (MOCK) return wait({ ...mockProfile })
  const data = await request(`/profile/${id}`)
  return data.profile ?? data
}
export const saveProfile = (id, profile) =>
  MOCK ? wait(profile) : request(`/profile/${id}`, { method: 'PUT', body: JSON.stringify(profile) })

// GET /api/courses -> { courses[] }
export async function getCourses() {
  if (MOCK) return wait(mockCourses)
  const data = await request('/courses')
  return data.courses ?? data
}
