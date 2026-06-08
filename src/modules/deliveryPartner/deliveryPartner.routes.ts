import { Router } from 'express';
import {
<<<<<<< HEAD
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
=======
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
>>>>>>> a20beab (Delivery Partner Module v1)

const deliveryPartnerRouter = Router();

deliveryPartnerRouter.use(authenticate);

deliveryPartnerRouter.use(authorize('Delivery_partner'));

deliveryPartnerRouter.get('/profile', getProfile);

deliveryPartnerRouter.patch(
  '/update/profile',
  validate(updateProfileSchema),
  updateProfile
);

<<<<<<< HEAD
=======
// deliveryPartnerRouter.post('/documents', uploadDocuments)

>>>>>>> a20beab (Delivery Partner Module v1)
deliveryPartnerRouter.patch(
  '/update/status',
  validate(updateStatusSchema),
  updateStatus
);

<<<<<<< HEAD
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
=======
// deliveryPartnerRouter.get('/assignments/all', getAllAssignments)

// deliveryPartnerRouter.get('/assignments/:assignmentId', getAssignmentById)

// deliveryPartnerRouter.patch('/assignments/:assignmentId/accept', acceptAssignment)

// decline with reason
// deliveryPartnerRouter.patch('/assignments/:assignmentId/decline', declineAssignment)
>>>>>>> a20beab (Delivery Partner Module v1)

// deliveryPartnerRouter.patch('/assignments/:assignmentId/pickup', pickupAssignment)

// mark order delivered with otp or photo
// deliveryPartnerRouter.patch('/assignments/:assignmentId/deliver', deliverAssignment)

// deliveryPartnerRouter.post('/assignments/:assignmentId/report-issue', reportDeliveryIssue)

<<<<<<< HEAD
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
=======
// today, weekly, monthly
// deliveryPartnerRouter.get('/earnings', getMyEarnings);

// Get itemised earning history per delivery
// deliveryPartnerRouter.get('/earnings/history', getMyEarnings);

// Get performance metrics (acceptance rate, on-time rate, rating)
// deliveryPartnerRouter.get('/performance', getMyPerformance);
>>>>>>> a20beab (Delivery Partner Module v1)

export { deliveryPartnerRouter };
