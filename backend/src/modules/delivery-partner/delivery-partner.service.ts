import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  DeliveryPartnerStatus,
  OnlineStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  GetEarningsQueryDto,
  GetPartnerAssignmentsQueryDto,
  ReportDeliveryIssueDto,
  UpdateDutyStatusDto,
  UpdateLocationDto,
} from './dto/delivery-partner.dto';

@Injectable()
export class DeliveryPartnerService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Profile & Duty Status
  async getProfile(userId: bigint) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner profile not found');
    }

    return {
      userId: partner.userId.toString(),
      vehicleType: partner.vehicleType,
      vehicleRegistrationNumber: partner.vehicleRegistrationNumber,
      isOnline: partner.isOnline,
      averageRating: Number(partner.averageRating),
      totalCompletedDeliveries: partner.totalCompletedDeliveries,
      status: partner.status,
      user: {
        ...partner.user,
        id: partner.user.id.toString(),
      },
    };
  }

  async updateStatus(userId: bigint, dto: UpdateDutyStatusDto) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner profile not found');
    }

    if (dto.isOnline && partner.status !== DeliveryPartnerStatus.ACTIVE) {
      throw new ForbiddenException(
        `Cannot go online while account status is ${partner.status}. Active verification required.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.deliveryPartner.update({
        where: { userId },
        data: { isOnline: dto.isOnline },
      });

      await tx.partnerStatusLog.create({
        data: {
          partnerUserId: userId,
          status: dto.isOnline ? OnlineStatus.ONLINE : OnlineStatus.OFFLINE,
          changedAt: new Date(),
        },
      });

      return p;
    });

    return {
      isOnline: updated.isOnline,
      status: updated.status,
      message: dto.isOnline ? 'You are now online and ready for deliveries' : 'You are now offline',
    };
  }

  // 2. Active & Past Assignments
  async getActiveAssignment(userId: bigint) {
    const assignment = await this.prisma.deliveryAssignment.findFirst({
      where: {
        partnerUserId: userId,
        status: { in: [AssignmentStatus.ASSIGNED, AssignmentStatus.ACCEPTED] },
      },
      include: {
        order: {
          include: {
            branch: {
              select: {
                id: true,
                branchName: true,
                addressLine1: true,
                contactPhone: true,
                city: true,
                latitude: true,
                longitude: true,
              },
            },
            address: true,
            items: {
              include: {
                modifiers: true,
              },
            },
          },
        },
        trackingPoints: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    if (!assignment) {
      return null;
    }

    const { otpHash, ...sanitizedOrder } = assignment.order;

    return {
      ...assignment,
      id: assignment.id.toString(),
      orderId: assignment.orderId.toString(),
      partnerUserId: assignment.partnerUserId?.toString(),
      assignedByUserId: assignment.assignedByUserId?.toString(),
      order: {
        ...sanitizedOrder,
        id: sanitizedOrder.id.toString(),
        restaurantId: sanitizedOrder.restaurantId.toString(),
        branchId: sanitizedOrder.branchId.toString(),
        customerUserId: sanitizedOrder.customerUserId.toString(),
        subtotalAmount: Number(sanitizedOrder.subtotalAmount),
        deliveryFee: Number(sanitizedOrder.deliveryFee),
        taxAmount: Number(sanitizedOrder.taxAmount),
        totalAmount: Number(sanitizedOrder.totalAmount),
        branch: {
          ...sanitizedOrder.branch,
          id: sanitizedOrder.branch.id.toString(),
        },
        items: sanitizedOrder.items.map((i) => ({
          ...i,
          id: i.id.toString(),
          orderId: i.orderId.toString(),
          menuItemId: i.menuItemId ? i.menuItemId.toString() : null,
          unitPrice: Number(i.unitPrice),
          lineTotal: Number(i.lineTotal),
          modifiers: i.modifiers.map((m) => ({
            ...m,
            id: m.id.toString(),
            orderItemId: m.orderItemId.toString(),
            additionalPrice: Number(m.additionalPrice),
          })),
        })),
      },
    };
  }

  async getAllAssignments(userId: bigint, query: GetPartnerAssignmentsQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = { partnerUserId: userId };
    if (query.status) {
      where.status = query.status;
    }

    const [total, assignments] = await Promise.all([
      this.prisma.deliveryAssignment.count({ where }),
      this.prisma.deliveryAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { assignedAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              orderStatus: true,
              paymentStatus: true,
              totalAmount: true,
              createdAt: true,
              branch: {
                select: {
                  branchName: true,
                  city: true,
                },
              },
              address: {
                select: {
                  recipientName: true,
                  addressLine1: true,
                  city: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      assignments: assignments.map((a) => ({
        id: a.id.toString(),
        orderId: a.orderId.toString(),
        status: a.status,
        assignmentType: a.assignmentType,
        assignedAt: a.assignedAt,
        acceptedAt: a.acceptedAt,
        completedAt: a.completedAt,
        order: {
          ...a.order,
          id: a.order.id.toString(),
          totalAmount: Number(a.order.totalAmount),
        },
      })),
    };
  }

  // 3. Location Telemetry
  async updateLocation(userId: bigint, assignmentId: bigint, dto: UpdateLocationDto) {
    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Delivery assignment not found');
    }

    if (assignment.partnerUserId !== userId) {
      throw new ForbiddenException('This assignment does not belong to you');
    }

    if (assignment.status !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException('Location can only be reported for active, accepted assignments');
    }

    const trackingPoint = await this.prisma.deliveryTrackingPoint.create({
      data: {
        assignmentId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        recordedAt: new Date(),
      },
    });

    return {
      success: true,
      recordedAt: trackingPoint.recordedAt,
      latitude: Number(trackingPoint.latitude),
      longitude: Number(trackingPoint.longitude),
      message: 'Location updated successfully',
    };
  }

  // 4. Report Issue & Incident Management
  async reportDeliveryIssue(userId: bigint, assignmentId: bigint, dto: ReportDeliveryIssueDto) {
    const assignment = await this.prisma.deliveryAssignment.findUnique({
      where: { id: assignmentId },
      include: { order: true },
    });

    if (!assignment) {
      throw new NotFoundException('Delivery assignment not found');
    }

    if (assignment.partnerUserId !== userId) {
      throw new ForbiddenException('This assignment does not belong to you');
    }

    const event = await this.prisma.deliveryEvent.create({
      data: {
        orderId: assignment.orderId,
        partnerUserId: userId,
        eventType: 'DELIVERY_ISSUE_REPORTED',
        eventData: {
          issueReason: dto.issueReason,
          notes: dto.notes || null,
          reportedAt: new Date().toISOString(),
          assignmentId: assignmentId.toString(),
        },
      },
    });

    // If critical vehicle breakdown, re-escalate assignment so dispatcher can step in
    if (dto.issueReason === 'VEHICLE_BREAKDOWN' || dto.issueReason === 'ACCIDENT') {
      await this.prisma.deliveryAssignment.update({
        where: { id: assignmentId },
        data: { status: AssignmentStatus.DECLINED },
      });
    }

    return {
      success: true,
      eventId: event.id.toString(),
      message: 'Delivery issue logged and escalated to Fleet Dispatcher',
    };
  }

  // 5. Earnings & Performance Summary
  async getEarnings(userId: bigint, query: GetEarningsQueryDto) {
    let dateFilter: any = undefined;
    const now = new Date();

    if (query.period === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { gte: startOfDay };
    } else if (query.period === 'weekly') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: sevenDaysAgo };
    }

    const where: any = { partnerUserId: userId };
    if (dateFilter) {
      where.createdAt = dateFilter;
    }

    const earnings = await this.prisma.partnerEarning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
          },
        },
      },
    });

    const totalEarning = earnings.reduce((sum, e) => sum + Number(e.totalEarning), 0);
    const baseEarning = earnings.reduce((sum, e) => sum + Number(e.baseEarning), 0);
    const tipAmount = earnings.reduce((sum, e) => sum + Number(e.tipAmount), 0);
    const incentives = earnings.reduce((sum, e) => sum + Number(e.incentiveAmount), 0);

    return {
      period: query.period || 'today',
      deliveriesCount: earnings.length,
      totalEarning,
      baseEarning,
      tipAmount,
      incentives,
      history: earnings.map((e) => ({
        id: e.id.toString(),
        orderId: e.orderId.toString(),
        orderNumber: e.order?.orderNumber,
        baseEarning: Number(e.baseEarning),
        tipAmount: Number(e.tipAmount),
        incentiveAmount: Number(e.incentiveAmount),
        totalEarning: Number(e.totalEarning),
        status: e.status,
        createdAt: e.createdAt,
      })),
    };
  }
}
