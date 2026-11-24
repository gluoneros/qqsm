import { useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';
import QuestionCard from '../components/QuestionCard';
import GameBoard from '../components/GameBoard';
import LifelineButton from '../components/LifelineButton';

export default function Play() {
  const { start, answer, question, step, won, loading, status } = useGame();
  const [gameId, setGameId] = useState<number | null>(null);
  const [remainingOptions, setRemainingOptions] = useState<{ id: number; text: string }[] | null>(null);

  useEffect(() => {
    const init = async () => {
      const data = await start();
      setGameId(data.gameId);
    };
    init();
  }, []);

  const handleFiftyFifty = (remaining: { id: number; text: string }[]) => {
    setRemainingOptions(remaining);
  };

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
          onClick={() => window.location.reload()}
        >
          Reintentar
        </button>
      </div>
    );

  return (
    <div className="flex flex-col items-center">
      <GameBoard currentStep={step} />

      {question && gameId && (
        <>
          <LifelineButton
            gameId={gameId}
            questionId={question.id}
            onFiftyFifty={handleFiftyFifty}
          />
          <QuestionCard
            question={question}
            onSelect={(optionId) => answer(optionId)}
            remainingOptions={remainingOptions || undefined}
          />
        </>
      )}
    </div>
  );
}