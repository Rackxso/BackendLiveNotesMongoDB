import { Router } from 'express';
import * as T from '../controller/ticket.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/tickets', authMiddleware, T.getTickets);
router.post('/tickets', authMiddleware, T.createTicket);

export { router as routerTickets };
