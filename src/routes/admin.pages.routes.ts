import { Router } from 'express';

const adminPageRouter = Router();

adminPageRouter.get('/admin-dashboard', (req, res) => {
  res.render('admin/dashboard');
});

adminPageRouter.get('/admin-users', (req, res) => {
  res.render('admin/users');
});

adminPageRouter.get('/admin-restaurants', (req, res) => {
  res.render('admin/restaurants');
});

adminPageRouter.get('/admin-orders', (req, res) => {
  res.render('admin/orders');
});

adminPageRouter.get('/admin-configs', (req, res) => {
  res.render('admin/configs');
});

adminPageRouter.get('/admin-audit-logs', (req, res) => {
  res.render('admin/audit-logs');
});

export { adminPageRouter };
