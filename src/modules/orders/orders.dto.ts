export interface OrderListDto {
  id: string;

  status: string;

  totalAmount: number;

  createdAt: Date;

  restaurant: {
    id: string;
    businessName: string;
    logoUrl: string | null;
  };

  branch: {
    id: string;
    branchName: string;
    city: string;
  };
}