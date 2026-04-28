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
    sendForgotPasswordEmail,
} from "../utils/mailer.js";
import { FRONTEND_URL } from "../config.js";

import { generarAccessToken, generarRefreshToken } from "../utils/jwt.js";
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

        const payload = { id: resultado._id, email: resultado.email, permisos: resultado.permisos };
        const accessToken = generarAccessToken(payload);
        const refreshToken = generarRefreshToken(payload);

        // Guardar refresh token en BD
        resultado.refreshToken = refreshToken;
        await resultado.save();

        // Guardar tokens en cookies HTTP-only
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.status(200).json({ message: "Login exitoso", user: { email: resultado.email, name: resultado.name, permisos: resultado.permisos } });
    } catch (error) {
        return res.status(500).json({ message: "Error al iniciar sesión" , error: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
        }
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(200).json({ message: "Logout exitoso" });
    } catch (error) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
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
        const mailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

        await User.create({
            name, email, password, permisos: 1,
            tokenVerificacion: mailConfigured ? token : null,
            verificado: !mailConfigured
        });

        if (mailConfigured) {
            try {
                await sendVerificacionEmail(email, token);
            } catch (mailError) {
                console.warn("No se pudo enviar el email de verificación:", mailError.message);
            }
        }

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
            return res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=error`);
        }
        resultado.verificado = true;
        resultado.tokenVerificacion = null;
        await resultado.save();
        await sendEmailVerificado(resultado.email);
        res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=verificacion`);
    } catch (error) {
        res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=error`);
    }
};

export const solicitarCambioPassword = async (req, res) => {
    try {
        const { email } = req.params;
        const { oldPassword, newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ message: "La nueva contraseña es requerida" });
        }
        const resultado = await User.findOne({ email });
        if (!resultado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        if (resultado.password !== oldPassword) {
            return res.status(401).json({ message: "Contraseña actual incorrecta" });
        }
        if (resultado.password === newPassword) {
            return res.status(400).json({ message: "La nueva contraseña no puede ser igual a la actual" });
        }
        const token = generarToken();
        resultado.tokenCambioPassword = token;
        resultado.tokenCambioPasswordExpira = new Date(Date.now() + 60 * 60 * 1000);
        resultado.newPasswordPending = newPassword;
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
        resultado.newPasswordPending = null;
        await resultado.save();
        await sendPasswordCambiada(resultado.email);
        res.status(200).json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al confirmar el cambio de contraseña" });
    }
};

export const confirmarCambioPasswordGet = async (req, res) => {
    try {
        const { token } = req.params;
        const resultado = await User.findOne({ tokenCambioPassword: token });
        if (!resultado || !resultado.newPasswordPending) {
            return res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=error`);
        }
        if (tokenExpirado(resultado.tokenCambioPasswordExpira)) {
            return res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=error`);
        }
        resultado.password = resultado.newPasswordPending;
        resultado.newPasswordPending = null;
        resultado.tokenCambioPassword = null;
        resultado.tokenCambioPasswordExpira = null;
        await resultado.save();
        await sendPasswordCambiada(resultado.email);
        res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=password`);
    } catch (error) {
        res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=error`);
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const resultado = await User.findOne({ email });
        if (!resultado) {
            // Respuesta genérica para no revelar si el email existe
            return res.status(200).json({ message: "Si el email existe, recibirás un enlace para restablecer tu contraseña" });
        }
        const token = generarToken();
        resultado.tokenCambioPassword = token;
        resultado.tokenCambioPasswordExpira = new Date(Date.now() + 60 * 60 * 1000);
        await resultado.save();
        await sendForgotPasswordEmail(email, token, FRONTEND_URL);
        res.status(200).json({ message: "Si el email existe, recibirás un enlace para restablecer tu contraseña" });
    } catch (error) {
        return res.status(500).json({ message: "Error al procesar la solicitud" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        const resultado = await User.findOne({ tokenCambioPassword: token });
        if (!resultado) {
            return res.status(404).json({ message: "Token inválido o ya utilizado" });
        }
        if (tokenExpirado(resultado.tokenCambioPasswordExpira)) {
            return res.status(400).json({ message: "El token ha expirado" });
        }
        resultado.password = newPassword;
        resultado.tokenCambioPassword = null;
        resultado.tokenCambioPasswordExpira = null;
        await resultado.save();
        await sendPasswordCambiada(resultado.email);
        res.status(200).json({ message: "Contraseña restablecida exitosamente" });
    } catch (error) {
        return res.status(500).json({ message: "Error al restablecer la contraseña" });
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

export const confirmarEliminacionGet = async (req, res) => {
    try {
        const { token } = req.params;
        const resultado = await User.findOneAndDelete({ tokenEliminacion: token });
        if (!resultado) {
            return res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=error`);
        }
        await sendCuentaEliminada(resultado.email);
        res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=eliminacion`);
    } catch (error) {
        res.redirect(`${FRONTEND_URL}/email-confirmado?tipo=error`);
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
        const resultado = await User.findOne({ email }).select('-password');
        if (!resultado) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.status(200).json({ email: resultado.email, name: resultado.name, permisos: resultado.permisos });
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