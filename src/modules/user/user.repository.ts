import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.ts';

async function findUserByEmailOrContact(email: string, phone: string) {
  return prisma.user.findFirst({
    where: {
      OR: [email ? { email } : undefined, phone ? { phone } : undefined].filter(
        Boolean
      ) as Prisma.UserWhereInput[],
    },
    select: {
      id: true,
    },
  });
}

async function findUserByIdentifier(identifier: string) {
  return prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  });
}

async function findUserById(userId: bigint) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
}

async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },
  });
}

async function createUser(data: {
  firstName: string;
  email: string;
  phone: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      firstName: data.firstName,
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
    },
  });
}

async function markUserIsVerified({
  userId,
  type,
}: {
  userId: number;
  type: string;
}) {
  const updateData =
    type === 'email' ? { emailVerified: true } : { phoneVerified: true };

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
}

async function updateUser({ userId, data }: { userId: bigint; data: {} }) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

export {
  createUser,
  findUserByEmailOrContact,
  updateUser,
  markUserIsVerified,
  findUserByIdentifier,
  findUserById,
  findUserByEmail,
};
