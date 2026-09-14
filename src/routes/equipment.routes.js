import { Router } from 'express';
import * as equipmentController from '../controllers/equipment.controller.js';
import { getWeather } from '../controllers/equipmentWeather.controller.js';
import { listEquipmentRequests } from '../controllers/request.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  createEquipmentSchema,
  equipmentIdSchema,
  equipmentListQuerySchema,
  updateEquipmentSchema,
} from '../validators/equipment.validator.js';
import { requestListQuerySchema } from '../validators/request.validator.js';
import { equipmentWeatherQuerySchema } from '../validators/weather.validator.js';

const equipmentRouter = Router();

equipmentRouter.get(
  '/',
  validate({ query: equipmentListQuerySchema }),
  equipmentController.listEquipment
);

equipmentRouter.post(
  '/',
  validate({ body: createEquipmentSchema }),
  equipmentController.createEquipment
);

equipmentRouter.get(
  '/:id/requests',
  validate({ params: equipmentIdSchema, query: requestListQuerySchema }),
  listEquipmentRequests
);

equipmentRouter.get(
  '/:id/weather',
  validate({ params: equipmentIdSchema, query: equipmentWeatherQuerySchema }),
  getWeather
);

equipmentRouter.get(
  '/:id',
  validate({ params: equipmentIdSchema }),
  equipmentController.getEquipment
);

equipmentRouter.patch(
  '/:id',
  validate({ params: equipmentIdSchema, body: updateEquipmentSchema }),
  equipmentController.updateEquipment
);

equipmentRouter.delete(
  '/:id',
  validate({ params: equipmentIdSchema }),
  equipmentController.deleteEquipment
);

export default equipmentRouter;
