# Guía de Despliegue en VPS (DigitalOcean / Render / Railway)

Esta guía explica cómo desplegar el sistema de Análisis de Contratos en un servidor VPS usando Docker Compose.

## Prerrequisitos

1. Un servidor VPS con Linux (Ubuntu 22.04 recomendado).
2. Docker y Docker Compose instalados.
3. Un dominio configurado apuntando a la IP de tu VPS (opcional pero recomendado para SSL).
4. Proyecto en Supabase (autenticación con email y Google).
5. Cuenta de Azure con una Storage Account y un contenedor privado para los PDFs.
6. Cuenta en OpenAI (para el análisis en n8n y el chat del backend).

## Pasos de Despliegue

### 1. Clonar el Repositorio

Ingresa a tu VPS por SSH y clona el proyecto:

```bash
git clone <URL_DEL_REPOSITORIO>
cd DesarrolloCloud
```

### 2. Configurar Supabase y Azure

**Supabase**
- En *Authentication → Providers* habilitá Email y Google.
- En *Authentication → URL Configuration* agregá `https://tu-dominio/auth/callback` como Redirect URL.
- En *Project Settings → API* copiá la URL, la `anon key` y el *JWT Secret* (lo usa el backend para verificar tokens).

**Azure Blob Storage**
- Creá un contenedor **privado** (por ejemplo `contratos`). El backend genera URLs de lectura temporales (SAS) para n8n, así que no hace falta acceso público.
- En la Storage Account → *Resource sharing (CORS)* → *Blob service* agregá una regla para que el navegador pueda subir los PDFs:
  - Allowed origins: `http://localhost:3000`, `https://tu-dominio`
  - Allowed methods: `PUT`
  - Allowed headers: `x-ms-blob-type,content-type`
- Copiá el nombre de la cuenta y una *Access key*.

### 3. Configurar Variables de Entorno

Hay tres archivos, cada uno con su plantilla:

```bash
cp .env.example .env                                  # docker-compose (secreto de n8n)
cp backend-info/.env.example backend-info/.env        # backend FastAPI
cp frontend/.env.local.example frontend/.env.local    # frontend Next.js
```

- `backend-info/.env`: `SUPABASE_JWT_SECRET`, `OPENAI_API_KEY`, `N8N_WEBHOOK_SECRET` y las tres variables `AZURE_STORAGE_*`. `MONGODB_URL` lo sobrescribe docker-compose.
- `.env` (raíz): `N8N_WEBHOOK_SECRET`, con **el mismo valor** que en `backend-info/.env`.
- `frontend/.env.local`: Supabase, `NEXT_PUBLIC_API_URL` (URL pública del backend, ej. `https://api.tudominio.com`) y las mismas variables `AZURE_STORAGE_*`.

Si el frontend se sirve desde otro dominio, agregalo a `allow_origins` en `backend-info/app/main.py`.

### 4. Iniciar los Servicios Backend (Docker)

El backend de FastAPI, MongoDB y n8n corren juntos con Docker Compose. Desde la raíz del proyecto:

```bash
docker-compose up -d --build
```

Esto levantará:
- **MongoDB** en el puerto `27017`
- **FastAPI** en el puerto `8000`
- **n8n** en el puerto `5678`

### 5. Configurar n8n

1. Accede a n8n en tu navegador: `http://TU_IP:5678` (usuario y contraseña definidos en `docker-compose.yml`).
2. Ve a **Workflows** → **Import from File** e importa `n8n-workflows/contract-analysis.json`.
3. Configura la credencial de **OpenAI** en el nodo "Analizar con GPT-4o".
4. Activa el workflow. Queda escuchando en `http://n8n:5678/webhook/analizar-contrato`, que es el valor por defecto de `N8N_WEBHOOK_URL` en el backend.

n8n no necesita credenciales de Azure: el backend le envía una URL con SAS de lectura válida por 1 hora.

### 6. Frontend (Next.js)

```bash
cd frontend
npm install
npm run build
npm run start # Opcionalmente, usa PM2: pm2 start npm --name "frontend" -- start
```

*(También puedes desplegar el frontend en Vercel conectándolo al repositorio; configurá allí las mismas variables de `frontend/.env.local`.)*

### 7. Proxy Reverso (Opcional - Nginx)

Para producción, se recomienda exponer FastAPI y n8n a través de Nginx con certificados SSL de Let's Encrypt, especialmente si vas a conectar un frontend hospedado en Vercel.

Ejemplo básico de Nginx para FastAPI:

```nginx
server {
    listen 80;
    server_name api.tudominio.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
