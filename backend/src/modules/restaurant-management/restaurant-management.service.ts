import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Restaurant,
  RestaurantBranch,
  RestaurantStatus,
  StaffStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AddBranchStaffDto,
  CreateBranchDto,
  CreateRestaurantDto,
  PauseRestaurantDto,
  ReplaceOperatingHoursDto,
  UpdateBranchDto,
  UpdateRestaurantDto,
  UpsertDeliveryZoneDto,
} from './dto/restaurant-management.dto';

@Injectable()
export class RestaurantManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------
  // Ownership & Authorization Helpers
  // -------------------------------------------------------------
  private async verifyRestaurantOwnerOrAdmin(
    restaurantId: bigint,
    userId: bigint,
    roles: string[],
  ): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, deletedAt: null },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found or deactivated');
    }

    if (roles.includes('Admin')) {
      return restaurant;
    }

    if (restaurant.ownerUserId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to manage this restaurant',
      );
    }

    return restaurant;
  }

  private async verifyBranchOwnerOrAdmin(
    branchId: bigint,
    userId: bigint,
    roles: string[],
  ): Promise<RestaurantBranch & { restaurant: Restaurant }> {
    const branch = await this.prisma.restaurantBranch.findFirst({
      where: { id: branchId, deletedAt: null },
      include: { restaurant: true },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found or deactivated');
    }

    if (roles.includes('Admin')) {
      return branch;
    }

    if (branch.restaurant.ownerUserId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to manage this branch',
      );
    }

    return branch;
  }

  // -------------------------------------------------------------
  // Restaurant Operations
  // -------------------------------------------------------------
  async createRestaurant(ownerUserId: bigint, dto: CreateRestaurantDto) {
    const { restaurant, branch } = await this.prisma.$transaction(async (tx) => {
      const createdRestaurant = await tx.restaurant.create({
        data: {
          ownerUserId,
          businessName: dto.businessName.trim(),
          legalBusinessName: dto.legalBusinessName.trim(),
          primaryPhone: dto.primaryPhone.trim(),
          primaryEmail: dto.primaryEmail.trim().toLowerCase(),
          description: dto.description?.trim() || null,
          cuisineTags: dto.cuisineTags?.trim() || null,
          status: RestaurantStatus.PENDING_VERIFICATION,
        },
      });

      // Create default initial main branch
      const createdBranch = await tx.restaurantBranch.create({
        data: {
          restaurantId: createdRestaurant.id,
          branchName: `${dto.businessName.trim()} — Main Branch`,
          gstin: 'PENDING',
          fssaiLicenseNumber: 'PENDING',
          contactPhone: dto.primaryPhone.trim(),
          addressLine1: 'Address to be updated',
          city: 'City',
          state: 'State',
          postalCode: '000000',
          country: 'India',
          latitude: 0,
          longitude: 0,
          minimumOrderValue: 0,
          deliveryFee: 0,
        },
      });

      return { restaurant: createdRestaurant, branch: createdBranch };
    });

    return {
      message: 'Restaurant registered successfully. Pending verification.',
      restaurant: this.serializeRestaurant(restaurant),
      branch: this.serializeBranch(branch),
    };
  }

  async getMyRestaurants(ownerUserId: bigint) {
    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        ownerUserId,
        deletedAt: null,
      },
      include: {
        branches: {
          where: { deletedAt: null },
          include: {
            deliveryZone: true,
            operatingHours: {
              orderBy: { dayOfWeek: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      restaurants: restaurants.map((r) => this.serializeRestaurant(r)),
    };
  }

  async getDashboardStats(ownerUserId: bigint) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const branches = await this.prisma.restaurantBranch.findMany({
      where: {
        restaurant: { ownerUserId, deletedAt: null },
        deletedAt: null,
      },
      select: { id: true },
    });

    const branchIds = branches.map((b) => b.id);

    if (branchIds.length === 0) {
      return {
        ordersToday: 0,
        revenueToday: 0,
        averageOrderValue: 0,
        acceptanceRate: 0,
        revenueTrends: [],
      };
    }

    const todaysOrders = await this.prisma.order.findMany({
      where: {
        branchId: { in: branchIds },
        createdAt: { gte: startOfDay },
      },
    });

    const ordersToday = todaysOrders.length;
    const paidOrders = todaysOrders.filter((o) => o.paymentStatus === PaymentStatus.PAID);
    const revenueToday = paidOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);

    const averageOrderValue =
      paidOrders.length > 0 ? Number((revenueToday / paidOrders.length).toFixed(2)) : 0;

    const nonAcceptedStatuses: OrderStatus[] = [
      OrderStatus.PLACED,
      OrderStatus.REJECTED,
      OrderStatus.CANCELLED,
    ];
    const acceptedOrders = todaysOrders.filter(
      (o) => !nonAcceptedStatuses.includes(o.orderStatus),
    ).length;

    const acceptanceRate =
      ordersToday > 0
        ? Number(((acceptedOrders / ordersToday) * 100).toFixed(1))
        : 0;

    const last7Days = new Date(startOfDay);
    last7Days.setDate(last7Days.getDate() - 6);

    const weekOrders = await this.prisma.order.findMany({
      where: {
        branchId: { in: branchIds },
        createdAt: { gte: last7Days },
      },
    });

    const revenueTrends = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(last7Days);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const dayOrders = weekOrders.filter(
        (o) =>
          o.createdAt.getDate() === d.getDate() &&
          o.createdAt.getMonth() === d.getMonth() &&
          o.createdAt.getFullYear() === d.getFullYear() &&
          o.paymentStatus === PaymentStatus.PAID,
      );
      const dayRev = dayOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount),
        0,
      );
      revenueTrends.push({ date: dateStr, revenue: Number(dayRev.toFixed(2)) });
    }

    return {
      ordersToday,
      revenueToday: Number(revenueToday.toFixed(2)),
      averageOrderValue,
      acceptanceRate,
      revenueTrends,
    };
  }

  async updateRestaurant(
    restaurantId: bigint,
    ownerUserId: bigint,
    roles: string[],
    dto: UpdateRestaurantDto,
  ) {
    await this.verifyRestaurantOwnerOrAdmin(restaurantId, ownerUserId, roles);

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        ...(dto.businessName !== undefined && { businessName: dto.businessName.trim() }),
        ...(dto.legalBusinessName !== undefined && {
          legalBusinessName: dto.legalBusinessName.trim(),
        }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.primaryPhone !== undefined && { primaryPhone: dto.primaryPhone.trim() }),
        ...(dto.primaryEmail !== undefined && {
          primaryEmail: dto.primaryEmail.trim().toLowerCase(),
        }),
        ...(dto.cuisineTags !== undefined && { cuisineTags: dto.cuisineTags?.trim() || null }),
        ...(dto.bankAccountName !== undefined && {
          bankAccountName: dto.bankAccountName?.trim() || null,
        }),
        ...(dto.bankAccountNumber !== undefined && {
          bankAccountNumber: dto.bankAccountNumber?.trim() || null,
        }),
        ...(dto.bankIfscCode !== undefined && {
          bankIfscCode: dto.bankIfscCode?.trim() || null,
        }),
      },
    });

    return {
      message: 'Restaurant updated successfully',
      restaurant: this.serializeRestaurant(updated),
    };
  }

  async pauseRestaurant(
    restaurantId: bigint,
    ownerUserId: bigint,
    roles: string[],
    dto?: PauseRestaurantDto,
  ) {
    const restaurant = await this.verifyRestaurantOwnerOrAdmin(restaurantId, ownerUserId, roles);

    if (!roles.includes('Admin') && restaurant.status !== RestaurantStatus.APPROVED) {
      throw new BadRequestException('Only approved restaurants can be paused.');
    }

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        status: RestaurantStatus.SUSPENDED,
      },
    });

    return {
      message: 'Restaurant paused successfully',
      restaurant: this.serializeRestaurant(updated),
      resumeAt: dto?.resumeAt ? new Date(dto.resumeAt) : null,
    };
  }

  async resumeRestaurant(
    restaurantId: bigint,
    ownerUserId: bigint,
    roles: string[],
  ) {
    const restaurant = await this.verifyRestaurantOwnerOrAdmin(restaurantId, ownerUserId, roles);

    if (!roles.includes('Admin')) {
      if (restaurant.status !== RestaurantStatus.SUSPENDED || !restaurant.approvedAt) {
        throw new BadRequestException(
          'Only approved restaurants that were paused can be resumed. Unverified or rejected restaurants require admin approval.',
        );
      }
    }

    const updated = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        status: RestaurantStatus.APPROVED,
      },
    });

    return {
      message: 'Restaurant resumed successfully',
      restaurant: this.serializeRestaurant(updated),
    };
  }

  async deactivateRestaurant(
    restaurantId: bigint,
    ownerUserId: bigint,
    roles: string[],
  ) {
    await this.verifyRestaurantOwnerOrAdmin(restaurantId, ownerUserId, roles);

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.restaurant.update({
        where: { id: restaurantId },
        data: { deletedAt: now },
      }),
      this.prisma.restaurantBranch.updateMany({
        where: { restaurantId, deletedAt: null },
        data: { isActive: false, deletedAt: now },
      }),
    ]);

    return {
      message: 'Restaurant deactivated successfully',
    };
  }

  // -------------------------------------------------------------
  // Branch Operations
  // -------------------------------------------------------------
  async getBranches(
    restaurantId: bigint,
    ownerUserId: bigint,
    roles: string[],
  ) {
    await this.verifyRestaurantOwnerOrAdmin(restaurantId, ownerUserId, roles);

    const branches = await this.prisma.restaurantBranch.findMany({
      where: { restaurantId, deletedAt: null },
      include: {
        deliveryZone: true,
        operatingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      branches: branches.map((b) => this.serializeBranch(b)),
    };
  }

  async createBranch(
    restaurantId: bigint,
    ownerUserId: bigint,
    roles: string[],
    dto: CreateBranchDto,
  ) {
    await this.verifyRestaurantOwnerOrAdmin(restaurantId, ownerUserId, roles);

    const branch = await this.prisma.restaurantBranch.create({
      data: {
        restaurantId,
        branchName: dto.branchName.trim(),
        gstin: dto.gstin.trim(),
        fssaiLicenseNumber: dto.fssaiLicenseNumber.trim(),
        contactPhone: dto.contactPhone.trim(),
        addressLine1: dto.addressLine1.trim(),
        addressLine2: dto.addressLine2?.trim() || null,
        city: dto.city.trim(),
        state: dto.state.trim(),
        postalCode: dto.postalCode.trim(),
        country: (dto.country || 'India').trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        minimumOrderValue: dto.minimumOrderValue ?? 0,
        deliveryFee: dto.deliveryFee ?? 0,
      },
    });

    return {
      message: 'Branch created successfully',
      branch: this.serializeBranch(branch),
    };
  }

  async updateBranch(
    branchId: bigint,
    ownerUserId: bigint,
    roles: string[],
    dto: UpdateBranchDto,
  ) {
    await this.verifyBranchOwnerOrAdmin(branchId, ownerUserId, roles);

    const updated = await this.prisma.restaurantBranch.update({
      where: { id: branchId },
      data: {
        ...(dto.branchName !== undefined && { branchName: dto.branchName.trim() }),
        ...(dto.gstin !== undefined && { gstin: dto.gstin.trim() }),
        ...(dto.fssaiLicenseNumber !== undefined && { fssaiLicenseNumber: dto.fssaiLicenseNumber.trim() }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone.trim() }),
        ...(dto.addressLine1 !== undefined && { addressLine1: dto.addressLine1.trim() }),
        ...(dto.addressLine2 !== undefined && { addressLine2: dto.addressLine2?.trim() || null }),
        ...(dto.city !== undefined && { city: dto.city.trim() }),
        ...(dto.state !== undefined && { state: dto.state.trim() }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode.trim() }),
        ...(dto.country !== undefined && { country: dto.country.trim() }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.minimumOrderValue !== undefined && {
          minimumOrderValue: dto.minimumOrderValue,
        }),
        ...(dto.deliveryFee !== undefined && { deliveryFee: dto.deliveryFee }),
        ...(dto.isAcceptingOrders !== undefined && {
          isAcceptingOrders: dto.isAcceptingOrders,
        }),
        ...(dto.autoResumeAt !== undefined && {
          autoResumeAt: dto.autoResumeAt ? new Date(dto.autoResumeAt) : null,
        }),
      },
    });

    return {
      message: 'Branch updated successfully',
      branch: this.serializeBranch(updated),
    };
  }

  async toggleOrders(
    branchId: bigint,
    ownerUserId: bigint,
    roles: string[],
  ) {
    const branch = await this.verifyBranchOwnerOrAdmin(branchId, ownerUserId, roles);
    const nextState = !branch.isAcceptingOrders;

    const updated = await this.prisma.restaurantBranch.update({
      where: { id: branchId },
      data: { isAcceptingOrders: nextState },
    });

    return {
      message: `Branch is now ${nextState ? 'accepting' : 'not accepting'} orders`,
      isAcceptingOrders: updated.isAcceptingOrders,
    };
  }

  // -------------------------------------------------------------
  // Operating Hours
  // -------------------------------------------------------------
  async getOperatingHours(
    branchId: bigint,
    ownerUserId: bigint,
    roles: string[],
  ) {
    await this.verifyBranchOwnerOrAdmin(branchId, ownerUserId, roles);

    const hours = await this.prisma.restaurantOperatingHour.findMany({
      where: { branchId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return {
      operatingHours: hours.map((h) => this.serializeOperatingHour(h)),
    };
  }

  async replaceOperatingHours(
    branchId: bigint,
    ownerUserId: bigint,
    roles: string[],
    dto: ReplaceOperatingHoursDto,
  ) {
    await this.verifyBranchOwnerOrAdmin(branchId, ownerUserId, roles);

    // Deduplicate hours by dayOfWeek to protect unique constraint
    const distinctHoursMap = new Map<number, (typeof dto.hours)[0]>();
    for (const h of dto.hours || []) {
      distinctHoursMap.set(h.dayOfWeek, h);
    }
    const distinctHours = Array.from(distinctHoursMap.values());

    const formatUtcTime = (timeStr?: string | null) => {
      if (!timeStr) return null;
      const clean = timeStr.trim();
      const withSeconds = clean.length === 5 ? `${clean}:00` : clean;
      return new Date(`1970-01-01T${withSeconds}Z`);
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.restaurantOperatingHour.deleteMany({
        where: { branchId },
      });

      if (distinctHours.length > 0) {
        await tx.restaurantOperatingHour.createMany({
          data: distinctHours.map((hour) => ({
            branchId,
            dayOfWeek: hour.dayOfWeek,
            openingTime: formatUtcTime(hour.openingTime),
            closingTime: formatUtcTime(hour.closingTime),
            isClosed: hour.isClosed ?? false,
          })),
        });
      }
    });

    const hours = await this.prisma.restaurantOperatingHour.findMany({
      where: { branchId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return {
      message: 'Operating hours updated successfully',
      operatingHours: hours.map((h) => this.serializeOperatingHour(h)),
    };
  }

  // -------------------------------------------------------------
  // Delivery Zone
  // -------------------------------------------------------------
  async getDeliveryZone(
    branchId: bigint,
    ownerUserId: bigint,
    roles: string[],
  ) {
    await this.verifyBranchOwnerOrAdmin(branchId, ownerUserId, roles);

    const zone = await this.prisma.restaurantDeliveryZone.findUnique({
      where: { branchId },
    });

    return {
      deliveryZone: zone ? this.serializeDeliveryZone(zone) : null,
    };
  }

  async upsertDeliveryZone(
    branchId: bigint,
    ownerUserId: bigint,
    roles: string[],
    dto: UpsertDeliveryZoneDto,
  ) {
    await this.verifyBranchOwnerOrAdmin(branchId, ownerUserId, roles);

    if (dto.minimumDeliveryTimeMinutes > dto.maximumDeliveryTimeMinutes) {
      throw new BadRequestException(
        'Minimum delivery time cannot exceed maximum delivery time',
      );
    }

    const zone = await this.prisma.restaurantDeliveryZone.upsert({
      where: { branchId },
      create: {
        branchId,
        radiusKm: dto.radiusKm,
        minimumDeliveryTimeMinutes: dto.minimumDeliveryTimeMinutes,
        maximumDeliveryTimeMinutes: dto.maximumDeliveryTimeMinutes,
      },
      update: {
        radiusKm: dto.radiusKm,
        minimumDeliveryTimeMinutes: dto.minimumDeliveryTimeMinutes,
        maximumDeliveryTimeMinutes: dto.maximumDeliveryTimeMinutes,
      },
    });

    return {
      message: 'Delivery zone saved successfully',
      deliveryZone: this.serializeDeliveryZone(zone),
    };
  }

  // -------------------------------------------------------------
  // Branch Staff Operations
  // -------------------------------------------------------------
  async getBranchStaff(
    branchId: bigint,
    ownerUserId: bigint,
    roles: string[],
  ) {
    await this.verifyBranchOwnerOrAdmin(branchId, ownerUserId, roles);

    const staff = await this.prisma.restaurantStaff.findMany({
      where: { branchId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return {
      staff: staff.map((s) => this.serializeStaff(s)),
    };
  }

  async addBranchStaff(
    branchId: bigint,
    ownerUserId: bigint,
    roles: string[],
    dto: AddBranchStaffDto,
  ) {
    await this.verifyBranchOwnerOrAdmin(branchId, ownerUserId, roles);

    if (!/^\d+$/.test(dto.userId)) {
      throw new BadRequestException('User ID must be numeric');
    }

    const targetUserId = BigInt(dto.userId);

    const user = await this.prisma.user.findFirst({
      where: { id: targetUserId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingStaff = await this.prisma.restaurantStaff.findUnique({
      where: {
        branchId_userId: {
          branchId,
          userId: targetUserId,
        },
      },
    });

    if (existingStaff) {
      throw new BadRequestException('User is already assigned to this branch');
    }

    const staff = await this.prisma.restaurantStaff.create({
      data: {
        branchId,
        userId: targetUserId,
        designation: dto.designation,
        status: StaffStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    return {
      message: 'Staff member added successfully',
      staff: this.serializeStaff(staff),
    };
  }

  async removeBranchStaff(
    branchId: bigint,
    staffId: bigint,
    ownerUserId: bigint,
    roles: string[],
  ) {
    await this.verifyBranchOwnerOrAdmin(branchId, ownerUserId, roles);

    const staff = await this.prisma.restaurantStaff.findFirst({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    if (staff.branchId !== branchId) {
      throw new BadRequestException(
        'Staff member does not belong to this branch',
      );
    }

    await this.prisma.restaurantStaff.delete({
      where: { id: staffId },
    });

    return {
      message: 'Staff member removed successfully',
    };
  }

  // -------------------------------------------------------------
  // Serialization Helpers
  // -------------------------------------------------------------
  private serializeRestaurant(restaurant: any) {
    return {
      id: restaurant.id.toString(),
      ownerUserId: restaurant.ownerUserId.toString(),
      businessName: restaurant.businessName,
      legalBusinessName: restaurant.legalBusinessName,
      primaryPhone: restaurant.primaryPhone,
      primaryEmail: restaurant.primaryEmail,
      logoUrl: restaurant.logoUrl,
      coverImageUrl: restaurant.coverImageUrl,
      description: restaurant.description,
      status: restaurant.status,
      approvedBy: restaurant.approvedBy ? restaurant.approvedBy.toString() : null,
      approvedAt: restaurant.approvedAt,
      cuisineTags: restaurant.cuisineTags,
      bankAccountName: restaurant.bankAccountName,
      bankAccountNumber: restaurant.bankAccountNumber,
      bankIfscCode: restaurant.bankIfscCode,
      commissionRate: restaurant.commissionRate ? Number(restaurant.commissionRate) : null,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
      branches: restaurant.branches
        ? restaurant.branches.map((b: any) => this.serializeBranch(b))
        : undefined,
    };
  }

  private serializeBranch(branch: any) {
    return {
      id: branch.id.toString(),
      restaurantId: branch.restaurantId.toString(),
      branchName: branch.branchName,
      gstin: branch.gstin,
      fssaiLicenseNumber: branch.fssaiLicenseNumber,
      contactPhone: branch.contactPhone,
      addressLine1: branch.addressLine1,
      addressLine2: branch.addressLine2,
      city: branch.city,
      state: branch.state,
      postalCode: branch.postalCode,
      country: branch.country,
      latitude: Number(branch.latitude),
      longitude: Number(branch.longitude),
      minimumOrderValue: Number(branch.minimumOrderValue),
      deliveryFee: Number(branch.deliveryFee),
      isActive: branch.isActive,
      isAcceptingOrders: branch.isAcceptingOrders,
      autoResumeAt: branch.autoResumeAt,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
      deliveryZone: branch.deliveryZone
        ? this.serializeDeliveryZone(branch.deliveryZone)
        : null,
      operatingHours: branch.operatingHours
        ? branch.operatingHours.map((h: any) => this.serializeOperatingHour(h))
        : undefined,
    };
  }

  private serializeOperatingHour(hour: any) {
    return {
      id: hour.id.toString(),
      branchId: hour.branchId.toString(),
      dayOfWeek: hour.dayOfWeek,
      openingTime: hour.openingTime
        ? hour.openingTime.toISOString().substring(11, 19)
        : null,
      closingTime: hour.closingTime
        ? hour.closingTime.toISOString().substring(11, 19)
        : null,
      isClosed: hour.isClosed,
    };
  }

  private serializeDeliveryZone(zone: any) {
    return {
      id: zone.id.toString(),
      branchId: zone.branchId.toString(),
      radiusKm: Number(zone.radiusKm),
      minimumDeliveryTimeMinutes: zone.minimumDeliveryTimeMinutes,
      maximumDeliveryTimeMinutes: zone.maximumDeliveryTimeMinutes,
    };
  }

  private serializeStaff(staff: any) {
    return {
      id: staff.id.toString(),
      branchId: staff.branchId.toString(),
      userId: staff.userId.toString(),
      designation: staff.designation,
      status: staff.status,
      joinedAt: staff.joinedAt,
      user: staff.user
        ? {
            id: staff.user.id.toString(),
            firstName: staff.user.firstName,
            lastName: staff.user.lastName,
            email: staff.user.email,
            phone: staff.user.phone,
            status: staff.user.status,
          }
        : undefined,
    };
  }
}
