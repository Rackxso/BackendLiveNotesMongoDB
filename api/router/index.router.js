import { Router } from "express";
import { routerCuentas } from "./cuenta.router.js";
import { routerMovimientos } from "./movimiento.router.js";
import { routerUser } from "./user.router.js";

const router = Router();

router.use(routerCuentas);
router.use(routerMovimientos);
router.use(routerUser);

export { router as apiRouter };

