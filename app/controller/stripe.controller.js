// stripe.controller.js
"use strict";

// [STRIPE] Descomenta este bloque cuando tengas las claves de Stripe configuradas en .env
// import Stripe from 'stripe';
// import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID, FRONTEND_URL } from '../config.js';
// const stripe = new Stripe(STRIPE_SECRET_KEY);

import { User } from '../models/user.model.js';
import { FRONTEND_URL } from '../config.js';

const PREMIUM_PERMISOS = 2;

// [STRIPE] Crea una sesión de pago en Stripe Checkout
export const createCheckoutSession = async (req, res) => {
    // const { email } = req.user;
    // const session = await stripe.checkout.sessions.create({
    //     mode: 'subscription',
    //     payment_method_types: ['card'],
    //     line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    //     customer_email: email,
    //     success_url: `${FRONTEND_URL}/finance/overview?upgraded=true`,
    //     cancel_url:  `${FRONTEND_URL}/finance/overview?cancelled=true`,
    //     metadata: { userEmail: email },
    // });
    // res.status(200).json({ url: session.url });
    res.status(503).json({ message: 'Stripe no está activado aún.' });
};

// [STRIPE] Webhook — verifica firma y sube permisos al completar el pago
export const stripeWebhook = async (req, res) => {
    // const sig = req.headers['stripe-signature'];
    // let event;
    // try {
    //     event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    // } catch (err) {
    //     return res.status(400).json({ message: `Webhook error: ${err.message}` });
    // }
    // if (event.type === 'checkout.session.completed') {
    //     const session = event.data.object;
    //     const email = session.metadata?.userEmail ?? session.customer_email;
    //     if (email) await User.findOneAndUpdate({ email }, { permisos: PREMIUM_PERMISOS });
    // }
    // res.status(200).json({ received: true });
    res.status(503).json({ message: 'Stripe no está activado aún.' });
};

// Activo — no depende de Stripe. Alterna permisos 1 ↔ 2 para pruebas locales.
export const simulateToggle = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email }).select('permisos');
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const newPermisos = user.permisos >= PREMIUM_PERMISOS ? 1 : PREMIUM_PERMISOS;
        user.permisos = newPermisos;
        await user.save();

        res.status(200).json({ permisos: newPermisos, isPremium: newPermisos >= PREMIUM_PERMISOS });
    } catch (error) {
        res.status(500).json({ message: 'Error al simular cambio de plan', error: error.message });
    }
};
