"use strict";

import { Router } from "express";
import * as X from "../controller/user.controller.js";
const router = Router();

// Auth
router.post("/user/register", X.register);
router.post("/user/login", X.login);

// Verificación de email
router.get("/user/verificar/:token", X.verificarEmail);

// Info y permisos
router.get("/user/:email/permisos", X.getPermisos);
router.get("/user/:email/info", X.getUserInfo);

// Actualizar
router.put("/user/:email", X.updateUser);
router.post("/user/upgrade", X.upgradePlan);

// Cambio de contraseña
router.put("/user/:email/password", X.solicitarCambioPassword);
router.post("/user/password/:token", X.confirmarCambioPassword);

// Eliminación
router.delete("/user/:email", X.solicitarEliminacion);
router.delete("/user/confirmar/:token", X.confirmarEliminacion);

export { router as routerUser };