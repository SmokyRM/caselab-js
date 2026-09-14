import express from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import equipmentRouter from './routes/equipment.routes.js';
import healthRouter from './routes/health.routes.js';
import requestRouter from './routes/request.routes.js';

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use('/api', healthRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/requests', requestRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
