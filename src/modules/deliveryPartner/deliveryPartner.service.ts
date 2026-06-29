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
import { prisma } from '../../config/prisma.ts';
import { updateOrderStatus } from '../orders/order.repository.ts';
import bcrypt from 'bcryptjs';

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

  // Check how many times this order has been declined
  const orderId = currentAssignment.orderId;
  const declineCount = await prisma.deliveryAssignment.count({
    where: { orderId: BigInt(orderId), status: 'DECLINED' },
  });

  if (declineCount >= 3) {
    // Leave it unassigned, Fleet Manager will manually assign
    console.log(`Order ${orderId} declined 3 or more times. Waiting for manual assignment by Fleet Manager.`);
  } else {
    // Attempt auto-assign again
    await triggerAutoAssignment(BigInt(orderId));
  }

  return {
    message: 'Assignment declined successfully',
    assignment: updatedAssignment,
  };
}

export async function triggerAutoAssignment(orderId: bigint) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { branch: true },
  });

  if (!order) return;

  // Find an online delivery partner who is not already declined for this order
  const declinedPartners = await prisma.deliveryAssignment.findMany({
    where: { orderId, status: 'DECLINED' },
    select: { partnerUserId: true }
  });
  const declinedIds = declinedPartners.map(p => p.partnerUserId).filter(Boolean);

  const availablePartner = await prisma.deliveryPartner.findFirst({
    where: {
      isOnline: true,
      status: 'ACTIVE',
      userId: { notIn: declinedIds as bigint[] }
    },
    // Ideally order by distance using Haversine, but for now we pick the first available
    orderBy: { joinedAt: 'asc' }
  });

  if (availablePartner) {
    const assignment = await prisma.deliveryAssignment.create({
      data: {
        orderId,
        partnerUserId: availablePartner.userId,
        assignmentType: 'AUTO',
        status: 'PENDING',
        assignedAt: new Date()
      }
    });
    
    await prisma.deliveryEvent.create({
      data: {
        orderId,
        partnerUserId: availablePartner.userId,
        eventType: 'ASSIGNMENT_AUTO_CREATED',
        eventData: { assignmentId: assignment.id.toString() }
      }
    });
    
    // Calculate dummy earnings
    const deliveryFeeNum = order.deliveryFee ? Number(order.deliveryFee) : 0;
    const finalEarning = deliveryFeeNum > 0 ? deliveryFeeNum : 40;

    console.log(`[PUSH NOTIFICATION/IN-APP ALERT] To Partner ${availablePartner.userId}: New Order Assignment!`);
    console.log(`- Restaurant: ${order.branch?.branchName || 'Restaurant'}`);
    console.log(`- Pickup: ${order.branch?.addressLine1 || 'Restaurant Address'}`);
    console.log(`- Estimated Earnings: ₹${finalEarning}`);
    console.log(`Tap to Accept or Decline.`);
    
    console.log(`Order ${orderId} auto-assigned to partner ${availablePartner.userId}`);

    // Set 60 second timeout to automatically decline if no action taken
    setTimeout(async () => {
      try {
        const currentAssignment = await prisma.deliveryAssignment.findUnique({
          where: { id: assignment.id }
        });
        if (currentAssignment && currentAssignment.status === 'PENDING') {
          console.log(`[TIMEOUT] Assignment ${assignment.id} auto-declined due to no response in 60s`);
          await declineAssignmentService(assignment.id.toString(), availablePartner.userId.toString());
        }
      } catch (err) {
        console.error('Error in auto-decline timeout:', err);
      }
    }, 60 * 1000);
  } else {
    console.log(`No available partners for order ${orderId}`);
  }
}

async function reportDeliveryIssueService(assignmentId: string, partnerUserId: string, issueReason: string) {
  const assignment = await getAssignmentByIdRepo(BigInt(assignmentId));
  if (!assignment || assignment.partnerUserId !== partnerUserId) throw new Error('Invalid assignment');

  await prisma.supportTicket.create({
    data: {
      ticketNumber: `TKT-${Date.now()}`,
      orderId: BigInt(assignment.orderId),
      partnerUserId: BigInt(partnerUserId),
      category: 'OTHER',
      priority: 'HIGH',
      status: 'OPEN',
      subject: 'Delivery Issue Reported by Partner',
      description: issueReason
    }
  });

  const order = await prisma.order.findUnique({
    where: { id: BigInt(assignment.orderId) }
  });

  if (order) {
    console.log(`[SMS/PUSH NOTIFICATION] To Customer ${order.customerUserId}: Your delivery partner reported an issue with your order #${order.orderNumber || order.id}: "${issueReason}". We are looking into it.`);
  }

  console.log(`[ALERT] To Fleet Manager: Delivery Partner ${partnerUserId} reported an issue for Order #${assignment.orderId}: "${issueReason}".`);

  return { message: 'Issue reported successfully' };
}

