import { Router } from "express";
import { routerCuentas } from "./cuenta.router.js";
import { routerMovimientos } from "./movimiento.router.js";
import { routerUser } from "./user.router.js";
import { routerEvents } from "./evento.router.js";
import { routerMetas } from "./meta.router.js";
import { routerCategorias } from './categoria.router.js';
import { routerPresupuestos } from './presupuesto.router.js';
import { routerNotas } from './nota.router.js';
import { routerTodos } from "./todo.router.js";


const router = Router();


router.use(routerNotas);
router.use(routerCategorias);
router.use(routerPresupuestos);
router.use(routerCuentas);
router.use(routerMovimientos);
router.use(routerUser);
router.use(routerEvents);
router.use(routerMetas);
router.use(routerTodos)

export { router as apiRouter };

 