import { Router } from 'express';
import * as C from '../controller/cuenta.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/cuentas', authMiddleware, C.getCuentas);
router.post('/cuentas', authMiddleware, C.createCuenta);
router.put('/cuentas/:id', authMiddleware, C.updateCuenta);
router.delete('/cuentas/:id', authMiddleware, C.deleteCuenta);

export { router as routerCuentas };