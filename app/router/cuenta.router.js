"use strict";
import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import * as X from "../controller/cuenta.controllers.js";


const router = Router();

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

router.get("/cuenta",  X.getCuentas);

router.get("/cuenta/:id",
    // 
    // param("id").isMongoId(),
    // validate,
    X.getCuenta);

router.post("/cuenta",
    
    body("name").isString().trim().notEmpty(),
    body("balance").isNumeric(),
    validate,
    X.postCuenta);

router.put("/cuenta/:id",
    
    param("id").isMongoId(),
    body("name").optional().isString().trim().notEmpty(),
    body("balance").optional().isNumeric(),
    validate,
    X.updateCuenta);

router.delete("/cuenta/:id",
    
    param("id").isMongoId(),
    validate,
    X.deleteCuenta);

export { router as routerCuentas };