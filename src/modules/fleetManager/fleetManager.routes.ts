import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';

const fleetManagerRouter = Router();

fleetManagerRouter.use(authenticate);

fleetManagerRouter.use(authorize('Fleet_manager'));

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

// Get real-time positions of all Method Endpoint Description online delivery partners (Socket.IO data snapshot).
// fleetManagerRouter.get("/live-map", getLiveMap);

export { fleetManagerRouter };
