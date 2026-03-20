import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { Cuenta } from '../models/cuenta.model.js';

afterEach(async () => {
    await User.deleteMany({});
    await Cuenta.deleteMany({});
}
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const crearUsuarioYLogin = async () => {
    const user = await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });
    const res = await request(app)
        .post('/api/user/login')
        .send({ email: 'juan@test.com', password: '123456' });
    return { cookies: res.headers['set-cookie'], userId: user.id };
};

const crearSegundoUsuario = async () => {
    await User.create({ name: 'Otro', email: 'otro@test.com', password: '123456', permisos: 1, verificado: true });
    const res = await request(app)
        .post('/api/user/login')
        .send({ email: 'otro@test.com', password: '123456' });
    return res.headers['set-cookie'];
};

afterEach(async () => {
    await User.deleteMany({});
    await Cuenta.deleteMany({});
});

// ─── GET CUENTAS ──────────────────────────────────────────────────────────────

describe('Test Get Cuentas', () => {
    it('Debe retornar las cuentas del usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Cuenta.create({ name: 'Cuenta 2', balance: 200, usuario: userId });

        const res = await request(app).get('/api/cuentas').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('No debe retornar cuentas de otros usuarios', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cookiesOtro = await crearSegundoUsuario();
        await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app).get('/api/cuentas').set('Cookie', cookiesOtro);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe retornar array vacío si no hay cuentas', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).get('/api/cuentas').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).get('/api/cuentas');
        expect(res.status).toBe(401);
    });
});

// ─── CREATE CUENTA ────────────────────────────────────────────────────────────

describe('Test Create Cuenta', () => {
    it('Debe crear una cuenta correctamente', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app)
            .post('/api/cuentas')
            .set('Cookie', cookies)
            .send({ name: 'Cuenta 1', balance: 100 });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Cuenta 1');
        expect(res.body.balance).toBe(100);
    });

    it('Debe guardar la cuenta en la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();

        await request(app).post('/api/cuentas').set('Cookie', cookies)
            .send({ name: 'Cuenta 1', balance: 100 });

        const cuenta = await Cuenta.findOne({ name: 'Cuenta 1', usuario: userId });
        expect(cuenta).not.toBeNull();
        expect(cuenta.balance).toBe(100);
    });

    it('Debe rechazar nombre duplicado para el mismo usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app)
            .post('/api/cuentas')
            .set('Cookie', cookies)
            .send({ name: 'Cuenta 1', balance: 200 });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Ya existe una cuenta con ese nombre');
    });

    it('Debe permitir el mismo nombre para distintos usuarios', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const cookiesOtro = await crearSegundoUsuario();

        await request(app).post('/api/cuentas').set('Cookie', cookies)
            .send({ name: 'Cuenta 1', balance: 100 });

        const res = await request(app).post('/api/cuentas').set('Cookie', cookiesOtro)
            .send({ name: 'Cuenta 1', balance: 200 });

        expect(res.status).toBe(201);
    });

    it('Debe fallar si falta el nombre', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).post('/api/cuentas').set('Cookie', cookies)
            .send({ balance: 100 });

        expect(res.status).toBe(500);
    });

    it('Debe fallar si falta el balance', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).post('/api/cuentas').set('Cookie', cookies)
            .send({ name: 'Cuenta 1' });

        expect(res.status).toBe(500);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).post('/api/cuentas').send({ name: 'Cuenta 1', balance: 100 });
        expect(res.status).toBe(401);
    });
});

// ─── UPDATE CUENTA ────────────────────────────────────────────────────────────

describe('Test Update Cuenta', () => {
    it('Debe actualizar el nombre correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app)
            .put(`/api/cuentas/${cuenta._id}`)
            .set('Cookie', cookies)
            .send({ name: 'Cuenta actualizada' });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Cuenta actualizada');
    });

    it('Debe guardar el nuevo nombre en la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        await request(app).put(`/api/cuentas/${cuenta._id}`).set('Cookie', cookies)
            .send({ name: 'Cuenta actualizada' });

        const cuentaActualizada = await Cuenta.findById(cuenta._id);
        expect(cuentaActualizada.name).toBe('Cuenta actualizada');
    });

    it('Debe rechazar si el nombre ya existe para el mismo usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });
        await Cuenta.create({ name: 'Cuenta 2', balance: 200, usuario: userId });

        const res = await request(app)
            .put(`/api/cuentas/${cuenta._id}`)
            .set('Cookie', cookies)
            .send({ name: 'Cuenta 2' });

        expect(res.status).toBe(409);
    });

    it('No debe actualizar una cuenta de otro usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cookiesOtro = await crearSegundoUsuario();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app)
            .put(`/api/cuentas/${cuenta._id}`)
            .set('Cookie', cookiesOtro)
            .send({ name: 'Hackeada' });

        expect(res.status).toBe(404);
    });

    it('Debe fallar si la cuenta no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app)
            .put(`/api/cuentas/${idFalso}`)
            .set('Cookie', cookies)
            .send({ name: 'Cuenta actualizada' });

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/cuentas/${idFalso}`).send({ name: 'Cuenta' });
        expect(res.status).toBe(401);
    });
});

// ─── DELETE CUENTA ────────────────────────────────────────────────────────────

describe('Test Delete Cuenta', () => {
    it('Debe eliminar una cuenta correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app)
            .delete(`/api/cuentas/${cuenta._id}`)
            .set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Cuenta eliminada exitosamente');
    });

    it('Debe eliminar la cuenta de la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        await request(app).delete(`/api/cuentas/${cuenta._id}`).set('Cookie', cookies);

        const cuentaEliminada = await Cuenta.findById(cuenta._id);
        expect(cuentaEliminada).toBeNull();
    });

    it('No debe eliminar una cuenta de otro usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const cookiesOtro = await crearSegundoUsuario();
        const cuenta = await Cuenta.create({ name: 'Cuenta 1', balance: 100, usuario: userId });

        const res = await request(app)
            .delete(`/api/cuentas/${cuenta._id}`)
            .set('Cookie', cookiesOtro);

        expect(res.status).toBe(404);
    });

    it('Debe fallar si la cuenta no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app)
            .delete(`/api/cuentas/${idFalso}`)
            .set('Cookie', cookies);

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).delete(`/api/cuentas/${idFalso}`);
        expect(res.status).toBe(401);
    });
});