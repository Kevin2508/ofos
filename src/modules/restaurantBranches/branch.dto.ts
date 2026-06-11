export type branchParamsDto = {
  restaurantId: string;
  id: string;
  branchId: string;
  dayOfWeek: string;
};

export type createBranchDto = {
  branchName: string;
  gstin: string;
  fssaiLicenseNumber: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  minimumOrderValue?: number;
  deliveryFee?: number;
};

export type updateBranchDto = {
  branchName?: string;
  contactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  minimumOrderValue?: number;
  deliveryFee?: number;
}