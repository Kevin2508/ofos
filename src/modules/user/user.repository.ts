import { prisma } from '../../config/prisma.ts';
import { Prisma } from '../../generated/prisma/client.ts';
import { UserRoleStatus } from '../../generated/prisma/enums.ts';

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

async function findUserByContact(phone: string) {
  return prisma.user.findUnique({
    where: {
      phone,
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
    select: {
      id: true,
    },
  });
}

async function getRoleIdByRole(data: { role: string }) {
  return await prisma.role.findUnique({
    where: {
      name: data.role,
    },
    select: {
      id: true,
    },
  });
}

async function assignRole(data: {
  userId: bigint;
  roleId: bigint;
  status: UserRoleStatus;
}) {
  return await prisma.userRole.create({
    data: {
      userId: data.userId,
      roleId: data.roleId,
      status: data.status,
    },
  });
}

async function markUserIsVerified({
  userId,
  type,
}: {
  userId: bigint;
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

//  Fetches user by email or phone, including their full role and permission tree.
async function findUserForAuth(identifier: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: identifier }],
    },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

// Increments failed login attempts to protect against brute force attacks.
async function incrementFailedLoginAttempts(userId: bigint) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: { increment: 1 },
    },
  });
}

// Resets failed attempts to 0 and updates the last login timestamp on success.
async function handleSuccessfulLogin(userId: bigint) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
    },
  });
}

// Blocks a user account temporarily or permanently.
async function lockUserAccount(userId: bigint) {
  return prisma.user.update({
    where: { id: userId },
    data: { status: 'SUSPENDED' },
  });
}

// Revokes all active sessions for a user (used after a password reset)
async function revokeAllUserSessions(userId: bigint) {
  return prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

async function assignRoleToUser(userId: bigint, roleId: bigint) {
  return prisma.userRole.upsert({
    where: {
      userId_roleId: { userId, roleId },
    },
    update: {},
    create: {
      userId,
      roleId,
    },
  });
}

export {
  assignRole,
  assignRoleToUser,
  createUser,
  findUserByContact,
  findUserByEmail,
  findUserByEmailOrContact,
  findUserById,
  findUserByIdentifier,
  findUserForAuth,
  getRoleIdByRole,
  handleSuccessfulLogin,
  incrementFailedLoginAttempts,
  lockUserAccount,
  markUserIsVerified,
  revokeAllUserSessions,
  updateUser,
};
