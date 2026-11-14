# PGRKAM AI Assistant – Backend API

> **Member 2** – Backend APIs  
> Stack: Node.js · Express · PostgreSQL · Prisma · JWT

---

## 🚀 Setup & Run

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev        # starts on http://localhost:5001
```

Add a `.env` file (see `.env.example`) with:
```
PORT=5001
DATABASE_URL="postgresql://<user>@localhost:5432/pgrkam_clean?schema=public"
JWT_SECRET="your_secret_here"
AI_SERVICE_URL="http://localhost:5002/api/ai/chat"
```

---

## 📋 API Endpoints

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |

### Jobs
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/jobs` | — | List all jobs (supports `?search=`, `?location=`, `?employmentType=`) |
| POST | `/api/jobs` | ✅ | Create a new job |

### Profile
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/profile` | ✅ | Get current user's profile |
| PUT | `/api/profile` | ✅ | Create/update candidate profile |

### Courses
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/courses` | — | List all courses (supports `?skill=`, `?search=`) |
| GET | `/api/courses/:id` | — | Get single course |
| POST | `/api/courses` | ✅ | Create a course |

### Recommendations
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/recommendations` | ✅ | Get skill-based job recommendations |
| GET | `/api/recommendations/history` | ✅ | Get saved recommendation history |

### Chat (AI)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/chat` | Optional | Send message to AI assistant |

---

## 🔐 Authentication

Send the JWT token from login/register in the `Authorization` header:
```
Authorization: Bearer <token>
```
