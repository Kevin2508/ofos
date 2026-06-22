import * as loyaltyRepo from './loyalty.repository.ts';
import redisService from '../../services/redisService.ts';

// 1 point = ? Rs
export async function getRedemptionRate(): Promise<number> {
  const rate = await loyaltyRepo.getSystemConfig('loyalty_redemption_rate');
  return rate ? parseFloat(rate) : 1; // default 1 Rs per point
}

export async function getEarningRate(): Promise<number> {
  const rate = await loyaltyRepo.getSystemConfig('loyalty_earning_rate');
  return rate ? parseFloat(rate) : 0.1; // default 0.1 point per Rs spent
}

export async function getLoyaltyDetailsService(userId: bigint) {
  const account = await loyaltyRepo.getLoyaltyAccount(userId);
  const transactions = await loyaltyRepo.getLoyaltyTransactions(userId);
  const earningRate = await getEarningRate();
  const redemptionRate = await getRedemptionRate();
  
  return {
    balance: account.currentBalance,
    transactions: transactions.map(t => ({
      ...t,
      id: String(t.id),
      customerUserId: String(t.customerUserId),
      orderId: t.orderId ? String(t.orderId) : null
    })),
    earningRate,
    redemptionRate
  };
}

export async function applyLoyaltyPointsService(userId: bigint, cartId: bigint, pointsToApply: number) {
  const account = await loyaltyRepo.getLoyaltyAccount(userId);
  if (account.currentBalance < pointsToApply) {
    throw new Error('Insufficient loyalty points');
  }

  // Store the intention to apply points in Redis
  await redisService.set(`cart:${cartId}:loyalty`, pointsToApply, 3600); // 1 hour TTL
  
  return {
    appliedPoints: pointsToApply,
    message: "Loyalty points applied successfully"
  };
}

export async function removeLoyaltyPointsService(cartId: bigint) {
  await redisService.del(`cart:${cartId}:loyalty`);
  return {
    message: "Loyalty points removed successfully"
  };
}

export async function getAppliedLoyaltyPoints(cartId: bigint): Promise<number> {
  const points = await redisService.get<number>(`cart:${cartId}:loyalty`);
  return points || 0;
}
