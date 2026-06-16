import { Router } from 'express';

const restaurantStaffPageRouter = Router();

restaurantStaffPageRouter.get('/restaurant-staff-dashboard', (req, res) => {
  res.render('restaurantStaff/dashboard');
});

restaurantStaffPageRouter.get('/restaurant-staff-orders', (req, res) => {
  res.render('restaurantStaff/orders');
});

restaurantStaffPageRouter.get('/restaurant-staff-profile', (req, res) => {
  res.render('restaurantStaff/profile');
});

export { restaurantStaffPageRouter };
