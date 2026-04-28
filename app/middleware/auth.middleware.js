
import { verificarAccessToken, generarAccessToken, verificarRefreshToken } from '../utils/jwt.js';
import { User } from '../models/user.model.js';

export const authMiddleware = async (req, res, next) => {
    try {
        // Prioridad: Authorization header (Bearer token), luego cookie
        const authHeader = req.headers.authorization;
        const accessToken = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
            ?? req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        if (!accessToken && !refreshToken) {
            return res.status(401).json({ message: "No autenticado" });
        }

        // Verificar access token
        try {
            const payload = verificarAccessToken(accessToken);
            req.user = payload;
            return next();
        } catch {
            // Access token expirado o inválido, intentar con refresh token (solo cookies)
            if (!refreshToken) {
                return res.status(401).json({ message: "Sesión expirada" });
            }
        }

        // Verificar refresh token (solo para flujo de cookies)
        const payload = verificarRefreshToken(refreshToken);
        const user = await User.findOne({ email: payload.email, refreshToken });
        if (!user) {
            return res.status(401).json({ message: "Sesión inválida" });
        }

        const newAccessToken = generarAccessToken({ id: user._id, email: user.email, permisos: user.permisos });
        const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
        res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: isSecure, sameSite: isSecure ? 'none' : 'lax', maxAge: 15 * 60 * 1000 });

        req.user = { id: user._id, email: user.email, permisos: user.permisos };
        next();

    } catch (error) {
        return res.status(401).json({ message: "Sesión inválida" });
    }
};
