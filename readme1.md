# Who Wants to Be a Millionaire – Math Edition

> **Play a classic “Who Wants to Be a Millionaire” game** with 8‑grade math questions.  
> Built with **React + Vite (TS)** + **Node / Express (TS)** + **PostgreSQL** (Prisma).  
> Fully Dockerised and ready for cloud (Vercel + Render / Fly.io).

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Project Structure](#project-structure)
5. [Getting Started (Local)](#getting-started-local)
6. [Running Tests](#running-tests)
7. [Deploying to the Cloud](#deploying-to-the-cloud)
8. [Extending the Game](#extending-the-game)
9. [License](#license)

---

## Features

- 🎮 Classic 15‑question ladder with prize table.
- ✅ Server‑side validation (no cheating).
- 🔐 JWT‑based authentication (register / login).
- 📚 Seedable question bank (JSON → Prisma).
- 📱 Responsive UI built with TailwindCSS.
- 🧪 Unit + integration tests (Jest, Supertest, React‑Testing‑Library).
- 🐳 Docker‑Compose for one‑click dev environment.
- 🌐 Cloud‑ready (Vercel frontend, Render/Fly backend).

---

## Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | React + Vite (TS) + TailwindCSS | Fast HMR, typed code, minimal CSS |
| Backend | Node + Express (TS) + Prisma ORM | Light, typed, DB migrations |
| DB | PostgreSQL (Docker) (SQLite only for quick local test) | ACID, scalable |
| Auth | JWT + bcrypt | Stateless, easy to host |
| Testing | Jest, Supertest, React‑Testing‑Library | Full coverage |
| CI/CD | GitHub Actions | Lint → Test → Build → Docker push |
| Cloud | Vercel (frontend) + Render/Fly (backend) | Zero‑config static hosting + Docker support |

---

## Architecture Overview

```
+-------------------+          HTTP           +-------------------+
|   Browser (SPA)   |  <--------------------> |   API (Express)   |
|  React + Vite     |                         |   Prisma + PGSQL  |
+-------------------+                         +-------------------+
▲   ▲                                      │
│   │   fetch (JWT)                       │
│   │                                      ▼
+-------------------+                 +-------------------+
|   Auth Service    |                 |   Question Store  |
|   (login/regs)   |                 |   (PostgreSQL)   |
+-------------------+                 +-------------------+
```

All game rules reside on the backend; the front‑end is a pure consumer.

---

## Project Structure

```
/
├─ .docker/
│   ├─ Dockerfile.frontend
│   ├─ Dockerfile.backend
│   └─ docker-compose.yml
│
├─ backend/
│   ├─ src/
│   │   ├─ api/          # routes
│   │   ├─ middlewares/
│   │   ├─ services/
│   │   └─ index.ts
│   ├─ prisma/
│   │   ├─ schema.prisma
│   │   └─ seed.ts
│   ├─ test/
│   └─ package.json
│
├─ frontend/
│   ├─ src/
│   │   ├─ components/
│   │   ├─ hooks/
│   │   ├─ pages/
│   │   └─ services/
│   ├─ public/
│   └─ package.json
│
├─ .github/workflows/ci.yml
├─ .env.example
└─ README.md
```

*Full file list is in the repo.  See each folder for more details.*

---

## Getting Started (Local)

### Prerequisites

- **Docker Desktop** (or Docker Engine)
- **Node ≥ 20** (only required to run `npm install` inside containers)
- **Git**

### Steps

```bash
 1️⃣ Clone repository
git clone https://github.com/youruser/millionaire-math.git
cd millionaire-math

 2️⃣ Build & run containers
docker compose -f .docker/docker-compose.yml up --build -d

 3️⃣ Run DB migrations + seed (first time only)
docker exec -it backend sh -c "npx prisma migrate deploy && node prisma/seed.js"

 4️⃣ Open the app
    - Frontend: http://localhost
    - API: http://localhost:4000/api
```

The API is protected; register a user via the UI or directly:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@demo.com","password":"secret123"}'
```

You’ll receive a JWT token that the SPA stores in `localStorage`.

### Development mode (without Docker)

```bash
1️⃣  Backend
cd backend
npm install
npm run dev   # nodemon watches src/**/*.ts

2️⃣   Frontend
cd ../frontend
npm install
npm run dev   # Vite dev server (localhost:5173)
```

Add a `.env` file in each folder following `.env.example`.

---

## Running Tests

```bash
1️⃣  Backend tests
cd backend
npm test

2️⃣  Frontend tests
cd ../frontend
npm test
```

Both suites should pass with a clean checkout.

---

## Deploying to the Cloud

### 1️⃣ Frontend → Vercel

1. Sign‑in to Vercel, import the repo.
2. Set **Framework Preset** → *Vite*.
3. Add env var `VITE_API_URL` → URL of your backend (e.g. `https://api‑millionaire.onrender.com/api`).
4. Deploy – Vercel will build `npm run build` and serve the static files.

### 2️⃣ Backend → Render (Docker)

1. Create a *New Web Service* → **Docker** → repo URL and Dockerfile path `backend/.docker/Dockerfile.backend`.
2. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
3. Render automatically provisions a PostgreSQL instance; copy its connection string into `DATABASE_URL`.
4. After the first deploy run migrations/seeding via the Render shell:

```bash
# Inside Render shell
npx prisma migrate deploy
node prisma/seed.js
```

Your API will be reachable at `https://api‑millionaire.onrender.com/api`.

### 3️⃣ Alternative: Fly.io (all‑in‑one)

Fly’s quick‑start:

```bash
fly launch   # pick Dockerfile, name, region
fly secrets set DATABASE_URL=... JWT_SECRET=...
fly deploy
```

---

## Extending the Game

| Feature | Where to modify |
|--------|-----------------|
| **More questions / categories** | Add JSON files under `backend/prisma/data/`, update `seed.ts`, optionally add a `category` column in `Question`. |
| **Lifelines (50/50, Phone‑a‑Friend, Ask‑the‑Audience)** | Create new endpoints in `backend/api/lifelines.ts`, store state in `Game` (e.g., `usedFiftyFifty`). UI components under `frontend/src/components/LifelineButton`. |
| **Leaderboard** | New table `Score` linked to `User`, endpoint `/api/leaderboard`, front page component `Leaderboard.tsx`. |
| **Multiplayer / Rooms** | Add `Room` model, WebSocket (socket.io) server, client hook `useSocket`. |
| **Internationalisation** | Use `react-i18next`, move question texts to separate locale files. |
| **Server‑Side Rendering** | Migrate to **Next.js** – API routes become `pages/api/*`, front pages become `pages/*`. |

All new code should follow the existing folder conventions and be typed.

---

## License

MIT © 2024 – Feel free to fork, modify and use in your projects. 🎉

--- 

### Happy coding!

If you run into any trouble, open an issue in the repo or drop me a line. 🚀