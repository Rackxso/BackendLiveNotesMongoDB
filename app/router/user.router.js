"use strict";

import { Router } from "express";
import * as X from "../controller/user.controller.js";
const router = Router();
import { authMiddleware } from "../middleware/auth.middleware.js";

// Auth
router.post("/user/register", X.register);
router.post("/user/login", X.login);
router.post("/user/logout", authMiddleware, X.logout);

// Verificación de email
router.get("/user/verificar/:token", X.verificarEmail);

// Info y permisos
router.get("/user/:email/permisos", authMiddleware, X.getPermisos);
router.get("/user/:email/info", authMiddleware, X.getUserInfo);

// Actualizar
router.put("/user/:email", authMiddleware, X.updateUser);
router.post("/user/upgrade", authMiddleware, X.upgradePlan);

// Cambio de contraseña
router.put("/user/:email/password", authMiddleware, X.solicitarCambioPassword);
router.post("/user/password/:token", X.confirmarCambioPassword);

// Eliminación
router.delete("/user/:email", authMiddleware, X.solicitarEliminacion);
router.delete("/user/confirmar/:token", X.confirmarEliminacion);

export { router as routerUser };