import { CreateReviewRequest, ReviewFilterQuery } from "./reviews.interface.ts";
import * as reviewsRepo from "./reviews.repository.ts";
import orderRepository from "../orders/order.repository.ts";

export async function submitReview(
  customerUserId: bigint,
  data: CreateReviewRequest,
  imageUrls: string[]
) {
  const order = await orderRepository.getOrderById(data.orderId, customerUserId);
  if (!order) {
    throw new Error("Order not found or does not belong to this customer.");
  }

  if (order.orderStatus !== "DELIVERED") {
    throw new Error("Reviews can only be submitted for delivered orders.");
  }

  const existingReview = await reviewsRepo.getReviewByOrderId(data.orderId);
  if (existingReview) {
    throw new Error("This order has already been reviewed.");
  }
  const avg = (data.foodRating + data.deliveryRating + data.packagingRating) / 3;
  const overallRating = Math.round(avg * 10) / 10; // Round to 1 decimal place

  const review = await reviewsRepo.createReview(
    {
      orderId: data.orderId,
      customerUserId,
      restaurantId: order.restaurant.id,
      foodRating: data.foodRating,
      deliveryRating: data.deliveryRating,
      packagingRating: data.packagingRating,
      overallRating,
      reviewText: data.reviewText,
    },
    imageUrls
  );

  return review;
}

export async function getRestaurantReviews(
  restaurantId: bigint,
  query: ReviewFilterQuery
) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  return await reviewsRepo.getReviewsForRestaurant(restaurantId, {
    rating: query.rating,
    sort: query.sort,
    skip,
    take: limit,
  });
}

export async function getOwnerReviews(ownerUserId: bigint) {
  return await reviewsRepo.getReviewsByOwner(ownerUserId);
}

export async function replyToReview(
  reviewId: bigint,
  ownerUserId: bigint,
  replyText: string
) {
  const review = await reviewsRepo.getReviewById(reviewId);
  if (!review) {
    throw new Error("Review not found.");
  }

  if (review.restaurant.ownerUserId !== ownerUserId) {
    throw new Error("You do not have permission to reply to this review.");
  }

  return await reviewsRepo.addReviewReply(reviewId, ownerUserId, replyText);
}
