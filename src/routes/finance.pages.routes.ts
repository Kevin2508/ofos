import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.ts';

const financePageRouter = Router();

financePageRouter.use(authenticate);

financePageRouter.use(authorize(['Finance_manager']));

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
