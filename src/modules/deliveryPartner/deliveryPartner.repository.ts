import { prisma } from '../../config/prisma.ts';
import {
  AssignmentStatus,
  DeliveryPartnerStatus,
  
} from '../../generated/prisma/enums.ts';
import { VehicleType } from '../../generated/prisma/enums.ts';
import { IupdateProfilePayload } from './deliveryPartner.interface.ts';

async function createDeliveryPartner(data: {
  userId: bigint;
  vehicleType: VehicleType;
  vehicleRegistrationNumber: string;
}) {
  return await prisma.deliveryPartner.create({
    data: {
      userId: data.userId,
      vehicleType: data.vehicleType,
      vehicleRegistrationNumber: data.vehicleRegistrationNumber,
    },
  });
}

async function getProfile(id: bigint) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      deliveryPartner: {
        select: {
          vehicleType: true,
          vehicleRegistrationNumber: true,
          isOnline: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    id: user.id.toString(),
    deliveryPartner: user.deliveryPartner
      ? {
          ...user.deliveryPartner,
        }
      : null,
  };
}

async function updateProfileRepo(id: bigint, data: IupdateProfilePayload) {
  const { vehicleType, vehicleRegistrationNumber, ...userData } = data;

  const deliveryPartnerUpdate: any = {};
  if (vehicleType) deliveryPartnerUpdate.vehicleType = vehicleType;
  if (vehicleRegistrationNumber)
    deliveryPartnerUpdate.vehicleRegistrationNumber = vehicleRegistrationNumber;

  const prismaUpdateData: any = { ...userData };

  if (Object.keys(deliveryPartnerUpdate).length > 0) {
    prismaUpdateData.deliveryPartner = {
      update: deliveryPartnerUpdate,
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: prismaUpdateData,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileImageUrl: true,
      createdAt: true,
      deliveryPartner: {
        select: {
          vehicleType: true,
          vehicleRegistrationNumber: true,
          isOnline: true,
        },
      },
    },
  });

  if (!updatedUser) return null;

  return {
    ...updatedUser,
    id: updatedUser.id.toString(),
    deliveryPartner: updatedUser.deliveryPartner
      ? {
          ...updatedUser.deliveryPartner,
        }
      : null,
  };
}

async function updateStatusRepo(userId: bigint, isOnline: boolean) {
  const deliveryPartner = await prisma.deliveryPartner.update({
    where: {
      userId: userId,
    },
    data: {
      isOnline: isOnline,
    },
    select: {
      isOnline: true,
    },
  });

  return deliveryPartner;
}

async function uploadDocumentRepo(
  partnerUserId: bigint,
  documentType: any,
  documentUrl: string
) {
  const document = await prisma.deliveryPartnerDocument.create({
    data: {
      partnerUserId,
      documentType,
      documentUrl,
    },
    select: {
      id: true,
      documentType: true,
      documentUrl: true,
      verificationStatus: true,
      verifiedAt: true,
    },
  });

  return {
    ...document,
    id: document.id.toString(),
  };
}

async function getAllAssignmentsRepo(
  partnerUserId: bigint,
  statusFilter?: string
) {
  const whereClause: any = {
    partnerUserId: partnerUserId,
  };

  if (statusFilter) {
    whereClause.status = statusFilter;
  }

  const assignments = await prisma.deliveryAssignment.findMany({
    where: whereClause,
    orderBy: {
      id: 'desc',
    },
  });

  if (!assignments.length) return [];

  return assignments.map((assignment) => ({
    ...assignment,
    id: assignment.id.toString(),
    orderId: assignment.orderId.toString(),
    partnerUserId: assignment.partnerUserId
      ? assignment.partnerUserId.toString()
      : null,
    assignedByUserId: assignment.assignedByUserId
      ? assignment.assignedByUserId.toString()
      : null,
  }));
}

async function getAssignmentByIdRepo(assignmentId: bigint) {
  const assignment = await prisma.deliveryAssignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) return null;

  return {
    ...assignment,
    id: assignment.id.toString(),
    orderId: assignment.orderId.toString(),
    partnerUserId: assignment.partnerUserId
      ? assignment.partnerUserId.toString()
      : null,
    assignedByUserId: assignment.assignedByUserId
      ? assignment.assignedByUserId.toString()
      : null,
  };
}

async function acceptAssignmentRepo(
  assignmentId: bigint,
  partnerUserId: bigint
) {
  const assignment = await prisma.deliveryAssignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      status: 'ACCEPTED',
      partnerUserId: partnerUserId,
    },
  });

  return {
    ...assignment,
    id: assignment.id.toString(),
    orderId: assignment.orderId.toString(),
    partnerUserId: assignment.partnerUserId
      ? assignment.partnerUserId.toString()
      : null,
    assignedByUserId: assignment.assignedByUserId
      ? assignment.assignedByUserId.toString()
      : null,
  };
}

async function declineAssignmentRepo(
  assignmentId: bigint,
  partnerUserId: bigint
) {
  const assignment = await prisma.deliveryAssignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      status: 'DECLINED',
      partnerUserId: partnerUserId,
    },
  });

  return {
    ...assignment,
    id: assignment.id.toString(),
    orderId: assignment.orderId.toString(),
    partnerUserId: assignment.partnerUserId
      ? assignment.partnerUserId.toString()
      : null,
    assignedByUserId: assignment.assignedByUserId
      ? assignment.assignedByUserId.toString()
      : null,
  };
}

