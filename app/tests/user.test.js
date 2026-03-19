import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { URI } from '../config.js';


vi.mock('nodemailer', () => ({
    default: {
        createTransport: () => ({
            sendMail: vi.fn().mockResolvedValue(true)
        })
    }
}));

beforeAll(async () => {
    await mongoose.connect(URI, { dbName: 'LiveNotes_test' });
});

afterEach(async () => {
    await mongoose.connection.dropDatabase();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});

// ─── REGISTER ────────────────────────────────────────────────────────────────

describe('Test Register', () => {
    it('Debe registrar un usuario correctamente', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ name: 'Juan', email: 'juan@test.com', password: '123456' });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Usuario registrado, revisa tu email para verificar tu cuenta');
    });

    it('Debe guardar el usuario en la BD', async () => {
        await request(app)
            .post('/api/user/register')
            .send({ name: 'Juan', email: 'juan@test.com', password: '123456' });

        const user = await User.findOne({ email: 'juan@test.com' });
        expect(user).not.toBeNull();
        expect(user.name).toBe('Juan');
        expect(user.permisos).toBe(1);
    });

    it('Debe guardar el token de verificación', async () => {
        await request(app)
            .post('/api/user/register')
            .send({ name: 'Juan', email: 'juan@test.com', password: '123456' });

        const user = await User.findOne({ email: 'juan@test.com' });
        expect(user.tokenVerificacion).not.toBeNull();
    });

    it('Debe crear la cuenta como no verificada', async () => {
        await request(app)
            .post('/api/user/register')
            .send({ name: 'Juan', email: 'juan@test.com', password: '123456' });

        const user = await User.findOne({ email: 'juan@test.com' });
        expect(user.verificado).toBe(false);
    });

    it('Debe rechazar un email duplicado', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1 });

        const res = await request(app)
            .post('/api/user/register')
            .send({ name: 'Juan', email: 'juan@test.com', password: '123456' });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Ya existe un usuario con ese email');
    });

    it('Debe fallar si falta el nombre', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ email: 'juan@test.com', password: '123456' });

        expect(res.status).toBe(500);
    });

    it('Debe fallar si falta el email', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ name: 'Juan', password: '123456' });

        expect(res.status).toBe(500);
    });

    it('Debe fallar si falta la contraseña', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ name: 'Juan', email: 'juan@test.com' });

        expect(res.status).toBe(500);
    });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

describe('Test Login', () => {
    it('Debe iniciar sesión correctamente', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app)
            .post('/api/user/login')
            .send({ email: 'juan@test.com', password: '123456' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Login exitoso');
    });

    it('Debe rechazar si el usuario no está verificado', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: false });

        const res = await request(app)
            .post('/api/user/login')
            .send({ email: 'juan@test.com', password: '123456' });

        expect(res.status).toBe(403);
    });

    it('Debe rechazar credenciales incorrectas', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app)
            .post('/api/user/login')
            .send({ email: 'juan@test.com', password: 'wrongpassword' });

        expect(res.status).toBe(401);
    });

    it('Debe rechazar si el usuario no existe', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({ email: 'noexiste@test.com', password: '123456' });

        expect(res.status).toBe(401);
    });
});

// ─── VERIFICAR EMAIL ──────────────────────────────────────────────────────────

describe('Test Verificar Email', () => {
    it('Debe verificar el email correctamente', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, tokenVerificacion: 'token123' });

        const res = await request(app).get('/api/user/verificar/token123');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Email verificado exitosamente');
    });

    it('Debe limpiar el token tras verificar', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, tokenVerificacion: 'token123' });

        await request(app).get('/api/user/verificar/token123');

        const user = await User.findOne({ email: 'juan@test.com' });
        expect(user.tokenVerificacion).toBeNull();
        expect(user.verificado).toBe(true);
    });

    it('Debe rechazar un token inválido', async () => {
        const res = await request(app).get('/api/user/verificar/tokeninvalido');

        expect(res.status).toBe(404);
    });
});

// ─── GET PERMISOS ─────────────────────────────────────────────────────────────

describe('Test Get Permisos', () => {
    it('Debe retornar los permisos del usuario', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app).get('/api/user/juan@test.com/permisos');

        expect(res.status).toBe(200);
        expect(res.body.permisos).toBe(1);
    });

    it('Debe fallar si el usuario no existe', async () => {
        const res = await request(app).get('/api/user/noexiste@test.com/permisos');

        expect(res.status).toBe(404);
    });
});

// ─── GET USER INFO ────────────────────────────────────────────────────────────

describe('Test Get User Info', () => {
    it('Debe retornar la info del usuario sin password ni permisos', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app).get('/api/user/juan@test.com/info');

        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Juan');
        expect(res.body.password).toBeUndefined();
        expect(res.body.permisos).toBeUndefined();
    });

    it('Debe fallar si el usuario no existe', async () => {
        const res = await request(app).get('/api/user/noexiste@test.com/info');

        expect(res.status).toBe(404);
    });
});

