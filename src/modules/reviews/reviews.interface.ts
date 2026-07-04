export interface CreateReviewRequest {
  orderId: bigint;
  foodRating: number;
  deliveryRating: number;
  packagingRating: number;
  reviewText?: string;
}

export interface ReviewFilterQuery {
  rating?: number;
  sort?: 'recent' | 'highest' | 'lowest';
  page?: number;
  limit?: number;
}
