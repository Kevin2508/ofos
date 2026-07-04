export interface GetRestaurantsQuery {
  page?: number;
  limit?: number;

  search?: string;
  city?: string;

  foodType?: "VEG" | "NON_VEG" | "VEGAN";

  minRating?: number;
}  

export interface RestaurantParams {
  id: string;
}
