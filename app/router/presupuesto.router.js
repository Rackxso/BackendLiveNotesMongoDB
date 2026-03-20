// router/presupuesto.router.js
import { Router } from 'express';
import * as P from '../controller/presupuesto.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/presupuestos', authMiddleware, P.getPresupuestos);
router.post('/presupuestos', authMiddleware, P.createPresupuesto);
router.put('/presupuestos/:id', authMiddleware, P.updatePresupuesto);
router.delete('/presupuestos/:id', authMiddleware, P.deletePresupuesto);

export { router as routerPresupuestos };