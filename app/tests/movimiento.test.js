// tests/movimiento.test.js
import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { Cuenta } from '../models/cuenta.model.js';
import { Movimiento } from '../models/movimiento.model.js';
import { Categoria } from '../models/categoria.model.js';
import { Presupuesto } from '../models/presupuesto.model.js';
import { Meta } from '../models/meta.model.js';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const crearUsuarioYLogin = async () => {
    const user = await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });
    const res = await request(app)
        .post('/api/user/login')
        .send({ email: 'juan@test.com', password: '123456' });
    return { cookies: res.headers['set-cookie'], userId: user._id };
};

const crearSegundoUsuario = async () => {
    const user = await User.create({ name: 'Otro', email: 'otro@test.com', password: '123456', permisos: 1, verificado: true });
    const res = await request(app)
        .post('/api/user/login')
        .send({ email: 'otro@test.com', password: '123456' });
    return { cookies: res.headers['set-cookie'], userId: user._id };
};

afterEach(async () => {
    await User.deleteMany({});
    await Cuenta.deleteMany({});
    await Movimiento.deleteMany({});
    await Presupuesto.deleteMany({});
    await Meta.deleteMany({});
    await Categoria.deleteMany({ predefinida: false });
});

// ─── CREATE MOVIMIENTO ────────────────────────────────────────────────────────

