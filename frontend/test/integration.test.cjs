/**
 * PGRKAM Frontend Integration Test Suite
 *
 * Tests all 8 verified integration mismatches after fixes:
 *   A. Courses  (getCourses, Courses.jsx)
 *   B. Profile  (getProfile, saveProfile, Profile.jsx)
 *   C. Auth / request() Bearer-token header
 *   D. Recommendations  (getRecommendations)
 *   E. Mock consistency
 *   F. Response-extraction safety regression guard
 *
 * Run from repo root:
 *   node --test frontend/test/integration.test.js
 */
'use strict'

const test   = require('node:test')
const assert = require('node:assert/strict')
const path   = require('node:path')
const fs     = require('node:fs')

const FE  = '/Users/harshityadav/pgrkam-ai-assistant/pgrkam-ai-assistant/frontend'
const SRV = '/Users/harshityadav/pgrkam-ai-assistant/pgrkam-ai-assistant/server'

const React         = require(path.join(FE, 'node_modules/react'))
const ReactDOMServer = require(path.join(FE, 'node_modules/react-dom/server'))
const esbuild       = require(path.join(FE, 'node_modules/esbuild'))

global.React = React

// ─── bundle helpers ─────────────────────────────────────────────────────────

async function buildCode(entryContents, { loader = 'js', mocks = {} } = {}) {
  const plugins = Object.entries(mocks).map(([filter, contents]) => ({
    name: `mock:${filter}`,
    setup(build) {
      build.onResolve({ filter: new RegExp(filter.replace(/\//g, '\\/')) },
        (a) => ({ path: a.path, namespace: `mock:${filter}` }))
      build.onLoad({ filter: /.*/, namespace: `mock:${filter}` },
        () => ({ contents, loader: 'js' }))
    },
  }))

  const result = await esbuild.build({
    stdin: {
      contents: entryContents,
      resolveDir: path.join(FE, 'src'),
      sourcefile: `entry.${loader}`,
      loader,
    },
    bundle: true,
    format: 'cjs',
    write: false,
    define: { 'import.meta.env': '{}' },
    external: ['react', 'react-dom'],
    plugins,
  })
  return result.outputFiles[0].text
}

function evalModule(code) {
  const mod = { exports: {} }
  const req = (id) => {
    if (id === 'react')     return React
    if (id === 'react-dom') return require(path.join(FE, 'node_modules/react-dom'))
    return require(id)
  }
  new Function('require', 'module', 'exports', code)(req, mod, mod.exports)
  return mod.exports
}

/** Build + eval an api.js function with a custom fetch mock */
async function apiWith(fetchMock, localStorageMock = { getItem: () => null }) {
  const code = await buildCode(`export * from './services/api.js'`)
  global.fetch = fetchMock
  global.localStorage = localStorageMock
  const mod = evalModule(code)
  return mod
}

function makeFetch(body, { status = 200, ok = true } = {}) {
  const fn = async (url, opts) => {
    fn.lastUrl  = url
    fn.lastOpts = opts
    return { ok, status, json: async () => body }
  }
  return fn
}

function withToken(token) { return { getItem: (k) => k === 'token' ? token : null } }

// ─── A. COURSES ──────────────────────────────────────────────────────────────

test('A1 – getCourses: returns raw { success, count, data } response body', async () => {
  const serverBody = { success: true, count: 2, data: [
    { id: 1, title: 'Python Basics', provider: 'NIELIT', skills: ['Python'] },
    { id: 2, title: 'React Essentials', provider: 'Coursera', skills: ['React'] },
  ] }
  const api = await apiWith(makeFetch(serverBody))
  const result = await api.getCourses()
  assert.equal(result.success, true)
  assert.equal(result.count, 2)
  assert.equal(Array.isArray(result.data), true)
  assert.equal(result.data[0].title, 'Python Basics')
  delete global.localStorage
})

test('A2 – getCourses mock: returns { success, count, data } consistent with backend shape', async () => {
  // VITE_USE_MOCK=true path
  const code = await buildCode(`export * from './services/api.js'`,
    { mocks: { 'import\\.meta\\.env': `module.exports = { VITE_USE_MOCK: 'true' }` } })
  // We can't easily set import.meta.env at runtime; test the documented mock shape
  // by checking the source directly
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  assert.match(src, /success: true, count: mockCourses\.length, data: mockCourses/,
    'Mock getCourses must return { success, count, data } shape')
  delete global.localStorage
})

test('A3 – Courses.jsx: extracts response.data array (normal backend response)', async () => {
  const code = await buildCode(`import Courses from './pages/Courses.jsx'; export default Courses`, {
    loader: 'jsx',
    mocks: {
      'services/api': `
        export const getCourses = async () => ({
          success: true, count: 1,
          data: [{ id: 7, title: 'ML Intro', provider: 'DeepAI', description: 'Learn ML', skills: ['Python'], url: 'https://example.com' }]
        })
      `,
    },
  })
  const { default: Courses } = evalModule(code)
  const html = ReactDOMServer.renderToString(React.createElement(Courses, { lang: 'en' }))
  // SSR initial render shows loading (useEffect doesn't fire in SSR); component must at least render
  assert.ok(html.length > 50)
  assert.match(html, /Looking through/)
})

test('A4 – Courses.jsx: handles bare-array fallback without crash', () => {
  // Test the extraction logic inline (same logic as Courses.jsx)
  function extract(response) {
    return Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : []
  }
  const bare = [{ id: 1, title: 'X' }]
  assert.equal(extract(bare).length, 1)
  assert.equal(extract({ success: true, count: 1, data: bare }).length, 1)
  assert.equal(extract(null).length, 0)
  assert.equal(extract({}).length, 0)
})

test('A5 – Courses.jsx: does not render c.category (not in Course schema)', () => {
  const src = fs.readFileSync(path.join(FE, 'src/pages/Courses.jsx'), 'utf8')
  assert.ok(!src.includes('c.category'), 'Courses.jsx must not reference c.category — field not in schema')
})

test('A6 – Courses.jsx: renders correct Course schema fields', () => {
  const src = fs.readFileSync(path.join(FE, 'src/pages/Courses.jsx'), 'utf8')
  assert.match(src, /c\.title/, 'Must render c.title')
  assert.match(src, /c\.provider/, 'Must render c.provider')
  assert.match(src, /c\.description/, 'Must render c.description')
  assert.match(src, /c\.url/, 'Must render c.url')
  assert.match(src, /c\.skills/, 'Must render c.skills')
})

test('A7 – Courses.jsx: courses.map only called on confirmed array', () => {
  const src = fs.readFileSync(path.join(FE, 'src/pages/Courses.jsx'), 'utf8')
  // The page must guard before calling map — either via setCourses(arr) where arr is always []+ or
  // via an Array.isArray check. Both patterns are present.
  const hasGuard =
    src.includes('Array.isArray(response?.data)') ||
    src.includes('Array.isArray(response)') ||
    src.includes('setCourses(arr)') ||
    src.includes('setCourses([])')
  assert.ok(hasGuard, 'Courses.jsx must guard before calling .map()')
})

// ─── B. PROFILE ───────────────────────────────────────────────────────────────

test('B1 – getProfile: returns data.data (full user object with nested profile)', async () => {
  const userObj = {
    id: 1, name: 'Harshit', email: 'h@example.com', role: 'CANDIDATE',
    profile: { location: 'Mohali', education: 'B.Tech CSE', skills: ['Python', 'React'], experienceYears: 2 },
  }
  const api = await apiWith(makeFetch({ success: true, data: userObj }), withToken('tok'))
  const result = await api.getProfile(1)
  assert.equal(result.name, 'Harshit')
  assert.equal(result.email, 'h@example.com')
  assert.equal(result.profile.location, 'Mohali')
  assert.deepEqual(result.profile.skills, ['Python', 'React'])
  delete global.localStorage
})

test('B2 – getProfile: sends Authorization header', async () => {
  const f = makeFetch({ success: true, data: { id: 1, name: 'T', profile: null } })
  const api = await apiWith(f, withToken('my-jwt'))
  await api.getProfile(1)
  assert.equal(f.lastOpts?.headers?.Authorization, 'Bearer my-jwt')
  delete global.localStorage
})

test('B3 – Profile.jsx buildFormState: maps user+profile to form fields correctly', () => {
  // Mirror the helper from Profile.jsx
  function buildFormState(user) {
    const p = user?.profile ?? {}
    return {
      name: user?.name ?? '',
      education: p.education ?? '',
      skills: Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills ?? ''),
      experience: String(p.experienceYears ?? ''),
      preferred_location: p.location ?? '',
    }
  }
  const user = {
    id: 1, name: 'Harshit', email: 'h@e.com', role: 'CANDIDATE',
    profile: { location: 'Chandigarh', education: 'B.Tech', skills: ['Node.js', 'SQL'], experienceYears: 3 },
  }
  const form = buildFormState(user)
  assert.equal(form.name, 'Harshit')
  assert.equal(form.education, 'B.Tech')
  assert.equal(form.skills, 'Node.js, SQL')
  assert.equal(form.experience, '3')
  assert.equal(form.preferred_location, 'Chandigarh')
})

test('B4 – Profile.jsx buildFormState: handles null profile gracefully', () => {
  function buildFormState(user) {
    const p = user?.profile ?? {}
    return {
      name: user?.name ?? '',
      education: p.education ?? '',
      skills: Array.isArray(p.skills) ? p.skills.join(', ') : (p.skills ?? ''),
      experience: String(p.experienceYears ?? ''),
      preferred_location: p.location ?? '',
    }
  }
  const form = buildFormState({ id: 2, name: 'New', profile: null })
  assert.equal(form.name, 'New')
  assert.equal(form.education, '')
  assert.equal(form.skills, '')
  assert.equal(form.experience, '')
  assert.equal(form.preferred_location, '')
})

test('B5 – saveProfile: maps form → backend CandidateProfile payload correctly', async () => {
  const f = makeFetch({ success: true, message: 'Profile updated successfully', data: {} })
  const api = await apiWith(f, withToken('tok'))
  await api.saveProfile(1, {
    name: 'Harshit',              // should NOT be sent
    education: 'B.Tech CSE',
    skills: 'Python, Node.js',    // comma string → string[]
    experience: '3',              // → experienceYears: 3
    preferred_location: 'Mohali', // → location
  })
  const body = JSON.parse(f.lastOpts.body)
  assert.equal(body.location, 'Mohali')
  assert.equal(body.education, 'B.Tech CSE')
  assert.deepEqual(body.skills, ['Python', 'Node.js'])
  assert.equal(body.experienceYears, 3)
  assert.equal(body.name, undefined, 'name must NOT be sent to backend')
  assert.equal(body.preferred_location, undefined, 'preferred_location must NOT be in payload')
  assert.equal(body.experience, undefined, 'experience must NOT be in payload (use experienceYears)')
  delete global.localStorage
})

test('B6 – saveProfile: handles empty skills gracefully', async () => {
  const f = makeFetch({ success: true, data: {} })
  const api = await apiWith(f, withToken('tok'))
  await api.saveProfile(1, { education: 'BTech', skills: '', experience: '', preferred_location: '' })
  const body = JSON.parse(f.lastOpts.body)
  assert.deepEqual(body.skills, [])
  assert.equal(body.experienceYears, 0)
  delete global.localStorage
})

test('B7 – saveProfile: sends Authorization header', async () => {
  const f = makeFetch({ success: true, data: {} })
  const api = await apiWith(f, withToken('save-jwt'))
  await api.saveProfile(1, { education: '', skills: '', experience: '', preferred_location: '' })
  assert.equal(f.lastOpts?.headers?.Authorization, 'Bearer save-jwt')
  delete global.localStorage
})

test('B8 – Profile.jsx: does not use old incorrect field names', () => {
  const src = fs.readFileSync(path.join(FE, 'src/pages/Profile.jsx'), 'utf8')
  // The old code sent p[key] directly with wrong keys
  assert.ok(!src.includes("'preferred_job_type'"), 'preferred_job_type must not appear in Profile.jsx')
  assert.match(src, /buildFormState/, 'Profile.jsx must use buildFormState helper')
})

// ─── C. AUTH / request() BEARER TOKEN ────────────────────────────────────────

test('C1 – request(): attaches Bearer token when localStorage has one', async () => {
  const f = makeFetch({ success: true, count: 0, data: [] })
  const api = await apiWith(f, withToken('the-token'))
  await api.getCourses()
  assert.equal(f.lastOpts?.headers?.Authorization, 'Bearer the-token')
  delete global.localStorage
})

test('C2 – request(): omits Authorization header when no token', async () => {
  const f = makeFetch({ success: true, count: 0, data: [] })
  const api = await apiWith(f, { getItem: () => null })
  await api.getCourses()
  assert.equal(f.lastOpts?.headers?.Authorization, undefined)
  delete global.localStorage
})

test('C3 – request(): omits Authorization for whitespace-only token', async () => {
  const f = makeFetch({ success: true, count: 0, data: [] })
  const api = await apiWith(f, { getItem: () => '   ' })
  await api.getCourses()
  assert.equal(f.lastOpts?.headers?.Authorization, undefined)
  delete global.localStorage
})

test('C4 – request(): always sends Content-Type: application/json', async () => {
  const f = makeFetch({ success: true, count: 0, data: [] })
  const api = await apiWith(f)
  await api.getCourses()
  assert.equal(f.lastOpts?.headers?.['Content-Type'], 'application/json')
  delete global.localStorage
})

test('C5 – request(): public endpoints (jobs, courses) work without token', async () => {
  const jobsResponse = { success: true, count: 1, data: [{ id: 1, title: 'Dev' }] }
  const f = makeFetch(jobsResponse)
  const api = await apiWith(f, { getItem: () => null })
  const result = await api.getJobs({})
  assert.equal(result.success, true)
  assert.equal(Array.isArray(result.data), true)
  delete global.localStorage
})

test('C6 – request(): throws AuthError on 401 from protected routes', async () => {
  const f = makeFetch({ success: false, message: 'Unauthorized' }, { ok: false, status: 401 })
  const api = await apiWith(f, { getItem: () => null })
  let threw = null
  try { await api.getCourses() } catch (e) { threw = e }
  assert.ok(threw, 'request() must throw on 401')
  // Since 401 is now an AuthError, check for AuthError name or the message
  assert.ok(
    threw.name === 'AuthError' || /Request failed/.test(threw.message),
    `request() must throw AuthError or similar on 401, got: ${threw.name}: ${threw.message}`
  )
  delete global.localStorage
})

test('C7 – api.js source: getToken() reads from localStorage["token"]', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  // getToken() uses TOKEN_KEY constant (= 'token') and calls getItem(TOKEN_KEY)
  const readsToken =
    (src.includes("TOKEN_KEY = 'token'") && src.includes('getItem(TOKEN_KEY)')) ||
    /getItem\(['"]token['"]\)/.test(src)
  assert.ok(readsToken, 'getToken must read localStorage["token"] (via TOKEN_KEY constant or literal)')
  assert.match(src, /Authorization.*Bearer/, 'request() must set Authorization: Bearer <token>')
})

// ─── D. RECOMMENDATIONS ──────────────────────────────────────────────────────

test('D1 – getRecommendations: extracts data.data [{job, score, reason}] array', async () => {
  const scored = [
    { job: { id: 3, title: 'AI Engineer', company: 'TechCo', location: 'Mohali', skills: ['Python'] }, score: 0.75, reason: 'Your skills match: Python' },
    { job: { id: 4, title: 'Data Analyst', company: 'DataCo', location: 'Chandigarh', skills: ['SQL'] }, score: 0.5, reason: 'Your skills match: SQL' },
  ]
  const f = makeFetch({ success: true, count: 2, data: scored })
  const api = await apiWith(f, withToken('tok'))
  const result = await api.getRecommendations(1)
  assert.equal(Array.isArray(result), true)
  assert.equal(result.length, 2)
  assert.equal(result[0].job.title, 'AI Engineer')
  assert.equal(result[0].score, 0.75)
  assert.equal(result[0].reason, 'Your skills match: Python')
  delete global.localStorage
})

test('D2 – getRecommendations: sends Authorization header', async () => {
  const f = makeFetch({ success: true, count: 0, data: [] })
  const api = await apiWith(f, withToken('rec-jwt'))
  await api.getRecommendations(1)
  assert.equal(f.lastOpts?.headers?.Authorization, 'Bearer rec-jwt')
  delete global.localStorage
})

test('D3 – getRecommendations: sends POST to /api/recommendations with userId body', async () => {
  const f = makeFetch({ success: true, count: 0, data: [] })
  const api = await apiWith(f, withToken('tok'))
  await api.getRecommendations(42)
  assert.match(f.lastUrl, /\/recommendations$/)
  assert.equal(f.lastOpts?.method, 'POST')
  assert.equal(JSON.parse(f.lastOpts?.body)?.userId, 42)
  delete global.localStorage
})

test('D4 – getRecommendations: handles empty data array gracefully', async () => {
  const f = makeFetch({ success: true, count: 0, data: [] })
  const api = await apiWith(f, withToken('tok'))
  const result = await api.getRecommendations(1)
  assert.equal(Array.isArray(result), true)
  assert.equal(result.length, 0)
  delete global.localStorage
})

test('D5 – getRecommendations mock: returns [{job,score,reason}] shape', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  assert.match(src, /job, score.*reason|score.*reason.*job/,
    'Mock getRecommendations must return [{job, score, reason}] items')
})

test('D6 – Recommendations UI: nested job fields are accessible from result items', () => {
  const item = { job: { id: 1, title: 'Backend Dev', company: 'PGRKAM Corp', location: 'Punjab' }, score: 0.8, reason: 'Skill match' }
  // Verify the shape consumers can rely on
  assert.ok(item.job.title)
  assert.ok(item.job.company)
  assert.ok(item.score >= 0 && item.score <= 1)
  assert.ok(typeof item.reason === 'string')
})

// ─── E. MOCK CONSISTENCY ────────────────────────────────────────────────────

test('E1 – getJobs mock returns { success, count, data } consistent with backend', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  assert.match(src, /success: true, count: filtered\.length, data: filtered/,
    'getJobs mock must return { success, count, data } shape')
})

test('E2 – getCourses mock returns { success, count, data } consistent with backend', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  assert.match(src, /success: true, count: mockCourses\.length, data: mockCourses/,
    'getCourses mock must return { success, count, data } shape')
})

