import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';
<<<<<<< HEAD
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
=======
>>>>>>> a20beab (Delivery Partner Module v1)

const fleetManagerRouter = Router();

fleetManagerRouter.use(authenticate);

fleetManagerRouter.use(authorize('Fleet_manager'));

<<<<<<< HEAD
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
=======
// List all delivery partners with current status and active assignment.
// fleetManagerRouter.get("/all/delivery-partners", getAllDeliveryPartners);

// Get a specific partner's profile, earnings, and performance.
// fleetManagerRouter.get("/delivery-partner/:id", getDeliveryPartnerById);

// Admin-override partner status (ACTIVE, SUSPENDED).
// fleetManagerRouter.patch("/delivery-partner/:id/update/status", updateDeliveryPartnerStatus);

// List all current active assignments across the fleet.
// fleetManagerRouter.get("/all/assignments", getAllAssignments);

// Manually assign an order to a specific delivery partner.
// fleetManagerRouter.post("/:orderId/assign", assignDelivery);

// Reassign an active delivery to a different partner.
// fleetManagerRouter.patch("/:id/reassign", reassignDelivery);
>>>>>>> a20beab (Delivery Partner Module v1)

// Get real-time positions of all Method Endpoint Description online delivery partners (Socket.IO data snapshot).
// fleetManagerRouter.get("/live-map", getLiveMap);

export { fleetManagerRouter };
