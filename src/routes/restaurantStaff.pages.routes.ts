import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.ts';

const restaurantStaffPageRouter = Router();

restaurantStaffPageRouter.use(authenticate);

restaurantStaffPageRouter.use(authorize(['Restaurant_staff']));

restaurantStaffPageRouter.get('/restaurant-staff-dashboard', (req, res) => {
  res.render('restaurantStaff/dashboard');
});

restaurantStaffPageRouter.get('/restaurant-staff-orders', (req, res) => {
  res.render('restaurantStaff/orders');
});

restaurantStaffPageRouter.get('/restaurant-staff-profile', (req, res) => {
  res.render('restaurantStaff/profile');
});



restaurantStaffPageRouter.get('/profile', (req, res) => {
  res.render('restaurantStaff/profile');
});

export { restaurantStaffPageRouter };
