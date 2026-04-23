// controllers/presupuesto.controller.js
"use strict";

import { Presupuesto } from '../models/presupuesto.model.js';
import { Categoria } from '../models/categoria.model.js';

export const getPresupuestos = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        const currentMes  = today.getMonth() + 1;
        const currentAnio = today.getFullYear();

        const targetMes  = req.query.mes  ? Number(req.query.mes)  : currentMes;
        const targetAnio = req.query.anio ? Number(req.query.anio) : currentAnio;

        let presupuestos = await Presupuesto.find({ usuario: userId, mes: targetMes, anio: targetAnio }).populate('categoria');

        // Auto-rollover: si el mes actual no tiene presupuestos, copiarlos del mes anterior con acumulado=0
        const isCurrentMonth = targetMes === currentMes && targetAnio === currentAnio;
        if (isCurrentMonth && presupuestos.length === 0) {
            const prevMes  = currentMes === 1 ? 12 : currentMes - 1;
            const prevAnio = currentMes === 1 ? currentAnio - 1 : currentAnio;
            const anteriores = await Presupuesto.find({ usuario: userId, mes: prevMes, anio: prevAnio }).populate('categoria');

            if (anteriores.length > 0) {
                await Promise.all(anteriores.map(p =>
                    Presupuesto.create({
                        usuario:   userId,
                        categoria: p.categoria._id,
                        limite:    p.limite,
                        mes:       currentMes,
                        anio:      currentAnio,
                        acumulado: 0,
                    })
                ));
                presupuestos = await Presupuesto.find({ usuario: userId, mes: targetMes, anio: targetAnio }).populate('categoria');
            }
        }

        res.status(200).json(presupuestos);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los presupuestos' });
    }
};

const FREE_BUDGET_LIMIT = 3;
const PREMIUM_PERMISOS = 2;

export const createPresupuesto = async (req, res) => {
    try {
        const userId = req.user.id;
        const userPermisos = req.user.permisos;
        const { nombre, color, limite, mes, anio } = req.body;

        if (userPermisos < PREMIUM_PERMISOS) {
            const today = new Date();
            const currentMes = mes ?? today.getMonth() + 1;
            const currentAnio = anio ?? today.getFullYear();
            const count = await Presupuesto.countDocuments({ usuario: userId, mes: currentMes, anio: currentAnio });
            if (count >= FREE_BUDGET_LIMIT) {
                return res.status(403).json({ message: 'Límite de presupuestos alcanzado. Hazte premium para añadir más.', code: 'BUDGET_LIMIT_REACHED' });
            }
        }

        let categoria = await Categoria.findOne({ nombre, usuario: userId });
        if (!categoria) {
            categoria = await Categoria.create({ nombre, color, usuario: userId, predefinida: false });
        } else if (color && categoria.color !== color) {
            categoria.color = color;
            await categoria.save();
        }

        const check = await Presupuesto.findOne({ usuario: userId, categoria: categoria._id, mes, anio });
        if (check) {
            return res.status(409).json({ message: 'Ya existe un presupuesto para esa categoría en ese mes' });
        }

        const presupuesto = await (await Presupuesto.create({
            usuario: userId,
            categoria: categoria._id,
            limite,
            mes,
            anio,
        })).populate('categoria');

        res.status(201).json(presupuesto);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear el presupuesto' });
    }
};

export const updatePresupuesto = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { limite } = req.body;

        const presupuesto = await Presupuesto.findOne({ _id: id, usuario: userId });
        if (!presupuesto) {
            return res.status(404).json({ message: 'Presupuesto no encontrado' });
        }

        presupuesto.limite = limite;
        presupuesto.superado = presupuesto.acumulado >= limite;
        await presupuesto.save();

        res.status(200).json(presupuesto);
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar el presupuesto' });
    }
};

export const deletePresupuesto = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const presupuesto = await Presupuesto.findOneAndDelete({ _id: id, usuario: userId });
        if (!presupuesto) {
            return res.status(404).json({ message: 'Presupuesto no encontrado' });
        }

        res.status(200).json({ message: 'Presupuesto eliminado exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el presupuesto' });
    }
};