describe('Test Create Movimiento', () => {
    it('Debe crear un ingreso correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app)
            .post('/api/movimientos')
            .set('Cookie', cookies)
            .send({ name: 'Nómina', tipo: true, importe: 1000, cuentaId: cuenta._id, metodo: 'Transferencia' });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Nómina');
        expect(res.body.tipo).toBe(true);
    });

    it('Debe crear un gasto correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app)
            .post('/api/movimientos')
            .set('Cookie', cookies)
            .send({ name: 'Supermercado', tipo: false, importe: 50, cuentaId: cuenta._id, metodo: 'Tarjeta' });

        expect(res.status).toBe(201);
        expect(res.body.tipo).toBe(false);
    });

    it('Debe sumar al balance en un ingreso', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Nómina', tipo: true, importe: 1000, cuentaId: cuenta._id, metodo: 'Transferencia' });

        const cuentaActualizada = await Cuenta.findById(cuenta._id);
        expect(cuentaActualizada.balance).toBe(1100);
    });

    it('Debe restar al balance en un gasto', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Supermercado', tipo: false, importe: 50, cuentaId: cuenta._id, metodo: 'Tarjeta' });

        const cuentaActualizada = await Cuenta.findById(cuenta._id);
        expect(cuentaActualizada.balance).toBe(50);
    });

    it('Debe guardar el movimiento en la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Nómina', tipo: true, importe: 1000, cuentaId: cuenta._id, metodo: 'Transferencia' });

        const movimiento = await Movimiento.findOne({ name: 'Nómina' });
        expect(movimiento).not.toBeNull();
        expect(movimiento.importe).toBe(1000);
    });

    it('Debe crear un movimiento con categoría predefinida', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const categoria = await Categoria.findOne({ predefinida: true });

        const res = await request(app)
            .post('/api/movimientos')
            .set('Cookie', cookies)
            .send({ name: 'Spotify', tipo: false, importe: 10, cuentaId: cuenta._id, categorias: [categoria._id] });

        expect(res.status).toBe(201);
        expect(res.body.categorias.length).toBe(1);
    });

    it('Debe crear un movimiento con categoría personalizada', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const categoria = await Categoria.create({ nombre: 'Mi categoría', usuario: userId });

        const res = await request(app)
            .post('/api/movimientos')
            .set('Cookie', cookies)
            .send({ name: 'Gasto', tipo: false, importe: 10, cuentaId: cuenta._id, categorias: [categoria._id] });

        expect(res.status).toBe(201);
        expect(res.body.categorias.length).toBe(1);
    });

    it('No debe crear un movimiento con categoría de otro usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const categoriaOtro = await Categoria.create({ nombre: 'Categoría otro', usuario: otroId });

        const res = await request(app)
            .post('/api/movimientos')
            .set('Cookie', cookies)
            .send({ name: 'Gasto', tipo: false, importe: 10, cuentaId: cuenta._id, categorias: [categoriaOtro._id] });

        expect(res.status).toBe(404);
    });

    it('Debe crear presupuesto automáticamente al usar una categoría', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const categoria = await Categoria.findOne({ predefinida: true });
        const ahora = new Date();

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Spotify', tipo: false, importe: 10, cuentaId: cuenta._id, categorias: [categoria._id] });

        const presupuesto = await Presupuesto.findOne({
            usuario: userId,
            categoria: categoria._id,
            mes: ahora.getMonth() + 1,
            anio: ahora.getFullYear()
        });
        expect(presupuesto).not.toBeNull();
        expect(presupuesto.acumulado).toBe(10);
    });

    it('Debe dividir el importe entre categorías a partes iguales', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const categorias = await Categoria.find({ predefinida: true }).limit(2);
        const ahora = new Date();

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Gasto', tipo: false, importe: 100, cuentaId: cuenta._id, categorias: categorias.map(c => c._id) });

        for (const categoria of categorias) {
            const presupuesto = await Presupuesto.findOne({
                usuario: userId,
                categoria: categoria._id,
                mes: ahora.getMonth() + 1,
                anio: ahora.getFullYear()
            });
            expect(presupuesto.acumulado).toBe(50);
        }
    });

    it('Debe marcar presupuesto como superado al superar el límite', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 1000, usuario: userId });
        const categoria = await Categoria.findOne({ predefinida: true });
        const ahora = new Date();

        await Presupuesto.create({
            usuario: userId,
            categoria: categoria._id,
            limite: 50,
            acumulado: 0,
            mes: ahora.getMonth() + 1,
            anio: ahora.getFullYear()
        });

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Gasto', tipo: false, importe: 100, cuentaId: cuenta._id, categorias: [categoria._id] });

        const presupuesto = await Presupuesto.findOne({ usuario: userId, categoria: categoria._id });
        expect(presupuesto.superado).toBe(true);
    });

    it('Debe heredar el límite del mes anterior al crear presupuesto automático', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const categoria = await Categoria.findOne({ predefinida: true });
        const ahora = new Date();
        const mesAnterior = ahora.getMonth() === 0 ? 12 : ahora.getMonth();
        const anioAnterior = ahora.getMonth() === 0 ? ahora.getFullYear() - 1 : ahora.getFullYear();

        await Presupuesto.create({
            usuario: userId,
            categoria: categoria._id,
            limite: 200,
            acumulado: 0,
            mes: mesAnterior,
            anio: anioAnterior
        });

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Gasto', tipo: false, importe: 10, cuentaId: cuenta._id, categorias: [categoria._id] });

        const presupuesto = await Presupuesto.findOne({
            usuario: userId,
            categoria: categoria._id,
            mes: ahora.getMonth() + 1,
            anio: ahora.getFullYear()
        });
        expect(presupuesto.limite).toBe(200);
    });

    it('Debe fallar si la cuenta no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Nómina', tipo: true, importe: 1000, cuentaId: idFalso });

        expect(res.status).toBe(404);
    });

    it('No debe crear un movimiento en una cuenta de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const cuentaOtro = await Cuenta.create({ name: 'Cuenta Otro', balance: 100, usuario: otroId });

        const res = await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Nómina', tipo: true, importe: 1000, cuentaId: cuentaOtro._id });

        expect(res.status).toBe(404);
    });

    it('Debe fallar si falta el nombre', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ tipo: true, importe: 1000, cuentaId: cuenta._id });

        expect(res.status).toBe(500);
    });

    it('Debe fallar si falta el importe', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Nómina', tipo: true, cuentaId: cuenta._id });

        expect(res.status).toBe(500);
    });

    it('Debe fallar si falta el tipo', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Nómina', importe: 1000, cuentaId: cuenta._id });

        expect(res.status).toBe(500);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).post('/api/movimientos')
            .send({ name: 'Nómina', tipo: true, importe: 1000 });
        expect(res.status).toBe(401);
    });
});

// ─── GET MOVIMIENTOS ──────────────────────────────────────────────────────────

