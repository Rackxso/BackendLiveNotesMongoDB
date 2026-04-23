export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.permisos !== 13579)
    return res.status(403).json({ message: 'Acceso denegado' });
  next();
};
