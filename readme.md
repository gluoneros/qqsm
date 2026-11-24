## 🎯  Quien Quiere Ser Millonario – Math Edition
**MVP**: Juego “Who Wants to Be a Millionaire” con preguntas de matemáticas de 8.º de secundaria (≈ 14‑16 años).

**Objetivo**: Entregar una base de código lista para ejecutar *localmente* y *en la nube* que sea fácil de extender (más preguntas, nuevos “lifelines”, ranking, etc.).

---

## 1️⃣  Stack recomendado (máxima eficiencia + velocidad de desarrollo)

| Layer | Tecnologías | Por qué |
|-------|-------------|---------|
| **Frontend** | **React + Vite** (TS)  &nbsp;•&nbsp; **TailwindCSS** | • HMR ultra‑rápido (Vite)  <br>• TS = tipado fuerte  <br>• Tailwind = estilos responsivos con muy poco CSS |
| **Backend** | **Node.js + Express** (TS)  &nbsp;•&nbsp; **Prisma ORM**  &nbsp;•&nbsp; **PostgreSQL** | • Express es ligero y fácil de testear  <br>• Prisma brinda autogeneración de tipos y migraciones sin escribir SQL  <br>• PostgreSQL es robusto y escala bien (puede reemplazarse por SQLite en dev) |
| **Database** | PostgreSQL (Docker) (o SQLite para pruebas rápidas) | • ACID, índices, JSONB (útil para almacenar opciones) |
| **Auth** | **JSON‑Web‑Token** (stateless, simple) | • No hay necesidad de sesiones complejas para el MVP |
| **Testing** | Jest + React‑Testing‑Library (frontend) <br>Supertest (backend) | • Cobertura inmediata |
| **Deploy** | Docker‑Compose (local) <br>**Vercel** (frontend) + **Render** o **Fly.io** (backend) <br>**Heroku**/Railway (alternativa) | • Cada parte está contenedorizada y se puede subir a cualquier PaaS |
| **CI/CD** | GitHub Actions (build, test, push Docker) | • Automatiza pruebas y despliegue |

> **Nota**: Si prefieres una solución “all‑in‑one”, el mismo stack puede migrarse a **Next.js** (pages + API routes). Aquí usamos la separación clásica para que el proyecto sea más claro a la hora de escalar.

--- 

## 2️⃣  Arquitectura del MVP

```
┌─────────────────────┐       ┌───────────────────────┐
│  Browser (SPA)      │       │  API (Express)          │
│  ──► React + Vite   │  HTTP │  ──► /api/questions     │
│  (TS + Tailwind)     │──────►│  ──► /api/answers       │
│                     │       │  ──► /api/auth          │
└─────────────────────┘       └───────────────────────┘
          │                               │
          │               PostgreSQL  <───┘
          │               (Docker)       
          ▼
  Persistencia de preguntas, usuarios,
  puntajes y configuración
```

*El frontend sólo consume la API REST. La lógica del juego (selección de pregunta, validación de respuesta, cálculo del premio) está en el backend* – de esa forma la **integridad** del juego no puede ser manipulada desde el cliente.

---

## 3️⃣  Estructura de carpetas

```
/millionaire-math/
│
├─ .docker/                     # Dockerfiles y compose
│   ├─ Dockerfile.frontend
│   ├─ Dockerfile.backend
│   └─ docker-compose.yml
│
├─ backend/
│   ├─ src/
│   │   ├─ api/                 # Rutas Express
│   │   │   ├─ auth.ts
│   │   │   ├─ game.ts
│   │   │   └─ questions.ts
│   │   ├─ config/
│   │   │   └─ prisma.ts        # Prisma client
│   │   ├─ middlewares/
│   │   │   └─ authMiddleware.ts
│   │   ├─ services/
│   │   │   ├─ gameService.ts   # lógica del juego
│   │   │   └─ questionService.ts
│   │   ├─ utils/
│   │   │   └─ errorHandler.ts
│   │   └─ index.ts             # entrypoint
│   ├─ prisma/
│   │   ├─ schema.prisma        # DB model
│   │   └─ seed.ts              # seed de preguntas
│   ├─ test/
│   │   └─ game.test.ts
│   ├─ tsconfig.json
│   ├─ package.json
│   └─ jest.config.js
│
├─ frontend/
│   ├─ src/
│   │   ├─ components/
│   │   │   ├─ GameBoard.tsx
│   │   │   ├─ QuestionCard.tsx
│   │   │   ├─ AnswerOption.tsx
│   │   │   └─ LifelineButton.tsx
│   │   ├─ hooks/
│   │   │   └─ useGame.ts
│   │   ├─ pages/
│   │   │   ├─ Home.tsx
│   │   │   ├─ Play.tsx
│   │   │   └─ Result.tsx
│   │   ├─ services/
│   │   │   └─ api.ts           # wrapper fetch con JWT
│   │   ├─ utils/
│   │   │   └─ constants.ts
│   │   └─ main.tsx
│   ├─ public/
│   ├─ tsconfig.json
│   ├─ vite.config.ts
│   ├─ tailwind.config.cjs
│   ├─ postcss.config.cjs
│   ├─ package.json
│   └─ index.html
│
├─ .github/
│   └─ workflows/
│       └─ ci.yml              # lint, test, build, push images
│
├─ README.md
└─ .env.example                # variables de entorno para dev & prod
```

