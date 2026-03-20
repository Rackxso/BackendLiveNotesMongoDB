// tests/nota.test.js
import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { Nota } from '../models/nota.model.js';

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
    await Nota.deleteMany({});
});

// ─── GET NOTAS ────────────────────────────────────────────────────────────────

describe('Test Get Notas', () => {
    it('Debe retornar las notas del usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Nota.create({ titulo: 'Nota 1', contenido: '# Hola', usuario: userId });
        await Nota.create({ titulo: 'Nota 2', contenido: '## Mundo', usuario: userId });

        const res = await request(app).get('/api/notas').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('No debe retornar notas de otros usuarios', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        await Nota.create({ titulo: 'Nota otro', contenido: 'contenido', usuario: otroId });

        const res = await request(app).get('/api/notas').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe retornar array vacío si no hay notas', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).get('/api/notas').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe ordenar por fecha de actualización descendente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const nota1 = await Nota.create({ titulo: 'Primera', contenido: 'contenido', usuario: userId });
        await new Promise(r => setTimeout(r, 10));
        await Nota.create({ titulo: 'Segunda', contenido: 'contenido', usuario: userId });

        const res = await request(app).get('/api/notas').set('Cookie', cookies);

        expect(res.body[0].titulo).toBe('Segunda');
        expect(res.body[1].titulo).toBe('Primera');
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).get('/api/notas');
        expect(res.status).toBe(401);
    });
});

// ─── GET NOTA ─────────────────────────────────────────────────────────────────

