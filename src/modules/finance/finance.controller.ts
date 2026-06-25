import { Request, Response } from 'express';
import { FinanceService } from './finance.service.ts';
import { PayoutStatus, RefundStatus } from '@prisma/client';

const financeService = new FinanceService();

export const getFinanceOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await financeService.getOverviewStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Finance Overview Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getRestaurantPayouts = async (req: Request, res: Response): Promise<void> => {
  try {
    const formatted = await financeService.getFormattedRestaurantPayouts();
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Restaurant Payouts Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const updateRestaurantPayoutStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const formatted = await financeService.updateRestaurantPayout(id as string, status as PayoutStatus);
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Update Restaurant Payout Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const getPartnerPayouts = async (req: Request, res: Response): Promise<void> => {
  try {
    const formatted = await financeService.getFormattedPartnerPayouts();
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Partner Payouts Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const updatePartnerPayoutStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const formatted = await financeService.updatePartnerPayout(id as string, status as PayoutStatus);
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Update Partner Payout Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const processWeeklyPartnerPayouts = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await financeService.processWeeklyPartnerPayouts();
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRefunds = async (req: Request, res: Response): Promise<void> => {
  try {
    const formatted = await financeService.getFormattedRefunds();
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Refunds Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

export const updateRefundStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const formatted = await financeService.updateRefund(id as string, status as RefundStatus);
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Update Refund Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
