import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CouponType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCoupon(userId: bigint, dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
      include: { couponRestaurants: true },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      throw new BadRequestException('Coupon is not yet active');
    }
    if (coupon.validUntil < now) {
      throw new BadRequestException('Coupon has expired');
    }

    if (dto.restaurantBranchId) {
      const branchId = BigInt(dto.restaurantBranchId);
      const branch = await this.prisma.restaurantBranch.findUnique({
        where: { id: branchId },
      });
      if (branch && coupon.couponRestaurants.length > 0) {
        const isApplicable = coupon.couponRestaurants.some(
          (cr) => cr.restaurantId === branch.restaurantId,
        );
        if (!isApplicable) {
          throw new BadRequestException('Coupon is not valid for this restaurant');
        }
      }
    }

    if (coupon.usageLimit) {
      const usageCount = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id },
      });
      if (usageCount >= coupon.usageLimit) {
        throw new BadRequestException('Coupon global usage limit reached');
      }
    }

    if (coupon.perUserLimit) {
      const userUsageCount = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id, customerUserId: userId },
      });
      if (userUsageCount >= coupon.perUserLimit) {
        throw new BadRequestException('You have reached your limit for this coupon');
      }
    }

    const cartValue = dto.cartValue || 0;
    if (
      coupon.minimumOrderAmount &&
      cartValue > 0 &&
      cartValue < Number(coupon.minimumOrderAmount)
    ) {
      throw new BadRequestException(
        `Minimum order amount of ₹${coupon.minimumOrderAmount} required`,
      );
    }

    let discount = 0;
    if (coupon.couponType === CouponType.PERCENTAGE) {
      discount = (cartValue * Number(coupon.value)) / 100;
      if (coupon.maximumDiscountAmount) {
        discount = Math.min(discount, Number(coupon.maximumDiscountAmount));
      }
    } else if (coupon.couponType === CouponType.FLAT) {
      discount = Math.min(cartValue > 0 ? cartValue : Number(coupon.value), Number(coupon.value));
    } else if (coupon.couponType === CouponType.FREE_DELIVERY) {
      if (dto.restaurantBranchId) {
        const branch = await this.prisma.restaurantBranch.findUnique({
          where: { id: BigInt(dto.restaurantBranchId) },
        });
        discount = Number(branch?.deliveryFee || 0);
      }
    } else if (coupon.couponType === CouponType.BOGO) {
      discount = coupon.maximumDiscountAmount ? Number(coupon.maximumDiscountAmount) : Number(coupon.value);
    }

    return {
      valid: true,
      couponId: coupon.id.toString(),
      code: coupon.code,
      couponType: coupon.couponType,
      value: Number(coupon.value),
      discountAmount: discount.toFixed(2),
      message: 'Coupon is valid',
    };
  }

  async findAll(userRoles: string[] = [], ownerUserId?: bigint) {
    const isAdmin = userRoles.includes('Admin');
    const isOwner = userRoles.includes('Restaurant_owner');

    if (isAdmin) {
      return this.prisma.coupon.findMany({
        include: { couponRestaurants: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (isOwner && ownerUserId) {
      const ownedRestaurants = await this.prisma.restaurant.findMany({
        where: { ownerUserId },
        select: { id: true },
      });
      const ownedIds = ownedRestaurants.map((r) => r.id);

      return this.prisma.coupon.findMany({
        where: {
          OR: [
            { couponRestaurants: { none: {} } },
            { couponRestaurants: { some: { restaurantId: { in: ownedIds } } } },
          ],
        },
        include: { couponRestaurants: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    const now = new Date();
    return this.prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      include: { couponRestaurants: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(user: any, dto: CreateCouponDto) {
    const isAdmin = user?.roles?.includes('Admin');

    if (!isAdmin) {
      if (!dto.restaurantIds || dto.restaurantIds.length === 0) {
        throw new ForbiddenException(
          'Restaurant owners can only create restaurant-specific coupons. Please specify restaurantIds.',
        );
      }

      const ownerUserId = BigInt(user.id);
      const targetIds = dto.restaurantIds.map((id) => BigInt(id));
      const ownedRestaurants = await this.prisma.restaurant.findMany({
        where: {
          id: { in: targetIds },
          ownerUserId,
        },
        select: { id: true },
      });

      if (ownedRestaurants.length !== targetIds.length) {
        throw new ForbiddenException(
          'You can only create coupons for restaurants you own',
        );
      }
    }

    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.coupon.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Coupon code "${code}" already exists`);
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        couponType: dto.couponType,
        value: dto.value,
        minimumOrderAmount: dto.minimumOrderAmount ?? null,
        maximumDiscountAmount: dto.maximumDiscountAmount ?? null,
        usageLimit: dto.usageLimit ?? null,
        perUserLimit: dto.perUserLimit ?? null,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
        isActive: dto.isActive ?? true,
      },
    });

    if (dto.restaurantIds && dto.restaurantIds.length > 0) {
      await this.prisma.couponRestaurant.createMany({
        data: dto.restaurantIds.map((rId) => ({
          couponId: coupon.id,
          restaurantId: BigInt(rId),
        })),
      });
    }

    return this.prisma.coupon.findUnique({
      where: { id: coupon.id },
      include: { couponRestaurants: true },
    });
  }

  async deleteCoupon(id: bigint) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.prisma.couponRestaurant.deleteMany({
      where: { couponId: id },
    });
    await this.prisma.couponUsage.deleteMany({
      where: { couponId: id },
    });
    await this.prisma.coupon.delete({
      where: { id },
    });

    return { message: 'Coupon deleted successfully' };
  }
}
