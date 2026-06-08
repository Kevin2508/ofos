interface customerDto {
  id: string;
  email?: string;
  roles: string[];
<<<<<<< HEAD
  pendingRoles: string[];
=======
>>>>>>> 6cc4dc7 (customer address module is done)
  permissions: string[];
  iat: number;
  exp: number
}

interface CreateAddressDto{
  label: 'HOME' | 'WORK' | 'OTHER';
  contactName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean
}

export{
    customerDto, CreateAddressDto
}