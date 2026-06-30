import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.ts';

const restaurantOwnerPageRouter = Router();

restaurantOwnerPageRouter.use(authenticate);

restaurantOwnerPageRouter.use(authorize(['Restaurant_owner']));

restaurantOwnerPageRouter.get('/restaurant-owner-dashboard', (req, res) => {
  res.render('restaurantOwner/dashboard');
});

restaurantOwnerPageRouter.get('/restaurant-owner-restaurants', (req, res) => {
  res.render('restaurantOwner/restaurants');
});

restaurantOwnerPageRouter.get('/restaurant-owner-orders', (req, res) => {
  res.render('restaurantOwner/orders');
});

restaurantOwnerPageRouter.get('/restaurant-owner-menu', (req, res) => {
  res.render('restaurantOwner/menu');
});

restaurantOwnerPageRouter.get('/restaurant-owner-profile', (req, res) => {
  res.render('restaurantOwner/profile');
});

restaurantOwnerPageRouter.get('/restaurant-owner-reviews', (req, res) => {
  res.render('restaurantOwner/reviews');
});

restaurantOwnerPageRouter.get('/restaurant-owner-finance', (req, res) => {
  res.render('restaurantOwner/finance');
});

restaurantOwnerPageRouter.get('/restaurant-owner-promotions', (req, res) => {
  res.render('restaurantOwner/promotions');
});



restaurantOwnerPageRouter.get('/profile', (req, res) => {
  res.render('restaurantOwner/profile');
});

export { restaurantOwnerPageRouter };
