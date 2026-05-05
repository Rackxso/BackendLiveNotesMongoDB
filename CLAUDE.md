# LiveNotes — Backend API

API REST construida con **Node.js + Express + MongoDB**. Es el backend de la app de productividad personal LiveNotes.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js (ES Modules `"type": "module"`) |
| Framework | Express 4.21 |
| Base de datos | MongoDB 7+ con Mongoose 9 |
| Auth | JWT (access 15 min) + Refresh token (7 días, httpOnly cookie) |
| Pagos | Stripe 22 |
| Email | Resend (primario) / Nodemailer (fallback) |
| Validación | Express-validator 7 |
| Testing | Vitest 4 + Supertest 7 |

## Estructura del proyecto

```
app/
├── server.js          # Punto de entrada: conecta MongoDB, lanza Express
├── app.js             # Configura Express, CORS, middlewares, monta routers
├── config.js          # Carga variables de entorno desde .env
├── data/db.js         # Conexión Mongoose
├── models/            # Esquemas Mongoose (11 modelos)
├── router/            # Definición de rutas (11 archivos)
├── controller/        # Lógica de negocio por dominio (13 archivos)
├── middleware/        # Auth, admin, validación, rate limiting
└── utils/             # JWT helpers, email, templates de email
```

## Modelos de datos

| Modelo | Propósito | Campos clave |
|--------|-----------|-------------|
| `User` | Cuentas de usuario | name, email, password (bcrypt), avatar, permisos, verificado, stripeCustomerId |
| `Nota` | Notas de texto | usuario (ref), titulo, contenido, categoria |
| `Todo` | Listas de tareas | usuario, idLista, texto, completado, prioridad, fechaLimite, subItems (anidados) |
| `Evento` | Eventos polimórficos | userId, date, type (calendar/habit/mood), campos según tipo |
| `Movimiento` | Transacciones financieras | usuario, name, fecha, tipo (expense/income), importe, metodo, metaId, categorias |
| `Meta` | Objetivos de ahorro | usuario, name, meta (objetivo), acumulado, completada, movimientos |
| `Presupuesto` | Presupuestos mensuales | usuario, categoria, limite, acumulado, mes, anio, superado |
| `Categoria` | Categorías de gastos | nombre, icono, color, predefinida, usuario (null si es predefinida) |
| `Habit` | Seguimiento de hábitos | userId, name, icon, rachaActual, rachaMasLarga, ultimoHecho, completionDates |
| `Permiso` | Control de acceso | name, number, precio |
| `Ticket` | Tickets de soporte | usuario, asunto, categoria, descripcion, estado |

## Sistema de permisos

Los permisos son **numéricos** almacenados en `User.permisos`:
- `1` → Plan gratuito (acceso básico)
- `2+` → Plan premium (funcionalidades avanzadas)
- `13579` → Admin (acceso total)

El `adminMiddleware` verifica que `permisos` incluya el número `13579`.

## Endpoints de la API

### Autenticación (`/api/user`)
```
POST   /user/register                  # Registro con verificación de email
POST   /user/login                     # Login → devuelve access token + refresh cookie
POST   /user/logout                    # Invalida refresh token
POST   /user/refresh                   # Refresca access token usando cookie
GET    /user/verificar/:token          # Verifica email
POST   /user/forgot-password           # Solicita reset de contraseña
POST   /user/reset-password/:token     # Aplica nueva contraseña
GET    /user/:email/info               # Datos del usuario
GET    /user/:email/permisos           # Permisos del usuario
PUT    /user/:email                    # Actualizar perfil
POST   /user/upgrade                   # Actualizar a premium
```

### Notas (`/api/notas`)
```
GET    /notas          # Listar notas del usuario
POST   /notas          # Crear nota
PUT    /notas/:id      # Editar nota
DELETE /notas/:id      # Eliminar nota
```

### Categorías (`/api/categoria`)
```
CRUD completo de categorías de gastos (predefinidas o de usuario)
```

### Tareas (`/api/todos`)
```
CRUD completo + reordenación + gestión de subtareas anidadas
```

### Finanzas
```
/api/movimientos   → CRUD de transacciones
/api/meta          → CRUD de objetivos de ahorro
/api/presupuesto   → Gestión de presupuestos mensuales
```

### Calendario y eventos (`/api/events`, `/api/habits`)
```
GET/POST/PUT/DELETE /events/calendar   # Eventos de calendario
GET/POST            /events/mood       # Entradas de estado de ánimo
GET/POST/PATCH/DELETE /habits          # Seguimiento de hábitos
```

### Stripe (`/api/stripe`)
```
POST /stripe/create-checkout-session   # Sesión de pago
POST /stripe/create-portal-session     # Portal de gestión de suscripción
POST /stripe/webhook                   # Webhook de Stripe (sin auth JWT)
POST /stripe/simulate-toggle           # Simular toggle premium (dev)
```

### Soporte (`/api/tickets`)
```
GET/POST       /tickets          # Crear / listar tickets del usuario
GET            /tickets/admin    # Vista admin de todos los tickets
PATCH/DELETE   /tickets/:id      # Gestión admin
```

## Middlewares

- `authMiddleware` — Verifica JWT, con fallback de refresco automático
- `adminMiddleware` — Solo acceso admin (permiso 13579)
- `validateMiddleware` — Integración con express-validator
- `rateMiddleware` — Rate limiting por IP

## Flujo de autenticación

1. Login → genera access token (15 min, en body) + refresh token (7 días, httpOnly cookie)
2. Requests protegidos → `Authorization: Bearer <accessToken>`
3. Access token expirado → cliente llama `POST /user/refresh` con la cookie
4. Logout → invalida el refresh token en BD

## Variables de entorno requeridas

```env
MONGO_URI              # Connection string de MongoDB
JWT_SECRET             # Secreto para access tokens
JWT_REFRESH_SECRET     # Secreto para refresh tokens
STRIPE_SECRET_KEY      # API key de Stripe
STRIPE_WEBHOOK_SECRET  # Signing secret para webhooks de Stripe
STRIPE_PRICE_ID        # ID del precio en Stripe
RESEND_API_KEY         # API key de Resend
EMAIL_FROM             # Email remitente
CLIENT_URL             # URL del frontend (para CORS y links en emails)
PORT                   # Puerto del servidor (default 4000)
```

## Scripts

```bash
npm run dev    # Nodemon con hot reload
npm start      # Producción
npm test       # Vitest (tests de integración con Supertest)
```

## Convenciones del código

- **ES Modules**: usar `import/export`, nunca `require()`
- **Async/await**: toda la lógica asíncrona usa async/await con try/catch
- Los controladores reciben `(req, res)` y gestionan la respuesta directamente
- Los modelos Mongoose usan `{ timestamps: true }` por defecto
- Los errores devuelven `{ message: "..." }` con el status HTTP apropiado
