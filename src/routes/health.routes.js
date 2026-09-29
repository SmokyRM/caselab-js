import { Router } from 'express';
import * as healthController from '../controllers/health.controller.js';

const healthRouter = Router();

healthRouter.get('/health', healthController.getHealth);
healthRouter.get('/health/live', healthController.getLiveness);
healthRouter.get('/health/ready', healthController.getReadiness);

export default healthRouter;
