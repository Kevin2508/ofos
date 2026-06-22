import { prisma } from '../../config/prisma.ts';
import { Prisma } from "@prisma/client";

export async function createReview(
  data: any,
  images: string[]
) {
  return await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data,
    });

    if (images.length > 0) {
      await tx.reviewImage.createMany({
        data: images.map((url) => ({
          reviewId: review.id,
          imageUrl: url,
        })),
      });
    }

    return review;
  });
}

export async function getReviewsForRestaurant(
  restaurantId: bigint,
  options: {
    rating?: number;
    sort?: "recent" | "highest" | "lowest";
    skip?: number;
    take?: number;
  }
) {
  const where: Prisma.ReviewWhereInput = {
    restaurantId,
    isHidden: false,
  };

  if (options.rating) {
    where.overallRating = {
      gte: options.rating,
      lt: options.rating + 1,
    };
  }

  let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: "desc" };
  if (options.sort === "highest") {
    orderBy = { overallRating: "desc" };
  } else if (options.sort === "lowest") {
    orderBy = { overallRating: "asc" };
  }

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where: where as any,
      orderBy,
      skip: options.skip,
      take: options.take,
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
    prisma.review.count({ where: where as any }),
  ]);

  return { reviews, totalCount };
}

export async function getReviewsByOwner(ownerUserId: bigint) {
  return await prisma.review.findMany({
    where: {
      restaurant: {
        ownerUserId,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      images: true,
      reply: true,
      restaurant: {
        select: {
          businessName: true,
        },
      },
      customer: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function addReviewReply(
  reviewId: bigint,
  repliedByUserId: bigint,
  replyText: string
) {
  return await prisma.reviewReply.create({
    data: {
      reviewId,
      repliedByUserId,
      replyText,
    },
  });
}

export async function getReviewById(id: bigint) {
  return await prisma.review.findUnique({
    where: { id },
    include: {
      restaurant: true,
    },
  });
}

export async function getReviewByOrderId(orderId: bigint) {
  return await prisma.review.findUnique({
    where: { orderId },
  });
}
