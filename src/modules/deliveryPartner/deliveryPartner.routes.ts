import { Router } from 'express';
import {
  acceptAssignment,
  declineAssignment,
  getAllAssignments,
  getAssignmentById,
  getMyEarnings,
  getMyEarningsHistory,
  getMyPerformance,
  getProfile,
  updateProfile,
  updateStatus,
  uploadDocuments,
  pickupOrder,
  deliverOrder,
  reportDeliveryIssue,
  updateLocation,
} from './deliveryPartner.controller.ts';
import { authenticate, authorize } from '../../middlewares/auth.middleware.ts';
import {
  validate,
  validateParams,
  validateQuery,
} from '../../middlewares/validation.middleware.ts';
import {
  assignmentIdSchema,
  getAssignmentsQuerySchema,
  getEarningsHistorySchema,
  getEarningsSchema,
  updateProfileSchema,
  updateStatusSchema,
  uploadDocumentSchema,
} from './deliveryPartner.validation.ts';
import { upload } from '../../middlewares/upload.middleware.ts';

const deliveryPartnerRouter = Router();

deliveryPartnerRouter.use(authenticate);

deliveryPartnerRouter.use(authorize('Delivery_partner'));

deliveryPartnerRouter.get('/profile', getProfile);

deliveryPartnerRouter.patch(
  '/update/profile',
  validate(updateProfileSchema),
  updateProfile
);

deliveryPartnerRouter.patch(
  '/update/status',
  validate(updateStatusSchema),
  updateStatus
);

deliveryPartnerRouter.post(
  '/documents',
  upload.single('delivery-partner-document'),
  validate(uploadDocumentSchema),
  uploadDocuments
);

// deliveryPartnerRouter.get('/assignments/all', getAllAssignments)
deliveryPartnerRouter.get(
  '/assignments/all',
  validateQuery(getAssignmentsQuerySchema),
  getAllAssignments
);

deliveryPartnerRouter.get(
  '/assignments/:assignmentId',
  validateParams(assignmentIdSchema),
  getAssignmentById
);

deliveryPartnerRouter.patch(
  '/assignments/:assignmentId/accept',
  validateParams(assignmentIdSchema),
  acceptAssignment
);

deliveryPartnerRouter.patch(
  '/assignments/:assignmentId/decline',
  validateParams(assignmentIdSchema),
  declineAssignment
);

deliveryPartnerRouter.patch(
  '/assignments/:assignmentId/pickup',
  validateParams(assignmentIdSchema),
  pickupOrder
);

deliveryPartnerRouter.patch(
  '/assignments/:assignmentId/deliver',
  validateParams(assignmentIdSchema),
  deliverOrder
);

deliveryPartnerRouter.post(
  '/assignments/:assignmentId/report-issue',
  validateParams(assignmentIdSchema),
  reportDeliveryIssue
);

deliveryPartnerRouter.post(
  '/assignments/:assignmentId/location',
  validateParams(assignmentIdSchema),
  updateLocation
);

deliveryPartnerRouter.get(
  '/earnings',
  validateQuery(getEarningsSchema),
  getMyEarnings
);

deliveryPartnerRouter.get(
  '/earnings/history',
  validateQuery(getEarningsHistorySchema),
  getMyEarningsHistory
);

deliveryPartnerRouter.get('/performance', getMyPerformance);

export { deliveryPartnerRouter };
