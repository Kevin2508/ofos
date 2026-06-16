import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.ts';

const fleetManagerPageRouter = Router();

// Protect all fleet manager routes
fleetManagerPageRouter.use(authenticate);

fleetManagerPageRouter.get('/fleet-manager-dashboard', (req, res) => {
  res.render('fleetManager/dashboard');
});

fleetManagerPageRouter.get('/fleet-manager-partners', (req, res) => {
  res.render('fleetManager/partners');
});

fleetManagerPageRouter.get('/fleet-manager-assignments', (req, res) => {
  res.render('fleetManager/assignments');
});

fleetManagerPageRouter.get('/fleet-manager-profile', (req, res) => {
  res.render('fleetManager/profile');
});

export { fleetManagerPageRouter };
