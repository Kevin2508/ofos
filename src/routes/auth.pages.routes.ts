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

export { authPageRouter };
