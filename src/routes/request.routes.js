import { Router } from 'express';
import * as requestController from '../controllers/request.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  createRequestSchema,
  requestAssigneeIdSchema,
  requestAssigneesSchema,
  requestIdSchema,
  requestListQuerySchema,
  requestStatusSchema,
  updateRequestSchema,
} from '../validators/request.validator.js';

const requestRouter = Router();

requestRouter.get(
  '/',
  validate({ query: requestListQuerySchema }),
  requestController.listRequests
);

requestRouter.post(
  '/',
  validate({ body: createRequestSchema }),
  requestController.createRequest
);

requestRouter.get(
  '/:id/history',
  validate({ params: requestIdSchema }),
  requestController.getRequestStatusHistory
);

requestRouter.post(
  '/:id/assignees',
  validate({ params: requestIdSchema, body: requestAssigneesSchema }),
  requestController.replaceRequestAssignees
);

requestRouter.delete(
  '/:id/assignees/:userId',
  validate({ params: requestAssigneeIdSchema }),
  requestController.removeRequestAssignee
);

requestRouter.get(
  '/:id',
  validate({ params: requestIdSchema }),
  requestController.getRequest
);

requestRouter.patch(
  '/:id/status',
  validate({ params: requestIdSchema, body: requestStatusSchema }),
  requestController.changeRequestStatus
);

requestRouter.patch(
  '/:id',
  validate({ params: requestIdSchema, body: updateRequestSchema }),
  requestController.updateRequest
);

requestRouter.delete(
  '/:id',
  validate({ params: requestIdSchema }),
  requestController.deleteRequest
);

export default requestRouter;
