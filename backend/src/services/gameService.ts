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
    100, 200, 300, 500, 1_000, // 5 → "seguro"
    2_000, 4_000, 8_000, 16_000, 32_000, // 10 → "seguro"
    64_000, 125_000, 250_000, 500_000, 1_000_000,
  ];
  return prizes[step] ?? 0;
}