// controllers/nota.controller.js
"use strict";

import { Nota } from '../models/nota.model.js';

export const getNotas = async (req, res) => {
    try {
        const userId = req.user.id;
        const notas = await Nota.find({ usuario: userId }).sort({ updatedAt: -1 });
        res.status(200).json(notas);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener las notas' });
    }
};

export const getNota = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const nota = await Nota.findOne({ _id: id, usuario: userId });
        if (!nota) {
            return res.status(404).json({ message: 'Nota no encontrada' });
        }
        res.status(200).json(nota);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener la nota' });
    }
};

export const createNota = async (req, res) => {
    try {
        const userId = req.user.id;
        const { titulo, contenido, categoria } = req.body;
        const nota = await Nota.create({ titulo, contenido, categoria, usuario: userId });
        res.status(201).json(nota);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear la nota' });
    }
};

export const updateNota = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { titulo, contenido, categoria } = req.body;
        const nota = await Nota.findOne({ _id: id, usuario: userId });
        if (!nota) {
            return res.status(404).json({ message: 'Nota no encontrada' });
        }
        if (titulo !== undefined) nota.titulo = titulo;
        if (contenido !== undefined) nota.contenido = contenido;
        if (categoria !== undefined) nota.categoria = categoria;
        await nota.save();
        res.status(200).json(nota);
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar la nota' });
    }
};

export const deleteNota = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const nota = await Nota.findOneAndDelete({ _id: id, usuario: userId });
        if (!nota) {
            return res.status(404).json({ message: 'Nota no encontrada' });
        }
        res.status(200).json({ message: 'Nota eliminada exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar la nota' });
    }
};