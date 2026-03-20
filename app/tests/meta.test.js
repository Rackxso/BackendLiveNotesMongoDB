// tests/meta.test.js
import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { Cuenta } from '../models/cuenta.model.js';
import { Movimiento } from '../models/movimiento.model.js';
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
    await Meta.deleteMany({});
});

// ─── GET METAS ────────────────────────────────────────────────────────────────

describe('Test Get Metas', () => {
    it('Debe retornar las metas del usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: userId });
        await Meta.create({ name: 'Coche', meta: 5000, usuario: userId });

        const res = await request(app).get('/api/metas').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('No debe retornar metas de otros usuarios', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: otroId });

        const res = await request(app).get('/api/metas').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe retornar array vacío si no hay metas', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).get('/api/metas').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).get('/api/metas');
        expect(res.status).toBe(401);
    });
});

// ─── CREATE META ──────────────────────────────────────────────────────────────

describe('Test Create Meta', () => {
    it('Debe crear una meta correctamente', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app)
            .post('/api/metas')
            .set('Cookie', cookies)
            .send({ name: 'Vacaciones', meta: 1000 });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Vacaciones');
        expect(res.body.meta).toBe(1000);
        expect(res.body.acumulado).toBe(0);
        expect(res.body.completada).toBe(false);
    });

    it('Debe guardar la meta en la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();

        await request(app).post('/api/metas').set('Cookie', cookies)
            .send({ name: 'Vacaciones', meta: 1000 });

        const meta = await Meta.findOne({ name: 'Vacaciones', usuario: userId });
        expect(meta).not.toBeNull();
        expect(meta.meta).toBe(1000);
    });

    it('Debe rechazar nombre duplicado para el mismo usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: userId });

        const res = await request(app).post('/api/metas').set('Cookie', cookies)
            .send({ name: 'Vacaciones', meta: 2000 });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Ya existe una meta con ese nombre');
    });

    it('Debe permitir el mismo nombre para distintos usuarios', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { cookies: cookiesOtro } = await crearSegundoUsuario();

        await request(app).post('/api/metas').set('Cookie', cookies)
            .send({ name: 'Vacaciones', meta: 1000 });

        const res = await request(app).post('/api/metas').set('Cookie', cookiesOtro)
            .send({ name: 'Vacaciones', meta: 2000 });

        expect(res.status).toBe(201);
    });

    it('Debe fallar si falta el nombre', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).post('/api/metas').set('Cookie', cookies)
            .send({ meta: 1000 });

        expect(res.status).toBe(500);
    });

    it('Debe fallar si falta la meta', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).post('/api/metas').set('Cookie', cookies)
            .send({ name: 'Vacaciones' });

        expect(res.status).toBe(500);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).post('/api/metas').send({ name: 'Vacaciones', meta: 1000 });
        expect(res.status).toBe(401);
    });
});

// ─── UPDATE META ──────────────────────────────────────────────────────────────

