import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { CalendarEvent, MoodEntry } from '../models/evento.model.js';
import { Habit } from '../models/habit.model.js';
import { URI } from '../config.js';

afterEach(async () => {
    await CalendarEvent.deleteMany({});
    await MoodEntry.deleteMany({});
    await Habit.deleteMany({});
    await User.deleteMany({});
});

// ─── HELPER ───────────────────────────────────────────────────────────────────

const crearUsuarioYLogin = async () => {
    await User.create({ name: 'Juan', email: 'juan@test.com', password: '123456', permisos: 1, verificado: true });
    const res = await request(app)
        .post('/api/user/login')
        .send({ email: 'juan@test.com', password: '123456' });
    return { cookies: res.headers['set-cookie'], userId: res.body.id };
};

// ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────

describe('Test Calendar Events', () => {
    it('Debe crear un evento de calendario', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app)
            .post('/api/events/calendar')
            .set('Cookie', cookies)
            .send({ date: '2026-03-20', title: 'Reunión', allDay: false });

        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Reunión');
    });

    it('Debe guardar el evento en la BD', async () => {
        const { cookies } = await crearUsuarioYLogin();

        await request(app)
            .post('/api/events/calendar')
            .set('Cookie', cookies)
            .send({ date: '2026-03-20', title: 'Reunión', allDay: false });

        const evento = await CalendarEvent.findOne({ title: 'Reunión' });
        expect(evento).not.toBeNull();
        expect(evento.title).toBe('Reunión');
    });

    it('Debe obtener los eventos del usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();

        await request(app).post('/api/events/calendar').set('Cookie', cookies)
            .send({ date: '2026-03-20', title: 'Reunión', allDay: false });
        await request(app).post('/api/events/calendar').set('Cookie', cookies)
            .send({ date: '2026-03-21', title: 'Cumpleaños', allDay: true });

        const res = await request(app).get('/api/events/calendar').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('No debe devolver eventos de otros usuarios', async () => {
        const { cookies } = await crearUsuarioYLogin();

        await request(app).post('/api/events/calendar').set('Cookie', cookies)
            .send({ date: '2026-03-20', title: 'Mi evento', allDay: false });

        // Crear segundo usuario
        await User.create({ name: 'Otro', email: 'otro@test.com', password: '123456', permisos: 1, verificado: true });
        const resOtro = await request(app).post('/api/user/login').send({ email: 'otro@test.com', password: '123456' });
        const cookiesOtro = resOtro.headers['set-cookie'];

        const res = await request(app).get('/api/events/calendar').set('Cookie', cookiesOtro);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe actualizar un evento', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/events/calendar').set('Cookie', cookies)
            .send({ date: '2026-03-20', title: 'Reunión', allDay: false });

        const res = await request(app)
            .put(`/api/events/calendar/${crear.body._id}`)
            .set('Cookie', cookies)
            .send({ date: '2026-03-20', title: 'Reunión actualizada', allDay: false });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Reunión actualizada');
    });

    it('No debe actualizar un evento de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/events/calendar').set('Cookie', cookies)
            .send({ date: '2026-03-20', title: 'Reunión', allDay: false });

        await User.create({ name: 'Otro', email: 'otro@test.com', password: '123456', permisos: 1, verificado: true });
        const resOtro = await request(app).post('/api/user/login').send({ email: 'otro@test.com', password: '123456' });
        const cookiesOtro = resOtro.headers['set-cookie'];

        const res = await request(app)
            .put(`/api/events/calendar/${crear.body._id}`)
            .set('Cookie', cookiesOtro)
            .send({ date: '2026-03-20', title: 'Hackeado', allDay: false });

        expect(res.status).toBe(404);
    });

    it('Debe eliminar un evento', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/events/calendar').set('Cookie', cookies)
            .send({ date: '2026-03-20', title: 'Reunión', allDay: false });

        const res = await request(app)
            .delete(`/api/events/calendar/${crear.body._id}`)
            .set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Evento eliminado exitosamente');
    });

    it('No debe eliminar un evento de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/events/calendar').set('Cookie', cookies)
            .send({ date: '2026-03-20', title: 'Reunión', allDay: false });

        await User.create({ name: 'Otro', email: 'otro@test.com', password: '123456', permisos: 1, verificado: true });
        const resOtro = await request(app).post('/api/user/login').send({ email: 'otro@test.com', password: '123456' });
        const cookiesOtro = resOtro.headers['set-cookie'];

        const res = await request(app)
            .delete(`/api/events/calendar/${crear.body._id}`)
            .set('Cookie', cookiesOtro);

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).get('/api/events/calendar');
        expect(res.status).toBe(401);
    });
});

// ─── MOOD TRACKER ─────────────────────────────────────────────────────────────

