// app.js — solo configuración
import express from 'express';
import cors from 'cors';
import { apiRouter } from './router/index.router.js';
import cookieParser from 'cookie-parser';
import { stripeWebhook } from './controller/stripe.controller.js';


const app = express();

const corsOption = {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}

app.use(cookieParser());
app.use(cors(corsOption));

// El webhook necesita el body en raw antes de express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.json({ message: 'API REST con Express.js' })
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Página no encontrada' });
});

export default app;