import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Question {
  id: number;
  level: number;
  question: string;
  options: { id: number; text: string; isCorrect: boolean }[];
}

export default function Admin() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const data = await api<Question[]>('/admin/questions');
      setQuestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel - Questions</h1>
      <ul className="space-y-4">
        {questions.map((q) => (
          <li key={q.id} className="border p-4 rounded">
            <h2 className="font-semibold">Level {q.level}: {q.question}</h2>
            <ul className="mt-2">
              {q.options.map((opt) => (
                <li key={opt.id} className={opt.isCorrect ? 'font-bold' : ''}>
                  {opt.text}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}