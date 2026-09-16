import { Router } from 'express';
import * as equipmentController from '../controllers/equipment.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  createEquipmentSchema,
  equipmentIdSchema,
  equipmentListQuerySchema,
  updateEquipmentSchema,
} from '../validators/equipment.validator.js';

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
