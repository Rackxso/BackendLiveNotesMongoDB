"use strict";

import { Cuenta } from '../models/cuenta.model.js';

export const getCuentas = async (req, res) => {
    try {
        const userId = req.user.id;
        const cuentas = await Cuenta.find({ usuario: userId });
        res.status(200).json(cuentas);
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener las cuentas' });
    }
};

export const createCuenta = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, balance } = req.body;
        const check = await Cuenta.findOne({ name, usuario: userId });
        if (check) {
            return res.status(409).json({ message: 'Ya existe una cuenta con ese nombre' });
        }
        const cuenta = await Cuenta.create({ name, balance, usuario: userId });
        res.status(201).json(cuenta);
    } catch (error) {
        return res.status(500).json({ message: 'Error al crear la cuenta' });
    }
};

export const updateCuenta = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name } = req.body;
        const cuenta = await Cuenta.findOne({ _id: id, usuario: userId });
        if (!cuenta) {
            return res.status(404).json({ message: 'Cuenta no encontrada' });
        }
        const check = await Cuenta.findOne({ name, usuario: userId }); 
        if (check) {
            return res.status(409).json({ message: 'Ya existe una cuenta con ese nombre' });
        }
        cuenta.name = name;
        await cuenta.save();
        res.status(200).json(cuenta);
    } catch (error) {
        return res.status(500).json({ message: 'Error al actualizar la cuenta' });
    }
};

export const deleteCuenta = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const cuenta = await Cuenta.findOneAndDelete({ _id: id, usuario: userId });
        if (!cuenta) {
            return res.status(404).json({ message: 'Cuenta no encontrada' });
        }
        res.status(200).json({ message: 'Cuenta eliminada exitosamente' });
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar la cuenta' });
    }
};