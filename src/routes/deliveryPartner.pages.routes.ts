import { Router } from 'express';

const deliveryPartnerPageRouter = Router();

deliveryPartnerPageRouter.get('/delivery-partner-dashboard', (req, res) => {
  res.render('deliveryPartner/dashboard');
});

deliveryPartnerPageRouter.get('/delivery-partner-assignments', (req, res) => {
  res.render('deliveryPartner/assignments');
});

deliveryPartnerPageRouter.get('/delivery-partner-earnings', (req, res) => {
  res.render('deliveryPartner/earnings');
});

deliveryPartnerPageRouter.get('/delivery-partner-profile', (req, res) => {
  res.render('deliveryPartner/profile');
});

export { deliveryPartnerPageRouter };