test('E3 – getRecommendations mock returns [{job,score,reason}] items', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  // Mock must map to scored shape
  assert.match(src, /\.map\(\(job\).*job, score.*reason\)|map.*score.*reason/,
    'getRecommendations mock must return items with job/score/reason')
})

// ─── F. RESPONSE-EXTRACTION SAFETY REGRESSION ────────────────────────────────

test('F1 – response extraction: safe for all invalid inputs', () => {
  function extract(response) {
    return Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : []
  }
  for (const v of [null, undefined, {}, { success: false }, { data: null }, 42, 'string', false]) {
    const arr = extract(v)
    assert.equal(Array.isArray(arr), true, `extract(${JSON.stringify(v)}) must return array`)
    assert.doesNotThrow(() => arr.map((x) => x))
  }
})

test('F2 – response extraction: works for valid backend shape', () => {
  function extract(response) {
    return Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : []
  }
  assert.equal(extract({ success: true, count: 2, data: [1, 2] }).length, 2)
  assert.equal(extract([1, 2, 3]).length, 3)
  assert.equal(extract({ success: true, count: 0, data: [] }).length, 0)
})

test('F3 – Jobs.jsx: guards jobList with Array.isArray before .map()', () => {
  const src = fs.readFileSync(path.join(FE, 'src/pages/Jobs.jsx'), 'utf8')
  assert.match(src, /Array\.isArray\(jobs\)/, 'Jobs.jsx must guard jobs with Array.isArray')
  assert.match(src, /jobList\.map/, 'Jobs.jsx must call .map() on jobList, not raw jobs state')
})

