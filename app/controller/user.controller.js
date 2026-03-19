"use strict";

import { User } from "../models/user.model.js";
import { generarToken, tokenExpirado } from "../utils/token.js";
import {
    sendVerificacionEmail,
    sendEmailVerificado,
    sendSolicitarCambioPassword,
    sendPasswordCambiada,
    sendSolicitarEliminacion,
    sendCuentaEliminada,
} from "../utils/mailer.js";

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const resultado = await User.findOne({ email, password });
        if (!resultado) {
            return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
        }
        if (!resultado.verificado) {
            return res.status(403).json({ message: "Debes verificar tu email antes de iniciar sesión" });
        }
        res.status(200).json({ message: "Login exitoso" });
    } catch (error) {
        return res.status(500).json({ message: "Error al iniciar sesión" });
    }
};

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const check = await User.findOne({ email });
        if (check) {
            return res.status(409).json({ message: "Ya existe un usuario con ese email" });
        }
        const token = generarToken();
        await User.create({ name, email, password, permisos: 1, tokenVerificacion: token });
        await sendVerificacionEmail(email, token);
        res.status(201).json({ message: "Usuario registrado, revisa tu email para verificar tu cuenta" });
    } catch (error) {
        return res.status(500).json({ message: "Error al registrar el usuario", error: error.message });
    }
};

export const verificarEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const resultado = await User.findOne({ tokenVerificacion: token });
        if (!resultado) {
            return res.status(404).json({ message: "Token inválido" });
        }
        resultado.verificado = true;
        resultado.tokenVerificacion = null;
        await resultado.save();
        await sendEmailVerificado(resultado.email);
        res.status(200).json({ message: "Email verificado exitosamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al verificar el email" });
    }
};

export const solicitarCambioPassword = async (req, res) => {
    try {
        const { email } = req.params;
        const { oldPassword } = req.body;
        const resultado = await User.findOne({ email });
        if (!resultado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        if (resultado.password !== oldPassword) {
            return res.status(401).json({ message: "Contraseña actual incorrecta" });
        }
        const token = generarToken();
        resultado.tokenCambioPassword = token;
        resultado.tokenCambioPasswordExpira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        await resultado.save();
        await sendSolicitarCambioPassword(email, token);
        res.status(200).json({ message: "Revisa tu email para confirmar el cambio de contraseña" });
    } catch (error) {
        return res.status(500).json({ message: "Error al solicitar el cambio de contraseña" });
    }
};

export const confirmarCambioPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        const resultado = await User.findOne({ tokenCambioPassword: token });
        if (!resultado) {
            return res.status(404).json({ message: "Token inválido" });
        }
        if (tokenExpirado(resultado.tokenCambioPasswordExpira)) {
            return res.status(400).json({ message: "El token ha expirado" });
        }
        if (resultado.password === newPassword) {
            return res.status(400).json({ message: "La nueva contraseña no puede ser igual a la actual" });
        }
        resultado.password = newPassword;
        resultado.tokenCambioPassword = null;
        resultado.tokenCambioPasswordExpira = null;
        await resultado.save();
        await sendPasswordCambiada(resultado.email);
        res.status(200).json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al confirmar el cambio de contraseña" });
    }
};

export const solicitarEliminacion = async (req, res) => {
    try {
        const { email } = req.params;
        const resultado = await User.findOne({ email });
        if (!resultado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        const token = generarToken();
        resultado.tokenEliminacion = token;
        await resultado.save();
        await sendSolicitarEliminacion(email, token);
        res.status(200).json({ message: "Revisa tu email para confirmar la eliminación de tu cuenta" });
    } catch (error) {
        return res.status(500).json({ message: "Error al solicitar la eliminación de la cuenta" });
    }
};

export const confirmarEliminacion = async (req, res) => {
    try {
        const { token } = req.params;
        const resultado = await User.findOneAndDelete({ tokenEliminacion: token });
        if (!resultado) {
            return res.status(404).json({ message: "Token inválido" });
        }
        await sendCuentaEliminada(resultado.email);
        res.status(200).json({ message: "Cuenta eliminada exitosamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al confirmar la eliminación de la cuenta" });
    }
};

export const getPermisos = async (req, res) => {
    try {
        const { email } = req.params;
        const resultado = await User.findOne({ email }).select('permisos');
        if (!resultado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json({ permisos: resultado.permisos });
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener los permisos del usuario" });
    }
};

export const getUserInfo = async (req, res) => {
    try {
        const { email } = req.params;
        const resultado = await User.findOne({ email }).select('-password -permisos');
        if (!resultado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json(resultado);
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener la información del usuario" });
    }
};

export const upgradePlan = async (req, res) => {
    try {
        const { email } = req.body;
        const newPermisos = Number(req.body.newPermisos);
        const resultado = await User.findOne({ email }).select('permisos');
        if (!resultado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        } else if (resultado.permisos == newPermisos) {
            return res.status(400).json({ message: "El usuario ya tiene ese plan" });
        }
        resultado.permisos = newPermisos;
        await resultado.save();
        res.status(200).json({ message: "Plan actualizado exitosamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar el plan del usuario" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { email } = req.params;
        const { name, avatar } = req.body;
        const resultado = await User.findOne({ email });
        if (!resultado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        resultado.name = name;
        resultado.avatar = avatar;
        await resultado.save();
        res.status(200).json({ message: "Información del usuario actualizada exitosamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar la información del usuario" });
    }
};