// app.js — solo configuración
import express from 'express';
import cors from 'cors';
import { apiRouter } from './router/index.router.js';
import cookieParser from 'cookie-parser';
import { stripeWebhook } from './controller/stripe.controller.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));


const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:4200'
].filter(Boolean);

const corsOption = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}

app.use(cookieParser());
app.use(cors(corsOption));
app.use('/public', express.static(join(__dirname, 'public')));

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