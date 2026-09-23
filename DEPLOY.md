# Guía de Despliegue en VPS (DigitalOcean / Render / Railway)

Esta guía explica cómo desplegar el sistema de Análisis de Contratos en un servidor VPS usando Docker Compose.

## Prerrequisitos

1. Un servidor VPS con Linux (Ubuntu 22.04 recomendado).
2. Docker y Docker Compose instalados.
3. Un dominio configurado apuntando a la IP de tu VPS (opcional pero recomendado para SSL).
4. Cuenta en Clerk (para autenticación).
5. Cuenta en OpenAI (para los nodos de IA en n8n).
6. Cuenta en AWS (para S3).

## Pasos de Despliegue

### 1. Clonar el Repositorio

Ingresa a tu VPS por SSH y clona el proyecto:

```bash
git clone <URL_DEL_REPOSITORIO>
cd DesarrolloCloud
```

### 2. Configurar Variables de Entorno

Copia la plantilla de variables de entorno:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales reales (Clerk, AWS S3, OpenAI):

```bash
nano .env
```

### 3. Configurar el Frontend (Next.js)

El frontend de Next.js necesita construirse para producción.

1. Navega al directorio del frontend: `cd frontend`
2. Configura las variables de entorno para la construcción (Clerk):
   ```bash
   cp .env.local.example .env.local
   nano .env.local
   ```
   Asegúrate de configurar `NEXT_PUBLIC_API_URL` apuntando a tu dominio o IP donde correrá el backend (ej. `https://api.tudominio.com`).
3. Construye e inicia la aplicación Next.js:
   ```bash
   npm install
   npm run build
   npm run start # Opcionalmente, usa PM2 para mantenerlo corriendo: pm2 start npm --name "frontend" -- start
   ```

*(Nota: También puedes desplegar el frontend directamente en Vercel de manera gratuita, conectándolo a tu repositorio de GitHub).*

### 4. Iniciar los Servicios Backend (Docker)

El backend de FastAPI, MongoDB y n8n corren juntos con Docker Compose.

Regresa a la raíz del proyecto y ejecuta:

```bash
docker-compose up -d --build
```

Esto levantará:
- **MongoDB** en el puerto `27017`
- **FastAPI** en el puerto `8000`
- **n8n** en el puerto `5678`

### 5. Configurar n8n

1. Accede a n8n en tu navegador: `http://TU_IP:5678` (usando admin/password u otras credenciales que hayas configurado en el `.env`).
2. Ve a **Workflows** -> **Import from File**.
3. Importa el archivo `n8n-workflows/contract-analysis.json`.
4. Configura las credenciales dentro de n8n para:
   - AWS (para descargar el documento de S3).
   - OpenAI (para procesar el documento).
5. Activa el workflow.

### 6. Configurar el Webhook del Backend

Asegúrate de que la variable `N8N_WEBHOOK_URL` en el `.env` de tu backend apunte correctamente al webhook de producción de n8n.
Si n8n está corriendo en la misma red de Docker, puedes usar: `http://n8n:5678/webhook/analyze-contract`.

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
