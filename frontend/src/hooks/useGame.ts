import { useState } from 'react';
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
    return data;
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