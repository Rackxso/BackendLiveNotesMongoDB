// router/todo.router.js
import { Router } from 'express';
import * as T from '../controller/todo.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/todos', authMiddleware, T.getTodos);
router.get('/todos/:id', authMiddleware, T.getTodo);
router.post('/todos', authMiddleware, T.createTodo);
router.put('/todos/:id', authMiddleware, T.updateTodo);
router.delete('/todos/:id', authMiddleware, T.deleteTodo);

router.post('/todos/:id/subitems', authMiddleware, T.createSubItem);
router.put('/todos/:id/subitems/:subId', authMiddleware, T.updateSubItem);
router.delete('/todos/:id/subitems/:subId', authMiddleware, T.deleteSubItem);

export { router as routerTodos };