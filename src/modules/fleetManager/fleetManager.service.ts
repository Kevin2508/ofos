import {
  getAllDeliveryPartnersRepo,
  updateDeliveryPartnerStatusRepo,
} from '../deliveryPartner/deliveryPartner.repository.ts';
import {
  assignDeliveryRepo,
  getAllAssignmentsRepo,
  reassignDeliveryRepo,
} from './fleetManager.repository.ts';
import { prisma } from '../../config/prisma.ts';

async function getAllDeliveryPartnersService(filters: {
  page: number;
  limit: number;
  status?: string;
  isOnline?: boolean;
}) {
  const { partners } = await getAllDeliveryPartnersRepo();

  const formattedPartners = partners.map((partner) => {
    const activeAssignment =
      partner.assignments && partner.assignments.length > 0
        ? partner.assignments[0]
        : null;

    return {
      ...partner,
      userId: partner.userId.toString(),
      averageRating: partner.averageRating ? Number(partner.averageRating) : 0,
      activeAssignment: activeAssignment
        ? {
            ...activeAssignment,
            id: activeAssignment.id.toString(),
            orderId: activeAssignment.orderId.toString(),
            partnerUserId: activeAssignment.partnerUserId?.toString(),
            assignedByUserId: activeAssignment.assignedByUserId?.toString(),
          }
        : null,
      assignments: undefined,
    };
  });

  return {
    partners: formattedPartners,
  };
}

async function updateDeliveryPartnerStatusService(
  partnerId: string,
  status: string
) {
  const updatedPartner = await updateDeliveryPartnerStatusRepo(
    BigInt(partnerId),
    status
  );

  return {
    ...updatedPartner,
    userId: updatedPartner.userId.toString(),
    averageRating: updatedPartner.averageRating
      ? Number(updatedPartner.averageRating)
      : 0,
  };
}

async function getAllAssignmentsService() {
  const { assignments } = await getAllAssignmentsRepo();

  const formattedAssignments = assignments.map((assignment) => ({
    ...assignment,
    id: assignment.id.toString(),
    orderId: assignment.orderId.toString(),
    partnerUserId: assignment.partnerUserId?.toString(),
    assignedByUserId: assignment.assignedByUserId?.toString(),
  }));

  return {
    assignments: formattedAssignments,
  };
}

async function assignDeliveryService(
  orderId: string,
  partnerUserId: string,
  assignedByUserId: string
) {
  const assignment = await assignDeliveryRepo(
    BigInt(orderId),
    BigInt(partnerUserId),
    BigInt(assignedByUserId)
  );

  return {
    ...assignment,
    id: assignment.id.toString(),
    orderId: assignment.orderId.toString(),
    partnerUserId: assignment.partnerUserId?.toString(),
    assignedByUserId: assignment.assignedByUserId?.toString(),
  };
}

async function reassignDeliveryService(
  assignmentId: string,
  newPartnerUserId: string,
  assignedByUserId: string
) {
  const newAssignment = await reassignDeliveryRepo(
    BigInt(assignmentId),
    BigInt(newPartnerUserId),
    BigInt(assignedByUserId)
  );

  return {
    ...newAssignment,
    id: newAssignment.id.toString(),
    orderId: newAssignment.orderId.toString(),
    partnerUserId: newAssignment.partnerUserId?.toString(),
    assignedByUserId: newAssignment.assignedByUserId?.toString(),
  };
}

async function getPartnerLocationsService() {
  const partners = await prisma.deliveryPartner.findMany({
    where: { isOnline: true },
    include: {
      user: { select: { firstName: true, lastName: true, phone: true } },
      assignments: {
        where: { status: { in: ['ACCEPTED'] } },
        include: {
          trackingPoints: {
            orderBy: { recordedAt: 'desc' },
            take: 1
          }
        }
      }
    }
  });

  return partners.map(p => {
    let location = null;
    const assignments = (p as any).assignments;
    if (assignments && assignments.length > 0 && assignments[0].trackingPoints.length > 0) {
      location = assignments[0].trackingPoints[0];
    }
    return {
      userId: p.userId.toString(),
      name: `${(p as any).user.firstName} ${(p as any).user.lastName}`,
      phone: (p as any).user.phone,
      vehicleType: p.vehicleType,
      activeAssignment: (p as any).assignments.length > 0 ? (p as any).assignments[0].id.toString() : null,
      location: location ? { latitude: location.latitude, longitude: location.longitude, recordedAt: location.recordedAt } : null
    };
  });
}

export {
  getAllDeliveryPartnersService,
  reassignDeliveryService,
  assignDeliveryService,
  getAllAssignmentsService,
  updateDeliveryPartnerStatusService,
  getPartnerLocationsService,
};