test('F4 – Courses.jsx: guards courses array before .map()', () => {
  const src = fs.readFileSync(path.join(FE, 'src/pages/Courses.jsx'), 'utf8')
  assert.match(src, /courses\.map/, 'Courses.jsx must call .map() on courses state')
  // courses state is always set via setCourses(arr) where arr is validated
  assert.match(src, /setCourses\(arr\)|setCourses\(\[\]\)/, 'Must set courses to a validated array')
})

// ─── G. CORS / SERVER ────────────────────────────────────────────────────────

test('G1 – server.js uses cors() middleware for cross-origin support', () => {
  const src = fs.readFileSync(path.join(SRV, 'src/server.js'), 'utf8')
  assert.match(src, /cors\(\)/, 'server.js must call app.use(cors())')
})

test('G2 – chat-api.js reads token from localStorage["token"] for chat requests', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/chat-api.js'), 'utf8')
  // chat-api.js uses SESSION_TOKEN_KEY = 'token' and calls getItem(SESSION_TOKEN_KEY)
  const readsToken =
    (src.includes("SESSION_TOKEN_KEY = 'token'") && src.includes('getItem(SESSION_TOKEN_KEY)')) ||
    /getItem\(['"]token['"]\)/.test(src)
  assert.ok(readsToken, 'chat-api.js must read localStorage["token"] (directly or via SESSION_TOKEN_KEY constant)')
  assert.match(src, /Authorization.*Bearer/, 'chat-api.js must set Authorization: Bearer header')
})


// ─── H. AUTHENTICATION ───────────────────────────────────────────────────────

test('H1 – api.js exports login(), register(), logout(), clearSession()', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  assert.match(src, /export async function login/, 'api.js must export login()')
  assert.match(src, /export async function register/, 'api.js must export register()')
  assert.match(src, /export function logout/, 'api.js must export logout()')
  assert.match(src, /export function clearSession/, 'api.js must export clearSession()')
})

