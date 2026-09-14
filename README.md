# Applycation

**Track every job and internship application in one place — with a Chrome extension that adds the job you're looking at in one click.**

[applycation.net](https://www.applycation.net/) · 300+ active users

![CI](https://github.com/rahulbaweja7/Internly/actions/workflows/ci.yml/badge.svg)

## What it does

Applycation is a job/internship application tracker built to replace the spreadsheet everyone starts with. It's a live, in-use product, not a demo:

- **Dashboard** — total applications, interviews, offers, and response rate at a glance, with charts (Recharts) for status breakdown over time
- **Chrome extension** — a one-click "Add to Applycation" button that captures the job you're currently viewing straight into your tracker, no copy-pasting
- **Google OAuth sign-in** — no separate password to manage
- **Search & filter** — by company, position, location, or status
- **Kanban-style status board** — drag applications between stages
- **Responsive UI** — works on desktop, tablet, and mobile

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, React Router 6, Tailwind CSS, Radix UI, React Query, Recharts |
| Backend | Node.js, Express 5, MongoDB + Mongoose |
| Auth | Passport.js (Google OAuth 2.0), JWT in HttpOnly cookies, CSRF double-submit |
| Async jobs | BullMQ + Redis (email reminders, background processing) |
| Security | Helmet, express-rate-limit, express-mongo-sanitize, Zod validation |
| Observability | Pino/Winston structured logging, Vercel Analytics, PostHog |
| Extension | Chrome Manifest V3 |
| Infra | Vercel (frontend), Docker, GitHub Actions CI |
| Tests | Jest + Supertest, mongodb-memory-server for isolated integration tests |

## Project structure

```
Internly/
├── backend/          Express API — auth, jobs, email parsing, queues
├── frontend/         React app (Create React App)
├── extension/        Chrome extension (Manifest V3) — one-click job capture
├── .github/workflows/ci.yml   Backend + frontend CI
├── SECURITY.md        Responsible disclosure policy
├── PRIVACY.md          Privacy policy (live product, real user data)
├── TERMS.md            Terms of service
└── AUTHENTICATION_SETUP.md   Google OAuth setup walkthrough
```

## Running locally

Requires Node 22.x, a MongoDB connection (Atlas or local), and Redis for the job queue.

```bash
git clone https://github.com/rahulbaweja7/Internly.git
cd Internly

# Backend
cd backend
npm install
cp env.example .env   # fill in MONGO_URI, GOOGLE_CLIENT_ID/SECRET, JWT_SECRET, SESSION_SECRET, REDIS_URL
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`, backend at the port set in `.env` (default `3001`).

See [`AUTHENTICATION_SETUP.md`](./AUTHENTICATION_SETUP.md) for the Google OAuth credential setup and [`DEPLOYMENT.md`](./DEPLOYMENT.md) for production deployment.

### Chrome extension

Load unpacked from `extension/` via `chrome://extensions` → Developer mode → Load unpacked. Captures the current tab's job posting into your Applycation account in one click.

## Testing

```bash
cd backend
npm test              # Jest + Supertest, isolated per-test MongoDB via mongodb-memory-server
npm run test:coverage
```

CI runs the backend test suite and frontend build on every push and pull request.

## Security

This handles real user credentials and application data for 300+ users. Auth uses Google OAuth (no passwords stored), JWTs live in HttpOnly cookies, and state-changing requests are protected by CSRF double-submit tokens. See [`SECURITY.md`](./SECURITY.md) to report a vulnerability, and [`PRIVACY.md`](./PRIVACY.md) / [`TERMS.md`](./TERMS.md) for the live product's policies.

## License

MIT
