# PGRKAM AI Assistant – API Reference

> Agreed contracts as per team decision (B. Agree on API contracts)

## Base URL
```
http://localhost:5001
```

---

## Auth Endpoints *(not in formal contract but required)*

### POST `/api/auth/register`
```json
// Request body
{ "name": "Harshit Yadav", "email": "harshit@example.com", "password": "secret123" }

// Response 201
{ "success": true, "token": "<jwt>", "data": { "id": 1, "name": "...", "email": "...", "role": "CANDIDATE" } }
```

### POST `/api/auth/login`
```json
// Request body
{ "email": "harshit@example.com", "password": "secret123" }

// Response 200
{ "success": true, "token": "<jwt>", "data": { "id": 1, "name": "...", "email": "...", "role": "CANDIDATE" } }
```

---

## Agreed Contract Endpoints

### GET `/api/jobs`  · Owner: Member 2
List all jobs. Optional query params: `?search=`, `?location=`, `?employmentType=`

```json
// Response 200
{ "success": true, "count": 5, "data": [ { "id": 1, "title": "...", "company": "...", "location": "...", "skills": [], "createdAt": "..." } ] }
```

---

### GET `/api/jobs/:id`  · Owner: Member 2
Single job by ID.

```json
// Response 200
{ "success": true, "data": { "id": 1, "title": "Frontend Developer", "company": "...", ... } }

// Response 404
{ "success": false, "message": "Job not found" }
```

---

### GET `/api/profile/:id`  · Owner: Member 2
Get a user's profile by user ID. Auth required.

```
GET /api/profile/1
Authorization: Bearer <token>
```

```json
// Response 200
{
  "success": true,
  "data": {
    "id": 1, "name": "Harshit", "email": "...", "role": "CANDIDATE",
    "profile": { "location": "Mohali", "skills": ["Python", "Node.js"], "experienceYears": 2 }
  }
}
```

---

### PUT `/api/profile/:id`  · Owner: Member 2
Update a candidate's profile (can only update own). Auth required.

```
PUT /api/profile/1
Authorization: Bearer <token>
```

```json
// Request body
{ "location": "Mohali", "education": "B.Tech CSE", "skills": ["Python", "Node.js"], "experienceYears": 2 }

// Response 200
{ "success": true, "message": "Profile updated successfully", "data": { ... } }
```

---

### POST `/api/recommendations`  · Owner: Member 2 + 3
Get skill-based job recommendations for a candidate. Auth required.

```
POST /api/recommendations
Authorization: Bearer <token>
```

```json
// Request body
{ "userId": 1 }

// Response 200
{
  "success": true,
  "count": 5,
  "data": [
    {
      "job": { "id": 2, "title": "Backend Dev", "skills": ["Node.js", "Python"], ... },
      "score": 0.8,
      "reason": "Your skills match: Node.js, Python"
    }
  ]
}
```

---

### GET `/api/courses`  · Owner: Member 2
List all courses. Optional query params: `?skill=`, `?search=`

```json
// Response 200
{ "success": true, "count": 3, "data": [ { "id": 1, "title": "...", "provider": "NIELIT", "skills": ["React"] } ] }
```

---

### POST `/api/chat`  · Owner: Member 2 + 3
Send a message to the AI assistant. Auth optional.

```json
// Request body (candidate identity comes from the optional JWT, never this body)
{ "message": "What jobs are good for someone who knows Python?" }

// Response 200
{
  "success": true,
  "data": {
    "reply": "Based on the PGRKAM records and your skills...",
    "language": "en",
    "jobs": [ { "id": 1, "title": "...", "company": "...", "skills": [], "location": "..." } ],
    "courses": [ { "id": 1, "title": "...", "provider": "...", "skills": [], "url": "..." } ],
    "sources": [ "https://..." ],
    "grounding": {
      "dataFound": true,
      "jobCount": 1,
      "courseCount": 0,
      "message": "Relevant records were found in the PGRKAM database."
    },
    "timestamp": "2026-11-14T08:12:00.000Z"
  }
}
```

`jobs`, `courses`, and `sources` contain bounded records retrieved from PostgreSQL; source URLs are returned only when stored on a course record. The `grounding` object reports when no relevant job or course records were found. When an `Authorization: Bearer <token>` header identifies a candidate, the assistant uses that JWT identity to load only their education, skills, location, and experience. A request body `userId` is ignored.

Errors use `{ "success": false, "code": "...", "message": "..." }` with an appropriate HTTP status. The frontend sends only `message` and `language`; it never supplies a candidate ID. If the browser has a JWT in `localStorage` under `token`, the API service sends it as a bearer token. Anonymous chat remains available.

---

## 🔐 Authentication Header
```
Authorization: Bearer <token>
```
