// controllers/movimiento.controller.js
"use strict";

import { Movimiento } from '../models/movimiento.model.js';
import { Cuenta } from '../models/cuenta.model.js';
import { Meta } from '../models/meta.model.js';
import { Presupuesto } from '../models/presupuesto.model.js';
import { Categoria } from '../models/categoria.model.js';

export const getMovimientos = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cuentaId, tipo, fechaDesde, fechaHasta, importeMin, importeMax } = req.query;

        const cuentas = await Cuenta.find({ usuario: userId }).select('_id');
        const cuentaIds = cuentas.map(c => c._id);

        if (cuentaId) {
            const cuentaValida = cuentaIds.some(id => id.toString() === cuentaId);
            if (!cuentaValida) {
                return res.status(403).json({ message: 'No tienes acceso a esa cuenta' });
            }
        }

        if (cuentaIds.length === 0) return res.status(200).json([]);

        const filtro = { cuenta: { $in: cuentaIds } };
        if (cuentaId) filtro.cuenta = cuentaId;
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
        const { name, fecha, destinatario, tipo, importe, cuentaId, metodo, metaId, categorias = [] } = req.body;

        // Verificar cuenta
        const cuenta = await Cuenta.findOne({ _id: cuentaId, usuario: userId });
        if (!cuenta) {
            return res.status(404).json({ message: 'Cuenta no encontrada' });
        }

        // Verificar que las categorías existen y pertenecen al usuario o son predefinidas
        if (categorias.length > 0) {
            const categoriasValidas = await Categoria.find({
                _id: { $in: categorias },
                $or: [{ predefinida: true }, { usuario: userId }]
            });
            if (categoriasValidas.length !== categorias.length) {
                return res.status(404).json({ message: 'Una o más categorías no son válidas' });
            }
        }

        // Verificar meta
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

        // Actualizar presupuestos si hay categorías
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

        // Actualizar balance cuenta
        cuenta.balance = tipo ? cuenta.balance + importe : cuenta.balance - importe;
        await cuenta.save();

        const movimiento = await Movimiento.create({
            name, fecha, destinatario, tipo, importe,
            cuenta: cuentaId, metodo,
            metaId: metaId || null,
            categorias
        });

        res.status(201).json(movimiento);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear el movimiento' });
    }
};