---

## 4️⃣  Base de datos – **Prisma schema**

`backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["selectRelationCount"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

/* --------------------------------------------------------------
   Usuarios (para guardar puntuaciones, historial y JWT)
   -------------------------------------------------------------- */
model User {
  id          Int       @id @default(autoincrement())
  email       String    @unique
  password    String    // hash bcrypt
  score       Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  games       Game[]
}

/* --------------------------------------------------------------
   Juego (una partida)
   -------------------------------------------------------------- */
model Game {
  id          Int       @id @default(autoincrement())
  userId      Int
  user        User      @relation(fields: [userId], references: [id])
  currentStep Int       @default(1) // 1‑15
  wonAmount   Int       @default(0)
  finished    Boolean   @default(false)
  createdAt   DateTime  @default(now())
}

/* --------------------------------------------------------------
   Preguntas
   -------------------------------------------------------------- */
model Question {
  id          Int      @id @default(autoincrement())
  level       Int      // 1‑15 (dificultad según premio)
  question    String
  // cada opción tiene texto y flag `isCorrect`
  options     Option[]
}

/* Cada opción pertenece a una pregunta */
model Option {
  id          Int       @id @default(autoincrement())
  questionId  Int
  question    Question  @relation(fields: [questionId], references: [id])
  text        String
  isCorrect   Boolean
}
```

**Seed de preguntas (8.º de secundaria)** – `backend/prisma/seed.ts`

```ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  const raw = fs.readFileSync(
    path.join(__dirname, '..', 'data', 'questions.json'),
    'utf-8'
  );
  const questions = JSON.parse(raw) as any[];

  for (const q of questions) {
    const { level, question, options } = q;
    await prisma.question.create({
      data: {
        level,
        question,
        options: {
          create: options.map((o: any) => ({
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        },
      },
    });
  }

  console.log('✅ Seed concluido');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

Ejemplo de `questions.json` (pocos ítems para el MVP)

```json
[
  {
    "level": 1,
    "question": "¿Cuál es el valor de 7 × 8?",
    "options": [
      { "text": "54", "isCorrect": false },
      { "text": "56", "isCorrect": true },
      { "text": "58", "isCorrect": false },
      { "text": "60", "isCorrect": false }
    ]
  },
  {
    "level": 2,
    "question": "Si x + 4 = 13, ¿cuál es x?",
    "options": [
      { "text": "7", "isCorrect": true },
      { "text": "8", "isCorrect": false },
      { "text": "9", "isCorrect": false },
      { "text": "10", "isCorrect": false }
    ]
  }/* … hasta level 15 */
]
```

> Cada `level` corresponde al “premio” de la escalera de 1‑15. Puedes ajustar los montos en `frontend/src/utils/constants.ts`.

---

## 5️⃣  Backend – API

### 5.1  `src/index.ts` (servidor)

```ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { json, urlencoded } from 'body-parser';
import authRouter from './api/auth';
import gameRouter from './api/game';
import questionsRouter from './api/questions';
import { errorHandler } from './utils/errorHandler';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(json());
app.use(urlencoded({ extended: true }));

// Rutas públicas
app.use('/api/auth', authRouter);

// Rutas protegidas (middleware de JWT)
app.use('/api/game', gameRouter);
app.use('/api/questions', questionsRouter);

// Captura de errores
app.use(errorHandler);

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`🚀 API listening on ${PORT}`));
```

### 5.2  Auth (JWT + Bcrypt)

`src/api/auth.ts`

```ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'CHANGE_ME';

