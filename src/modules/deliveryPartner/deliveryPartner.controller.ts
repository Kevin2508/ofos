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
} from './deliveryPartner.service.ts';

const getProfile = catchAsync(async (req: Request, res: Response) => {
  let data;
  if (req.user?.id) {
    data = await getProfileService(req.user?.id);
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
    data = await updateProfileService(req.user?.id, req.body);
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
    data = await updateStatusService(req.user.id, req.body.isOnline);
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
    req.user.id,
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

  const data = await getAllAssignmentsService(req.user.id, statusFilter);

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
    req.user.id
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
    req.user.id
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
    req.user.id
  );

  res.status(200).json({
    status: 'success',
    message: data.message,
    assignment: data.assignment,
  });
});

const getMyEarnings = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');

  const period = req.query.period as 'today' | 'weekly' | 'monthly';
  const data = await getEarningsService(req.user.id, period);

  res.status(200).json({ status: 'success', ...data });
});

const getMyEarningsHistory = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');

  const limit = parseInt(req.query.limit as string) || 20;
  const page = parseInt(req.query.page as string) || 1;
  const data = await getEarningsHistoryService(req.user.id, limit, page);

  res.status(200).json({ status: 'success', ...data });
});

const getMyPerformance = catchAsync(async (req: Request, res: Response) => {
  if (!req.user?.id) throw new Error('Unauthorized access');

  const data = await getPerformanceService(req.user.id);

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
};
