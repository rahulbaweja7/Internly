# Applycation — engineering context

## what this app is

Applycation is a job application tracker with 300+ real users. It is a production app, not a side project. Every change must be made with that in mind.

## stack

- Frontend: React 19, React Router 6, Tailwind CSS 3, Radix UI, @dnd-kit, Recharts, Axios
- Backend: Node.js + Express 5, MongoDB + Mongoose, Passport.js (Google OAuth 2.0), JWT via HttpOnly cookies, CSRF double-submit pattern, Nodemailer
- Infra: Vercel (frontend), MongoDB Atlas, GitHub Actions CI, Docker
- Integrations: Google OAuth, Gmail API (read-only)
- Tests: Jest, 23 tests, mongodb-memory-server

## engineering principles — follow these on every task

### never break what works

- Run existing tests before and after every change
- If a change touches auth, CSRF, or cookies — flag it explicitly and explain the security implications
- Do not remove or refactor working code unless asked

### performance first

- Every new DB query must have an index or explain why it doesn't need one
- Use .lean() on read-only Mongoose queries
- Paginate any endpoint that returns a list — default page size 20
- Avoid N+1 queries — if you're querying inside a loop, stop and redesign
- Cache aggressively on the frontend with React Query or SWR where applicable

### clean architecture

- Controllers are thin — business logic lives in service files
- One responsibility per file
- No magic numbers or hardcoded strings — use constants
- All new endpoints must have input validation (zod or express-validator)
- All new endpoints must have error handling — never let unhandled promises crash the server

### scalability mindset

- Design every feature as if it will serve 100,000 users, not 300
- Use job queues (Bull/BullMQ + Redis) for anything async — reminder emails, email parsing, etc.
- Never do blocking work in a request/response cycle
- Rate limit all public-facing endpoints

### testing

- Every new service function needs a unit test
- Every new API endpoint needs an integration test
- Do not delete existing tests
- If a test is failing, fix the code — not the test

### code style

- Async/await only — no raw promise chains
- Explicit error types — no catch(e) { console.log(e) }
- TypeScript-friendly patterns even though the codebase is JS — JSDoc types on all functions

## current known pain points (prioritize fixing these)

1. No input validation on several endpoints — add zod schemas
2. Some Mongoose queries missing indexes — audit and add
3. Email reminder logic runs synchronously in request cycle — move to BullMQ queue
4. No rate limiting on auth endpoints — add express-rate-limit
5. Test coverage is low on service layer — increase to 80%+
6. No structured logging — add pino or winston

## when suggesting changes

- Always show the before/after diff, not just the new code
- Explain the scalability reason for every architectural suggestion
- If something has a tradeoff, say so explicitly
- Prefer incremental improvements over rewrites
- Flag any change that touches security (auth, CSRF, cookies, OAuth) for extra review

## goal

Get Applycation from 300 users to 10,000+ without rewriting everything. Every improvement should make the codebase more maintainable, more observable, and more performant — not just add features.