// ─── UPGRADE PLAN ─────────────────────────────────────────────────────────────

describe('Test Upgrade Plan', () => {
    it('Debe actualizar el plan correctamente', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app)
            .post('/api/user/upgrade')
            .send({ email: 'juan@test.com', newPermisos: 2 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Plan actualizado exitosamente');
    });

    it('Debe rechazar si el plan es el mismo', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app)
            .post('/api/user/upgrade')
            .send({ email: 'juan@test.com', newPermisos: 1 });

        expect(res.status).toBe(400);
    });

    it('Debe fallar si el usuario no existe', async () => {
        const res = await request(app)
            .post('/api/user/upgrade')
            .send({ email: 'noexiste@test.com', newPermisos: 2 });

        expect(res.status).toBe(404);
    });
});

// ─── UPDATE USER ──────────────────────────────────────────────────────────────

describe('Test Update User', () => {
    it('Debe actualizar el nombre correctamente', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app)
            .put('/api/user/juan@test.com')
            .send({ name: 'Pedro' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Información del usuario actualizada exitosamente');
    });

    it('Debe guardar el nuevo nombre en la BD', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        await request(app).put('/api/user/juan@test.com').send({ name: 'Pedro' });

        const user = await User.findOne({ email: 'juan@test.com' });
        expect(user.name).toBe('Pedro');
    });

    it('Debe fallar si el usuario no existe', async () => {
        const res = await request(app)
            .put('/api/user/noexiste@test.com')
            .send({ name: 'Pedro' });

        expect(res.status).toBe(404);
    });
});

// ─── CAMBIO DE CONTRASEÑA ─────────────────────────────────────────────────────

describe('Test Cambio de Contraseña', () => {
    it('Debe solicitar el cambio correctamente', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app)
            .put('/api/user/juan@test.com/password')
            .send({ oldPassword: '123456' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Revisa tu email para confirmar el cambio de contraseña');
    });

    it('Debe guardar el token de cambio de contraseña', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        await request(app).put('/api/user/juan@test.com/password').send({ oldPassword: '123456' });

        const user = await User.findOne({ email: 'juan@test.com' });
        expect(user.tokenCambioPassword).not.toBeNull();
    });

    it('Debe rechazar si la contraseña actual es incorrecta', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app)
            .put('/api/user/juan@test.com/password')
            .send({ oldPassword: 'wrongpassword' });

        expect(res.status).toBe(401);
    });

    it('Debe confirmar el cambio de contraseña correctamente', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true, tokenCambioPassword: 'token123', tokenCambioPasswordExpira: new Date(Date.now() + 3600000) });

        const res = await request(app)
            .post('/api/user/password/token123')
            .send({ newPassword: 'newpassword' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Contraseña actualizada exitosamente');
    });

    it('Debe rechazar si el token ha expirado', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true, tokenCambioPassword: 'token123', tokenCambioPasswordExpira: new Date(Date.now() - 3600000) });

        const res = await request(app)
            .post('/api/user/password/token123')
            .send({ newPassword: 'newpassword' });

        expect(res.status).toBe(400);
    });

    it('Debe rechazar si la nueva contraseña es igual a la actual', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true, tokenCambioPassword: 'token123', tokenCambioPasswordExpira: new Date(Date.now() + 3600000) });

        const res = await request(app)
            .post('/api/user/password/token123')
            .send({ newPassword: '123456' });

        expect(res.status).toBe(400);
    });

    it('Debe rechazar un token inválido', async () => {
        const res = await request(app)
            .post('/api/user/password/tokeninvalido')
            .send({ newPassword: 'newpassword' });

        expect(res.status).toBe(404);
    });
});

// ─── ELIMINACIÓN ──────────────────────────────────────────────────────────────

describe('Test Eliminación de Cuenta', () => {
    it('Debe solicitar la eliminación correctamente', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        const res = await request(app).delete('/api/user/juan@test.com');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Revisa tu email para confirmar la eliminación de tu cuenta');
    });

    it('Debe guardar el token de eliminación', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });

        await request(app).delete('/api/user/juan@test.com');

        const user = await User.findOne({ email: 'juan@test.com' });
        expect(user.tokenEliminacion).not.toBeNull();
    });

    it('Debe confirmar la eliminación correctamente', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true, tokenEliminacion: 'token123' });

        const res = await request(app).delete('/api/user/confirmar/token123');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Cuenta eliminada exitosamente');
    });

    it('Debe eliminar el usuario de la BD', async () => {
        await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true, tokenEliminacion: 'token123' });

        await request(app).delete('/api/user/confirmar/token123');

        const user = await User.findOne({ email: 'juan@test.com' });
        expect(user).toBeNull();
    });

    it('Debe rechazar un token inválido', async () => {
        const res = await request(app).delete('/api/user/confirmar/tokeninvalido');

        expect(res.status).toBe(404);
    });

    it('Debe fallar si el usuario no existe', async () => {
        const res = await request(app).delete('/api/user/noexiste@test.com');

        expect(res.status).toBe(404);
    });
});