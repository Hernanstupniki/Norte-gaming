# Norte Gaming Backend

Backend ecommerce completo para Norte Gaming, construido con NestJS + Prisma + PostgreSQL + JWT + Swagger.

## Stack

- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- JWT (access + refresh)
- Swagger (`/docs`)
- Docker + Docker Compose

## Funcionalidades incluidas

- Auth: registro, login, refresh, logout, me, cambio y reseteo de password.
- Usuarios: perfil propio y endpoints admin.
- Catalogo: marcas, categorias y productos (publico + admin).
- Carrito: agregar/editar/eliminar items y vaciado.
- Wishlist: toggle de favoritos.
- Direcciones: CRUD por usuario y direccion primaria.
- Envio: metodos de envio administrables.
- Cupones: CRUD admin + validacion y uso en checkout.
- Ordenes: checkout desde carrito, descuento, stock, historial, gestion admin.
- Pagos: creacion y actualizacion de estado (preparado para pasarela externa).
- Resenas: CRUD usuario + moderacion admin.
- Contacto: formulario publico + seguimiento admin.

## Variables de entorno

Copiar `.env.example` a `.env` y ajustar:

```bash
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/norte_gaming?schema=public
JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nortegamingba@gmail.com
SMTP_PASS=app_password_de_gmail
CONTACT_RECEIVER_EMAIL=nortegamingba@gmail.com
```

## Instalacion local

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start:dev
```

API base URL: `http://localhost:4000/api`

Swagger: `http://localhost:4000/docs`

## Docker

```bash
docker compose up --build
```

## Scripts utiles

```bash
npm run start:dev
npm run build
npm run start:prod
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
```

## Seed

El seed crea:

- Usuario admin: `admin@nortegaming.com` / `Admin123*`
- Marcas y categorias base
- Productos demo con imagenes y specs
- Metodos de envio
- Cupon `NORTE10`

## Notas

- Todos los endpoints excepto los marcados como publicos requieren JWT Bearer.
- El backend aplica validacion global (`ValidationPipe`) y mapea errores comunes de Prisma.
- Roles soportados: `ADMIN`, `CLIENT`.
