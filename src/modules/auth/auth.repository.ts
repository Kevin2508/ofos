import { prisma } from '../../config/prisma.ts';

async function storeResetToken(data: {
  userId: bigint;
  token: string;
  expiresAt: Date;
}) {
  const result = await prisma.resetToken.upsert({
    where: {
      userId: data.userId,
    },
    update: {
      token: data.token,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
    },
    create: {
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
    },
  });

  return {
    message: 'Reset token data inserted',
    data: result,
  };
}

async function findDataByToken(token: string) {
  const data = await prisma.resetToken.findFirst({
    where: { token },
  });

  if (!data) {
    return { message: 'Reset token not found' };
  }

  return {
    message: 'Reset token data found',
    data,
  };
}

async function deleteTokenById(resetTokenId: bigint) {
  await prisma.resetToken.delete({
    where: { id: resetTokenId },
  });

  return { message: 'Reset token deleted' };
}

async function storeOtp(data: { email: string; otp: string; expiresAt: Date }) {
  const result = await prisma.otp.upsert({
    where: {
      email: data.email,
    },
    update: {
      otp: data.otp,
      expiresAt: data.expiresAt,
      attempts: 0,
      createdAt: new Date(),
    },
    create: {
      email: data.email,
      otp: data.otp,
      expiresAt: data.expiresAt,
      attempts: 0,
    },
  });

  return {
    message: 'Otp data inserted',
    data: result,
  };
}

async function findOtpByEmail(email: string) {
  const data = await prisma.otp.findUnique({
    where: { email },
  });

  if (!data) {
    return { message: 'Otp data not found' };
  }

  return {
    message: 'Otp data found',
    data,
  };
}

async function updateOtpAttempts(otpId: bigint) {
  await prisma.otp.update({
    where: { id: otpId },
    data: {
      attempts: {
        increment: 1,
      },
    },
  });

  return { message: 'Attempts updated' };
}

async function deleteOtpById(otpId: bigint) {
  await prisma.otp.delete({
    where: { id: otpId },
  });

  return { message: 'Otp deleted' };
}

export {
  deleteOtpById,
  deleteTokenById,
  findDataByToken,
  findOtpByEmail,
  storeOtp,
  storeResetToken,
  updateOtpAttempts,
};