async function getDeliveryPartnerByIdRepo(partnerId: bigint) {
  return await prisma.deliveryPartner.findUnique({
    where: {
      userId: partnerId,
    },
    include: {
      earnings: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      assignments: {
        orderBy: {
          assignedAt: 'desc',
        },
      },
    },
  });
}

async function getAllDeliveryPartnersRepo() {
  const [partners, totalCount] = await prisma.$transaction([
    prisma.deliveryPartner.findMany({
      orderBy: {
        joinedAt: 'desc',
      },
      include: {
        assignments: {
          where: {
            status: {
              in: ['ACCEPTED'] as AssignmentStatus[],
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
          take: 1,
        },
      },
    }),
    prisma.deliveryPartner.count(),
  ]);

  return { partners, totalCount };
}

async function getDeliveryPartnerByIdService(partnerId: string) {
  const partner = await getDeliveryPartnerByIdRepo(BigInt(partnerId));

  if (!partner) return null;

  return {
    ...partner,
    userId: partner.userId.toString(),
    averageRating: partner.averageRating ? Number(partner.averageRating) : 0,

    earnings: partner.earnings.map((earning) => ({
      ...earning,
      id: earning.id.toString(),
      partnerUserId: earning.partnerUserId.toString(),
      orderId: earning.orderId.toString(),
      baseEarning: Number(earning.baseEarning),
      incentiveAmount: Number(earning.incentiveAmount),
      totalEarning: Number(earning.totalEarning),
    })),

    assignments: partner.assignments.map((assignment) => ({
      ...assignment,
      id: assignment.id.toString(),
      orderId: assignment.orderId.toString(),
      partnerUserId: assignment.partnerUserId?.toString(),
      assignedByUserId: assignment.assignedByUserId?.toString(),
    })),
  };
}

async function updateDeliveryPartnerStatusRepo(
  partnerId: bigint,
  status: string
) {
  return await prisma.deliveryPartner.update({
    where: { userId: partnerId },
    data: { status: status as DeliveryPartnerStatus },
  });
}

async function getEarningsRepo(partnerUserId: bigint, startDate: Date) {
  const aggregations = await prisma.partnerEarning.aggregate({
    where: {
      partnerUserId,
      createdAt: { gte: startDate },
    },
    _sum: {
      baseEarning: true,
      incentiveAmount: true,
      totalEarning: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    totalDeliveries: aggregations._count.id,
    baseEarning: aggregations._sum.baseEarning?.toNumber() || 0,
    incentiveAmount: aggregations._sum.incentiveAmount?.toNumber() || 0,
    totalEarning: aggregations._sum.totalEarning?.toNumber() || 0,
  };
}

async function getEarningsHistoryRepo(
  partnerUserId: bigint,
  take: number,
  skip: number
) {
  const earnings = await prisma.partnerEarning.findMany({
    where: { partnerUserId },
    orderBy: { createdAt: 'desc' },
    take,
    skip,
  });

  return earnings.map((earning) => ({
    id: earning.id.toString(),
    orderId: earning.orderId.toString(),
    baseEarning: earning.baseEarning.toNumber(),
    incentiveAmount: earning.incentiveAmount.toNumber(),
    totalEarning: earning.totalEarning.toNumber(),
    status: earning.status,
    createdAt: earning.createdAt,
  }));
}

async function getPerformanceRepo(partnerUserId: bigint) {
  const assignments = await prisma.deliveryAssignment.findMany({
    where: { partnerUserId },
    select: { status: true, assignedAt: true, completedAt: true },
  });

  const totalAssigned = assignments.length;
  if (totalAssigned === 0) {
    return { acceptanceRate: 0, completionRate: 0, totalDeliveries: 0 };
  }

  const acceptedDeliveries = assignments.filter(
    (a) => a.status !== 'DECLINED' && a.status !== 'PENDING'
  );
  const acceptanceRate = (acceptedDeliveries.length / totalAssigned) * 100;

  const completedDeliveries = assignments.filter(
    (a) => a.status === 'COMPLETED'
  );
  const completionRate =
    acceptedDeliveries.length > 0
      ? (completedDeliveries.length / acceptedDeliveries.length) * 100
      : 0;

  return {
    totalAssigned,
    totalAccepted: acceptedDeliveries.length,
    totalCompleted: completedDeliveries.length,
    acceptanceRate: parseFloat(acceptanceRate.toFixed(2)),
    completionRate: parseFloat(completionRate.toFixed(2)),
  };
}

export {
  createDeliveryPartner,
  getProfile,
  getAllDeliveryPartnersRepo,
  getAllAssignmentsRepo,
  updateProfileRepo,
  updateStatusRepo,
  uploadDocumentRepo,
  getAssignmentByIdRepo,
  acceptAssignmentRepo,
  declineAssignmentRepo,
  getDeliveryPartnerByIdRepo,
  getDeliveryPartnerByIdService,
  updateDeliveryPartnerStatusRepo,
  getEarningsHistoryRepo,
  getEarningsRepo,
  getPerformanceRepo,
};
