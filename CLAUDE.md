# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Proyecto

"Suchus Contract AI": los usuarios suben contratos en PDF, un workflow de n8n los analiza con un LLM en segundo plano y luego los usuarios chatean con un LLM sobre el contrato analizado. El código, los comentarios, la documentación y los textos de la interfaz están en español; mantener el código nuevo en la misma línea.

Tres partes:
- `frontend/`: Next.js 16 (App Router, React 19, Tailwind v4), autenticación con Supabase. Tiene su propio `frontend/CLAUDE.md` → `AGENTS.md`: **esta versión de Next.js tiene cambios incompatibles; leer `frontend/node_modules/next/dist/docs/` antes de escribir código de Next.js.**
- `backend-info/`: FastAPI + Beanie (ODM asíncrono de MongoDB sobre Motor) + OpenAI.
- `n8n-workflows/contract-analysis.json`: workflow exportado de n8n, se importa en n8n (por la interfaz o con `n8n import:workflow`).

## Comandos

```bash
# Stack completo (MongoDB :27017, FastAPI :8000, n8n :5678). backend-info se monta como volumen y corre uvicorn --reload.
docker compose up -d --build

# Importar y publicar el workflow en n8n (luego reiniciar el contenedor de n8n)
docker exec contratos_n8n n8n import:workflow --input=/workflows/contract-analysis.json
docker exec contratos_n8n n8n publish:workflow --id=analizarContrato

# Backend solo (desde backend-info/, necesita backend-info/.env)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000     # Swagger en /docs, health en /health

# Frontend (desde frontend/, necesita frontend/.env.local; ver .env.local.example)
npm install
npm run dev      # next dev --webpack, puerto 3000
npm run build
npm run lint     # eslint 9 (flat config)
```

Ninguno de los dos proyectos tiene tests.

## Arquitectura / flujo de datos

1. **Auth**: Supabase (email + Google OAuth). `frontend/src/proxy.ts` (el `middleware.ts` renombrado en Next 16) refresca la sesión y redirige a los usuarios no autenticados fuera de las rutas no públicas; `app/auth/callback/route.ts` hace el intercambio del código OAuth. Los clientes de Supabase están en `frontend/src/lib/supabase/{client,server}.ts`. El frontend envía el access token de Supabase como `Authorization: Bearer`; el backend lo verifica en `app/core/auth.py` (`verify_supabase_token`, audience `authenticated`): los tokens ES256/RS256 contra el JWKS del proyecto en `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (cacheado 10 min y se vuelve a pedir si llega un `kid` desconocido), y los tokens legacy HS256 contra `SUPABASE_JWT_SECRET`. Este proyecto firma actualmente con ES256. El backend usa `payload["sub"]` como ID de usuario.
2. **Subida (direct-to-cloud)**: `components/UploadContract.tsx` llama al server action `src/actions/azure.ts` → `generateUploadUrl()`, que devuelve una URL SAS de solo escritura (10 min) para Azure Blob Storage (`AZURE_STORAGE_ACCOUNT_NAME/KEY/CONTAINER_NAME`, variables solo de servidor). El navegador hace PUT del PDF directo a Azure en `contratos/{userId}/{uuid}.pdf` (solo PDF, máx. 3 MB) y luego hace POST de `{contrato_url, nombre_archivo}` a FastAPI.
3. **Registro + disparo**: `POST /api/contratos/analizar` (`routes/contratos.py`, requiere auth; el dueño sale del token, no del body) rechaza cualquier `contrato_url` que no sea `contratos/{user_id}/…` dentro del contenedor configurado (`services/azure_storage.py`), inserta un `Contrato` (`estado="pendiente"`) y una `BackgroundTask` (`services/n8n.py`) hace POST de `{secret, contrato_id, contrato_url, usuario_id}` a `N8N_WEBHOOK_URL` (path de n8n `analizar-contrato`); ese `contrato_url` es una URL SAS de lectura válida por 1 hora, porque el contenedor es privado. El mismo router sirve listar/detalle/borrar (borrar también elimina el blob en una tarea en segundo plano) y traduce los valores de `estado` en español a los `status` en inglés que espera el frontend (`pending|processing|completed|error`).
4. **Análisis**: n8n descarga el PDF desde `contrato_url`, extrae el texto, lo pasa a GPT-4o-mini y llama de vuelta a `POST /webhooks/n8n/analysis-complete` (y opcionalmente a `/analysis-progress`) en `http://backend-info:8000`. Los callbacks se autentican con un campo `secret` en el body que debe coincidir con `N8N_WEBHOOK_SECRET`. Si sale bien, el backend inserta un documento `Analysis` y pone `Contrato.estado="completado"` y `analisis_ia=summary`.
5. **Chat**: `POST /chat/{contrato_id}` (requiere auth; el contrato debe ser del usuario y estar `completado`, si no devuelve 404/409) → `services/llm.py` arma un system prompt con el `Analysis` (resumen, partes, fechas, riesgos, cláusulas y los primeros 8000 caracteres de `raw_text`) más los últimos 10 mensajes de la `ChatSession`, llama a `gpt-4o-mini` y agrega ambos turnos a la sesión.

Colecciones de MongoDB (`Document`s de Beanie, registrados en `app/core/database.py`; los modelos nuevos se tienen que agregar a `document_models` ahí): `contratos` (`Contrato`, campos en español), `analyses` (`Analysis`) y `chat_sessions` (`ChatSession`). Ojo con la diferencia de nombres: `Contrato` usa `usuario_id`, mientras que `Analysis`/`ChatSession` usan `user_id`/`contract_id`.

La configuración sale de `app/core/config.py` (pydantic-settings, lee `.env` e ignora claves desconocidas).

## Configuración

Hay tres archivos de entorno (cada uno con su plantilla al lado): el `.env` de la raíz (solo `N8N_WEBHOOK_SECRET`, que docker-compose le pasa al contenedor de n8n), `backend-info/.env` (obligatorio por el `env_file` de docker-compose) y `frontend/.env.local` (Next.js solo lee archivos de entorno dentro de `frontend/`). `N8N_WEBHOOK_SECRET` tiene que coincidir entre la raíz y el backend; las variables `AZURE_STORAGE_*` tienen que coincidir entre backend y frontend. Para que el navegador pueda subir archivos, la Storage Account de Azure necesita una regla CORS (ver `DEPLOY.md`).

## Git

Hacer los commits y push directo a `main`, sin líneas de atribución a Claude (`Co-Authored-By`, "Generated with Claude Code").
