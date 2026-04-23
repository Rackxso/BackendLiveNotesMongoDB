import { Router } from "express";
import { routerMovimientos } from "./movimiento.router.js";
import { routerUser } from "./user.router.js";
import { routerEvents } from "./evento.router.js";
import { routerMetas } from "./meta.router.js";
import { routerCategorias } from './categoria.router.js';
import { routerPresupuestos } from './presupuesto.router.js';
import { routerNotas } from './nota.router.js';
import { routerTodos } from "./todo.router.js";
import { routerStripe } from './stripe.router.js';
import { routerTickets } from './ticket.router.js';


const router = Router();


router.use(routerNotas);
router.use(routerCategorias);
router.use(routerPresupuestos);
router.use(routerMovimientos);
router.use(routerUser);
router.use(routerEvents);
router.use(routerMetas);
router.use(routerTodos);
router.use(routerStripe);
router.use(routerTickets);

export { router as apiRouter };

 