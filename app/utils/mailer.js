import nodemailer from 'nodemailer';
import { MAIL_USER, MAIL_PASS, URL } from '../config.js';
import {
    tmplVerificacionEmail,
    tmplEmailVerificado,
    tmplSolicitarCambioPassword,
    tmplPasswordCambiada,
    tmplSolicitarEliminacion,
    tmplCuentaEliminada,
    tmplForgotPassword,
} from './emailTemplates.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
    },
});

const send = async (to, subject, html) => {
    await transporter.sendMail({ from: `LiveNotes <${MAIL_USER}>`, to, subject, html });
};

export const sendVerificacionEmail = (email, token) =>
    send(email, 'Verifica tu cuenta', tmplVerificacionEmail(`${URL}/api/user/verificar/${token}`));

export const sendEmailVerificado = (email) =>
    send(email, 'Email verificado', tmplEmailVerificado());

export const sendSolicitarCambioPassword = (email, token) =>
    send(email, 'Confirma el cambio de contraseña', tmplSolicitarCambioPassword(`${URL}/api/user/password/${token}`));

export const sendPasswordCambiada = (email) =>
    send(email, 'Contraseña actualizada', tmplPasswordCambiada());

export const sendSolicitarEliminacion = (email, token) =>
    send(email, 'Confirma la eliminación de tu cuenta', tmplSolicitarEliminacion(`${URL}/api/user/confirmar/${token}`));

export const sendForgotPasswordEmail = (email, token, frontendUrl) =>
    send(email, 'Restablece tu contraseña', tmplForgotPassword(`${frontendUrl}/reset-password/${token}`));

export const sendCuentaEliminada = (email) =>
    send(email, 'Cuenta eliminada', tmplCuentaEliminada());
