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