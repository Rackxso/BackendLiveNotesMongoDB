// tests/setup.js
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { URI } from '../config.js';
import { Categoria } from '../models/categoria.model.js';

vi.mock('nodemailer', () => ({
    default: {
        createTransport: () => ({
            sendMail: vi.fn().mockResolvedValue(true)
        })
    }
}));

const categoriasPredefinidas = [
    { nombre: 'Alimentación', icono: '🛒', color: '#4CAF50', predefinida: true },
    { nombre: 'Transporte', icono: '🚗', color: '#2196F3', predefinida: true },
    { nombre: 'Ocio', icono: '🎮', color: '#9C27B0', predefinida: true },
    { nombre: 'Subscripciones', icono: '📱', color: '#FF5722', predefinida: true },
    { nombre: 'Salud', icono: '💊', color: '#F44336', predefinida: true },
    { nombre: 'Hogar', icono: '🏠', color: '#FF9800', predefinida: true },
    { nombre: 'Ropa', icono: '👕', color: '#E91E63', predefinida: true },
    { nombre: 'Educación', icono: '📚', color: '#00BCD4', predefinida: true },
    { nombre: 'Nómina', icono: '💰', color: '#8BC34A', predefinida: true },
    { nombre: 'Otros', icono: '📦', color: '#607D8B', predefinida: true },
];

beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(URI, { dbName: 'LiveNotes_test' });
    await Categoria.insertMany(categoriasPredefinidas);
});

afterEach(async () => {
    // Las predefinidas nunca se borran en el afterEach
    await Categoria.deleteMany({ predefinida: false });
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});