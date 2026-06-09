import { VehicleType } from '../../generated/prisma/enums.ts';

interface IupdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  vehicleType?: VehicleType;
  vehicleRegistrationNumber?: string;
}

export { IupdateProfilePayload };
