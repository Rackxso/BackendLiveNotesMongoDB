// controllers/movimiento.controller.js
"use strict";

import { Movimiento } from '../models/movimiento.model.js';
import { Meta } from '../models/meta.model.js';
import { Presupuesto } from '../models/presupuesto.model.js';
import { Categoria } from '../models/categoria.model.js';

export const getMovimientos = async (req, res) => {
    try {
        const userId = req.user.id;
        const { tipo, fechaDesde, fechaHasta, importeMin, importeMax } = req.query;

        const filtro = { usuario: userId };
        if (tipo !== undefined) filtro.tipo = tipo === 'true';
        if (fechaDesde || fechaHasta) {
            filtro.fecha = {};
            if (fechaDesde) filtro.fecha.$gte = new Date(fechaDesde);
            if (fechaHasta) filtro.fecha.$lte = new Date(fechaHasta);
        }
        if (importeMin !== undefined || importeMax !== undefined) {
            filtro.importe = {};
            if (importeMin !== undefined) filtro.importe.$gte = Number(importeMin);
            if (importeMax !== undefined) filtro.importe.$lte = Number(importeMax);
        }

        const movimientos = await Movimiento.find(filtro)
            .populate('categorias')
            .sort({ fecha: -1 });
        res.status(200).json(movimientos);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los movimientos' });
    }
};

export const createMovimiento = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, fecha, destinatario, tipo, importe, metodo, metaId, categorias = [] } = req.body;

        if (categorias.length > 0) {
            const categoriasValidas = await Categoria.find({
                _id: { $in: categorias },
                $or: [{ predefinida: true }, { usuario: userId }]
            });
            if (categoriasValidas.length !== categorias.length) {
                return res.status(404).json({ message: 'Una o más categorías no son válidas' });
            }
        }

        if (metaId) {
            const meta = await Meta.findOne({ _id: metaId, usuario: userId });
            if (!meta) {
                return res.status(404).json({ message: 'Meta no encontrada' });
            }
            if (meta.completada) {
                return res.status(400).json({ message: 'La meta ya está completada' });
            }
            meta.acumulado = tipo ? meta.acumulado + importe : meta.acumulado - importe;
            if (meta.acumulado >= meta.meta) meta.completada = true;
            meta.movimientos.push({ fecha: fecha || new Date(), importe });
            await meta.save();
        }

        if (categorias.length > 0) {
            const fechaMovimiento = fecha ? new Date(fecha) : new Date();
            const mes = fechaMovimiento.getMonth() + 1;
            const anio = fechaMovimiento.getFullYear();
            const importePorCategoria = importe / categorias.length;

            for (const categoriaId of categorias) {
                let presupuesto = await Presupuesto.findOne({ usuario: userId, categoria: categoriaId, mes, anio });

                if (!presupuesto) {
                    const mesAnterior = mes === 1 ? 12 : mes - 1;
                    const anioAnterior = mes === 1 ? anio - 1 : anio;
                    const presupuestoAnterior = await Presupuesto.findOne({
                        usuario: userId, categoria: categoriaId,
                        mes: mesAnterior, anio: anioAnterior
                    });

                    presupuesto = await Presupuesto.create({
                        usuario: userId,
                        categoria: categoriaId,
                        limite: presupuestoAnterior ? presupuestoAnterior.limite : 0,
                        acumulado: 0,
                        mes,
                        anio
                    });
                }

                presupuesto.acumulado = tipo
                    ? presupuesto.acumulado - importePorCategoria
                    : presupuesto.acumulado + importePorCategoria;

                presupuesto.superado = presupuesto.acumulado >= presupuesto.limite && presupuesto.limite > 0;
                await presupuesto.save();
            }
        }

        const movimiento = await Movimiento.create({
            name, fecha, destinatario, tipo, importe,
            usuario: userId, metodo,
            metaId: metaId || null,
            categorias
        });

        res.status(201).json(movimiento);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear el movimiento' });
    }
};
