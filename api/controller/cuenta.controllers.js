"use strict";

import { Cuenta } from '../models/cuenta.model.js';

export const getCuentas = async (req, res) => {
    try {
        const response = await Cuenta.find({ usuario: req.usuario.id }); // 👈
        res.status(200).json({ data: response });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las cuentas" });
    }
};

export const getCuenta = async (req, res) => {
    try {
        const response = await Cuenta.findById(req.param);
        res.status(200).json({data:response});
    } catch (error) {
        res.status(500).json({message: "Error al obtener la cuenta", error: error});
    }
};

export const postCuenta = async (req, res) => {};

export const updateCuenta  = async (req, res) => {};

export const deleteCuenta  = async (req, res) => {};