import { Router } from 'express';

const customerPageRouter = Router();

customerPageRouter.get('/', (req, res) => {
  res.render('customer/dashboard');
});

// customerPageRouter.get('/forgotPasswordPage', (req, res) => {
//   res.render('customer/forgot-password');
// });

// customerPageRouter.get('/resetPasswordPage', (req, res) => {
//   res.render('customer/reset-password');
// });

// customerPageRouter.get('/registerPage', (req, res) => {
//   res.render('customer/register/customer');
// });

// customerPageRouter.get('/registerPage/admin', (req, res) => {
//   res.render('customer/register/admin');
// });

export { customerPageRouter };
