// router/movimiento.router.js
import { Router } from 'express';
import * as M from '../controller/movimiento.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/movimientos', authMiddleware, M.getMovimientos);
router.post('/movimientos', authMiddleware, M.createMovimiento);

export { router as routerMovimientos };