describe('Test Update Meta', () => {
    it('Debe actualizar el nombre correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: userId });

        const res = await request(app)
            .put(`/api/metas/${meta._id}`)
            .set('Cookie', cookies)
            .send({ name: 'Vacaciones 2026' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Vacaciones 2026');
    });

    it('Debe actualizar la meta final correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: userId });

        const res = await request(app)
            .put(`/api/metas/${meta._id}`)
            .set('Cookie', cookies)
            .send({ meta: 2000 });

        expect(res.status).toBe(200);
        expect(res.body.meta).toBe(2000);
    });

    it('Debe marcar como completada si acumulado >= nueva meta', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, acumulado: 800, usuario: userId });

        const res = await request(app)
            .put(`/api/metas/${meta._id}`)
            .set('Cookie', cookies)
            .send({ meta: 800 });

        expect(res.status).toBe(200);
        expect(res.body.completada).toBe(true);
    });

    it('Debe desmarcar completada si nueva meta > acumulado', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, acumulado: 1000, completada: true, usuario: userId });

        const res = await request(app)
            .put(`/api/metas/${meta._id}`)
            .set('Cookie', cookies)
            .send({ meta: 2000 });

        expect(res.status).toBe(200);
        expect(res.body.completada).toBe(false);
    });

    it('Debe rechazar nombre duplicado para el mismo usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: userId });
        await Meta.create({ name: 'Coche', meta: 5000, usuario: userId });

        const res = await request(app)
            .put(`/api/metas/${meta._id}`)
            .set('Cookie', cookies)
            .send({ name: 'Coche' });

        expect(res.status).toBe(409);
    });

    it('No debe actualizar una meta de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: otroId });

        const res = await request(app)
            .put(`/api/metas/${meta._id}`)
            .set('Cookie', cookies)
            .send({ name: 'Hackeada' });

        expect(res.status).toBe(404);
    });

    it('Debe fallar si la meta no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app)
            .put(`/api/metas/${idFalso}`)
            .set('Cookie', cookies)
            .send({ name: 'Vacaciones' });

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/metas/${idFalso}`).send({ name: 'Vacaciones' });
        expect(res.status).toBe(401);
    });
});

// ─── DELETE META ──────────────────────────────────────────────────────────────

describe('Test Delete Meta', () => {
    it('Debe eliminar una meta correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: userId });

        const res = await request(app)
            .delete(`/api/metas/${meta._id}`)
            .set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Meta eliminada exitosamente');
    });

    it('Debe eliminar la meta de la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: userId });

        await request(app).delete(`/api/metas/${meta._id}`).set('Cookie', cookies);

        const metaEliminada = await Meta.findById(meta._id);
        expect(metaEliminada).toBeNull();
    });

    it('No debe eliminar una meta de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: otroId });

        const res = await request(app)
            .delete(`/api/metas/${meta._id}`)
            .set('Cookie', cookies);

        expect(res.status).toBe(404);
    });

    it('Debe fallar si la meta no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/metas/${idFalso}`)
            .set('Cookie', cookies);

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).delete(`/api/metas/${idFalso}`);
        expect(res.status).toBe(401);
    });
});

// ─── MOVIMIENTOS ASOCIADOS A META ─────────────────────────────────────────────

describe('Test Movimientos asociados a Meta', () => {
    it('Debe actualizar el acumulado al crear un ingreso asociado', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: userId });

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Aportación', tipo: true, importe: 200, cuentaId: cuenta._id, metaId: meta._id });

        const metaActualizada = await Meta.findById(meta._id);
        expect(metaActualizada.acumulado).toBe(200);
    });

    it('Debe restar al acumulado al crear un gasto asociado', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, acumulado: 500, usuario: userId });

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Retirada', tipo: false, importe: 100, cuentaId: cuenta._id, metaId: meta._id });

        const metaActualizada = await Meta.findById(meta._id);
        expect(metaActualizada.acumulado).toBe(400);
    });

    it('Debe marcar la meta como completada al alcanzar el objetivo', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 1000, usuario: userId });
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, acumulado: 800, usuario: userId });

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Aportación', tipo: true, importe: 200, cuentaId: cuenta._id, metaId: meta._id });

        const metaActualizada = await Meta.findById(meta._id);
        expect(metaActualizada.completada).toBe(true);
    });

    it('Debe añadir el movimiento embebido en la meta', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: userId });

        await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Aportación', tipo: true, importe: 200, cuentaId: cuenta._id, metaId: meta._id });

        const metaActualizada = await Meta.findById(meta._id);
        expect(metaActualizada.movimientos.length).toBe(1);
        expect(metaActualizada.movimientos[0].importe).toBe(200);
    });

    it('Debe rechazar si la meta ya está completada', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const meta = await Meta.create({ name: 'Vacaciones', meta: 1000, acumulado: 1000, completada: true, usuario: userId });

        const res = await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Aportación', tipo: true, importe: 200, cuentaId: cuenta._id, metaId: meta._id });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('La meta ya está completada');
    });

    it('Debe rechazar si la meta no existe', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Aportación', tipo: true, importe: 200, cuentaId: cuenta._id, metaId: idFalso });

        expect(res.status).toBe(404);
    });

    it('No debe asociar una meta de otro usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        const metaOtro = await Meta.create({ name: 'Vacaciones', meta: 1000, usuario: otroId });

        const res = await request(app).post('/api/movimientos').set('Cookie', cookies)
            .send({ name: 'Aportación', tipo: true, importe: 200, cuentaId: cuenta._id, metaId: metaOtro._id });

        expect(res.status).toBe(404);
    });
});