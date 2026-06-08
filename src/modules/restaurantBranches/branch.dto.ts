export type branchParamsDto = {
  restaurantId: string;
  id: string;
<<<<<<< HEAD
  branchId: string;
  dayOfWeek: string;
=======
>>>>>>> 69b2b43 (completed restaurant management and restaurant branches modules)
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