router.post(
  '/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({ data: { email, password: hash } });
      const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token });
    } catch (e) {
      res.status(400).json({ error: 'Email already taken' });
    }
  }
);

router.post(
  '/login',
  body('email').isEmail(),
  body('password').exists(),
  async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  }
);

export default router;
```

### 5.3  Middleware de autorización

`src/middlewares/authMiddleware.ts`

```ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'CHANGE_ME';

export interface AuthRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: number };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 5.4  Preguntas

`src/api/questions.ts`

```ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

/* GET /api/questions/next?level=5  → una pregunta aleatoria del nivel indicado */
router.get('/next', async (req: AuthRequest, res) => {
  const level = Number(req.query.level ?? 1);
  const q = await prisma.question.findFirst({
    where: { level },
    include: { options: { select: { id: true, text: true } } },
  });
  if (!q) return res.status(404).json({ error: 'No question' });
  res.json(q);
});

export default router;
```

### 5.5  Lógica del juego

`src/services/gameService.ts`

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function startNewGame(userId: number) {
  return prisma.game.create({
    data: { userId, currentStep: 1, wonAmount: 0, finished: false },
  });
}

export async function answerQuestion(
  gameId: number,
  questionId: number,
  optionId: number
) {
  const opt = await prisma.option.findUnique({ where: { id: optionId } });
  if (!opt) throw new Error('Option not found');

  const isCorrect = opt.isCorrect;
  const game = await prisma.game.findUnique({ where: { id: gameId } });

  if (!game) throw new Error('Game not found');

  // actualizar paso
  let newStep = game.currentStep + (isCorrect ? 1 : 0);
  let wonAmount = isCorrect ? prizeForStep(game.currentStep) : 0;

  await prisma.game.update({
    where: { id: gameId },
    data: {
      currentStep: newStep,
      wonAmount,
      finished: !isCorrect || newStep > 15,
    },
  });

  // actualizar puntuación del usuario (simplemente acumular)
  if (!isCorrect) {
    await prisma.user.update({
      where: { id: game.userId },
      data: { score: { increment: wonAmount } },
    });
  }

  return { isCorrect, wonAmount, nextStep: newStep };
}

/* tabla de premios (puede extraerse a DB) */
function prizeForStep(step: number): number {
  const prizes = [
    0,
    100, 200, 300, 500, 1_000, // 5 → “seguro”
    2_000, 4_000, 8_000, 16_000, 32_000, // 10 → “seguro”
    64_000, 125_000, 250_000, 500_000, 1_000_000,
  ];
  return prizes[step] ?? 0;
}
```

### 5.6  Game router (usar el service)

`src/api/game.ts`

```ts
import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { startNewGame, answerQuestion } from '../services/gameService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

/* POST /api/game/start → crea juego y devuelve ID y primer nivel */
router.post('/start', async (req: AuthRequest, res) => {
  const game = await startNewGame(req.userId!);
  res.json({ gameId: game.id, currentStep: game.currentStep });
});

/* POST /api/game/answer */
router.post('/answer', async (req: AuthRequest, res) => {
  const { gameId, questionId, optionId } = req.body;
  if (!gameId || !questionId || !optionId) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await answerQuestion(gameId, questionId, optionId);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
```

---

## 6️⃣  Frontend – Principales componentes

> **Todas las piezas están tipadas con TypeScript**.  
> **Tailwind** permite un UI claro sin CSS adicional.

### 6.1  `src/services/api.ts` – Wrapper con JWT

```ts
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers ?? {}),
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? 'API error');
  }
  return response.json();
}
```

### 6.2  Hook `useGame`

`src/hooks/useGame.ts`

```ts
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface Question {
  id: number;
  level: number;
  question: string;
  options: { id: number; text: string }[];
}

