// utils/jwt.js
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../config.js';

export const generarAccessToken = (payload) => {
    console.log('JWT_SECRET:', JWT_SECRET); //
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generarRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verificarAccessToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

export const verificarRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};