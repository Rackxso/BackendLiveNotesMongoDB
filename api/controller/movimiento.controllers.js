"use strict";

import { Movimiento } from "../models/movimiento.model.js";
import { Cuenta } from "../models/cuenta.model.js";


const getCuentaIdsForUsuario = async (usuarioId) => {

};

export const getMovimientos = async (req, res) => {
    try {

    } catch {
        return res.status(500).json({ message: "Error al obtener los movimientos" });
    }
};

export const getMovimiento = async (req, res) => {
    try {

    } catch {
        return res.status(500).json({ message: "Error al obtener el movimiento" });
    }
};

export const postMovimiento = async (req, res) => {
    try {

    } catch (error) {
        return res.status(500).json({ message: "Error al crear el movimiento" });
    }
};

export const updateMovimiento = async (req, res) => {
    try {

    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar el movimiento" });
    }
};

export const deleteMovimiento = async (req, res) => {
    try {

    } catch {
        return res.status(500).json({ message: "Error al eliminar el movimiento" });
    }
};

