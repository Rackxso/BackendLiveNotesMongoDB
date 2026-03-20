// router/nota.router.js
import { Router } from 'express';
import * as N from '../controller/nota.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/notas', authMiddleware, N.getNotas);
router.get('/notas/:id', authMiddleware, N.getNota);
router.post('/notas', authMiddleware, N.createNota);
router.put('/notas/:id', authMiddleware, N.updateNota);
router.delete('/notas/:id', authMiddleware, N.deleteNota);

export { router as routerNotas };