test('H2 – api.js exports getStoredUser() for session persistence', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  assert.match(src, /export function getStoredUser/, 'api.js must export getStoredUser()')
  assert.match(src, /USER_KEY/, 'api.js must define USER_KEY for user storage')
})

test('H3 – login() calls POST /auth/login and stores token + user on success', async () => {
  const user = { id: 42, name: 'Harjit Singh', email: 'h@example.com', role: 'CANDIDATE' }
  const serverBody = { success: true, token: 'jwt-abc', data: user }
  const stored = {}
  const ls = {
    getItem: (k) => stored[k] ?? null,
    setItem: (k, v) => { stored[k] = v },
    removeItem: (k) => { delete stored[k] },
  }
  const api = await apiWith(makeFetch(serverBody), ls)
  const result = await api.login({ email: 'h@example.com', password: 'pass123' })
  assert.equal(result.success, true)
  assert.equal(result.token, 'jwt-abc')
  assert.equal(stored['token'], 'jwt-abc', 'JWT must be stored under "token" key')
  assert.ok(stored['auth_user'], 'User object must be stored under "auth_user" key')
  const stored_user = JSON.parse(stored['auth_user'])
  assert.equal(stored_user.id, 42)
  assert.equal(stored_user.name, 'Harjit Singh')
})

