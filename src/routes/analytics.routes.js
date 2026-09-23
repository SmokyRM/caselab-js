import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  equipmentLoadQuerySchema,
  siteIdSchema,
} from '../validators/analytics.validator.js';

const analyticsRouter = Router();

analyticsRouter.get(
  '/sites/:id/summary',
  validate({ params: siteIdSchema }),
  analyticsController.getSiteSummary
);

analyticsRouter.get(
  '/reports/equipment-load',
  validate({ query: equipmentLoadQuerySchema }),
  analyticsController.getEquipmentLoad
);

export default analyticsRouter;
