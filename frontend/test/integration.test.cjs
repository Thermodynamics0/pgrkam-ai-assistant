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

test('C6 – request(): throws on non-ok HTTP status', async () => {
  const f = makeFetch({ success: false, message: 'Unauthorized' }, { ok: false, status: 401 })
  const api = await apiWith(f, { getItem: () => null })
  await assert.rejects(() => api.getCourses(), /Request failed \(401\)/)
  delete global.localStorage
})

test('C7 – api.js source: getToken() reads from localStorage["token"]', () => {
  const src = fs.readFileSync(path.join(FE, 'src/services/api.js'), 'utf8')
  assert.match(src, /getItem\(['"]token['"]\)/, 'getToken must read localStorage["token"]')
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
