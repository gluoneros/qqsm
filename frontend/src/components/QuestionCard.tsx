import { Question } from '../hooks/useGame';

interface Props {
  question: Question;
  onSelect: (optionId: number) => void;
  remainingOptions?: { id: number; text: string }[];
}
export default function QuestionCard({ question, onSelect, remainingOptions }: Props) {
  const options = remainingOptions || question.options;
  return (
    <div className="max-w-xl w-full bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-xl font-semibold">{question.question}</h2>
      <ul className="mt-4 space-y-2">
        {options.map((opt) => (
          <li key={opt.id}>
            <button
              className="w-full text-left px-4 py-2 border rounded hover:bg-indigo-100"
              onClick={() => onSelect(opt.id)}
            >
              {opt.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}