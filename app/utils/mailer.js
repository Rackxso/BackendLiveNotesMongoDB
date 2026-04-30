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
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    family: 4,
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

transporter.verify((error) => {
    if (error) console.error('[Mailer] Error de conexión SMTP:', error.message);
    else console.log('[Mailer] Conexión SMTP lista');
});

export const sendVerificacionEmail = async (email, token) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Verifica tu cuenta',
        html: tmplVerificacionEmail(`${URL}/api/user/verificar/${token}`)
    });
};

export const sendEmailVerificado = async (email) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Email verificado',
        html: tmplEmailVerificado()
    });
};

export const sendSolicitarCambioPassword = async (email, token) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Confirma el cambio de contraseña',
        html: tmplSolicitarCambioPassword(`${URL}/api/user/password/${token}`)
    });
};

export const sendPasswordCambiada = async (email) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Contraseña actualizada',
        html: tmplPasswordCambiada()
    });
};

export const sendSolicitarEliminacion = async (email, token) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Confirma la eliminación de tu cuenta',
        html: tmplSolicitarEliminacion(`${URL}/api/user/confirmar/${token}`)
    });
};

export const sendForgotPasswordEmail = async (email, token, frontendUrl) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Restablece tu contraseña',
        html: tmplForgotPassword(`${frontendUrl}/reset-password/${token}`)
    });
};

export const sendCuentaEliminada = async (email) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Cuenta eliminada',
        html: tmplCuentaEliminada()
    });
};
