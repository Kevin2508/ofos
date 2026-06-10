import { IupdateProfilePayload } from './deliveryPartner.interface.ts';
import {
  acceptAssignmentRepo,
  declineAssignmentRepo,
  getAllAssignmentsRepo,
  getAssignmentByIdRepo,
  getEarningsHistoryRepo,
  getEarningsRepo,
  getPerformanceRepo,
  getProfile,
  updateProfileRepo,
  updateStatusRepo,
  uploadDocumentRepo,
} from './deliveryPartner.repository.ts';

async function getProfileService(userId: string) {
  const user = await getProfile(BigInt(userId));
  return { message: 'user profile fetched', user };
}

async function updateProfileService(
  userId: string,
  updateData: IupdateProfilePayload
) {
  const user = await updateProfileRepo(BigInt(userId), updateData);

  return {
    message: 'Profile updated successfully',
    user,
  };
}

async function updateStatusService(userId: string, isOnline: boolean) {
  const updatedPartner = await updateStatusRepo(BigInt(userId), isOnline);

  if (!updatedPartner) {
    throw new Error('Delivery partner profile not found');
  }

  return {
    message: `You are now ${isOnline ? 'online' : 'offline'}`,
    isOnline: updatedPartner.isOnline,
  };
}

async function uploadDocumentService(
  userId: string,
  documentType: any,
  filePath: string
) {
  const documentUrl = filePath.replace(/\\/g, '/');

  const document = await uploadDocumentRepo(
    BigInt(userId),
    documentType,
    documentUrl
  );

  return {
    message: 'Document uploaded successfully',
    document,
  };
}

async function getAllAssignmentsService(userId: string, statusFilter?: string) {
  const assignments = await getAllAssignmentsRepo(BigInt(userId), statusFilter);

  return {
    message: 'Assignments fetched successfully',
    assignments: assignments || [],
  };
}

async function getAssignmentByIdService(
  assignmentId: string,
  currentUserId: string
) {
  const assignment = await getAssignmentByIdRepo(BigInt(assignmentId));

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  if (assignment.partnerUserId !== currentUserId) {
    throw new Error('You do not have permission to view this assignment');
  }

  return {
    message: 'Assignment fetched successfully',
    assignment,
  };
}

async function acceptAssignmentService(
  assignmentId: string,
  partnerUserId: string
) {
  const assignmentBigInt = BigInt(assignmentId);

  const currentAssignment = await getAssignmentByIdRepo(assignmentBigInt);

  if (!currentAssignment) {
    throw new Error('Assignment not found');
  }

  if (currentAssignment.status !== 'PENDING') {
    throw new Error(
      `Cannot accept this assignment. It is currently marked as ${currentAssignment.status}`
    );
  }

  if (
    currentAssignment.partnerUserId &&
    currentAssignment.partnerUserId !== partnerUserId
  ) {
    throw new Error('You do not have permission to accept this assignment');
  }

  const updatedAssignment = await acceptAssignmentRepo(
    assignmentBigInt,
    BigInt(partnerUserId)
  );

  return {
    message: 'Assignment accepted successfully',
    assignment: updatedAssignment,
  };
}

async function declineAssignmentService(
  assignmentId: string,
  partnerUserId: string
) {
  const assignmentBigInt = BigInt(assignmentId);

  const currentAssignment = await getAssignmentByIdRepo(assignmentBigInt);

  if (!currentAssignment) {
    throw new Error('Assignment not found');
  }

  if (currentAssignment.status !== 'PENDING') {
    throw new Error(
      `Cannot decline this assignment. It is currently marked as ${currentAssignment.status}`
    );
  }

  if (
    currentAssignment.partnerUserId &&
    currentAssignment.partnerUserId !== partnerUserId
  ) {
    throw new Error('You do not have permission to modify this assignment');
  }

  const updatedAssignment = await declineAssignmentRepo(
    assignmentBigInt,
    BigInt(partnerUserId)
  );

  return {
    message: 'Assignment declined successfully',
    assignment: updatedAssignment,
  };
}

async function getEarningsService(
  userId: string,
  period: 'today' | 'weekly' | 'monthly'
) {
  const now = new Date();
  let startDate = new Date();

  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'monthly') {
    startDate.setMonth(now.getMonth() - 1);
  }

  const earnings = await getEarningsRepo(BigInt(userId), startDate);

  return { message: 'Earnings fetched successfully', period, earnings };
}

async function getEarningsHistoryService(
  userId: string,
  limit: number,
  page: number
) {
  const skip = (page - 1) * limit;
  const history = await getEarningsHistoryRepo(BigInt(userId), limit, skip);

  return {
    message: 'Earnings history fetched successfully',
    page,
    limit,
    history,
  };
}

async function getPerformanceService(userId: string) {
  const performance = await getPerformanceRepo(BigInt(userId));

  return { message: 'Performance metrics fetched successfully', performance };
}

export {
  getProfileService,
  updateProfileService,
  updateStatusService,
  uploadDocumentService,
  getAllAssignmentsService,
  getAssignmentByIdService,
  acceptAssignmentService,
  declineAssignmentService,
  getEarningsHistoryService,
  getPerformanceService,
  getEarningsService,
};