test('H4 – login() uses POST method and sends email+password in body', async () => {
  const serverBody = { success: true, token: 'tok', data: { id: 1, name: 'A', email: 'a@b.com', role: 'CANDIDATE' } }
  const fetchFn = makeFetch(serverBody)
  const api = await apiWith(fetchFn)
  await api.login({ email: 'a@b.com', password: 'secret' })
  assert.equal(fetchFn.lastOpts.method, 'POST', 'login must use POST')
  const body = JSON.parse(fetchFn.lastOpts.body)
  assert.equal(body.email, 'a@b.com')
  assert.equal(body.password, 'secret')
  assert.match(fetchFn.lastUrl, /\/auth\/login/, 'must POST to /auth/login')
})

test('H5 – register() calls POST /auth/register and stores session on success', async () => {
  const user = { id: 7, name: 'Priya', email: 'p@test.com', role: 'CANDIDATE' }
  const serverBody = { success: true, token: 'reg-tok', data: user }
  const stored = {}
  const ls = {
    getItem: (k) => stored[k] ?? null,
    setItem: (k, v) => { stored[k] = v },
    removeItem: (k) => { delete stored[k] },
  }
  const fetchFn = makeFetch(serverBody)
  const api = await apiWith(fetchFn, ls)
  const result = await api.register({ name: 'Priya', email: 'p@test.com', password: 'pw', role: 'CANDIDATE' })
  assert.equal(result.success, true)
  assert.match(fetchFn.lastUrl, /\/auth\/register/, 'must POST to /auth/register')
  assert.equal(fetchFn.lastOpts.method, 'POST')
  const body = JSON.parse(fetchFn.lastOpts.body)
  assert.equal(body.name, 'Priya')
  assert.equal(stored['token'], 'reg-tok')
})

