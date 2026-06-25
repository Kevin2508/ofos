import { prisma } from '../../config/prisma.ts';
import {
  AssignmentStatus,
  AssignmentType,
} from '../../generated/prisma/enums.ts';

async function getAllAssignmentsRepo() {
  const activeStatuses: AssignmentStatus[] = [
    'PENDING',
    'ASSIGNED',
    'ACCEPTED',
  ];

  const [assignments, totalCount] = await prisma.$transaction([
    prisma.deliveryAssignment.findMany({
      where: {
        status: { in: activeStatuses },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    }),
    prisma.deliveryAssignment.count({
      where: {
        status: { in: activeStatuses },
      },
    }),
  ]);

  const unassignedOrders = await prisma.order.findMany({
    where: {
      orderStatus: 'READY_FOR_PICKUP',
      deliveryAssignments: {
        none: {
          status: { in: activeStatuses },
        },
      },
    },
    include: {
      branch: { select: { branchName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { assignments, totalCount, unassignedOrders };
}

async function assignDeliveryRepo(
  orderId: bigint,
  partnerUserId: bigint,
  assignedByUserId: bigint
) {
  return await prisma.deliveryAssignment.create({
    data: {
      orderId,
      partnerUserId,
      assignedByUserId,
      assignmentType: 'MANUAL' as AssignmentType,
      status: 'ASSIGNED' as AssignmentStatus,
      assignedAt: new Date(),
    },
  });
}

async function reassignDeliveryRepo(
  oldAssignmentId: bigint,
  newPartnerUserId: bigint,
  assignedByUserId: bigint
) {
  return await prisma.$transaction(async (tx) => {
    const oldAssignment = await tx.deliveryAssignment.findUnique({
      where: { id: oldAssignmentId },
    });

    if (!oldAssignment) {
      throw new Error('Original assignment not found');
    }

    await tx.deliveryAssignment.update({
      where: { id: oldAssignmentId },
      data: { status: 'REASSIGNED' as AssignmentStatus },
    });

    const newAssignment = await tx.deliveryAssignment.create({
      data: {
        orderId: oldAssignment.orderId,
        partnerUserId: newPartnerUserId,
        assignedByUserId: assignedByUserId,
        assignmentType: 'MANUAL' as AssignmentType,
        status: 'ASSIGNED' as AssignmentStatus,
        assignedAt: new Date(),
      },
    });

    return newAssignment;
  });
}

export { getAllAssignmentsRepo, reassignDeliveryRepo, assignDeliveryRepo };
