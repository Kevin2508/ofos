import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';
import {
  validate,
  validateParams,
} from '../../middlewares/validation.middleware.ts';
import {
  assignDelivery,
  getAllAssignments,
  getAllDeliveryPartners,
  getDeliveryPartnerById,
  reassignDelivery,
  updateDeliveryPartnerStatus,
} from './fleetManager.controller.ts';
import {
  assignDeliverySchema,
  getDeliveryPartnerByIdSchema,
  reassignDeliverySchema,
  updatePartnerStatusSchema,
} from './fleetManager.validation.ts';

const fleetManagerRouter = Router();

fleetManagerRouter.use(authenticate);

fleetManagerRouter.use(authorize('Fleet_manager'));

fleetManagerRouter.get('/delivery-partners/all', getAllDeliveryPartners);

fleetManagerRouter.get(
  '/delivery-partner/:id',
  validateParams(getDeliveryPartnerByIdSchema),
  getDeliveryPartnerById
);

fleetManagerRouter.patch(
  '/delivery-partner/:id/update/status',
  validate(updatePartnerStatusSchema),
  updateDeliveryPartnerStatus
);

fleetManagerRouter.get('/all/assignments', getAllAssignments);

fleetManagerRouter.post(
  '/:orderId/assign',
  validate(assignDeliverySchema),
  assignDelivery
);

fleetManagerRouter.patch(
  '/:id/reassign',
  validate(reassignDeliverySchema),
  reassignDelivery
);

// Get real-time positions of all Method Endpoint Description online delivery partners (Socket.IO data snapshot).
// fleetManagerRouter.get("/live-map", getLiveMap);

export { fleetManagerRouter };
