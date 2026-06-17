import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.ts';

const fleetManagerPageRouter = Router();

fleetManagerPageRouter.use(authenticate);

fleetManagerPageRouter.use(authorize('Fleet_manager'));

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
