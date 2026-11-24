import { useNavigate } from 'react-router-dom';

export default function Result() {
  const navigate = useNavigate();

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Resultados</h1>
      <p className="mt-4">Aquí puedes mostrar estadísticas o algo.</p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Volver al inicio
      </button>
    </div>
  );
}