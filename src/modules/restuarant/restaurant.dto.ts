export interface RestaurantListDto {
  id: string;
  businessName: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;

  totalBranches: number;
  averageRating: number;

  createdAt: Date;
}