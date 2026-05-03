import { URL as BASE_URL } from '../config.js';

const LOGO_URL = `${BASE_URL}/public/Logo.png`;

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Outfit:wght@400;500;600&display=swap" rel="stylesheet" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#FDF8F2;font-family:'Outfit',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF8F2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#D4956A;border-radius:12px 12px 0 0;padding:24px 40px;text-align:center;">
              <img src="${LOGO_URL}" alt="LiveNotes" width="72" height="72" style="display:block;margin:0 auto 8px auto;border-radius:16px;" />
              <h1 style="margin:0;font-family:'Fraunces',serif;font-size:24px;font-weight:600;color:#FDF8F2;letter-spacing:0.5px;">
                LiveNotes
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#F5EDE0;padding:40px;border-left:1px solid #EBD8C4;border-right:1px solid #EBD8C4;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#EBD8C4;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;border:1px solid #EBD8C4;border-top:none;">
              <p style="margin:0;font-size:12px;color:#4A2E18;font-family:'Outfit',sans-serif;">
                Si no has realizado esta acción, ignora este correo o
                <a href="mailto:soporte@livenotes.com" style="color:#7A5238;text-decoration:none;font-weight:500;">contacta con soporte</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const heading = (text) =>
  `<h2 style="margin:0 0 16px 0;font-family:'Fraunces',serif;font-size:22px;font-weight:600;color:#2E1F12;">${text}</h2>`;

const paragraph = (text) =>
  `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#4A2E18;">${text}</p>`;

const button = (href, label, color = '#D4956A') =>
  `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:${color};border-radius:8px;box-shadow:0px 3px 2px 0px rgba(139,94,60,0.25);">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-family:'Outfit',sans-serif;font-size:15px;font-weight:600;color:#FDF8F2;text-decoration:none;letter-spacing:0.3px;">${label}</a>
      </td>
    </tr>
  </table>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #EBD8C4;margin:24px 0;" />`;

const badge = (text, color = '#5A8A60') =>
  `<p style="display:inline-block;margin:0 0 20px 0;padding:6px 14px;background-color:${color}22;border-radius:20px;font-size:13px;font-weight:600;color:${color};">${text}</p>`;


export const tmplVerificacionEmail = (url) => baseTemplate(
  'Verifica tu cuenta',
  `
  ${badge('Confirma tu registro')}
  ${heading('Bienvenido/a a LiveNotes')}
  ${paragraph('Gracias por registrarte. Para activar tu cuenta y empezar a usar la app, haz clic en el botón de abajo.')}
  ${button(url, 'Verificar mi cuenta')}
  ${divider()}
  ${paragraph('<span style="font-size:13px;color:#7A5238;">El enlace es de un solo uso. Si no has creado una cuenta en LiveNotes, ignora este correo.</span>')}
  `
);

export const tmplEmailVerificado = () => baseTemplate(
  'Email verificado',
  `
  ${badge('Verificación completada', '#5A8A60')}
  ${heading('Tu cuenta está activa')}
  ${paragraph('Tu dirección de correo ha sido verificada correctamente. Ya puedes iniciar sesión y empezar a usar LiveNotes.')}
  ${divider()}
  ${paragraph('<span style="font-size:13px;color:#7A5238;">Si tienes algún problema para acceder, no dudes en contactar con soporte.</span>')}
  `
);

export const tmplSolicitarCambioPassword = (url) => baseTemplate(
  'Confirma el cambio de contraseña',
  `
  ${badge('Solicitud de cambio de contraseña', '#C8784A')}
  ${heading('¿Quieres cambiar tu contraseña?')}
  ${paragraph('Hemos recibido una solicitud para cambiar la contraseña de tu cuenta. Haz clic en el botón para confirmarla.')}
  ${button(url, 'Confirmar cambio', '#7A5238')}
  ${divider()}
  ${paragraph('<span style="font-size:13px;color:#B85040;">&#9888; Este enlace expira en <strong>1 hora</strong>. Si no has solicitado este cambio, ignora este correo — tu contraseña actual no se verá afectada.</span>')}
  `
);

export const tmplPasswordCambiada = () => baseTemplate(
  'Contraseña actualizada',
  `
  ${badge('Contraseña actualizada', '#5A8A60')}
  ${heading('Tu contraseña ha sido cambiada')}
  ${paragraph('La contraseña de tu cuenta ha sido actualizada correctamente.')}
  ${divider()}
  ${paragraph('<span style="font-size:13px;color:#B85040;">&#9888; Si no has sido tú quien realizó este cambio, contacta con soporte de inmediato para proteger tu cuenta.</span>')}
  `
);

export const tmplSolicitarEliminacion = (url) => baseTemplate(
  'Confirma la eliminación de tu cuenta',
  `
  ${badge('Solicitud de eliminación de cuenta', '#B85040')}
  ${heading('¿Quieres eliminar tu cuenta?')}
  ${paragraph('Hemos recibido una solicitud para eliminar tu cuenta de LiveNotes. Esta acción es <strong>permanente e irreversible</strong>: se borrarán todos tus datos.')}
  ${button(url, 'Eliminar mi cuenta', '#B85040')}
  ${divider()}
  ${paragraph('<span style="font-size:13px;color:#7A5238;">Si no has solicitado esto, ignora este correo — tu cuenta permanecerá activa sin ningún cambio.</span>')}
  `
);

export const tmplForgotPassword = (url) => baseTemplate(
  'Restablecer contraseña',
  `
  ${badge('Recuperación de contraseña', '#4A7FA5')}
  ${heading('Restablece tu contraseña')}
  ${paragraph('Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva.')}
  ${button(url, 'Restablecer contraseña', '#4A7FA5')}
  ${divider()}
  ${paragraph('<span style="font-size:13px;color:#B85040;">&#9888; Este enlace expira en <strong>1 hora</strong>. Si no has solicitado restablecer tu contraseña, ignora este correo — tu cuenta está segura.</span>')}
  `
);

export const tmplCuentaEliminada = () => baseTemplate(
  'Cuenta eliminada',
  `
  ${badge('Cuenta eliminada', '#B85040')}
  ${heading('Tu cuenta ha sido eliminada')}
  ${paragraph('Tu cuenta y todos los datos asociados han sido eliminados correctamente de LiveNotes.')}
  ${paragraph('Ha sido un placer tenerte con nosotros. Si en algún momento quieres volver, siempre puedes crear una nueva cuenta.')}
  ${divider()}
  ${paragraph('<span style="font-size:13px;color:#7A5238;">Si crees que esto ha sido un error, contacta con soporte lo antes posible.</span>')}
  `
);
