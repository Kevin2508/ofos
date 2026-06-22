import { Request, Response } from "express";
import * as reviewsService from "./reviews.service.ts";

export async function submitReviewController(req: Request, res: Response): Promise<any> {
  try {
    const customerUserId = BigInt((req as any).user.id);
    const orderId = BigInt((req.params as any).orderId);

    const { foodRating, deliveryRating, packagingRating, reviewText } = req.body;

    const files = req.files as Express.Multer.File[];
    const imageUrls = files ? files.map((f) => `/uploads/${f.filename}`) : [];

    const review = await reviewsService.submitReview(
      customerUserId,
      {
        orderId,
        foodRating: Number(foodRating),
        deliveryRating: Number(deliveryRating),
        packagingRating: Number(packagingRating),
        reviewText,
      },
      imageUrls
    );

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getRestaurantReviewsController(req: Request, res: Response): Promise<any> {
  try {
    const restaurantId = BigInt((req.params as any).restaurantId);
    const { rating, sort, page, limit } = req.query;

    const result = await reviewsService.getRestaurantReviews(restaurantId, {
      rating: rating ? Number(rating) : undefined,
      sort: sort as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getOwnerReviewsController(req: Request, res: Response): Promise<any> {
  try {
    const ownerId = BigInt((req as any).user.id);
    const reviews = await reviewsService.getOwnerReviews(ownerId);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function replyToReviewController(req: Request, res: Response): Promise<any> {
  try {
    const ownerId = BigInt((req as any).user.id);
    const reviewId = BigInt((req.params as any).reviewId);
    const { replyText } = req.body;

    if (!replyText) {
      return res.status(400).json({ success: false, message: "Reply text is required" });
    }

    const reply = await reviewsService.replyToReview(reviewId, ownerId, replyText);

    res.status(201).json({
      success: true,
      message: "Reply posted successfully",
      data: reply,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
