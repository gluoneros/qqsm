import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { json, urlencoded } from 'body-parser';
import authRouter from './api/auth';
import gameRouter from './api/game';
import questionsRouter from './api/questions';
import adminRouter from './api/admin';
import lifelinesRouter from './api/lifelines';
import { errorHandler } from './utils/errorHandler';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(json());
app.use(urlencoded({ extended: true }));

// Rutas públicas
app.use('/api/auth', authRouter);

// Rutas protegidas (middleware de JWT)
app.use('/api/game', gameRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/lifelines', lifelinesRouter);

// Captura de errores
app.use(errorHandler);

// Export for testing
export default app;

const PORT = process.env.PORT ?? 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 API listening on ${PORT}`));
}