describe('Test Mood Tracker', () => {
    it('Debe registrar una entrada de mood', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app)
            .post('/api/events/mood')
            .set('Cookie', cookies)
            .send({ score: 7, emotions: ['happy', 'calm'], energy: 4 });

        expect(res.status).toBe(201);
        expect(res.body.score).toBe(7);
    });

    it('Debe rechazar una segunda entrada de mood el mismo día', async () => {
        const { cookies } = await crearUsuarioYLogin();

        await request(app).post('/api/events/mood').set('Cookie', cookies)
            .send({ score: 7, emotions: ['happy'], energy: 4 });

        const res = await request(app).post('/api/events/mood').set('Cookie', cookies)
            .send({ score: 5, emotions: ['sad'], energy: 2 });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Ya has registrado tu mood hoy');
    });

    it('Debe obtener las entradas de mood del usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();

        await request(app).post('/api/events/mood').set('Cookie', cookies)
            .send({ score: 7, emotions: ['happy'], energy: 4 });

        const res = await request(app).get('/api/events/mood').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
    });

    it('No debe devolver entradas de mood de otros usuarios', async () => {
        const { cookies } = await crearUsuarioYLogin();

        await request(app).post('/api/events/mood').set('Cookie', cookies)
            .send({ score: 7, emotions: ['happy'], energy: 4 });

        await User.create({ name: 'Otro', email: 'otro@test.com', password: '123456', permisos: 1, verificado: true });
        const resOtro = await request(app).post('/api/user/login').send({ email: 'otro@test.com', password: '123456' });
        const cookiesOtro = resOtro.headers['set-cookie'];

        const res = await request(app).get('/api/events/mood').set('Cookie', cookiesOtro);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(0);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).get('/api/events/mood');
        expect(res.status).toBe(401);
    });
});

// ─── HABITS ───────────────────────────────────────────────────────────────────

describe('Test Habits', () => {
    it('Debe crear un hábito', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const res = await request(app)
            .post('/api/habits')
            .set('Cookie', cookies)
            .send({ name: 'Ejercicio' });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Ejercicio');
        expect(res.body.rachaActual).toBe(0);
    });

    it('Debe listar los hábitos del usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();

        await request(app).post('/api/habits').set('Cookie', cookies).send({ name: 'Ejercicio' });
        await request(app).post('/api/habits').set('Cookie', cookies).send({ name: 'Leer' });

        const res = await request(app).get('/api/habits').set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
    });

    it('Debe eliminar un hábito', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/habits').set('Cookie', cookies).send({ name: 'Ejercicio' });

        const res = await request(app).delete(`/api/habits/${crear.body._id}`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Hábito eliminado exitosamente');
    });

    it('Debe marcar un hábito como hecho', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/habits').set('Cookie', cookies).send({ name: 'Ejercicio' });

        const res = await request(app).patch(`/api/habits/${crear.body._id}/marcar`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.rachaActual).toBe(1);
    });

    it('Debe incrementar la racha al marcar varios días seguidos', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/habits').set('Cookie', cookies).send({ name: 'Ejercicio' });
        const id = crear.body._id;

        // Simular que fue marcado ayer
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        await Habit.findByIdAndUpdate(id, { ultimoHecho: ayer, rachaActual: 1 });

        const res = await request(app).patch(`/api/habits/${id}/marcar`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.rachaActual).toBe(2);
    });

    it('Debe romper la racha si no se marcó ayer', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/habits').set('Cookie', cookies).send({ name: 'Ejercicio' });
        const id = crear.body._id;

        // Simular que fue marcado hace 3 días
        const hace3Dias = new Date();
        hace3Dias.setDate(hace3Dias.getDate() - 3);
        await Habit.findByIdAndUpdate(id, { ultimoHecho: hace3Dias, rachaActual: 5 });

        const res = await request(app).patch(`/api/habits/${id}/marcar`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.rachaActual).toBe(1);
        expect(res.body.ultimaRacha).toBe(5);
    });

    it('Debe actualizar la racha más larga', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/habits').set('Cookie', cookies).send({ name: 'Ejercicio' });
        const id = crear.body._id;

        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        await Habit.findByIdAndUpdate(id, { ultimoHecho: ayer, rachaActual: 9, rachaMasLarga: 9 });

        const res = await request(app).patch(`/api/habits/${id}/marcar`).set('Cookie', cookies);

        expect(res.status).toBe(200);
        expect(res.body.rachaMasLarga).toBe(10);
    });

    it('Debe rechazar marcar un hábito dos veces el mismo día', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/habits').set('Cookie', cookies).send({ name: 'Ejercicio' });

        await request(app).patch(`/api/habits/${crear.body._id}/marcar`).set('Cookie', cookies);
        const res = await request(app).patch(`/api/habits/${crear.body._id}/marcar`).set('Cookie', cookies);

        expect(res.status).toBe(409);
        expect(res.body.message).toBe('Ya has marcado este hábito hoy');
    });

    it('No debe eliminar un hábito de otro usuario', async () => {
        const { cookies } = await crearUsuarioYLogin();

        const crear = await request(app).post('/api/habits').set('Cookie', cookies).send({ name: 'Ejercicio' });

        await User.create({ name: 'Otro', email: 'otro@test.com', password: '123456', permisos: 1, verificado: true });
        const resOtro = await request(app).post('/api/user/login').send({ email: 'otro@test.com', password: '123456' });
        const cookiesOtro = resOtro.headers['set-cookie'];

        const res = await request(app).delete(`/api/habits/${crear.body._id}`).set('Cookie', cookiesOtro);

        expect(res.status).toBe(404);
    });

    it('Debe rechazar si no está autenticado', async () => {
        const res = await request(app).get('/api/habits');
        expect(res.status).toBe(401);
    });
});