async function updateLocationService(partnerUserId: string, assignmentId: string, latitude: number, longitude: number) {
  const assignment = await getAssignmentByIdRepo(BigInt(assignmentId));
  if (!assignment || assignment.partnerUserId !== partnerUserId) throw new Error('Invalid assignment');

  await prisma.deliveryTrackingPoint.create({
    data: {
      assignmentId: BigInt(assignmentId),
      latitude,
      longitude,
      recordedAt: new Date()
    }
  });

  return { message: 'Location updated successfully' };
}

async function pickupOrderService(assignmentId: string, partnerUserId: string) {
  const assignment = await getAssignmentByIdRepo(BigInt(assignmentId));
  if (!assignment || assignment.partnerUserId !== partnerUserId) throw new Error('Invalid assignment');

  // Mark assignment as picked up by updating order status
  const order = await updateOrderStatus(BigInt(assignment.orderId), 'PICKED_UP', BigInt(partnerUserId), 'Picked up by delivery partner');

  await prisma.deliveryEvent.create({
    data: {
      orderId: BigInt(assignment.orderId),
      partnerUserId: BigInt(partnerUserId),
      eventType: 'ORDER_PICKED_UP',
      eventData: { assignmentId: assignmentId.toString() },
    },
  });

  console.log(`[SMS/PUSH NOTIFICATION] To Customer ${order.customerUserId}: Your order #${order.orderNumber || order.id} has been PICKED UP by the delivery partner!`);

  return { message: 'Order picked up successfully' };
}

async function markOutForDeliveryService(assignmentId: string, partnerUserId: string) {
  const assignment = await getAssignmentByIdRepo(BigInt(assignmentId));
  if (!assignment || assignment.partnerUserId !== partnerUserId) throw new Error('Invalid assignment');

  const order = await updateOrderStatus(BigInt(assignment.orderId), 'OUT_FOR_DELIVERY', BigInt(partnerUserId), 'Out for delivery');

  await prisma.deliveryEvent.create({
    data: {
      orderId: BigInt(assignment.orderId),
      partnerUserId: BigInt(partnerUserId),
      eventType: 'ORDER_OUT_FOR_DELIVERY',
      eventData: { assignmentId: assignmentId.toString() },
    },
  });

  console.log(`[SMS/PUSH NOTIFICATION] To Customer ${order.customerUserId}: Your order #${order.orderNumber || order.id} is OUT FOR DELIVERY! Please provide the OTP shown on your tracking page to the delivery partner.`);

  return { message: 'Order marked out for delivery' };
}

async function deliverOrderService(assignmentId: string, partnerUserId: string, otp: string) {
  const assignment = await getAssignmentByIdRepo(BigInt(assignmentId));
  if (!assignment || assignment.partnerUserId !== partnerUserId) throw new Error('Invalid assignment');

  const order = await prisma.order.findUnique({ where: { id: BigInt(assignment.orderId) } });
  if (!order) throw new Error('Order not found');

  if (order.otpHash) {
    const isMatch = await bcrypt.compare(otp, order.otpHash);
    if (!isMatch) {
      throw new Error('Invalid OTP');
    }
  }

  await prisma.deliveryAssignment.update({
    where: { id: BigInt(assignmentId) },
    data: { status: 'COMPLETED', completedAt: new Date() }
  });

  await updateOrderStatus(order.id, 'DELIVERED', BigInt(partnerUserId), 'Delivered successfully');

  await prisma.deliveryEvent.create({
    data: {
      orderId: order.id,
      partnerUserId: BigInt(partnerUserId),
      eventType: 'ORDER_DELIVERED',
      eventData: { assignmentId: assignmentId.toString() },
    },
  });

  console.log(`[SMS/PUSH NOTIFICATION] To Customer ${order.customerUserId}: Your order has arrived! Enjoy your meal.`);

  const deliveryFeeNum = order.deliveryFee ? Number(order.deliveryFee) : 0;
  const baseEarning = deliveryFeeNum > 0 ? deliveryFeeNum : 40;
  
  // Simulated dynamic additions for demo logic
  const distanceBonus = Math.floor(Math.random() * 20) + 5; // Random bonus between 5-25
  const tipAmount = Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 10 : 0; // Random tip or 0
  const finalEarning = baseEarning + distanceBonus + tipAmount;

  await prisma.partnerEarning.create({
    data: {
      partnerUserId: BigInt(partnerUserId),
      orderId: order.id,
      baseEarning: baseEarning,
      distanceBonus: distanceBonus,
      tipAmount: tipAmount,
      incentiveAmount: 0,
      totalEarning: finalEarning,
      status: 'PENDING',
    },
  });

  return { message: 'Order delivered successfully' };
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
  pickupOrderService,
  markOutForDeliveryService,
  deliverOrderService,
  reportDeliveryIssueService,
  updateLocationService,
};
