# Checklist rapido para clonar y levantar Norte Gaming

## 1) Requisitos
- Git
- Docker Desktop (encendido)
- Node.js 20+

## 2) Clonar repo
```bash
git clone https://github.com/LautaroYamil/Version-1-Norte-gaming.git
cd Version-1-Norte-gaming
```

## 3) Backend (Docker recomendado)
```bash
cd backend
# crear .env desde .env.example
# PowerShell:
Copy-Item .env.example .env
```

Variables minimas en `.env`:
```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@db:5432/norte_gaming?schema=public
JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Levantar backend + db:
```bash
docker compose up -d --build
```

Verificar backend:
- Swagger: http://localhost:4000/docs
- API: http://localhost:4000/api/products

## 4) Frontend
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```

Verificar frontend:
- http://localhost:3000

## 5) Comandos utiles
Backend logs:
```bash
cd backend
docker compose logs -f api
```

Apagar backend/db:
```bash
cd backend
docker compose down
```

Actualizar proyecto:
```bash
git pull
cd backend
docker compose up -d --build
```
