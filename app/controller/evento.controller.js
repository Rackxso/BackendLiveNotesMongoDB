// controllers/event.controller.js
"use strict";

import { CalendarEvent, MoodEntry } from '../models/evento.model.js';
import { Habit } from '../models/habit.model.js';

// ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────

export const getCalendarEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const eventos = await CalendarEvent.find({ userId });
        res.status(200).json(eventos);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los eventos' });
    }
};

export const createCalendarEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date, notes, title, endDate, location, allDay, color } = req.body;
        const evento = await CalendarEvent.create({ userId, date, notes, title, endDate, location, allDay, color });
        res.status(201).json(evento);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear el evento' });
    }
};

export const updateCalendarEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { date, notes, title, endDate, location, allDay, color } = req.body;
        const evento = await CalendarEvent.findOne({ _id: id, userId });
        if (!evento) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }
        Object.assign(evento, { date, notes, title, endDate, location, allDay, color });
        await evento.save();
        res.status(200).json(evento);
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el evento' });
    }
};

export const deleteCalendarEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const evento = await CalendarEvent.findOneAndDelete({ _id: id, userId });
        if (!evento) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }
        res.status(200).json({ message: 'Evento eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el evento' });
    }
};

// ─── MOOD TRACKER ─────────────────────────────────────────────────────────────

export const getMoodEntries = async (req, res) => {
    try {
        const userId = req.user.id;
        const entradas = await MoodEntry.find({ userId }).sort({ date: -1 });
        res.status(200).json(entradas);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener las entradas de mood' });
    }
};

export const createMoodEntry = async (req, res) => {
    try {
        const userId = req.user.id;
        const { score, emotions, energy, notes } = req.body;

        // Comprobar si ya hay una entrada hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const yaExiste = await MoodEntry.findOne({ userId, date: { $gte: hoy, $lt: manana } });
        if (yaExiste) {
            return res.status(409).json({ message: 'Ya has registrado tu mood hoy' });
        }

        const entrada = await MoodEntry.create({ userId, date: new Date(), score, emotions, energy, notes });
        res.status(201).json(entrada);
    } catch (error) {
        return res.status(500).json({ message: 'Error al registrar el mood' });
    }
};

// ─── HABITS ───────────────────────────────────────────────────────────────────

export const getHabits = async (req, res) => {
    try {
        const userId = req.user.id;
        const habitos = await Habit.find({ userId });
        res.status(200).json(habitos);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los hábitos' });
    }
};

export const createHabit = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;
        const habito = await Habit.create({ userId, name });
        res.status(201).json(habito);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear el hábito' });
    }
};

export const deleteHabit = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const habito = await Habit.findOneAndDelete({ _id: id, userId });
        if (!habito) {
            return res.status(404).json({ message: 'Hábito no encontrado' });
        }
        res.status(200).json({ message: 'Hábito eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el hábito' });
    }
};

export const marcarHabit = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const habito = await Habit.findOne({ _id: id, userId });
        if (!habito) {
            return res.status(404).json({ message: 'Hábito no encontrado' });
        }

        const ahora = new Date();
        const hoy = new Date(ahora);
        hoy.setHours(0, 0, 0, 0);

        // Comprobar si ya fue marcado hoy
        if (habito.ultimoHecho && habito.ultimoHecho >= hoy) {
            return res.status(409).json({ message: 'Ya has marcado este hábito hoy' });
        }

        // Comprobar si la racha se rompe (último hecho fue hace más de 1 día)
        const ayer = new Date(hoy);
        ayer.setDate(ayer.getDate() - 1);
        const rachaRota = habito.ultimoHecho && habito.ultimoHecho < ayer;

        if (rachaRota) {
            habito.ultimaRacha = habito.rachaActual;
            habito.rachaActual = 1;
        } else {
            habito.rachaActual += 1;
        }

        if (habito.rachaActual > habito.rachaMasLarga) {
            habito.rachaMasLarga = habito.rachaActual;
        }

        habito.ultimoHecho = ahora;
        await habito.save();

        res.status(200).json(habito);
    } catch (error) {
        return res.status(500).json({ message: 'Error al marcar el hábito' });
    }
};