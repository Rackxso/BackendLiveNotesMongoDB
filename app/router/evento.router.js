import { Router } from "express";
import * as X from "../controller/evento.controller.js";
const router = Router();
import { authMiddleware } from '../middleware/auth.middleware.js';

// Calendar
router.get('/events/calendar', authMiddleware, X.getCalendarEvents);
router.post('/events/calendar', authMiddleware, X.createCalendarEvent);
router.put('/events/calendar/:id', authMiddleware, X.updateCalendarEvent);
router.delete('/events/calendar/:id', authMiddleware, X.deleteCalendarEvent);

// Mood
router.get('/events/mood', authMiddleware, X.getMoodEntries);
router.post('/events/mood', authMiddleware, X.createMoodEntry);

// Habits
router.get('/habits', authMiddleware, X.getHabits);
router.post('/habits', authMiddleware, X.createHabit);
router.delete('/habits/:id', authMiddleware, X.deleteHabit);
router.patch('/habits/:id/marcar', authMiddleware, X.marcarHabit);

export { router as routerEvents };