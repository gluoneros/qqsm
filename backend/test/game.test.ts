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