export function useGame() {
  const [gameId, setGameId] = useState<number | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [step, setStep] = useState(1);
  const [won, setWon] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  // iniciar partida
  const start = async () => {
    const data = await api<{ gameId: number; currentStep: number }>('/game/start', {
      method: 'POST',
    });
    setGameId(data.gameId);
    setStep(data.currentStep);
    await loadQuestion(data.currentStep);
  };

  const loadQuestion = async (level: number) => {
    setLoading(true);
    const q = await api<Question>(`/questions/next?level=${level}`);
    setQuestion(q);
    setLoading(false);
  };

  const answer = async (optionId: number) => {
    if (!gameId || !question) return;
    const res = await api<{
      isCorrect: boolean;
      wonAmount: number;
      nextStep: number;
    }>('/game/answer', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        questionId: question.id,
        optionId,
      }),
    });

    if (res.isCorrect) {
      setWon(res.wonAmount);
      if (res.nextStep > 15) {
        setStatus('won');
      } else {
        setStep(res.nextStep);
        await loadQuestion(res.nextStep);
      }
    } else {
      setStatus('lost');
      setWon(res.wonAmount);
    }
  };

  return {
    start,
    answer,
    question,
    step,
    won,
    loading,
    status,
  };
}
```

### 6.3  `Play.tsx` – Vista principal del juego

```tsx
import { useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import QuestionCard from '../components/QuestionCard';
import GameBoard from '../components/GameBoard';

export default function Play() {
  const { start, answer, question, step, won, loading, status } = useGame();

  useEffect(() => {
    start();
  }, []);

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  if (status === 'won')
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold">¡Ganaste 1 000 000!</h1>
        <p className="mt-4">Has alcanzado el premio máximo.</p>
      </div>
    );

  if (status === 'lost')
    return (
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold">¡Has perdido!</h1>
        <p className="mt-4">Llevabas {won.toLocaleString()}€.</p>
        <button
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={start}
        >
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="flex flex-col items-center">
      <GameBoard currentStep={step} />

      {question && (
        <QuestionCard
          question={question}
          onSelect={(optionId) => answer(optionId)}
        />
      )}
    </div>
  );
}
```

### 6.4  `QuestionCard.tsx`

```tsx
import { Question } from '../hooks/useGame';