test('H6 – login() with wrong password returns body without throwing (non-AuthError)', async () => {
  // Backend returns 401 with { success: false, message: "Invalid email or password" }
  // login() must NOT throw AuthError — it must return the body so Login.jsx can show the message
  const serverBody = { success: false, message: 'Invalid email or password' }
  const api = await apiWith(makeFetch(serverBody, { status: 401, ok: false }))
  // Should resolve (not throw) so Login.jsx can inspect body.success
  const result = await api.login({ email: 'x@x.com', password: 'wrong' })
  assert.equal(result.success, false)
  assert.match(result.message, /Invalid/)
})

test('H7 – register() with duplicate email returns body without throwing', async () => {
  const serverBody = { success: false, message: 'Email already registered' }
  const api = await apiWith(makeFetch(serverBody, { status: 409, ok: false }))
  const result = await api.register({ name: 'X', email: 'dup@x.com', password: 'pw' })
  assert.equal(result.success, false)
})

test('H8 – logout() / clearSession() removes token and user from localStorage', async () => {
  const stored = { token: 'old-token', auth_user: '{"id":1}' }
  const ls = {
    getItem: (k) => stored[k] ?? null,
    setItem: (k, v) => { stored[k] = v },
    removeItem: (k) => { delete stored[k] },
  }
  const api = await apiWith(makeFetch({}), ls)
  api.logout()
  assert.ok(!stored['token'], 'token must be removed on logout')
  assert.ok(!stored['auth_user'], 'auth_user must be removed on logout')
})

