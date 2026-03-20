// tests/todo.test.js
import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { Todo } from '../models/todo.model.js';

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
    await Todo.deleteMany({});
});

// ─── GET TODOS ────────────────────────────────────────────────────────────────

describe('Test Get Todos', () => {
    it('Debe retornar todos los items del usuario', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });
        await Todo.create({ texto: 'Item 2', idLista: 'lista1', usuario: userId });

        const res = await request(app).get('/api/todos').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('No debe retornar items de otros usuarios', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        await Todo.create({ texto: 'Item otro', idLista: 'lista1', usuario: otroId });

        const res = await request(app).get('/api/todos').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe filtrar por idLista', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });
        await Todo.create({ texto: 'Item 2', idLista: 'lista2', usuario: userId });

        const res = await request(app).get('/api/todos?idLista=lista1').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].texto).toBe('Item 1');
    });

    it('Debe filtrar por prioridad', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Todo.create({ texto: 'Alta', idLista: 'lista1', prioridad: 8, usuario: userId });
        await Todo.create({ texto: 'Baja', idLista: 'lista1', prioridad: 2, usuario: userId });

        const res = await request(app).get('/api/todos?prioridad=8').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].texto).toBe('Alta');
    });

    it('Debe filtrar por completado', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Todo.create({ texto: 'Completado', idLista: 'lista1', completado: true, usuario: userId });
        await Todo.create({ texto: 'Pendiente', idLista: 'lista1', completado: false, usuario: userId });

        const res = await request(app).get('/api/todos?completado=true').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].texto).toBe('Completado');
    });

    it('Debe filtrar por etiqueta', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Todo.create({ texto: 'Item 1', idLista: 'lista1', etiquetas: ['trabajo'], usuario: userId });
        await Todo.create({ texto: 'Item 2', idLista: 'lista1', etiquetas: ['personal'], usuario: userId });

        const res = await request(app).get('/api/todos?etiqueta=trabajo').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].texto).toBe('Item 1');
    });

    it('Debe filtrar por fecha desde', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Todo.create({ texto: 'Antiguo', idLista: 'lista1', fechaLimite: new Date('2025-01-01'), usuario: userId });
        await Todo.create({ texto: 'Reciente', idLista: 'lista1', fechaLimite: new Date('2026-01-01'), usuario: userId });

        const res = await request(app).get('/api/todos?fechaDesde=2025-06-01').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].texto).toBe('Reciente');
    });

    it('Debe filtrar por fecha hasta', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Todo.create({ texto: 'Antiguo', idLista: 'lista1', fechaLimite: new Date('2025-01-01'), usuario: userId });
        await Todo.create({ texto: 'Reciente', idLista: 'lista1', fechaLimite: new Date('2026-01-01'), usuario: userId });

        const res = await request(app).get('/api/todos?fechaHasta=2025-06-01').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].texto).toBe('Antiguo');
    });

    it('Debe ordenar por prioridad descendente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Todo.create({ texto: 'Baja', idLista: 'lista1', prioridad: 2, usuario: userId });
        await Todo.create({ texto: 'Alta', idLista: 'lista1', prioridad: 9, usuario: userId });

        const res = await request(app).get('/api/todos?orden=prioridad').set('Cookie', cookies);

        expect(res.body[0].texto).toBe('Alta');
        expect(res.body[1].texto).toBe('Baja');
    });

    it('Debe ordenar por fecha límite ascendente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        await Todo.create({ texto: 'Tardío', idLista: 'lista1', fechaLimite: new Date('2026-12-01'), usuario: userId });
        await Todo.create({ texto: 'Urgente', idLista: 'lista1', fechaLimite: new Date('2026-01-01'), usuario: userId });

        const res = await request(app).get('/api/todos?orden=fecha').set('Cookie', cookies);

        expect(res.body[0].texto).toBe('Urgente');
        expect(res.body[1].texto).toBe('Tardío');
    });

    it('Debe retornar array vacío si no hay items', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const res = await request(app).get('/api/todos').set('Cookie', cookies);
        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).get('/api/todos');
        expect(res.status).toBe(401);
    });
});

// ─── GET TODO ─────────────────────────────────────────────────────────────────

