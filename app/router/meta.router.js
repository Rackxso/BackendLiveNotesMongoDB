import { Router } from 'express';
import * as M from '../controller/meta.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/metas', authMiddleware, M.getMetas);
router.post('/metas', authMiddleware, M.createMeta);
router.put('/metas/:id', authMiddleware, M.updateMeta);
router.delete('/metas/:id', authMiddleware, M.deleteMeta);

export { router as routerMetas };