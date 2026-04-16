# FlowBoard

> AI-powered project management — like Jira/Trello, with Claude built in.

**Stack:** React 18 · TypeScript · Vite · Tailwind · Zustand · Framer Motion · Node.js · Express · MongoDB · Mongoose · Socket.io · Anthropic Claude API

---

## Project status

This is a **scaffold**: Module 1 (Auth) is fully implemented end-to-end. Modules 2–4 (Kanban, AI Tools, Notifications) have working routes, models, and UI stubs that you can extend.

| Module | Backend | Frontend |
|--------|---------|----------|
| **1. Auth** (signup, login, OTP, password reset, JWT refresh) | ✅ Complete | ✅ Complete |
| **2. Workspaces / Projects / Kanban** | ✅ CRUD + invite + board | 🔨 Read-only view, ready for drag-and-drop |
| **3. AI Features** (5 Claude-powered tools) | ✅ All 5 endpoints + mock fallback | ✅ Tabbed UI, all tools callable |
| **4. Notifications / Comments / Polish** | ✅ Real-time Socket.io + comments + mentions | ✅ Notification dropdown, theme toggle, settings |

---

## Repository layout

```
flowboard/
├── client/          # React + Vite (deploys to Vercel)
├── server/          # Express + Mongoose (deploys to Render)
├── shared/          # Types + constants used by both
├── package.json     # Monorepo root (npm workspaces + concurrently)
└── README.md
```

---

## 1. Local setup

### Prerequisites

