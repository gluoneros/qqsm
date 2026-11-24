import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middlewares/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

// POST /api/lifelines/fifty-fifty
router.post('/fifty-fifty', async (req: AuthRequest, res) => {
  const { gameId, questionId } = req.body;
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.usedFiftyFifty) return res.status(400).json({ error: 'Already used or invalid game' });

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: true },
  });
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const correctOption = question.options.find(o => o.isCorrect);
  const wrongOptions = question.options.filter(o => !o.isCorrect);
  // Remove two wrong options
  const remainingWrong = wrongOptions.slice(0, 2);

  if (!correctOption) return res.status(500).json({ error: 'Question has no correct option' });

  await prisma.game.update({
    where: { id: gameId },
    data: { usedFiftyFifty: true },
  });

  res.json({
    remainingOptions: [correctOption, ...remainingWrong].map(o => ({ id: o.id, text: o.text })),
  });
});

export default router;