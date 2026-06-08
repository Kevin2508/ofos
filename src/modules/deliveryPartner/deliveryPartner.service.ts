import { IupdateProfilePayload } from './deliveryPartner.interface.ts';
import {
  getProfile,
  updateProfileRepo,
  updateStatusRepo,
} from './deliveryPartner.repository.ts';

async function getProfileService(userId: string) {
  const user = await getProfile(BigInt(userId));
  return { message: 'user profile fetched', user };
}

async function updateProfileService(
  userId: string,
  updateData: IupdateProfilePayload
) {
  const user = await updateProfileRepo(BigInt(userId), updateData);

  return {
    message: 'Profile updated successfully',
    user,
  };
}

async function updateStatusService(userId: string, isOnline: boolean) {
  const updatedPartner = await updateStatusRepo(BigInt(userId), isOnline);

  if (!updatedPartner) {
    throw new Error('Delivery partner profile not found');
  }

  return {
    message: `You are now ${isOnline ? 'online' : 'offline'}`,
    isOnline: updatedPartner.isOnline,
  };
}

export { getProfileService, updateProfileService, updateStatusService };
