"use strict";

import { Router } from "express";
import * as X from "../controller/user.controller.js";
import passport from "../config/passport.js";
const router = Router();
import { authMiddleware } from "../middleware/auth.middleware.js";

// Auth
router.post("/user/register", X.register);
router.post("/user/login", X.login);
router.post("/user/logout", authMiddleware, X.logout);

// Google OAuth
router.get("/user/auth/google", passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get("/user/auth/google/callback",
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL ?? 'http://localhost:4200'}/login?error=google` }),
    X.googleAuthCallback
);

// Verificación de email
router.get("/user/verificar/:token", X.verificarEmail);

// Info y permisos
router.get("/user/:email/permisos", authMiddleware, X.getPermisos);
router.get("/user/:email/info", authMiddleware, X.getUserInfo);

// Actualizar
router.put("/user/:email", authMiddleware, X.updateUser);
router.post("/user/upgrade", authMiddleware, X.upgradePlan);

// Cambio de contraseña (autenticado)
router.put("/user/:email/password", authMiddleware, X.solicitarCambioPassword);
router.post("/user/password/:token", X.confirmarCambioPassword);
router.get("/user/password/:token", X.confirmarCambioPasswordGet);

// Recuperación de contraseña (sin autenticación)
router.post("/user/forgot-password", X.forgotPassword);
router.post("/user/reset-password/:token", X.resetPassword);

// Eliminación
router.delete("/user/:email", authMiddleware, X.solicitarEliminacion);
router.delete("/user/confirmar/:token", X.confirmarEliminacion);
router.get("/user/confirmar/:token", X.confirmarEliminacionGet);

export { router as routerUser };