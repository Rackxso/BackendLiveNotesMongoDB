// stripe.controller.js
"use strict";

import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID, FRONTEND_URL } from '../config.js';
import { User } from '../models/user.model.js';

const stripe = new Stripe(STRIPE_SECRET_KEY);

const PREMIUM_PERMISOS = 2;
const FREE_PERMISOS = 1;

// Inicia sesión de pago en Stripe Checkout (modo suscripción)
export const createCheckoutSession = async (req, res) => {
    try {
        const { email } = req.user;

        const user = await User.findOne({ email }).select('stripeCustomerId');
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Reutiliza el customer de Stripe si ya existe
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({ email });
            customerId = customer.id;
            await User.updateOne({ email }, { stripeCustomerId: customerId });
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
            success_url: `${FRONTEND_URL}/settings?upgraded=true`,
            cancel_url: `${FRONTEND_URL}/settings?cancelled=true`,
            metadata: { userEmail: email },
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear sesión de pago', error: error.message });
    }
};

// Abre el portal de facturación de Stripe (para cancelar o gestionar la suscripción)
export const createPortalSession = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email }).select('stripeCustomerId');

        if (!user?.stripeCustomerId) {
            return res.status(400).json({ message: 'No hay suscripción activa' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${FRONTEND_URL}/settings`,
        });

        res.status(200).json({ url: portalSession.url });
    } catch (error) {
        res.status(500).json({ message: 'Error al abrir portal de facturación', error: error.message });
    }
};

// Webhook — recibe eventos de Stripe y actualiza el estado del usuario
export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).json({ message: `Webhook error: ${err.message}` });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const email = session.metadata?.userEmail ?? session.customer_email;
                if (email) {
                    await User.findOneAndUpdate(
                        { email },
                        {
                            permisos: PREMIUM_PERMISOS,
                            stripeCustomerId: session.customer,
                            stripeSubscriptionId: session.subscription,
                        }
                    );
                }
                break;
            }

            case 'customer.subscription.deleted': {
                // Suscripción cancelada o expirada — volver a plan gratuito
                const subscription = event.data.object;
                await User.findOneAndUpdate(
                    { stripeSubscriptionId: subscription.id },
                    { permisos: FREE_PERMISOS, stripeSubscriptionId: null }
                );
                break;
            }

            case 'invoice.paid': {
                // Renovación mensual exitosa — garantiza que el usuario sigue en premium
                const invoice = event.data.object;
                if (invoice.subscription) {
                    await User.findOneAndUpdate(
                        { stripeSubscriptionId: invoice.subscription },
                        { permisos: PREMIUM_PERMISOS }
                    );
                }
                break;
            }

            case 'invoice.payment_failed': {
                // Pago fallido — Stripe reintentará automáticamente según la config del dashboard
                break;
            }
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error procesando webhook', error: error.message });
    }

    res.status(200).json({ received: true });
};

// Solo para pruebas locales — alterna permisos 1 ↔ 2 sin pasar por Stripe
export const simulateToggle = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email }).select('permisos');
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const newPermisos = user.permisos >= PREMIUM_PERMISOS ? FREE_PERMISOS : PREMIUM_PERMISOS;
        user.permisos = newPermisos;
        await user.save();

        res.status(200).json({ permisos: newPermisos, isPremium: newPermisos >= PREMIUM_PERMISOS });
    } catch (error) {
        res.status(500).json({ message: 'Error al simular cambio de plan', error: error.message });
    }
};
