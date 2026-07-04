import { prisma } from '../../config/prisma.ts';

export async function getLoyaltyAccount(userId: bigint) {
  let account = await prisma.loyaltyAccount.findUnique({
    where: { customerUserId: userId }
  });
  if (!account) {
    account = await prisma.loyaltyAccount.create({
      data: {
        customerUserId: userId,
        currentBalance: 0
      }
    });
  }
  return account;
}

export async function getLoyaltyTransactions(userId: bigint) {
  return prisma.loyaltyTransaction.findMany({
    where: { customerUserId: userId },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getSystemConfig(key: string) {
  const config = await prisma.systemConfiguration.findUnique({
    where: { configKey: key }
  });
  return config?.configValue;
}

export async function addLoyaltyTransaction(
  userId: bigint,
  type: 'EARN' | 'REDEEM' | 'ADJUSTMENT',
  points: number,
  orderId?: bigint,
  description?: string
) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.loyaltyTransaction.create({
      data: {
        customerUserId: userId,
        transactionType: type,
        points: type === 'REDEEM' ? -Math.abs(points) : Math.abs(points),
        orderId: orderId,
        description: description
      }
    });

    const account = await tx.loyaltyAccount.upsert({
      where: { customerUserId: userId },
      update: {
        currentBalance: {
          increment: type === 'REDEEM' ? -Math.abs(points) : Math.abs(points)
        }
      },
      create: {
        customerUserId: userId,
        currentBalance: type === 'REDEEM' ? -Math.abs(points) : Math.abs(points)
      }
    });

    return { transaction, account };
  });
}
