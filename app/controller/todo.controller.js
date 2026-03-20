// controllers/todo.controller.js
"use strict";

import { Todo } from '../models/todo.model.js';

// ─── ITEMS ────────────────────────────────────────────────────────────────────

export const getTodos = async (req, res) => {
    try {
        const userId = req.user.id;
        const { idLista, prioridad, fechaDesde, fechaHasta, completado, etiqueta, orden } = req.query;

        const filtro = { usuario: userId };

        if (idLista) filtro.idLista = idLista;
        if (prioridad) filtro.prioridad = Number(prioridad);
        if (completado !== undefined) filtro.completado = completado === 'true';
        if (etiqueta) filtro.etiquetas = etiqueta;
        if (fechaDesde || fechaHasta) {
            filtro.fechaLimite = {};
            if (fechaDesde) filtro.fechaLimite.$gte = new Date(fechaDesde);
            if (fechaHasta) filtro.fechaLimite.$lte = new Date(fechaHasta);
        }

        let sort = { createdAt: -1 };
        if (orden === 'prioridad') sort = { prioridad: -1 };
        if (orden === 'fecha') sort = { fechaLimite: 1 };

        const todos = await Todo.find(filtro).sort(sort);
        res.status(200).json(todos);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los items' });
    }
};

export const getTodo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const todo = await Todo.findOne({ _id: id, usuario: userId });
        if (!todo) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }
        res.status(200).json(todo);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener el item' });
    }
};

export const createTodo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { texto, idLista, prioridad, fechaLimite, etiquetas } = req.body;
        const todo = await Todo.create({
            usuario: userId,
            texto,
            idLista,
            prioridad,
            fechaLimite,
            etiquetas
        });
        res.status(201).json(todo);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear el item' });
    }
};

export const updateTodo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { texto, idLista, prioridad, fechaLimite, etiquetas, completado } = req.body;

        const todo = await Todo.findOne({ _id: id, usuario: userId });
        if (!todo) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        if (texto !== undefined) todo.texto = texto;
        if (idLista !== undefined) todo.idLista = idLista;
        if (prioridad !== undefined) todo.prioridad = prioridad;
        if (fechaLimite !== undefined) todo.fechaLimite = fechaLimite;
        if (etiquetas !== undefined) todo.etiquetas = etiquetas;
        if (completado !== undefined) todo.completado = completado;

        await todo.save();
        res.status(200).json(todo);
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el item' });
    }
};

export const deleteTodo = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const todo = await Todo.findOneAndDelete({ _id: id, usuario: userId });
        if (!todo) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }
        res.status(200).json({ message: 'Item eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el item' });
    }
};

// ─── SUB-ITEMS ────────────────────────────────────────────────────────────────

export const createSubItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { texto, prioridad, fechaLimite, etiquetas } = req.body;

        const todo = await Todo.findOne({ _id: id, usuario: userId });
        if (!todo) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        todo.subItems.push({ usuario: userId, texto, prioridad, fechaLimite, etiquetas });
        await todo.save();
        res.status(201).json(todo);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear el sub-item' });
    }
};

export const updateSubItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id, subId } = req.params;
        const { texto, prioridad, fechaLimite, etiquetas, completado } = req.body;

        const todo = await Todo.findOne({ _id: id, usuario: userId });
        if (!todo) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        const subItem = todo.subItems.id(subId);
        if (!subItem) {
            return res.status(404).json({ message: 'Sub-item no encontrado' });
        }

        if (texto !== undefined) subItem.texto = texto;
        if (prioridad !== undefined) subItem.prioridad = prioridad;
        if (fechaLimite !== undefined) subItem.fechaLimite = fechaLimite;
        if (etiquetas !== undefined) subItem.etiquetas = etiquetas;
        if (completado !== undefined) subItem.completado = completado;

        await todo.save();
        res.status(200).json(todo);
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el sub-item' });
    }
};

export const deleteSubItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id, subId } = req.params;

        const todo = await Todo.findOne({ _id: id, usuario: userId });
        if (!todo) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        const subItem = todo.subItems.id(subId);
        if (!subItem) {
            return res.status(404).json({ message: 'Sub-item no encontrado' });
        }

        subItem.deleteOne();
        await todo.save();
        res.status(200).json(todo);
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el sub-item' });
    }
};