describe('Test Get Movimientos', () => {
    it('Debe retornar todos los movimientos del usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Nómina', tipo: true, importe: 1000, cuenta: cuenta._id, fecha: new Date() });
        await Movimiento.create({ name: 'Supermercado', tipo: false, importe: 50, cuenta: cuenta._id, fecha: new Date() });

        const res = await request(app).get('/api/movimientos').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('No debe retornar movimientos de otros usuarios', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const cuentaOtro = await Cuenta.create({ name: 'Cuenta Otro', balance: 100, usuario: otroId });
        await Movimiento.create({ name: 'Nómina', tipo: true, importe: 1000, cuenta: cuentaOtro._id, fecha: new Date() });

        const res = await request(app).get('/api/movimientos').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe filtrar por cuenta', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta1 = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const cuenta2 = await Cuenta.create({ name: 'Cuenta 2', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Nómina', tipo: true, importe: 1000, cuenta: cuenta1._id, fecha: new Date() });
        await Movimiento.create({ name: 'Supermercado', tipo: false, importe: 50, cuenta: cuenta2._id, fecha: new Date() });

        const res = await request(app).get(`/api/movimientos?cuentaId=${cuenta1._id}`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Nómina');
    });

    it('No debe filtrar por cuenta de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const cuentaOtro = await Cuenta.create({ name: 'Cuenta Otro', balance: 100, usuario: otroId });

        const res = await request(app).get(`/api/movimientos?cuentaId=${cuentaOtro._id}`).set('Cookie', cookies);

        expect(res.status).toBe(403);
    });

    it('Debe filtrar por tipo ingreso', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Nómina', tipo: true, importe: 1000, cuenta: cuenta._id, fecha: new Date() });
        await Movimiento.create({ name: 'Supermercado', tipo: false, importe: 50, cuenta: cuenta._id, fecha: new Date() });

        const res = await request(app).get('/api/movimientos?tipo=true').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].tipo).toBe(true);
    });

    it('Debe filtrar por tipo gasto', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Nómina', tipo: true, importe: 1000, cuenta: cuenta._id, fecha: new Date() });
        await Movimiento.create({ name: 'Supermercado', tipo: false, importe: 50, cuenta: cuenta._id, fecha: new Date() });

        const res = await request(app).get('/api/movimientos?tipo=false').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].tipo).toBe(false);
    });

    it('Debe filtrar por fecha desde', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Antiguo', tipo: true, importe: 100, cuenta: cuenta._id, fecha: new Date('2025-01-01') });
        await Movimiento.create({ name: 'Reciente', tipo: true, importe: 200, cuenta: cuenta._id, fecha: new Date('2026-01-01') });

        const res = await request(app).get('/api/movimientos?fechaDesde=2025-06-01').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Reciente');
    });

    it('Debe filtrar por fecha hasta', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Antiguo', tipo: true, importe: 100, cuenta: cuenta._id, fecha: new Date('2025-01-01') });
        await Movimiento.create({ name: 'Reciente', tipo: true, importe: 200, cuenta: cuenta._id, fecha: new Date('2026-01-01') });

        const res = await request(app).get('/api/movimientos?fechaHasta=2025-06-01').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Antiguo');
    });

    it('Debe filtrar por rango de fechas', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Antiguo', tipo: true, importe: 100, cuenta: cuenta._id, fecha: new Date('2024-01-01') });
        await Movimiento.create({ name: 'Medio', tipo: true, importe: 200, cuenta: cuenta._id, fecha: new Date('2025-01-01') });
        await Movimiento.create({ name: 'Reciente', tipo: true, importe: 300, cuenta: cuenta._id, fecha: new Date('2026-01-01') });

        const res = await request(app).get('/api/movimientos?fechaDesde=2024-06-01&fechaHasta=2025-06-01').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Medio');
    });

    it('Debe filtrar por importe mínimo', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Pequeño', tipo: true, importe: 10, cuenta: cuenta._id, fecha: new Date() });
        await Movimiento.create({ name: 'Grande', tipo: true, importe: 1000, cuenta: cuenta._id, fecha: new Date() });

        const res = await request(app).get('/api/movimientos?importeMin=100').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Grande');
    });

    it('Debe filtrar por importe máximo', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Pequeño', tipo: true, importe: 10, cuenta: cuenta._id, fecha: new Date() });
        await Movimiento.create({ name: 'Grande', tipo: true, importe: 1000, cuenta: cuenta._id, fecha: new Date() });

        const res = await request(app).get('/api/movimientos?importeMax=100').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Pequeño');
    });

    it('Debe filtrar por rango de importe', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Movimiento.create({ name: 'Pequeño', tipo: true, importe: 10, cuenta: cuenta._id, fecha: new Date() });
        await Movimiento.create({ name: 'Medio', tipo: true, importe: 100, cuenta: cuenta._id, fecha: new Date() });
        await Movimiento.create({ name: 'Grande', tipo: true, importe: 1000, cuenta: cuenta._id, fecha: new Date() });

        const res = await request(app).get('/api/movimientos?importeMin=50&importeMax=500').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Medio');
    });

    it('Debe retornar array vacío si no hay movimientos', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).get('/api/movimientos').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).get('/api/movimientos');
        expect(res.status).toBe(401);
    });
});