describe('Test Get Nota', () => {
    it('Debe retornar una nota por id', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const nota = await Nota.create({ titulo: 'Nota 1', contenido: '# Hola', usuario: userId });

        const res = await request(app).get(`/api/notas/${nota._id}`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.titulo).toBe('Nota 1');
        expect(res.body.contenido).toBe('# Hola');
    });

    it('No debe retornar una nota de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const nota = await Nota.create({ titulo: 'Nota otro', contenido: 'contenido', usuario: otroId });

        const res = await request(app).get(`/api/notas/${nota._id}`).set('Cookie', cookies);

        expect(res.status).toBe(404);
    });

    it('Debe fallar si la nota no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app).get(`/api/notas/${idFalso}`).set('Cookie', cookies);

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/notas/${idFalso}`);
        expect(res.status).toBe(401);
    });
});

// ─── CREATE NOTA ──────────────────────────────────────────────────────────────

describe('Test Create Nota', () => {
    it('Debe crear una nota correctamente', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app)
            .post('/api/notas')
            .set('Cookie', cookies)
            .send({ titulo: 'Nota 1', contenido: '# Hola mundo' });

        expect(res.status).toBe(201);
        expect(res.body.titulo).toBe('Nota 1');
        expect(res.body.contenido).toBe('# Hola mundo');
    });

    it('Debe guardar la nota en la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();

        await request(app).post('/api/notas').set('Cookie', cookies)
            .send({ titulo: 'Nota 1', contenido: '# Hola mundo' });

        const nota = await Nota.findOne({ titulo: 'Nota 1', usuario: userId });
        expect(nota).not.toBeNull();
        expect(nota.contenido).toBe('# Hola mundo');
    });

    it('Debe crear una nota sin contenido', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).post('/api/notas').set('Cookie', cookies)
            .send({ titulo: 'Nota vacía' });

        expect(res.status).toBe(201);
        expect(res.body.contenido).toBe('');
    });

    it('Debe guardar contenido markdown correctamente', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const markdown = '# Título\n\n- Item 1\n- Item 2\n\n**negrita**';

        const res = await request(app).post('/api/notas').set('Cookie', cookies)
            .send({ titulo: 'Markdown', contenido: markdown });

        expect(res.status).toBe(201);
        expect(res.body.contenido).toBe(markdown);
    });

    it('Debe fallar si falta el título', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).post('/api/notas').set('Cookie', cookies)
            .send({ contenido: '# Hola' });

        expect(res.status).toBe(500);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).post('/api/notas').send({ titulo: 'Nota', contenido: 'contenido' });
        expect(res.status).toBe(401);
    });
});

// ─── UPDATE NOTA ──────────────────────────────────────────────────────────────

describe('Test Update Nota', () => {
    it('Debe actualizar el título correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const nota = await Nota.create({ titulo: 'Nota 1', contenido: 'contenido', usuario: userId });

        const res = await request(app)
            .put(`/api/notas/${nota._id}`)
            .set('Cookie', cookies)
            .send({ titulo: 'Nota actualizada' });

        expect(res.status).toBe(200);
        expect(res.body.titulo).toBe('Nota actualizada');
    });

    it('Debe actualizar el contenido correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const nota = await Nota.create({ titulo: 'Nota 1', contenido: 'contenido', usuario: userId });

        const res = await request(app)
            .put(`/api/notas/${nota._id}`)
            .set('Cookie', cookies)
            .send({ contenido: '# Nuevo contenido' });

        expect(res.status).toBe(200);
        expect(res.body.contenido).toBe('# Nuevo contenido');
    });

    it('Debe actualizar título y contenido a la vez', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const nota = await Nota.create({ titulo: 'Nota 1', contenido: 'contenido', usuario: userId });

        const res = await request(app)
            .put(`/api/notas/${nota._id}`)
            .set('Cookie', cookies)
            .send({ titulo: 'Nuevo título', contenido: '# Nuevo contenido' });

        expect(res.status).toBe(200);
        expect(res.body.titulo).toBe('Nuevo título');
        expect(res.body.contenido).toBe('# Nuevo contenido');
    });

    it('Debe actualizar el timestamp al modificar', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const nota = await Nota.create({ titulo: 'Nota 1', contenido: 'contenido', usuario: userId });
        const updatedAtAntes = nota.updatedAt;

        await new Promise(r => setTimeout(r, 10));
        await request(app).put(`/api/notas/${nota._id}`).set('Cookie', cookies)
            .send({ titulo: 'Actualizada' });

        const notaActualizada = await Nota.findById(nota._id);
        expect(notaActualizada.updatedAt.getTime()).toBeGreaterThan(updatedAtAntes.getTime());
    });

    it('No debe actualizar una nota de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const nota = await Nota.create({ titulo: 'Nota otro', contenido: 'contenido', usuario: otroId });

        const res = await request(app)
            .put(`/api/notas/${nota._id}`)
            .set('Cookie', cookies)
            .send({ titulo: 'Hackeada' });

        expect(res.status).toBe(404);
    });

    it('Debe fallar si la nota no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app).put(`/api/notas/${idFalso}`).set('Cookie', cookies)
            .send({ titulo: 'Actualizada' });

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/notas/${idFalso}`).send({ titulo: 'Nota' });
        expect(res.status).toBe(401);
    });
});

// ─── DELETE NOTA ──────────────────────────────────────────────────────────────

describe('Test Delete Nota', () => {
    it('Debe eliminar una nota correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const nota = await Nota.create({ titulo: 'Nota 1', contenido: 'contenido', usuario: userId });

        const res = await request(app).delete(`/api/notas/${nota._id}`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Nota eliminada exitosamente');
    });

    it('Debe eliminar la nota de la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const nota = await Nota.create({ titulo: 'Nota 1', contenido: 'contenido', usuario: userId });

        await request(app).delete(`/api/notas/${nota._id}`).set('Cookie', cookies);

        const notaEliminada = await Nota.findById(nota._id);
        expect(notaEliminada).toBeNull();
    });

    it('No debe eliminar una nota de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const nota = await Nota.create({ titulo: 'Nota otro', contenido: 'contenido', usuario: otroId });

        const res = await request(app).delete(`/api/notas/${nota._id}`).set('Cookie', cookies);

        expect(res.status).toBe(404);
    });

    it('Debe fallar si la nota no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app).delete(`/api/notas/${idFalso}`).set('Cookie', cookies);

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).delete(`/api/notas/${idFalso}`);
        expect(res.status).toBe(401);
    });
});