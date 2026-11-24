const PRIZES = [
  0,
  100,
  200,
  300,
  500,
  1_000,
  2_000,
  4_000,
  8_000,
  16_000,
  32_000,
  64_000,
  125_000,
  250_000,
  500_000,
  1_000_000,
];

export default function GameBoard({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {PRIZES.slice(1).reverse().map((p, idx) => {
        const step = PRIZES.length - idx - 1;
        const active = step === currentStep;
        return (
          <div
            key={step}
            className={`p-2 text-center rounded ${
              active ? 'bg-indigo-600 text-white' : 'bg-gray-100'
            }`}
          >
            {step}. {p.toLocaleString()}€
          </div>
        );
      })}
    </div>
  );
}