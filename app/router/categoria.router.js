// router/categoria.router.js
import { Router } from 'express';
import * as C from '../controller/categoria.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/categorias', authMiddleware, C.getCategorias);
router.post('/categorias', authMiddleware, C.createCategoria);
router.put('/categorias/:id', authMiddleware, C.updateCategoria);
router.delete('/categorias/:id', authMiddleware, C.deleteCategoria);

export { router as routerCategorias };