// controllers/presupuesto.controller.js
"use strict";

import { Presupuesto } from '../models/presupuesto.model.js';

export const getPresupuestos = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mes, anio } = req.query;

        const filtro = { usuario: userId };
        if (mes) filtro.mes = Number(mes);
        if (anio) filtro.anio = Number(anio);

        const presupuestos = await Presupuesto.find(filtro).populate('categoria');
        res.status(200).json(presupuestos);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los presupuestos' });
    }
};

export const createPresupuesto = async (req, res) => {
    try {
        const userId = req.user.id;
        const { categoriaId, limite, mes, anio } = req.body;

        const check = await Presupuesto.findOne({ usuario: userId, categoria: categoriaId, mes, anio });
        if (check) {
            return res.status(409).json({ message: 'Ya existe un presupuesto para esa categoría en ese mes' });
        }

        const presupuesto = await Presupuesto.create({
            usuario: userId,
            categoria: categoriaId,
            limite,
            mes,
            anio,
        });

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