import { OtpPurpose } from '@prisma/client';
import { prisma } from '../../config/prisma.ts';

async function saveOtp({
  email,
  otpCode,
  purpose,
  expiresAt,
}: {
  email: string;
  otpCode: string;
  purpose: OtpPurpose;
  expiresAt: Date;
}) {
  return prisma.otpVerification.create({
    data: {
      email,
      otpCode,
      purpose,
      expiresAt,
    },
  });
}

async function getOtpByEmail(email: string) {
  return prisma.otpVerification.findFirst({
    where: {
      email,
    },
    orderBy: {
      createdAt: 'desc',
    },
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
  userId,
  otpCode,
  expiresAt,
  purpose,
}: {
  userId: bigint;
  otpCode: string;
  expiresAt: Date;
  purpose: OtpPurpose;
}) {
  return prisma.otpVerification.create({
    data: {
      userId,
      otpCode,
      purpose,
      expiresAt,
    },
  });
}

async function getToken({ otpCode }: { otpCode: string }) {
  return prisma.otpVerification.findFirst({
    where: {
      otpCode,
      expiresAt: {
        gt: new Date(),
      },
    },
  });
}

async function deleteResetToken({ id }: { id: bigint }) {
  return prisma.otpVerification.delete({
    where: { id },
  });
}

export {
  deleteOtp,
  deleteResetToken,
  getOtp,
  getOtpByEmail,
  getToken,
  saveOtp,
  storeResetToken,
};
