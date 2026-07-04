import { processPendingOrderTimeouts } from '../modules/orders/order.service.ts';

export function startOrderTimeoutJob() {
  // Run every 1 minute
  setInterval(() => {
    processPendingOrderTimeouts().catch((err) => {
      console.error('Error in processPendingOrderTimeouts job:', err);
    });
  }, 60 * 1000);

  console.log('Order Timeout Job initialized.');
}