interface Props {
  question: Question;
  onSelect: (optionId: number) => void;
}
export default function QuestionCard({ question, onSelect }: Props) {
  return (
    <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-xl font-semibold">{question.question}</h2>
      <ul className="mt-4 space-y-2">
        {question.options.map((opt) => (
          <li key={opt.id}>
            <button
              className="w-full text-left px-4 py-2 border rounded hover:bg-indigo-100"
              onClick={() => onSelect(opt.id)}
            >
              {opt.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 6.5  `GameBoard.tsx` – Escalera de premios

```tsx
const PRIZES = [
  0,
  100,
  200,
  300,
  500,
  1_000,
  2_000,
  4_000,
  8_000,
  16_000,
  32_000,
  64_000,
  125_000,
  250_000,
  500_000,
  1_000_000,
];

export default function GameBoard({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {PRIZES.slice(1).reverse().map((p, idx) => {
        const step = PRIZES.length - idx - 1;
        const active = step === currentStep;
        return (
          <div
            key={step}
            className={`p-2 text-center rounded ${
              active ? 'bg-indigo-600 text-white' : 'bg-gray-100'
            }`}
          >
            {step}. {p.toLocaleString()}€
          </div>
        );
      })}
    </div>
  );
}
```

### 6.6  Rutas de la SPA (`src/main.tsx`)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Play from './pages/Play';
import Result from './pages/Result';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/result" element={<Result />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
```

> **Home.tsx** contiene formulario de login/registro (usa `api('/auth/...')`).  
> **Result.tsx** muestra el resumen y permite volver al inicio.

---

## 7️⃣  Docker & Deploy

### 7.1  Dockerfile – Backend

`backend/.docker/Dockerfile.backend`

```Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npm ci --omit=dev && npm install -g prisma
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### 7.2  Dockerfile – Frontend

`frontend/.docker/Dockerfile.frontend`

```Dockerfile
# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # vite builds to /dist

# ---- Production ----
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 7.3  docker‑compose (dev)

`.docker/docker-compose.yml`

```yaml
version: '3.9'
services:
  db:
    image: postgres:15-alpine
    container_name: db
    environment:
      POSTGRES_USER: millionaire
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: millionaire
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: ../.docker/Dockerfile.backend
    env_file:
      - ./backend/.env.dev
    depends_on:
      - db
    ports:
      - "4000:4000"

  frontend:
    build:
      context: ./frontend
      dockerfile: ../.docker/Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

**Variables de entorno** (`backend/.env.dev`)

```
DATABASE_URL=postgresql://millionaire:secret@db:5432/millionaire?schema=public
JWT_SECRET=YOUR_SUPER_SECRET_!CHANGE_ME
CORS_ORIGIN=*
PORT=4000
```

**Pasos para arrancar localmente**

```bash
# 1️⃣ Clona el repo
git clone <repo-url>
cd millionaire-math

# 2️⃣ Lanza los contenedores
docker compose -f .docker/docker-compose.yml up --build -d

# 3️⃣ Ejecuta migrations + seed (solo la primera vez)
docker exec -it backend sh -c "npx prisma migrate deploy && node prisma/seed.js"

# 4️⃣ Abre http://localhost en el navegador
```

### 7.4  Deploy a la nube (ejemplo con Vercel + Render)

#### 7.4.1  Frontend → Vercel
1. Conecta el repositorio a Vercel.
2. En **Settings → Build & Output Settings** elige `npm run build` (el script ya está en `frontend/package.json`).
3. Vercel detectará automáticamente el *output directory* `dist`.
4. Añade la variable de entorno `VITE_API_URL` apuntando a tu backend (`https://api‑millionaire.onrender.com/api`).

#### 7.4.2  Backend → Render (Docker)

1. Crea un nuevo *Web Service* → **Docker** → apunta al repositorio y a la ruta `backend/.docker/Dockerfile.backend`.
2. En **Environment** agrega:
    - `DATABASE_URL` (string de conexión a PostgreSQL en Render DB)
    - `JWT_SECRET`
    - `CORS_ORIGIN=*` (o tu dominio Vercel)
3. Habilita el *Auto Deploy* a la rama `main`.
4. Render crea automáticamente la base de datos PostgreSQL; ejecuta `prisma migrate deploy` y `seed.js` una vez usando *Shell* en la consola de Render.

> **Alternativa**: Usar **Fly.io** para ambas capas (con *flyctl*). El mismo `docker-compose.yml` puede transformarse a `fly.toml`.

---

## 8️⃣  Tests (quickstart)

### Backend (`backend/test/game.test.ts`)

```ts
import request from 'supertest';
import app from '../src/index'; // exporta la app sin listen()
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

let token: string;
let gameId: number;

beforeAll(async () => {
  // crear usuario de prueba
  await request(app).post('/api/auth/register').send({
    email: 'test@example.com',
    password: 'password123',
  });
  const login = await request(app).post('/api/auth/login').send({
    email: 'test@example.com',
    password: 'password123',
  });
  token = login.body.token;
});

test('Start game', async () => {
  const res = await request(app)
    .post('/api/game/start')
    .set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.gameId).toBeDefined();
  gameId = res.body.gameId;
});

test('Answer correct question', async () => {
  const q = await request(app)
    .get('/api/questions/next?level=1')
    .set('Authorization', `Bearer ${token}`);

  const correctOption = q.body.options.find((o: any) => o.isCorrect);
  const ans = await request(app)
    .post('/api/game/answer')
    .set('Authorization', `Bearer ${token}`)
    .send({
      gameId,
      questionId: q.body.id,
      optionId: correctOption.id,
    });

  expect(ans.body.isCorrect).toBe(true);
  expect(ans.body.nextStep).toBe(2);
});
```

### Frontend (`frontend/src/components/QuestionCard.test.tsx`)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionCard from './QuestionCard';
import '@testing-library/jest-dom';

const dummy = {
  id: 1,
  level: 1,
  question: '¿Cuánto es 2+2?',
  options: [
    { id: 10, text: '3' },
    { id: 11, text: '4' },
    { id: 12, text: '5' },
    { id: 13, text: '6' },
  ],
};

test('renders question and fires onSelect', () => {
  const onSelect = vi.fn();
  render(<QuestionCard question={dummy} onSelect={onSelect} />);

  expect(screen.getByText(dummy.question)).toBeInTheDocument();
  fireEvent.click(screen.getByText('4'));
  expect(onSelect).toHaveBeenCalledWith(11);
});
```

Ejecutar:

```bash
# backend
npm run test

# frontend
npm run test
```

---

## 9️⃣  📄  README.md (lista completa)

> A continuación tienes el contenido completo del `README.md`.  
> Copia‑pégalo en la raíz del proyecto.

```markdown
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
# 1️⃣ Clone repository
git clone https://github.com/youruser/millionaire-math.git
cd millionaire-math

# 2️⃣ Build & run containers
docker compose -f .docker/docker-compose.yml up --build -d

# 3️⃣ Run DB migrations + seed (first time only)
docker exec -it backend sh -c "npx prisma migrate deploy && node prisma/seed.js"

# 4️⃣ Open the app
# Frontend: http://localhost
# API: http://localhost:4000/api
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
# Backend
cd backend
npm install
npm run dev   # nodemon watches src/**/*.ts

# Frontend
cd ../frontend
npm install
npm run dev   # Vite dev server (localhost:5173)
```

Add a `.env` file in each folder following `.env.example`.

---

## Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
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