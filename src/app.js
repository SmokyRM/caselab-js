import express from 'express';
import healthRouter from './routes/health.routes.js';

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use('/api', healthRouter);

export default app;
