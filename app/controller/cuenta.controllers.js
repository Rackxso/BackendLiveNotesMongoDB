"use strict";

import { Cuenta } from '../models/cuenta.model.js';


export const getCuentas = async (req, res) => {
    try {
        const resultado = await Cuenta.find();
        res.status(200).json(resultado);

    } catch (error) {
        res.status(500).json({ message: "Error al obtener las cuentas" });
    }
};

export const getCuenta = async (req, res) => {
    try {

    } catch (error) {
        res.status(500).json({ message: "Error al obtener la cuenta" });
    }
};

export const postCuenta = async (req, res) => {
    try {

    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ message: "Ya existe una cuenta con ese nombre" });
        }
        return res.status(500).json({ message: "Error al crear la cuenta" });
    }
};

export const updateCuenta = async (req, res) => {
    try {

    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar la cuenta" });
    }
};

export const deleteCuenta = async (req, res) => {
    try {

    } catch (error) {
        return res.status(500).json({ message: "Error al eliminar la cuenta" });
    }
};