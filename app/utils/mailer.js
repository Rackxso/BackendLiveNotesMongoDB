import nodemailer from 'nodemailer';
import { MAIL_USER, MAIL_PASS } from '../config.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS
    }
});

export const sendVerificacionEmail = async (email, token) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Verifica tu cuenta',
        html: `<p>Haz clic <a href="http://localhost:4000/api/user/verificar/${token}">aquí</a> para verificar tu cuenta.</p>`
    });
};

export const sendEmailVerificado = async (email) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Email verificado',
        html: `<p>Tu email ha sido verificado exitosamente.</p>`
    });
};

export const sendSolicitarCambioPassword = async (email, token) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Confirma el cambio de contraseña',
        html: `<p>Haz clic <a href="http://localhost:4000/api/user/password/${token}">aquí</a> para confirmar el cambio. El enlace expira en 1 hora.</p>`
    });
};

export const sendPasswordCambiada = async (email) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Contraseña actualizada',
        html: `<p>Tu contraseña ha sido cambiada exitosamente. Si no fuiste tú, contacta con soporte.</p>`
    });
};

export const sendSolicitarEliminacion = async (email, token) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Confirma la eliminación de tu cuenta',
        html: `<p>Haz clic <a href="http://localhost:4000/api/user/confirmar/${token}">aquí</a> para eliminar tu cuenta. Esta acción no se puede deshacer.</p>`
    });
};

export const sendCuentaEliminada = async (email) => {
    await transporter.sendMail({
        from: MAIL_USER, to: email,
        subject: 'Cuenta eliminada',
        html: `<p>Tu cuenta ha sido eliminada correctamente.</p>`
    });
};