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