"use strict";

import { Router } from "express";
import * as X from "../controller/user.controller.js";
const router = Router();
import { authMiddleware } from "../middleware/auth.middleware.js";

// Auth
router.post("/user/register", X.register);
router.post("/user/login", X.login);
router.post("/user/logout", X.logout);
router.post("/user/refresh", X.refresh);

// Verificación de email
router.get("/user/verificar/:token", X.verificarEmail);

// Info y permisos
router.get("/user/:email/permisos", authMiddleware, X.getPermisos);
router.get("/user/:email/info", authMiddleware, X.getUserInfo);

// Tours completados
router.get("/user/:email/tours", authMiddleware, X.getCompletedTours);
router.patch("/user/:email/tours/:tourId", authMiddleware, X.markTourCompleted);
router.delete("/user/:email/tours", authMiddleware, X.resetTours);

// Actualizar
router.put("/user/:email", authMiddleware, X.updateUser);
router.post("/user/upgrade", authMiddleware, X.upgradePlan);

// Cambio de contraseña (autenticado)
router.put("/user/:email/password", authMiddleware, X.solicitarCambioPassword);
router.get("/user/password/:token", X.confirmarCambioPasswordGet);

// Recuperación de contraseña (sin autenticación)
router.post("/user/forgot-password", X.forgotPassword);
router.post("/user/reset-password/:token", X.resetPassword);

// Eliminación
router.delete("/user/:email", authMiddleware, X.solicitarEliminacion);
router.delete("/user/confirmar/:token", X.confirmarEliminacion);
router.get("/user/confirmar/:token", X.confirmarEliminacionGet);

export { router as routerUser };