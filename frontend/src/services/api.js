// Central API layer. Matches the contracts agreed with the backend/AI members.
import { mockJobs, mockCourses, mockProfile, mockChat } from './mock'
import { createChatApi } from './chat-api'

const BASE = import.meta.env.VITE_API_URL || '/api'
const MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const CHAT_MOCK = import.meta.env.VITE_USE_CHAT_MOCK === 'true'
const wait = (v) => new Promise((r) => setTimeout(() => r(v), 400))
const chatApi = createChatApi({ baseUrl: BASE })

// --- Token / session helpers ---
// Token is stored under 'token' key — same key used by chat-api.js (SESSION_TOKEN_KEY).
export const TOKEN_KEY = 'token'
export const USER_KEY = 'auth_user'

export function getToken() {
  try { return globalThis.localStorage?.getItem(TOKEN_KEY)?.trim() || null } catch { return null }
}

export function getStoredUser() {
  try {
    const raw = globalThis.localStorage?.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function storeSession(token, user) {
  try {
    globalThis.localStorage?.setItem(TOKEN_KEY, token)
    globalThis.localStorage?.setItem(USER_KEY, JSON.stringify(user))
  } catch { /* ignore in SSR/test */ }
}

export function clearSession() {
  try {
    globalThis.localStorage?.removeItem(TOKEN_KEY)
    globalThis.localStorage?.removeItem(USER_KEY)
  } catch { /* ignore */ }
}

// --- Shared request helper ---
// All backend responses use { success, data } or { success, count, data }.
// request() returns the raw parsed JSON body (fetch, not Axios — no auto-unwrap).
// Throws an AuthError on 401/403 so callers can redirect to login.
export class AuthError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (res.status === 401 || res.status === 403) {
    // Parse body for a backend error message if available
    let msg = 'Your session has expired. Please log in again.'
    try { const j = await res.json(); if (j?.message) msg = j.message } catch { /* ignore */ }
    throw new AuthError(msg, res.status)
  }
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

// requestRaw: like request() but never throws AuthError — used by login/register
// so a wrong-password 401 or duplicate-email 409 is returned as the parsed body,
// not as an exception, leaving error display to the caller.
async function requestRaw(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  const body = await res.json().catch(() => ({}))
  return body
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

// --- Authentication ---
// POST /api/auth/register { name, email, password, role? }
// -> { success, token, data: { id, name, email, role } }
// Auth endpoints use requestRaw so a 401/409 is returned as a body, not thrown.
export async function register({ name, email, password, role = 'CANDIDATE' }) {
  if (MOCK) {
    const user = { id: 1, name, email, role }
    storeSession('mock-token', user)
    return { success: true, token: 'mock-token', data: user }
  }
  const body = await requestRaw('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  })
  if (body.success && body.token && body.data) {
    storeSession(body.token, body.data)
  }
  return body
}

// POST /api/auth/login { email, password }
// -> { success, token, data: { id, name, email, role } }
export async function login({ email, password }) {
  if (MOCK) {
    const user = { id: 1, name: 'Test User', email, role: 'CANDIDATE' }
    storeSession('mock-token', user)
    return { success: true, token: 'mock-token', data: user }
  }
  const body = await requestRaw('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (body.success && body.token && body.data) {
    storeSession(body.token, body.data)
  }
  return body
}

// Logout: clears local session. No backend call needed (JWT is stateless).
export function logout() {
  clearSession()
}
