import { prisma } from '../../config/prisma.ts';
import { VehicleType } from '../../generated/prisma/enums.ts';
import { IupdateProfilePayload } from './deliveryPartner.interface.ts';

async function createDeliveryPartner(data: {
  userId: bigint;
  vehicleType: VehicleType;
  vehicleRegistrationNumber: string;
}) {
  return await prisma.deliveryPartner.create({
    data: {
      userId: data.userId,
      vehicleType: data.vehicleType,
      vehicleRegistrationNumber: data.vehicleRegistrationNumber,
    },
  });
}

async function getProfile(id: bigint) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      deliveryPartner: {
        select: {
          vehicleType: true,
          vehicleRegistrationNumber: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    id: user.id.toString(),
    deliveryPartner: user.deliveryPartner
      ? {
          ...user.deliveryPartner,
        }
      : null,
  };
}

async function updateProfileRepo(id: bigint, data: IupdateProfilePayload) {
  const { vehicleType, vehicleRegistrationNumber, ...userData } = data;

  const deliveryPartnerUpdate: any = {};
  if (vehicleType) deliveryPartnerUpdate.vehicleType = vehicleType;
  if (vehicleRegistrationNumber)
    deliveryPartnerUpdate.vehicleRegistrationNumber = vehicleRegistrationNumber;

  const prismaUpdateData: any = { ...userData };

  if (Object.keys(deliveryPartnerUpdate).length > 0) {
    prismaUpdateData.deliveryPartner = {
      update: deliveryPartnerUpdate,
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: prismaUpdateData,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profileImageUrl: true,
      createdAt: true,
      deliveryPartner: {
        select: {
          vehicleType: true,
          vehicleRegistrationNumber: true,
        },
      },
    },
  });

  if (!updatedUser) return null;

  return {
    ...updatedUser,
    id: updatedUser.id.toString(),
    deliveryPartner: updatedUser.deliveryPartner
      ? {
          ...updatedUser.deliveryPartner,
        }
      : null,
  };
}

async function updateStatusRepo(userId: bigint, isOnline: boolean) {
  const deliveryPartner = await prisma.deliveryPartner.update({
    where: {
      userId: userId,
    },
    data: {
      isOnline: isOnline,
    },
    select: {
      isOnline: true,
    },
  });

  return deliveryPartner;
}

export {
  createDeliveryPartner,
  getProfile,
  updateProfileRepo,
  updateStatusRepo,
};