- **Node.js 20+**
- **MongoDB Atlas** account (free tier is fine) — [cloud.mongodb.com](https://cloud.mongodb.com)
- **Anthropic API key** (optional — without it, AI tools return mock responses) — [console.anthropic.com](https://console.anthropic.com)

### Clone and install

```bash
git clone <your-repo-url> flowboard
cd flowboard
npm install
```

This installs deps for all workspaces (`client`, `server`, `shared`).

### Configure environment variables

**Server** (`server/.env`):

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in at minimum:
- `MONGODB_URI` — your Atlas connection string (`mongodb+srv://…`)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` — any long random strings (generate with `openssl rand -base64 48`)
- `ANTHROPIC_API_KEY` — optional; without it, AI endpoints return mock data
- SMTP settings — optional in dev (emails are logged to console if missing)

**Client** (`client/.env.local`):

```bash
cp client/.env.example client/.env.local
```

Defaults work out of the box for local dev.

### Seed the database

```bash
npm run seed
```

On completion you'll see test login credentials in the terminal:

```
✨ Seed complete! Test login credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📧 alice@flowboard.dev  /  password123  (owner)
  📧 bob@flowboard.dev    /  password123  (admin)
  📧 carol@flowboard.dev  /  password123  (member)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Run dev servers

```bash
npm run dev
```

This runs the Express server (`:5000`) and the Vite dev server (`:5173`) in parallel via `concurrently`.

Open **http://localhost:5173** and sign in with Alice.

---

## 2. Deploying

### Backend → Render

1. Push this repo to GitHub.
2. On [Render](https://render.com), click **New → Blueprint** and point it at your repo. Render will pick up `server/render.yaml`.
   - Alternatively: **New → Web Service**, set **Root Directory** to `server`, **Build Command** to `npm install && npm run build`, **Start Command** to `npm start`.
3. Add these environment variables in the Render dashboard:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_ACCESS_SECRET` | Long random string |
   | `JWT_REFRESH_SECRET` | Different long random string |
   | `ANTHROPIC_API_KEY` | Your Claude API key (optional) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email credentials |
   | `EMAIL_FROM` | e.g. `FlowBoard <no-reply@yourdomain.com>` |
   | `CLIENT_URL` | Your Vercel URL, e.g. `https://flowboard.vercel.app` |
   | `ALLOWED_ORIGINS` | Same Vercel URL (comma-separated for multiple) |
   | `COOKIE_SECURE` | `true` |

4. Deploy. Note the public URL (e.g. `https://flowboard-server.onrender.com`).
5. Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access (or Render's egress IPs).

### Frontend → Vercel

1. On [Vercel](https://vercel.com), **Add New → Project**, import the repo.
2. Set the **Root Directory** to `client`. Vercel will detect `vercel.json`.
3. Add env vars:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://<your-render-url>.onrender.com/api` |
   | `VITE_SOCKET_URL` | `https://<your-render-url>.onrender.com` |

4. Deploy. Your Vercel URL is what you put in Render's `CLIENT_URL` / `ALLOWED_ORIGINS` — **update Render if you didn't already**.

### Cross-origin cookies gotcha

Because the refresh-token cookie must cross domains in production, the server sets `SameSite=None; Secure` when `COOKIE_SECURE=true`. This requires both sites to be HTTPS (they are, on Vercel and Render).

---

## 3. Common scripts

From the repo root:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Runs server + client in parallel |
| `npm run build` | Builds shared, server, client |
| `npm run seed` | Seeds MongoDB with sample users, workspaces, projects, tasks |
| `npm run install:all` | Reinstalls all workspace deps |
| `npm run lint` | Lints both packages |

---

## 4. API cheatsheet

```
POST   /api/auth/signup              Create account, sends OTP
POST   /api/auth/login               Returns accessToken + sets refresh cookie
POST   /api/auth/verify-email        { email, otp }
POST   /api/auth/resend-otp          { email }
POST   /api/auth/forgot-password     { email }
POST   /api/auth/reset-password      { token, password }
POST   /api/auth/refresh-token       Uses refresh cookie
POST   /api/auth/logout
GET    /api/auth/me                  Bearer required

GET    /api/workspaces               List workspaces
POST   /api/workspaces               Create workspace
GET    /api/workspaces/:id           Workspace + projects
POST   /api/workspaces/:id/invite    Invite member by email
GET    /api/workspaces/:id/projects  List projects
POST   /api/workspaces/:id/projects  Create project

GET    /api/projects/:id             Project details
GET    /api/projects/:id/board       Columns + tasks
POST   /api/projects/:id/tasks       Create task

GET    /api/tasks/:id                Task details
PATCH  /api/tasks/:id                Update
DELETE /api/tasks/:id                Delete
POST   /api/tasks/:id/move           Move to column/order

GET    /api/tasks/:id/comments       List
POST   /api/tasks/:id/comments       Create (@mentions auto-notify)

GET    /api/notifications            List last 50
GET    /api/notifications/unread-count
POST   /api/notifications/:id/mark-read
POST   /api/notifications/mark-all-read

POST   /api/ai/task-breakdown
POST   /api/ai/smart-description
POST   /api/ai/sprint-summary
POST   /api/ai/priority-suggestion
POST   /api/ai/standup
```

**Socket.io:** connect with `auth: { token: accessToken }`. The server joins you to `user:<yourId>` automatically. Listen for `notification:new`.

---

## 5. Design system

- **Brand color:** Electric Indigo `#6366F1` (Tailwind: `brand`)
- **Fonts:** Plus Jakarta Sans (headings), DM Sans (body), JetBrains Mono (code)
- **Theming:** CSS variables on `:root` / `.dark` — all components use `bg-surface`, `text-fg`, etc. so dark mode works everywhere
- **Motion:** Framer Motion for page-level transitions, CSS for micro-interactions

---

## 6. Next steps

The scaffold leaves clear extension points:

- **Module 2:** Wire up `@dnd-kit/sortable` on `BoardPage.tsx` → call `POST /api/tasks/:id/move` on drop. Add a task detail modal (click a card).
- **Module 3:** The AI Tools page already hits all 5 endpoints — add per-task AI actions (e.g. "Generate subtasks" button inside the task modal).
- **Module 4:** Build out the comment thread UI on the task modal. Add a `UserPreferences` model to back the Settings → Notifications toggles.

---

## License

MIT
