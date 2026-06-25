import { prisma } from '../config/prisma.ts';

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
}
