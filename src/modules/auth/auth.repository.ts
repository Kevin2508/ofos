import { prisma } from '../../config/prisma.ts';
import { OtpPurpose } from '../../generated/prisma/enums.ts';

async function saveOtp({
  email,
  phone,
  otpHash,
  purpose,
  expiresAt,
}: {
  email?: string | null;
  phone?: string | null;
  otpHash: string;
  purpose: OtpPurpose;
  expiresAt: Date;
}) {
  return prisma.otpVerification.create({
    data: {
      email,
      phone,
      otpHash,
      purpose,
      expiresAt,
    },
  });
}

// Fetch valid OTP by Email
async function getValidOtpByEmail(email: string, purpose: OtpPurpose) {
  return prisma.otpVerification.findFirst({
    where: {
      email,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Fetch valid OTP by Phone
async function getValidOtpByPhone(phone: string, purpose: OtpPurpose) {
  return prisma.otpVerification.findFirst({
    where: {
      phone,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getOtp({ otpHash }: { otpHash: string }) {
  return prisma.otpVerification.findFirst({
    where: {
      otpHash,
      verifiedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async function deleteOtp(id: bigint) {
  return prisma.otpVerification.delete({
    where: { id },
  });
}

async function storeResetToken({
  email,
  phone,
  otpHash,
  expiresAt,
  purpose,
}: {
  email?: string | null;
  phone?: string | null;
  otpHash: string;
  expiresAt: Date;
  purpose: OtpPurpose;
}) {
  return prisma.otpVerification.create({
    data: {
      email,
      phone,
      otpHash,
      purpose,
      expiresAt,
    },
  });
}

async function getToken({ otpHash }: { otpHash: string }) {
  return prisma.otpVerification.findFirst({
    where: {
      otpHash,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
}

async function getValidResetRecordByPhone(phone: string, purpose: OtpPurpose) {
  return prisma.otpVerification.findFirst({
    where: {
      phone,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function deleteResetToken({ id }: { id: bigint }) {
  return prisma.otpVerification.delete({
    where: { id },
  });
}

// Creates a secure user session for refresh tokens.
async function createUserSession({
  userId,
  refreshTokenHash,
  ipAddress,
  userAgent,
  deviceName,
  expiresAt,
}: {
  userId: bigint;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent: string;
  deviceName: string;
  expiresAt: Date;
}) {
  return prisma.userSession.create({
    data: {
      userId,
      refreshTokenHash,
      ipAddress,
      userAgent,
      deviceName,
      expiresAt,
    },
  });
}

// Revokes a specific session
async function revokeUserSession(sessionId: bigint) {
  return prisma.userSession.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

// Extends a specific session's expiry date
async function extendUserSession(sessionId: bigint, expiresAt: Date) {
  return prisma.userSession.update({
    where: { id: sessionId },
    data: { expiresAt },
  });
}

// Fetches all active sessions for a user
async function getUserSessions(userId: bigint) {
  return prisma.userSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });
}

// Fetches an OTP strictly checking that it hasn't expired or been verified
async function getValidOtp(email: string, purpose: OtpPurpose) {
  return prisma.otpVerification.findFirst({
    where: {
      email,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Revokes a session by the hashed refresh token (used for logout)
async function revokeSessionByTokenHash(refreshTokenHash: string) {
  return prisma.userSession.updateMany({
    where: { refreshTokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Finds a valid session and pulls in the user's role/permission tree.
// Ensures the session is not revoked and not expired.
async function getValidSessionWithUserByTokenHash(refreshTokenHash: string) {
  return prisma.userSession.findFirst({
    where: {
      refreshTokenHash,
      revokedAt: null, // Must not be logged out or kicked
      expiresAt: { gt: new Date() }, // Must not be expired
    },
    include: {
      user: {
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
      },
    },
  });
}

async function getUserRole(userId: bigint, roleName: string) {
  return prisma.userRole.findFirst({
    where: {
      userId,
      role: { name: roleName },
    },
    include: { role: true },
  });
}

export {
  createUserSession,
  deleteOtp,
  deleteResetToken,
  extendUserSession,
  getOtp,
  getToken,
  getValidOtp,
  getValidOtpByEmail,
  getValidOtpByPhone,
  getValidResetRecordByPhone,
  getValidSessionWithUserByTokenHash,
  getUserSessions,
  revokeSessionByTokenHash,
  revokeUserSession,
  saveOtp,
  storeResetToken,
  getUserRole,
};
