import { useState } from 'react';
import { api } from '../services/api';

interface Props {
  gameId: number;
  questionId: number;
  onFiftyFifty: (remaining: { id: number; text: string }[]) => void;
}

export default function LifelineButton({ gameId, questionId, onFiftyFifty }: Props) {
  const [used, setUsed] = useState(false);

  const useFiftyFifty = async () => {
    try {
      const res = await api<{ remainingOptions: { id: number; text: string }[] }>('/lifelines/fifty-fifty', {
        method: 'POST',
        body: JSON.stringify({ gameId, questionId }),
      });
      setUsed(true);
      onFiftyFifty(res.remainingOptions);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      onClick={useFiftyFifty}
      disabled={used}
      className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
    >
      50/50 {used ? '(Used)' : ''}
    </button>
  );
}