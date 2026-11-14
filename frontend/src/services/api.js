// Central API layer. Matches the contracts agreed with the backend/AI members.
import { mockJobs, mockCourses, mockProfile, mockChat } from './mock'
import { createChatApi } from './chat-api'

const BASE = import.meta.env.VITE_API_URL || '/api'
const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const CHAT_MOCK = import.meta.env.VITE_USE_CHAT_MOCK === 'true'
const wait = (v) => new Promise((r) => setTimeout(() => r(v), 400))
const chatApi = createChatApi({ baseUrl: BASE })

// All backend responses use { success, data } or { success, count, data }.
// request() returns the raw parsed JSON body (fetch, not Axios — no auto-unwrap).
// Protected routes require an Authorization: Bearer <token> header; this helper
// reads the JWT stored by chat-api.js under the 'token' localStorage key.
function getToken() {
  try { return globalThis.localStorage?.getItem('token')?.trim() || null } catch { return null }
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
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

// GET /api/jobs?search=&location=&employmentType= -> { success, count, data: Job[] }
export async function getJobs(filters = {}) {
  if (MOCK) {
    const f = (s) => (s || '').toLowerCase()
    const filtered = mockJobs.filter((j) => (!filters.location || f(j.location).includes(f(filters.location))) &&
      (!filters.category || j.category === filters.category) &&
      (!filters.q || f(j.title + j.description).includes(f(filters.q))))
    return wait({ success: true, count: filtered.length, data: filtered })
  }
  const params = {}
  if (filters.q) params.search = filters.q
  if (filters.search) params.search = filters.search
  if (filters.location) params.location = filters.location
  if (filters.employmentType) params.employmentType = filters.employmentType
  const qs = new URLSearchParams(params).toString()
  return request(`/jobs${qs ? `?${qs}` : ''}`)
}

// POST /api/recommendations { userId } -> { success, count, data: [{job, score, reason}] }
// Auth required. Returns the scored items array; each item has { job, score, reason }.
export async function getRecommendations(userId) {
  if (MOCK) return wait(mockJobs.slice(0, 3).map((job) => ({ job, score: 1, reason: 'Mock recommendation' })))
  const data = await request('/recommendations', { method: 'POST', body: JSON.stringify({ userId }) })
  // Backend: { success, count, data: [{job, score, reason}] }
  return Array.isArray(data?.data) ? data.data : []
}

// GET /api/profile/:id -> { success, data: { id, name, email, role, profile: {...} } }
// Auth required. Returns the full user object including the nested CandidateProfile.
export async function getProfile(id) {
  if (MOCK) return wait({ ...mockProfile })
  const data = await request(`/profile/${id}`)
  // Backend returns { success, data: user } — return the user object directly.
  return data?.data ?? data
}

// PUT /api/profile/:id body: { location, education, skills: string[], experienceYears: number }
// Auth required. Maps the frontend form state to the backend's CandidateProfile fields.
// Frontend form fields: education, skills (comma string), experience, preferred_location.
// Backend accepts:      location, education, skills (string[]), experienceYears (number).
export async function saveProfile(id, formState) {
  if (MOCK) return wait(formState)
  const skillsRaw = formState.skills ?? formState.profile?.skills ?? ''
  const skills = typeof skillsRaw === 'string'
    ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : Array.isArray(skillsRaw) ? skillsRaw : []
  const body = {
    location: formState.preferred_location ?? formState.profile?.location ?? '',
    education: formState.education ?? formState.profile?.education ?? '',
    skills,
    experienceYears: parseInt(formState.experience ?? formState.profile?.experienceYears ?? 0, 10) || 0,
  }
  return request(`/profile/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

// GET /api/courses -> { success, count, data: Course[] }
export async function getCourses() {
  if (MOCK) return wait({ success: true, count: mockCourses.length, data: mockCourses })
  return request('/courses')
}
