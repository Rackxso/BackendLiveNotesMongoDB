"use strict";
import { Router } from "express";
import * as X from "../controller/cuenta.controllers.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get('/cuenta', verifyToken, X.getCuentas);

router.get("/cuenta/:id", X.getCuenta);

router.post("/cuenta", X.postCuenta);

router.put("/cuenta/:id", X.updateCuenta);

router.delete("/cuenta/:id", X.deleteCuenta);

export { router as routerCuentas };