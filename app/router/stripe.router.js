// stripe.router.js
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { simulateToggle } from '../controller/stripe.controller.js';

// [STRIPE] Descomenta cuando Stripe esté activo
// import { createCheckoutSession } from '../controller/stripe.controller.js';

const router = Router();

// [STRIPE] router.post('/stripe/create-checkout-session', authMiddleware, createCheckoutSession);
router.post('/stripe/simulate-toggle', authMiddleware, simulateToggle);

export { router as routerStripe };
