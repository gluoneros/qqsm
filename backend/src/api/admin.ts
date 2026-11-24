import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

// GET /api/admin/questions - list all questions
router.get('/questions', async (req: AuthRequest, res) => {
  const questions = await prisma.question.findMany({
    include: { options: true },
  });
  res.json(questions);
});

// POST /api/admin/questions - add new question
router.post('/questions', async (req: AuthRequest, res) => {
  const { level, question, options } = req.body;
  const q = await prisma.question.create({
    data: {
      level,
      question,
      options: {
        create: options,
      },
    },
    include: { options: true },
  });
  res.json(q);
});

export default router;