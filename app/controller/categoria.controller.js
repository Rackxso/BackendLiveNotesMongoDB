// controllers/categoria.controller.js
"use strict";

import { Categoria } from '../models/categoria.model.js';

export const getCategorias = async (req, res) => {
    try {
        const userId = req.user.id;
        // Devuelve predefinidas + las del usuario
        const categorias = await Categoria.find({
            $or: [{ predefinida: true }, { usuario: userId }]
        });
        res.status(200).json(categorias);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener las categorías' });
    }
};

export const createCategoria = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, icono, color } = req.body;

        const check = await Categoria.findOne({ nombre, usuario: userId });
        if (check) {
            return res.status(409).json({ message: 'Ya existe una categoría con ese nombre' });
        }

        const categoria = await Categoria.create({ nombre, icono, color, usuario: userId, predefinida: false });
        res.status(201).json(categoria);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear la categoría' });
    }
};

export const updateCategoria = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { nombre, icono, color } = req.body;

        const categoria = await Categoria.findOne({ _id: id, usuario: userId, predefinida: false });
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        if (nombre && nombre !== categoria.nombre) {
            const check = await Categoria.findOne({ nombre, usuario: userId });
            if (check) {
                return res.status(409).json({ message: 'Ya existe una categoría con ese nombre' });
            }
            categoria.nombre = nombre;
        }

        if (icono !== undefined) categoria.icono = icono;
        if (color !== undefined) categoria.color = color;

        await categoria.save();
        res.status(200).json(categoria);
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar la categoría' });
    }
};

export const deleteCategoria = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const categoria = await Categoria.findOneAndDelete({ _id: id, usuario: userId, predefinida: false });
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        res.status(200).json({ message: 'Categoría eliminada exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar la categoría' });
    }
};