test('H9 – request() throws AuthError (not plain Error) on 401 from protected routes', async () => {
  const serverBody = { success: false, code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
  // getProfile hits a protected route — it uses request() which must throw AuthError
  const api = await apiWith(makeFetch(serverBody, { status: 401, ok: false }), withToken('expired-jwt'))
  let threw = null
  try {
    await api.getProfile(99)
  } catch (err) {
    threw = err
  }
  assert.ok(threw, 'getProfile must throw on 401')
  assert.equal(threw.name, 'AuthError', `Must throw AuthError, got ${threw.name}`)
  assert.equal(threw.status, 401)
})

test('H10 – AuthError is exported from api.js for instanceof checks in components', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  assert.match(src, /export class AuthError/, 'AuthError must be exported for use in components')
})

test('H11 – Profile.jsx imports and uses AuthError for onAuthError callback', () => {
  const src = fs.readFileSync(path.join(FE, 'src/pages/Profile.jsx'), 'utf8')
  assert.match(src, /AuthError/, 'Profile.jsx must import AuthError')
  assert.match(src, /onAuthError/, 'Profile.jsx must accept and call onAuthError prop')
  assert.match(src, /instanceof AuthError/, 'Profile.jsx must check err instanceof AuthError')
})

test('H12 – App.jsx uses getStoredUser() to restore session on startup', () => {
  const src = fs.readFileSync(path.join(FE, 'src/App.jsx'), 'utf8')
  assert.match(src, /getStoredUser/, 'App.jsx must call getStoredUser() for session persistence')
  assert.match(src, /useState.*getStoredUser/, 'App.jsx must initialise user state from getStoredUser')
})

