import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateReviewDto,
  GetRestaurantReviewsQueryDto,
  ReplyReviewDto,
} from './dto/reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitReview(customerId: bigint, orderIdParam: number, dto: CreateReviewDto) {
    const orderId = BigInt(orderIdParam);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryAssignments: {
          where: { status: 'COMPLETED' },
          orderBy: { assignedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerUserId !== customerId) {
      throw new ForbiddenException('You can only review orders placed by your account');
    }

    if (order.orderStatus !== 'DELIVERED') {
      throw new BadRequestException('Reviews can only be submitted for delivered orders');
    }

    const existingReview = await this.prisma.review.findUnique({
      where: { orderId },
    });

    if (existingReview) {
      throw new BadRequestException('This order has already been reviewed');
    }

    const avg = (dto.foodRating + dto.deliveryRating + dto.packagingRating) / 3;
    const overallRating = Math.round(avg * 10) / 10;

    const deliveryPartnerUserId =
      order.deliveryAssignments.length > 0
        ? order.deliveryAssignments[0].partnerUserId
        : null;

    const review = await this.prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          orderId,
          customerUserId: customerId,
          restaurantId: order.restaurantId,
          deliveryPartnerUserId,
          foodRating: dto.foodRating,
          deliveryRating: dto.deliveryRating,
          packagingRating: dto.packagingRating,
          overallRating,
          reviewText: dto.reviewText || null,
        },
      });

      if (dto.images && dto.images.length > 0) {
        await tx.reviewImage.createMany({
          data: dto.images.map((url) => ({
            reviewId: createdReview.id,
            imageUrl: url,
          })),
        });
      }

      // If delivery partner was assigned, recalculate rider averageRating
      if (deliveryPartnerUserId) {
        const partnerReviews = await tx.review.findMany({
          where: { deliveryPartnerUserId },
          select: { deliveryRating: true },
        });

        if (partnerReviews.length > 0) {
          const sumRating = partnerReviews.reduce(
            (sum, r) => sum + r.deliveryRating,
            0,
          );
          const newAvgRating = Math.round((sumRating / partnerReviews.length) * 100) / 100;

          await tx.deliveryPartner.update({
            where: { userId: deliveryPartnerUserId },
            data: {
              averageRating: newAvgRating,
            },
          });
        }
      }

      return createdReview;
    });

    return {
      message: 'Review submitted successfully',
      data: {
        id: review.id.toString(),
        orderId: review.orderId.toString(),
        overallRating: Number(review.overallRating),
        foodRating: review.foodRating,
        deliveryRating: review.deliveryRating,
        packagingRating: review.packagingRating,
        reviewText: review.reviewText,
        createdAt: review.createdAt,
      },
    };
  }

  async getRestaurantReviews(restaurantIdParam: number, query: GetRestaurantReviewsQueryDto) {
    const restaurantId = BigInt(restaurantIdParam);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      restaurantId,
      isHidden: false,
    };

    if (query.rating) {
      where.overallRating = {
        gte: query.rating,
        lt: query.rating + 1,
      };
    }

    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sort === 'highest') {
      orderBy = { overallRating: 'desc' };
    } else if (query.sort === 'lowest') {
      orderBy = { overallRating: 'asc' };
    }

    const [reviews, totalCount, aggregateStats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: true,
          reply: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where: { restaurantId, isHidden: false },
        _avg: {
          overallRating: true,
          foodRating: true,
          deliveryRating: true,
          packagingRating: true,
        },
        _count: { id: true },
      }),
    ]);

    return {
      stats: {
        totalReviews: aggregateStats._count.id,
        averageRating: aggregateStats._avg.overallRating
          ? Math.round(Number(aggregateStats._avg.overallRating) * 10) / 10
          : 0,
        averageFoodRating: aggregateStats._avg.foodRating
          ? Math.round(Number(aggregateStats._avg.foodRating) * 10) / 10
          : 0,
        averageDeliveryRating: aggregateStats._avg.deliveryRating
          ? Math.round(Number(aggregateStats._avg.deliveryRating) * 10) / 10
          : 0,
        averagePackagingRating: aggregateStats._avg.packagingRating
          ? Math.round(Number(aggregateStats._avg.packagingRating) * 10) / 10
          : 0,
      },
      data: reviews.map((r) => ({
        id: r.id.toString(),
        orderId: r.orderId.toString(),
        customerName: `${r.customer.firstName} ${r.customer.lastName ? r.customer.lastName[0] + '.' : ''}`,
        foodRating: r.foodRating,
        deliveryRating: r.deliveryRating,
        packagingRating: r.packagingRating,
        overallRating: Number(r.overallRating),
        reviewText: r.reviewText,
        createdAt: r.createdAt,
        images: r.images.map((img) => img.imageUrl),
        reply: r.reply
          ? {
              id: r.reply.id.toString(),
              replyText: r.reply.replyText,
              createdAt: r.reply.createdAt,
            }
          : null,
      })),
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async getOwnerReviews(ownerUserId: bigint) {
    const reviews = await this.prisma.review.findMany({
      where: {
        restaurant: {
          ownerUserId,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        images: true,
        reply: true,
        restaurant: {
          select: {
            id: true,
            businessName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            createdAt: true,
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      data: reviews.map((r) => ({
        id: r.id.toString(),
        orderId: r.orderId.toString(),
        orderNumber: r.order.orderNumber,
        restaurantId: r.restaurant.id.toString(),
        restaurantName: r.restaurant.businessName,
        customerName: `${r.customer.firstName} ${r.customer.lastName || ''}`.trim(),
        foodRating: r.foodRating,
        deliveryRating: r.deliveryRating,
        packagingRating: r.packagingRating,
        overallRating: Number(r.overallRating),
        reviewText: r.reviewText,
        createdAt: r.createdAt,
        images: r.images.map((img) => img.imageUrl),
        reply: r.reply
          ? {
              id: r.reply.id.toString(),
              replyText: r.reply.replyText,
              createdAt: r.reply.createdAt,
            }
          : null,
      })),
    };
  }

  async replyToReview(ownerUserId: bigint, reviewIdParam: number, dto: ReplyReviewDto) {
    const reviewId = BigInt(reviewIdParam);

    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        restaurant: { select: { ownerUserId: true } },
        reply: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.restaurant.ownerUserId !== ownerUserId) {
      throw new ForbiddenException('You do not own the restaurant for this review');
    }

    if (review.reply) {
      throw new BadRequestException('This review has already received an owner reply');
    }

    const reply = await this.prisma.reviewReply.create({
      data: {
        reviewId,
        repliedByUserId: ownerUserId,
        replyText: dto.replyText,
      },
    });

    return {
      message: 'Reply posted successfully',
      data: {
        id: reply.id.toString(),
        reviewId: reply.reviewId.toString(),
        replyText: reply.replyText,
        createdAt: reply.createdAt,
      },
    };
  }
}
