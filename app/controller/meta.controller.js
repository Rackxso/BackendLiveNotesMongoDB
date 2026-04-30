// controllers/meta.controller.js
"use strict";

import { Meta } from '../models/meta.model.js';

const FREE_META_LIMIT = 2;
const PREMIUM_PERMISOS = 2;

export const getMetas = async (req, res) => {
    try {
        const userId = req.user.id;
        const metas = await Meta.find({ usuario: userId });
        res.status(200).json(metas);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener las metas' });
    }
};

export const createMeta = async (req, res) => {
    try {
        const userId = req.user.id;
        const userPermisos = req.user.permisos;
        const { name, meta } = req.body;
        if (userPermisos < PREMIUM_PERMISOS) {
            const count = await Meta.countDocuments({ usuario: userId });
            if (count >= FREE_META_LIMIT) {
                return res.status(403).json({ message: 'Límite de metas alcanzado. Hazte premium para añadir más.', code: 'META_LIMIT_REACHED' });
            }
        }
        const check = await Meta.findOne({ name, usuario: userId });
        if (check) {
            return res.status(409).json({ message: 'Ya existe una meta con ese nombre' });
        }
        const nuevaMeta = await Meta.create({ name, meta, usuario: userId });
        res.status(201).json(nuevaMeta);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear la meta' });
    }
};

export const updateMeta = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, meta } = req.body;
        const metaDoc = await Meta.findOne({ _id: id, usuario: userId });
        if (!metaDoc) {
            return res.status(404).json({ message: 'Meta no encontrada' });
        }
        if (name && name !== metaDoc.name) {
            const check = await Meta.findOne({ name, usuario: userId });
            if (check) {
                return res.status(409).json({ message: 'Ya existe una meta con ese nombre' });
            }
            metaDoc.name = name;
        }
        if (meta !== undefined) {
            metaDoc.meta = meta;
            metaDoc.completada = metaDoc.acumulado >= meta;
        }
        await metaDoc.save();
        res.status(200).json(metaDoc);
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar la meta' });
    }
};

export const deleteMeta = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const meta = await Meta.findOneAndDelete({ _id: id, usuario: userId });
        if (!meta) {
            return res.status(404).json({ message: 'Meta no encontrada' });
        }
        res.status(200).json({ message: 'Meta eliminada exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar la meta' });
    }
};