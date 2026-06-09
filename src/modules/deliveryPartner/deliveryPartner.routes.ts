import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateStatus,
} from './deliveryPartner.controller.ts';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';
import { validate } from '../../middlewares/validation.middleware.ts';
import {
  updateProfileSchema,
  updateStatusSchema,
} from './deliveryPartner.validation.ts';

const deliveryPartnerRouter = Router();

deliveryPartnerRouter.use(authenticate);

deliveryPartnerRouter.use(authorize('Delivery_partner'));

deliveryPartnerRouter.get('/profile', getProfile);

deliveryPartnerRouter.patch(
  '/update/profile',
  validate(updateProfileSchema),
  updateProfile
);

// deliveryPartnerRouter.post('/documents', uploadDocuments)

deliveryPartnerRouter.patch(
  '/update/status',
  validate(updateStatusSchema),
  updateStatus
);

// deliveryPartnerRouter.get('/assignments/all', getAllAssignments)

// deliveryPartnerRouter.get('/assignments/:assignmentId', getAssignmentById)

// deliveryPartnerRouter.patch('/assignments/:assignmentId/accept', acceptAssignment)

// decline with reason
// deliveryPartnerRouter.patch('/assignments/:assignmentId/decline', declineAssignment)

// deliveryPartnerRouter.patch('/assignments/:assignmentId/pickup', pickupAssignment)

// mark order delivered with otp or photo
// deliveryPartnerRouter.patch('/assignments/:assignmentId/deliver', deliverAssignment)

// deliveryPartnerRouter.post('/assignments/:assignmentId/report-issue', reportDeliveryIssue)

// today, weekly, monthly
// deliveryPartnerRouter.get('/earnings', getMyEarnings);

// Get itemised earning history per delivery
// deliveryPartnerRouter.get('/earnings/history', getMyEarnings);

// Get performance metrics (acceptance rate, on-time rate, rating)
// deliveryPartnerRouter.get('/performance', getMyPerformance);

export { deliveryPartnerRouter };
