// stripe.router.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
    createCheckoutSession,
    createPortalSession,
    simulateToggle,
} from '../controller/stripe.controller.js';

const router = Router();

router.post('/stripe/create-checkout-session', authMiddleware, createCheckoutSession);
router.post('/stripe/create-portal-session', authMiddleware, createPortalSession);
router.post('/stripe/simulate-toggle', authMiddleware, simulateToggle);

export { router as routerStripe };
