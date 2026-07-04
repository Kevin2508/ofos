import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.ts';
import { validate } from '../../middlewares/validation.middleware.ts';
import { chatRequestSchema } from './ai.validation.ts';
import { chatController, resetChatController } from './ai.controller.ts';

const aiRouter = Router();

// Secure all AI routes with authentication
aiRouter.use(authenticate);

aiRouter.post('/chat', validate(chatRequestSchema), chatController);
aiRouter.post('/reset', resetChatController);

export { aiRouter };
