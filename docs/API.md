# PGRKAM AI Assistant – API Reference

## Base URL
```
http://localhost:5001
```

---

## Auth Endpoints

### POST `/api/auth/register`
Register a new user.

**Body**
```json
{
  "name": "Harshit Yadav",
  "email": "harshit@example.com",
  "password": "secret123",
  "role": "CANDIDATE"
}
```

**Response 201**
```json
{
  "success": true,
  "token": "<jwt>",
  "data": { "id": 1, "name": "Harshit Yadav", "email": "...", "role": "CANDIDATE" }
}
```

---

### POST `/api/auth/login`
Login with existing credentials.

**Body**
```json
{ "email": "harshit@example.com", "password": "secret123" }
```

**Response 200** – same shape as register response.

---

## Job Endpoints

### GET `/api/jobs`
List jobs. Query params: `search`, `location`, `employmentType`.

**Response 200**
```json
{ "success": true, "count": 5, "data": [ { "id": 1, "title": "...", ... } ] }
```

### POST `/api/jobs`  *(Auth required)*
Create a job.

**Body**
```json
{
  "title": "Frontend Developer",
  "company": "TechCorp",
  "location": "Chandigarh",
  "description": "...",
  "skills": ["React", "CSS"],
  "employmentType": "Full-time"
}
```

---

## Profile Endpoints  *(Auth required)*

### GET `/api/profile`
Returns the current user with their candidate profile.

### PUT `/api/profile`
Create or update candidate profile.

**Body**
```json
{
  "location": "Mohali",
  "education": "B.Tech CSE",
  "skills": ["Python", "Node.js"],
  "experienceYears": 2
}
```

---

## Courses Endpoints

### GET `/api/courses`
Query params: `skill`, `search`.

### GET `/api/courses/:id`
Single course by ID.

### POST `/api/courses`  *(Auth required)*
```json
{
  "title": "Full Stack Bootcamp",
  "provider": "NIELIT",
  "description": "...",
  "url": "https://nielit.gov.in/...",
  "skills": ["Node.js", "React"]
}
```

---

## Recommendations  *(Auth required)*

### GET `/api/recommendations`
Returns top-10 job recommendations ranked by skill overlap.

**Response 200**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "job": { "id": 2, "title": "Backend Dev", ... },
      "score": 0.8,
      "reason": "Your skills match: Node.js, Python"
    }
  ]
}
```

### GET `/api/recommendations/history`
Previously saved recommendations from the DB.

---

## Chat / AI

### POST `/api/chat`
Send a message to the AI assistant. Auth optional (adds personalized context).

**Body**
```json
{ "message": "What jobs are good for someone who knows Python?" }
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "userMessage": "What jobs are good for...",
    "aiReply": "Based on your Python skills, ...",
    "timestamp": "2024-11-14T08:12:00.000Z"
  }
}
```
