import { Router } from 'express';

const authPageRouter = Router();

authPageRouter.get('/loginPage', (req, res) => {
  res.render('auth/login');
});

authPageRouter.get('/forgotPasswordPage', (req, res) => {
  res.render('auth/forgot-password');
});

authPageRouter.get('/resetPasswordPage', (req, res) => {
  res.render('auth/reset-password');
});

authPageRouter.get('/registerPage', (req, res) => {
  res.render('auth/register/customer');
});

authPageRouter.get('/registerPage/admin', (req, res) => {
  res.render('auth/register/admin');
});

authPageRouter.get('/registerPage/deliveryPartner', (req, res) => {
  res.render('auth/register/delivery-partner');
});

authPageRouter.get('/registerPage/owner', (req, res) => {
  res.render('auth/register/restaurant-owner');
});

authPageRouter.get('/registerPage/fleetManager', (req, res) => {
  res.render('auth/register/fleet-manager');
});

authPageRouter.get('/registerPage/staff', (req, res) => {
  res.render('auth/register/restaurant-staff');
});

authPageRouter.get('/registerPage/financeManager', (req, res) => {
  res.render('auth/register/finance-manager');
});

authPageRouter.get('/phone-otp', (req, res) => {
  res.render('auth/phone-otp', { otp: req.query.otp });
});

authPageRouter.get('/setup-profile', (req, res) => {
  res.render('auth/setup-profile');
});

authPageRouter.get('/role-selection', (req, res) => {
  res.render('auth/role-selection');
});

authPageRouter.get('/apply-role', (req, res) => {
  res.render('auth/apply-role');
});

export { authPageRouter };
