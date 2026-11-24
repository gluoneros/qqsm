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