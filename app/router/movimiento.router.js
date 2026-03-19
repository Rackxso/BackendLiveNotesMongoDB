"use strict";

import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import * as X from "../controller/movimiento.controllers.js";

const router = Router();

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

router.get("/movimiento",  X.getMovimientos);

router.get(
    "/movimiento/:id",
    
    param("id").isMongoId(),
    validate,
    X.getMovimiento
);

router.post(
    "/movimiento",
    
    body("name").isString().trim().notEmpty(),
    body("tipo").isBoolean(),
    body("importe").isNumeric(),
    body("cuenta").isMongoId(),
    body("fecha").optional().isISO8601(),
    body("destinatario").optional().isString().trim(),
    body("metodo").optional().isString().trim(),
    validate,
    X.postMovimiento
);

router.put(
    "/movimiento/:id",
    
    param("id").isMongoId(),
    body("name").optional().isString().trim().notEmpty(),
    body("tipo").optional().isBoolean(),
    body("importe").optional().isNumeric(),
    body("cuenta").optional().isMongoId(),
    body("fecha").optional().isISO8601(),
    body("destinatario").optional().isString().trim(),
    body("metodo").optional().isString().trim(),
    validate,
    X.updateMovimiento
);

router.delete(
    "/movimiento/:id",
    
    param("id").isMongoId(),
    validate,
    X.deleteMovimiento
);

export { router as routerMovimientos };

