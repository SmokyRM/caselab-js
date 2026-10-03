import { Router } from 'express';
import { getMetrics } from '../controllers/metrics.controller.js';

const metricsRouter = Router();

metricsRouter.get('/metrics', getMetrics);

export default metricsRouter;
