import { Router } from 'express';

const defaultPageRouter = Router();

defaultPageRouter.get('/pendingVerificationPage', (req, res) => {
  res.render('default/pendingVerification');
});

defaultPageRouter.get('/email-simulation', (req, res) => {
  res.render('utils/email-template');
});

defaultPageRouter.get('/phone-simulation', (req, res) => {
  res.render('utils/phone-otp');
});

export { defaultPageRouter };