describe('Test Get Todo', () => {
    it('Debe retornar un item por id', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });

        const res = await request(app).get(`/api/todos/${todo._id}`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.texto).toBe('Item 1');
    });

    it('No debe retornar un item de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const todo = await Todo.create({ texto: 'Item otro', idLista: 'lista1', usuario: otroId });

        const res = await request(app).get(`/api/todos/${todo._id}`).set('Cookie', cookies);

        expect(res.status).toBe(404);
    });

    it('Debe fallar si el item no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/todos/${idFalso}`).set('Cookie', cookies);
        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/todos/${idFalso}`);
        expect(res.status).toBe(401);
    });
});

// ─── CREATE TODO ──────────────────────────────────────────────────────────────

describe('Test Create Todo', () => {
    it('Debe crear un item correctamente', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).post('/api/todos').set('Cookie', cookies)
            .send({ texto: 'Item 1', idLista: 'lista1' });

        expect(res.status).toBe(201);
        expect(res.body.texto).toBe('Item 1');
        expect(res.body.prioridad).toBe(1);
        expect(res.body.completado).toBe(false);
    });

    it('Debe crear un item con todos los campos', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app).post('/api/todos').set('Cookie', cookies)
            .send({ texto: 'Item 1', idLista: 'lista1', prioridad: 8, fechaLimite: '2026-12-31', etiquetas: ['trabajo', 'urgente'] });

        expect(res.status).toBe(201);
        expect(res.body.prioridad).toBe(8);
        expect(res.body.etiquetas).toContain('trabajo');
        expect(res.body.etiquetas).toContain('urgente');
    });

    it('Debe guardar el item en la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();

        await request(app).post('/api/todos').set('Cookie', cookies)
            .send({ texto: 'Item 1', idLista: 'lista1' });

        const todo = await Todo.findOne({ texto: 'Item 1', usuario: userId });
        expect(todo).not.toBeNull();
    });

    it('Debe fallar si falta el texto', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const res = await request(app).post('/api/todos').set('Cookie', cookies)
            .send({ idLista: 'lista1' });
        expect(res.status).toBe(500);
    });

    it('Debe fallar si falta el idLista', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const res = await request(app).post('/api/todos').set('Cookie', cookies)
            .send({ texto: 'Item 1' });
        expect(res.status).toBe(500);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).post('/api/todos').send({ texto: 'Item 1', idLista: 'lista1' });
        expect(res.status).toBe(401);
    });
});

// ─── UPDATE TODO ──────────────────────────────────────────────────────────────

describe('Test Update Todo', () => {
    it('Debe actualizar el texto correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });

        const res = await request(app).put(`/api/todos/${todo._id}`).set('Cookie', cookies)
            .send({ texto: 'Item actualizado' });

        expect(res.status).toBe(200);
        expect(res.body.texto).toBe('Item actualizado');
    });

    it('Debe marcar como completado', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });

        const res = await request(app).put(`/api/todos/${todo._id}`).set('Cookie', cookies)
            .send({ completado: true });

        expect(res.status).toBe(200);
        expect(res.body.completado).toBe(true);
    });

    it('Debe actualizar la prioridad', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });

        const res = await request(app).put(`/api/todos/${todo._id}`).set('Cookie', cookies)
            .send({ prioridad: 9 });

        expect(res.status).toBe(200);
        expect(res.body.prioridad).toBe(9);
    });

    it('Debe actualizar las etiquetas', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', etiquetas: ['trabajo'], usuario: userId });

        const res = await request(app).put(`/api/todos/${todo._id}`).set('Cookie', cookies)
            .send({ etiquetas: ['personal', 'urgente'] });

        expect(res.status).toBe(200);
        expect(res.body.etiquetas).toContain('personal');
        expect(res.body.etiquetas).toContain('urgente');
    });

    it('Debe mover a otra lista', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });

        const res = await request(app).put(`/api/todos/${todo._id}`).set('Cookie', cookies)
            .send({ idLista: 'lista2' });

        expect(res.status).toBe(200);
        expect(res.body.idLista).toBe('lista2');
    });

    it('No debe actualizar un item de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const todo = await Todo.create({ texto: 'Item otro', idLista: 'lista1', usuario: otroId });

        const res = await request(app).put(`/api/todos/${todo._id}`).set('Cookie', cookies)
            .send({ texto: 'Hackeado' });

        expect(res.status).toBe(404);
    });

    it('Debe fallar si el item no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/todos/${idFalso}`).set('Cookie', cookies)
            .send({ texto: 'Actualizado' });
        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).put(`/api/todos/${idFalso}`).send({ texto: 'Item' });
        expect(res.status).toBe(401);
    });
});

// ─── DELETE TODO ──────────────────────────────────────────────────────────────

