# MotiScan Frontend

Web app for **MotiScan**, a platform where teachers build visual/cognitive
exercises, assign them to students as timed exams, monitor live sessions, and
review AI-assisted reports. Students take their assigned exams and view their
history.

Built with **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4**,
talking to the [`motiscan-backend`](../motiscan-backend) REST + Socket.IO API.

- **Live app:** `https://motiscan-frontend.vercel.app`
- **Backend API:** `https://motiscan-backend-83d4.onrender.com`

## Tech stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI + shadcn-style components (`src/components/ui`) |
| Icons | lucide-react |
| Forms / validation | react-hook-form + zod |
| Charts | Recharts |
| Real-time | socket.io-client |
| PDF export | jsPDF |

## Getting started

```bash
npm install

# Point the app at a backend (no trailing slash, no /api suffix):
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To run against the deployed backend instead, set
`NEXT_PUBLIC_API_URL=https://motiscan-backend-83d4.onrender.com` and make sure
the backend's `CLIENT_URL` allows `http://localhost:3000`.

### npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API. **No trailing slash and no `/api` suffix** (e.g. `http://localhost:5000`). Defaults to `http://localhost:5000` if unset. |

The URL is normalized in `src/lib/getApiBaseUrl.ts`, and `/uploads/...` image
paths are rewritten to the active API host in `src/lib/mediaUrl.ts`.

## Project structure

```
src/
├── app/                       # App Router pages
│   ├── login, forgot-password, reset-password
│   ├── teacher/               # dashboard, exams, exercises, students, reports
│   └── student/               # dashboard, exam/[id], history
├── components/
│   ├── ui/                    # shadcn-style primitives (button, dialog, ...)
│   ├── exercises/             # exercise builders + player components
│   └── reports/               # report + feedback UI
├── contexts/                  # Auth, WebSocket, LiveSession providers
├── hooks/                     # useExamSession, use-toast
├── lib/                       # api client, socket, url helpers, pdf, utils
├── services/                  # typed API wrappers per resource
└── types/                     # shared TypeScript types
```

## Features

- **Auth** — login, JWT session handling, forgot/reset password flows.
- **Teacher** — dashboard, student management, exercise library, exam builder
  (create / edit / duplicate / assign), live session monitoring, and reports
  with AI summaries, editable feedback, and PDF export.
- **Student** — dashboard of assigned exams, a timed exam player, and history of
  past submissions.
- **Exercise types** — Differences, Shape Copy, Analytical Perception, and
  Priority Sort (Similarity Ranking and Rating Scale are planned).
- **Live sessions** — real-time exam progress over Socket.IO.

## Deployment (Vercel)

Deploy this directory to Vercel and set the single env var:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://motiscan-backend-83d4.onrender.com` |

**Important:** no trailing slash, no `/api` suffix. Redeploy after changing env
vars. Ensure the backend `CLIENT_URL` includes your Vercel URL.
