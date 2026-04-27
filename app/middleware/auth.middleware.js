
import { verificarAccessToken, generarAccessToken, verificarRefreshToken } from '../utils/jwt.js';
import { User } from '../models/user.model.js';

export const authMiddleware = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies.refreshToken;

        if (!accessToken && !refreshToken) {
            return res.status(401).json({ message: "No autenticado" });
        }

        // Verificar access token
        try {
            const payload = verificarAccessToken(accessToken);
            req.user = payload;
            return next();
        } catch (err) {
            // Access token expirado, intentar con refresh token
            if (!refreshToken) {
                return res.status(401).json({ message: "Sesión expirada" });
            }
        }

        // Verificar refresh token
        const payload = verificarRefreshToken(refreshToken);
        const user = await User.findOne({ email: payload.email, refreshToken });
        if (!user) {
            return res.status(401).json({ message: "Sesión inválida" });
        }

        // Generar nuevo access token
        const newAccessToken = generarAccessToken({ id: user._id, email: user.email, permisos: user.permisos });
        res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });

        req.user = { id: user._id, email: user.email, permisos: user.permisos };
        next();

    } catch (error) {
        return res.status(401).json({ message: "Sesión inválida" });
    }
};