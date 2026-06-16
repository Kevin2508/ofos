import { Router } from 'express';

const restaurantOwnerPageRouter = Router();

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

export { restaurantOwnerPageRouter };
