import { Router } from 'express';
import * as T from '../controller/ticket.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';

const router = Router();

router.get('/tickets', authMiddleware, T.getTickets);
router.post('/tickets', authMiddleware, T.createTicket);

router.get('/tickets/admin',          authMiddleware, adminMiddleware, T.getAllTicketsAdmin);
router.delete('/tickets/:id',         authMiddleware, adminMiddleware, T.deleteTicket);
router.patch('/tickets/:id/estado',   authMiddleware, adminMiddleware, T.updateEstado);

export { router as routerTickets };
