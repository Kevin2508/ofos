import { catchAsync } from '../../middlewares/catch.async.ts';
import { Request, Response } from 'express';
import {
  acceptAssignmentService,
  declineAssignmentService,
  getAllAssignmentsService,
  getAssignmentByIdService,
  getEarningsHistoryService,
  getEarningsService,
  getPerformanceService,
  uploadDocumentService,
  getProfileService,
  updateProfileService,
  updateStatusService,
  pickupOrderService,
  markOutForDeliveryService,
  deliverOrderService,
  reportDeliveryIssueService,
  updateLocationService,
} from './deliveryPartner.service.ts';

const getProfile = catchAsync(async (req: Request, res: Response) => {
  let data;
  if (req.user?.id) {
    data = await getProfileService(req.user?.id as string);
  }

  res.status(200).json({
    status: 'success',
    message: data?.message,
    user: data?.user,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  let data;

  if (req.user?.id) {
    data = await updateProfileService(req.user?.id as string, req.body);
  }

  res.status(200).json({
    status: 'success',
    message: data?.message,
    user: data?.user,
  });
});

// Route: deliveryPartnerRouter.patch('/update/status', validate(updateStatusSchema), updateStatus);

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  let data;

  if (req.user?.id) {
    data = await updateStatusService(req.user.id as string, req.body.isOnline);
  }

  res.status(200).json({
    status: 'success',
    message: data?.message,
    data: {
      isOnline: data?.isOnline,
    },
  });
});

const uploadDocuments = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new Error('Unauthorized');
  }

  if (!req.file) {
    throw new Error('Please upload a document image');
  }

  const data = await uploadDocumentService(
    req.user.id as string,
    req.body.documentType,
    req.file.path
  );

  res.status(201).json({
    status: 'success',
    message: data.message,
    document: data.document,
  });
});

const getAllAssignments = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new Error('Unauthorized access');
  }

  const statusFilter = req.query.status as string | undefined;

  const data = await getAllAssignmentsService(req.user.id as string, statusFilter);

  res.status(200).json({
    status: 'success',
    message: data.message,
    assignments: data.assignments,
  });
});

const getAssignmentById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new Error('Unauthorized access');
  }

  const { assignmentId } = req.params;

  const data = await getAssignmentByIdService(
    assignmentId as string,
    req.user.id as string
  );

  res.status(200).json({
    status: 'success',
    message: data.message,
    assignment: data.assignment,
  });
});

const acceptAssignment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new Error('Unauthorized access');
  }

  const { assignmentId } = req.params;

  const data = await acceptAssignmentService(
    assignmentId as string,
    req.user.id as string
  );

  res.status(200).json({
    status: 'success',
    message: data.message,
    assignment: data.assignment,
  });
});

const declineAssignment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new Error('Unauthorized access');
  }

  const { assignmentId } = req.params;

  const data = await declineAssignmentService(
    assignmentId as string,
    req.user.id as string
  );

  res.status(200).json({
    status: 'success',
    message: data.message,
    assignment: data.assignment,
  });
});

const pickupOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');
  const { assignmentId } = req.params;
  const data = await pickupOrderService(assignmentId as string, req.user.id as string);
  res.status(200).json({ status: 'success', message: data.message });
});

const outForDeliveryOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');
  const { assignmentId } = req.params;
  const data = await markOutForDeliveryService(assignmentId as string, req.user.id as string);
  res.status(200).json({ status: 'success', message: data.message });
});

const deliverOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');
  const { assignmentId } = req.params;
  const { otp } = req.body;
  if (!otp) throw new Error('OTP is required for delivery');
  const data = await deliverOrderService(assignmentId as string, req.user.id as string, otp as string);
  res.status(200).json({ status: 'success', message: data.message });
});

const reportDeliveryIssue = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');
  const { assignmentId } = req.params;
  const { issueReason } = req.body;
  if (!issueReason) throw new Error('issueReason is required');
  const data = await reportDeliveryIssueService(assignmentId as string, req.user.id as string, issueReason as string);
  res.status(200).json({ status: 'success', message: data.message });
});

const updateLocation = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');
  const { assignmentId } = req.params;
  const { latitude, longitude } = req.body;
  if (latitude === undefined || longitude === undefined) throw new Error('Latitude and longitude are required');
  const data = await updateLocationService(req.user.id as string, assignmentId as string, parseFloat(latitude), parseFloat(longitude));
  res.status(200).json({ status: 'success', message: data.message });
});

const getMyEarnings = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');

  const period = req.query.period as 'today' | 'weekly' | 'monthly';
  const data = await getEarningsService(req.user.id as string, period);

  res.status(200).json({ status: 'success', ...data });
});

const getMyEarningsHistory = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');

  const limit = parseInt(req.query.limit as string) || 20;
  const page = parseInt(req.query.page as string) || 1;
  const data = await getEarningsHistoryService(req.user.id as string, limit, page);

  res.status(200).json({ status: 'success', ...data });
});

const getMyPerformance = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');

  const data = await getPerformanceService(req.user.id as string);

  res.status(200).json({ status: 'success', ...data });
});

export {
  getProfile,
  updateProfile,
  updateStatus,
  uploadDocuments,
  getAllAssignments,
  getAssignmentById,
  acceptAssignment,
  declineAssignment,
  getMyEarnings,
  getMyEarningsHistory,
  getMyPerformance,
  pickupOrder,
  outForDeliveryOrder,
  deliverOrder,
  reportDeliveryIssue,
  updateLocation,
};