describe('Test Delete Todo', () => {
    it('Debe eliminar un item correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });

        const res = await request(app).delete(`/api/todos/${todo._id}`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Item eliminado exitosamente');
    });

    it('Debe eliminar el item de la BD', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });

        await request(app).delete(`/api/todos/${todo._id}`).set('Cookie', cookies);

        const todoEliminado = await Todo.findById(todo._id);
        expect(todoEliminado).toBeNull();
    });

    it('No debe eliminar un item de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const todo = await Todo.create({ texto: 'Item otro', idLista: 'lista1', usuario: otroId });

        const res = await request(app).delete(`/api/todos/${todo._id}`).set('Cookie', cookies);

        expect(res.status).toBe(404);
    });

    it('Debe fallar si el item no existe', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).delete(`/api/todos/${idFalso}`).set('Cookie', cookies);
        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).delete(`/api/todos/${idFalso}`);
        expect(res.status).toBe(401);
    });
});

// ─── SUB-ITEMS ────────────────────────────────────────────────────────────────

describe('Test Sub-Items', () => {
    it('Debe crear un sub-item correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });

        const res = await request(app).post(`/api/todos/${todo._id}/subitems`).set('Cookie', cookies)
            .send({ texto: 'Sub-item 1' });

        expect(res.status).toBe(201);
        expect(res.body.subItems.length).toBe(1);
        expect(res.body.subItems[0].texto).toBe('Sub-item 1');
    });

    it('Debe crear un sub-item con todos los campos', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });

        const res = await request(app).post(`/api/todos/${todo._id}/subitems`).set('Cookie', cookies)
            .send({ texto: 'Sub-item 1', prioridad: 7, fechaLimite: '2026-12-31', etiquetas: ['urgente'] });

        expect(res.status).toBe(201);
        expect(res.body.subItems[0].prioridad).toBe(7);
        expect(res.body.subItems[0].etiquetas).toContain('urgente');
    });

    it('Debe actualizar el texto de un sub-item', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({
            texto: 'Item 1', idLista: 'lista1', usuario: userId,
            subItems: [{ usuario: userId, texto: 'Sub-item 1' }]
        });
        const subId = todo.subItems[0]._id;

        const res = await request(app).put(`/api/todos/${todo._id}/subitems/${subId}`).set('Cookie', cookies)
            .send({ texto: 'Sub-item actualizado' });

        expect(res.status).toBe(200);
        expect(res.body.subItems[0].texto).toBe('Sub-item actualizado');
    });

    it('Debe marcar un sub-item como completado', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({
            texto: 'Item 1', idLista: 'lista1', usuario: userId,
            subItems: [{ usuario: userId, texto: 'Sub-item 1' }]
        });
        const subId = todo.subItems[0]._id;

        const res = await request(app).put(`/api/todos/${todo._id}/subitems/${subId}`).set('Cookie', cookies)
            .send({ completado: true });

        expect(res.status).toBe(200);
        expect(res.body.subItems[0].completado).toBe(true);
    });

    it('Debe actualizar la prioridad de un sub-item', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({
            texto: 'Item 1', idLista: 'lista1', usuario: userId,
            subItems: [{ usuario: userId, texto: 'Sub-item 1' }]
        });
        const subId = todo.subItems[0]._id;

        const res = await request(app).put(`/api/todos/${todo._id}/subitems/${subId}`).set('Cookie', cookies)
            .send({ prioridad: 8 });

        expect(res.status).toBe(200);
        expect(res.body.subItems[0].prioridad).toBe(8);
    });

    it('Debe eliminar un sub-item correctamente', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({
            texto: 'Item 1', idLista: 'lista1', usuario: userId,
            subItems: [{ usuario: userId, texto: 'Sub-item 1' }]
        });
        const subId = todo.subItems[0]._id;

        const res = await request(app).delete(`/api/todos/${todo._id}/subitems/${subId}`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.subItems.length).toBe(0);
    });

    it('Debe fallar si el sub-item no existe', async () => {
        const { cookies, userId } = await crearUsuarioYLogin();
        const todo = await Todo.create({ texto: 'Item 1', idLista: 'lista1', usuario: userId });
        const idFalso = new mongoose.Types.ObjectId();

        const res = await request(app).put(`/api/todos/${todo._id}/subitems/${idFalso}`).set('Cookie', cookies)
            .send({ texto: 'Actualizado' });

        expect(res.status).toBe(404);
    });

    it('No debe acceder a sub-items de un item de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();
        const { userId: otroId } = await crearSegundoUsuario();
        const todo = await Todo.create({
            texto: 'Item otro', idLista: 'lista1', usuario: otroId,
            subItems: [{ usuario: otroId, texto: 'Sub-item otro' }]
        });
        const subId = todo.subItems[0]._id;

        const res = await request(app).put(`/api/todos/${todo._id}/subitems/${subId}`).set('Cookie', cookies)
            .send({ texto: 'Hackeado' });

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const idFalso = new mongoose.Types.ObjectId();
        const res = await request(app).post(`/api/todos/${idFalso}/subitems`).send({ texto: 'Sub-item' });
        expect(res.status).toBe(401);
    });
});