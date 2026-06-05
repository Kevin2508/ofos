import { prisma } from '../../config/prisma.ts';
import { Prisma } from '@prisma/client';

async function createUser(data: Prisma.UserCreateInput) {
  const user = await prisma.user.create({
    data,
  });

  return {
    message: 'User inserted',
    user,
  };
}

async function createGoogleUser(
  data: Pick<Prisma.UserCreateInput, 'firstName' | 'email'>
) {
  const user = await prisma.user.create({
    data,
  });

  return {
    message: 'User inserted',
    user,
  };
}

async function getUserById(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return { message: 'User not found' };

  return { message: 'User found', user };
}

async function getUserByNameOrMail(userName: string, email: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ firstName: userName }, { email }],
    },
  });

  if (!user) return { message: 'User not found' };

  return { message: 'User found', user };
}

async function getUserByMail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return { message: 'User not found' };

  return { message: 'User found', user };
}

async function getUserByUsername(userName: string) {
  const user = await prisma.user.findFirst({
    where: { firstName: userName },
  });

  if (!user) return { message: 'User not found' };

  return { message: 'User found', user };
}

async function getUserByUserIdentifier(identifier: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { firstName: identifier }],
    },
  });

  if (!user) return { message: 'User not found' };

  return { message: 'User found', user };
}

async function resetUserPassword(passwordHash: string, userId: bigint) {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: 'Password reset successfully' };
}

async function isEmailAvailable(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return {
    message: user ? 'Email not available' : 'Email available',
    isAvailable: !user,
  };
}

async function updateUserProfile(data: {
  userId: bigint;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}) {
  const { userId, ...updateData } = data;

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return { message: 'Profile updated successfully' };
}

async function deleteUser(userId: bigint) {
  await prisma.user.delete({
    where: { id: userId },
  });

  return { message: 'User deleted' };
}

export {
  createUser,
  createGoogleUser,
  getUserById,
  getUserByNameOrMail,
  getUserByMail,
  getUserByUsername,
  getUserByUserIdentifier,
  resetUserPassword,
  isEmailAvailable,
  updateUserProfile,
  deleteUser,
};