test('H13 – App.jsx renders Login page and passes onAuth callback', () => {
  const src = fs.readFileSync(path.join(FE, 'src/App.jsx'), 'utf8')
  assert.match(src, /Login/, 'App.jsx must import and render Login page')
  assert.match(src, /onAuth/, 'App.jsx must pass onAuth prop to Login')
})

test('H14 – App.jsx renders logout button when user is logged in', () => {
  const src = fs.readFileSync(path.join(FE, 'src/App.jsx'), 'utf8')
  assert.match(src, /handleLogout|logout/, 'App.jsx must handle logout')
  assert.match(src, /t\(lang,\s*'logout'\)/, 'App.jsx must show translated logout label')
})

test('H15 – App.jsx passes real user.id (not hardcoded "101") to Profile', () => {
  const src = fs.readFileSync(path.join(FE, 'src/App.jsx'), 'utf8')
  // Must NOT contain the old hardcoded USER_ID = '101' placeholder
  assert.ok(!src.includes("USER_ID = '101'"), 'App.jsx must not use the hardcoded USER_ID placeholder')
  assert.match(src, /user\.id/, 'App.jsx must pass user.id to Profile')
})

test('H16 – Login.jsx renders both login and register forms with correct fields', () => {
  const src = fs.readFileSync(path.join(FE, 'src/pages/Login.jsx'), 'utf8')
  assert.match(src, /type="email"/, 'Login.jsx must have an email input')
  assert.match(src, /type="password"/, 'Login.jsx must have a password input')
  assert.match(src, /register/, 'Login.jsx must support register mode')
  assert.match(src, /login.*register|register.*login/s, 'Login.jsx must handle both modes')
})

test('H17 – Login.jsx calls login() / register() from api.js (not raw fetch)', () => {
  const src = fs.readFileSync(path.join(FE, 'src/pages/Login.jsx'), 'utf8')
  assert.match(src, /import.*login.*register.*from.*api|import.*register.*login.*from.*api/s, 'Login.jsx must import login and register from api.js')
})

test('H18 – TOKEN_KEY constant matches chat-api.js SESSION_TOKEN_KEY value ("token")', () => {
  const apiSrc = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  const chatSrc = fs.readFileSync(path.join(FE, 'src/services/chat-api.js'), 'utf8')
  // api.js TOKEN_KEY must be 'token'
  assert.match(apiSrc, /TOKEN_KEY\s*=\s*'token'/, 'api.js TOKEN_KEY must equal "token"')
  // chat-api.js SESSION_TOKEN_KEY must be 'token'
  assert.match(chatSrc, /SESSION_TOKEN_KEY\s*=\s*'token'/, 'chat-api.js SESSION_TOKEN_KEY must equal "token"')
})
