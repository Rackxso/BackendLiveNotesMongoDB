
import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 5,
    message: { message: 'Demasiados intentos de login, espera 15 minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: isTest ? 1000 : 10,
    message: { message: 'Demasiados registros desde esta IP, espera 1 hora' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 100,
    message: { message: 'Demasiadas peticiones, espera 15 minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});