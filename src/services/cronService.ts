import { prisma } from '../config/prisma.ts';
import { EarningStatus } from '@prisma/client';

export function startCronJobs() {
  console.log('Starting background cron jobs...');

  // Check every minute
  setInterval(async () => {
    try {
      const now = new Date();
      // Find branches that are paused, have an autoResumeAt set, and autoResumeAt <= now
      const branchesToResume = await prisma.restaurantBranch.findMany({
        where: {
          isAcceptingOrders: false,
          autoResumeAt: {
            lte: now,
          },
        },
      });

      if (branchesToResume.length > 0) {
        const branchIds = branchesToResume.map((b) => b.id);
        
        await prisma.restaurantBranch.updateMany({
          where: {
            id: {
              in: branchIds,
            },
          },
          data: {
            isAcceptingOrders: true,
            autoResumeAt: null, // clear the timer
          },
        });
        
        console.log(`Auto-resumed ${branchIds.length} branches.`);
      }
    } catch (err) {
      console.error('Error in auto-resume cron job:', err);
    }
  }, 60 * 1000);

  // Check for auto-reject orders every minute
  setInterval(async () => {
    try {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const ordersToReject = await prisma.order.findMany({
        where: {
          orderStatus: 'PLACED',
          createdAt: {
            lte: fiveMinsAgo,
          },
        },
      });

      if (ordersToReject.length > 0) {
        for (const order of ordersToReject) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              orderStatus: 'REJECTED',
              cancellationReason: 'Auto-rejected: no action taken by restaurant within 5 minutes',
            },
          });
          
          if (order.paymentStatus === 'PAID') {
            const payment = await prisma.payment.findFirst({ where: { orderId: order.id, status: 'CAPTURED' } });
            if (payment) {
               await prisma.refund.create({
                 data: {
                   orderId: order.id,
                   paymentId: payment.id,
                   refundReference: `AUTOREJ-${order.id}-${Date.now()}`,
                   amount: order.totalAmount,
                   reason: 'Auto-rejected order',
                   status: 'COMPLETED'
                 }
               });
               await prisma.payment.update({
                 where: { id: payment.id },
                 data: { status: 'REFUNDED' }
               });
            }
          }
        }
        console.log(`Auto-rejected ${ordersToReject.length} orders.`);
      }
    } catch (err) {
      console.error('Error in auto-reject orders cron job:', err);
    }
  }, 60 * 1000);

  // Weekly Partner Payouts (Running every 5 minutes for dev/demo purposes)
  setInterval(async () => {
    try {
      // Find all PENDING earnings
      const pendingEarnings = await prisma.partnerEarning.findMany({
        where: { status: 'PENDING' },
      });

      if (pendingEarnings.length === 0) return;

      // Group by partnerUserId
      const earningsByPartner = pendingEarnings.reduce((acc, earning) => {
        const id = earning.partnerUserId.toString();
        if (!acc[id]) acc[id] = [];
        acc[id].push(earning);
        return acc;
      }, {} as Record<string, typeof pendingEarnings>);

      for (const [partnerId, earnings] of Object.entries(earningsByPartner)) {
        const totalAmount = earnings.reduce((sum, e) => sum + Number(e.totalEarning), 0);

        // Process payout transaction
        await prisma.$transaction(async (tx) => {
          const payout = await tx.partnerPayout.create({
            data: {
              partnerUserId: BigInt(partnerId),
              payoutReference: `PAYOUT-PTNR-${Date.now()}-${partnerId}`,
              grossAmount: totalAmount,
              netAmount: totalAmount,
              status: 'PAID',
              paidAt: new Date(),
              items: {
                create: earnings.map(e => ({ earningId: e.id }))
              }
            }
          });

          // Mark earnings as PAID
          await tx.partnerEarning.updateMany({
            where: { id: { in: earnings.map(e => e.id) } },
            data: { status: EarningStatus.PAID }
          });
          
          console.log(`[BANK TRANSFER / PAYOUT] ₹${totalAmount} processed for Delivery Partner ${partnerId}.`);
          console.log(`[SMS/PUSH NOTIFICATION] To Partner ${partnerId}: Your weekly payout of ₹${totalAmount} has been processed successfully and transferred to your verified bank account. Ref: ${payout.payoutReference}`);
        });
      }
    } catch (err) {
      console.error('Error processing partner payouts:', err);
    }
  }, 5 * 60 * 1000); // Check every 5 mins for demo
}
