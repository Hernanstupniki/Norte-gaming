
# Norte Gaming

Monorepo del ecommerce Norte Gaming:

- `backend/`: API NestJS, Prisma y PostgreSQL.
- `frontend/`: aplicación Next.js.
- `dokploy.compose.yml`: definición de producción para Dokploy.

## Calidad

```bash
cd backend
npm ci
npm run lint:check
npm test
npm run build

cd ../frontend
npm ci
npm run lint
npm run build
```

## CI/CD de producción

`nuevabranch` es la única rama que publica imágenes `latest` y despliega.
Los pull requests hacia `main` o `nuevabranch` sólo ejecutan controles de
calidad.

Por cada commit productivo, GitHub Actions:

1. aplica lint obligatorio al TypeScript modificado y valida tests/builds
   completos de backend y frontend;
2. crea como máximo una imagen inmutable por servicio:
   `norte-gaming-api:sha-<commit>` y `norte-gaming-web:sha-<commit>`;
3. comprueba `APP_COMMIT_SHA`, la revisión OCI y el digest;
4. promueve esos mismos manifests a `latest`, sin reconstruirlos;
5. activa Dokploy y espera que API y Web informen el mismo commit.

La identidad del commit se agrega después de las capas de dependencias y
compilación. Por eso un commit vacío cambia la metadata verificable sin
invalidar ni duplicar esas capas pesadas.

Dokploy fuerza el pull únicamente de API y Web. PostgreSQL conserva su
contenedor y el volumen externo `backend_postgres_data`; la VPS no compila las
imágenes.

## Identidad y salud

- API: `https://nortegaming.com/api/health`
- Web: `https://nortegaming.com/health`

Ambas respuestas incluyen `ok`, `status`, `service`, `commit` y `timestamp`.
El pipeline no considera terminado un despliegue hasta que las dos están
saludables y `commit` coincide exactamente con el SHA que lo inició.

## Deuda conocida

El lint global anterior a esta normalización no estaba incluido en CI y tiene
errores heredados. CI no los oculta ni desactiva reglas: bloquea errores en cada
archivo TypeScript nuevo o modificado, mientras tests y builds siguen cubriendo
el árbol completo. La limpieza del baseline global queda como trabajo separado.
