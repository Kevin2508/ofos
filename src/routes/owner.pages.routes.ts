import { Router } from 'express';

const ownerPageRouter = Router();

ownerPageRouter.get('/owner-dashboard', (req, res) => {
  res.render('owner/dashboard');
});

export { ownerPageRouter };
