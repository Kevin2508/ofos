import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.ts';

const financePageRouter = Router();

// Protect all finance manager pages
financePageRouter.use(authenticate);

financePageRouter.get('/finance-dashboard', (req, res) => {
  res.render('finance/dashboard');
});

financePageRouter.get('/finance-restaurant-payouts', (req, res) => {
  res.render('finance/restaurantPayouts');
});

financePageRouter.get('/finance-partner-payouts', (req, res) => {
  res.render('finance/partnerPayouts');
});

financePageRouter.get('/finance-refunds', (req, res) => {
  res.render('finance/refunds');
});

financePageRouter.get('/finance-profile', (req, res) => {
  res.render('finance/profile');
});

export { financePageRouter };
