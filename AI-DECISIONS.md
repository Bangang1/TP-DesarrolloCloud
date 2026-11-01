# Registro de decisiones con IA

Este archivo documenta cada vez que usamos una herramienta de IA (Claude Code, Copilot, Cursor, ChatGPT, etc.) para escribir código o tomar decisiones de arquitectura en **Suchus Contract AI**.

Para cada decisión registramos:

- **Pedido:** qué le pedimos a la IA.
- **Propuesta de la IA:** qué devolvió.
- **Corrección / descarte:** qué cambiamos, rechazamos o tuvimos que corregir.
- **Validación:** cómo comprobamos que funciona (tests, pruebas manuales, revisión).
- **Revisión del equipo:** quién del grupo lo revisó. Hasta que alguien lo revise, queda `[ ] Pendiente`.

> Regla del equipo: nada generado por IA se mergea sin pasar el CI y sin que alguien del grupo lo haya leído.

---

## Plantilla

```markdown
### AAAA-MM-DD — Título corto

- **Herramienta:** (ej: Claude Code, Copilot)
- **Pedido:**
- **Propuesta de la IA:**
- **Corrección / descarte:**
- **Validación:**
- **Archivos:**
- **Revisión del equipo:** [ ] Pendiente
```

---

## Sesión 2026-10-08 — Puesta en marcha del sistema

> Reconstruido a partir del resumen de esa sesión (`RESUMEN-SESION.txt`). No se guardaron los prompts textuales.

### 2026-10-08 — Arreglos para que el backend arranque y alinear backend, n8n y frontend

- **Herramienta:** Claude Code
- **Pedido:** hacer funcionar el sistema de punta a punta (backend, n8n y frontend no coincidían entre sí).
- **Propuesta de la IA:**
  - Modelos `KeyDate`, `Risk` y `Message` heredaban de `pydantic.Field` (una función) → pasar a `BaseModel`.
  - Endpoints `/api/contratos` completos (alta, listado, detalle, borrado) con login obligatorio; el dueño del contrato se toma del token y no del body.
  - Validar que la URL del PDF sea del propio usuario dentro del contenedor de Azure; n8n descarga con una URL SAS de lectura de 1 hora (el contenedor puede ser privado).
  - Login de Supabase: verificar con las claves públicas (JWKS, ES256) además del legacy HS256.
  - Workflow de n8n reescrito: URL y campos alineados con el backend, descarga desde Azure (antes S3), paso de extracción de texto del PDF.
  - Frontend: nombres de funciones de `api.ts` alineados, `middleware.ts` → `proxy.ts` (Next.js 16), errores de ESLint.
  - `gpt-4o` → `gpt-4o-mini` para bajar costos.
- **Corrección / descarte:** se detectó que `.gitignore` ignoraba `frontend/src/lib` por una regla `lib/` y se corrigió.
- **Validación:** pruebas manuales del backend (`/health`, 401 sin token), endpoints con base simulada, 8 casos de tokens, validación de URLs, build del frontend. **No** se probó el flujo completo por falta de API key de OpenAI.
- **Revisión del equipo:** [ ] Pendiente

---

## Sesión 2026-10-31 — Pendientes técnicos, CI y tests

Herramienta en todas las entradas: **Claude Code**. Se trabajó sobre la lista "Qué falta hacer" del resumen anterior.

### 2026-10-31 — Archivos de configuración local (`.env`)

- **Pedido:** dejar el proyecto listo para levantar en una PC nueva (los `.env` no están en el repo).
- **Propuesta de la IA:** crear `.env`, `backend-info/.env` y `frontend/.env.local` generando al azar la contraseña de MongoDB y los secretos internos, y marcar con `COMPLETAR` las claves externas (Supabase, Azure, OpenAI). Agregar `frontend/.env.local.example`, que el README mencionaba pero no existía.
- **Corrección / descarte:** el `.gitignore` del frontend (`.env*`) ignoraba también la plantilla; se agregó la excepción `!.env.local.example`.
- **Validación:** `git status` confirma que los `.env` con secretos siguen ignorados y que la plantilla sí se versiona.
- **Archivos:** `frontend/.env.local.example`, `frontend/.gitignore`
- **Revisión del equipo:** [ ] Pendiente

### 2026-10-31 — `params` asíncrono en rutas dinámicas (Next.js 16)

- **Pedido:** revisar las páginas `contracts/[id]` y `contracts/[id]/chat` (pendiente del resumen anterior).
- **Propuesta de la IA:** en Next.js 16 `params` es una promesa; las páginas leían `params.id` directo, que da `undefined`. Desenvolverla con `use(params)` de React.
- **Corrección / descarte:** se evaluó `useParams()` como alternativa; se eligió `use(params)` por ser la forma documentada para componentes cliente que reciben `params`.
- **Validación:** TypeScript, ESLint y `next build` sin errores. Falta probarlo en el navegador con un usuario real.
- **Archivos:** `frontend/src/app/dashboard/contracts/[id]/page.tsx`, `.../[id]/chat/page.tsx`
- **Revisión del equipo:** [ ] Pendiente

### 2026-10-31 — Vulnerabilidades de `npm audit`

- **Pedido:** resolver las vulnerabilidades que marcaba `npm audit` sin romper nada.
- **Propuesta de la IA:** actualizar Next.js `16.3.6 → 16.4.3` (misma versión mayor; corrige una vulnerabilidad crítica de ejecución remota de código y varias de cache poisoning) y aplicar `npm audit fix` **sin** `--force`.
- **Corrección / descarte:** se **descartó** `npm audit fix --force`: bajaba ESLint a la v4 y `eslint-config-next` a la v12. Quedan 16 vulnerabilidades moderadas de `minimatch` dentro de ESLint (solo herramienta de desarrollo, no se despliega); se aceptan hasta que ESLint publique el arreglo.
- **Validación:** `npm audit --omit=dev` → 0 vulnerabilidades. Build, lint y TypeScript OK. Se revisó el diff del `package-lock.json`: solo los 25 cambios de versión esperados más deduplicación.
- **Archivos:** `frontend/package.json`, `frontend/package-lock.json`
- **Revisión del equipo:** [ ] Pendiente

### 2026-10-31 — Datos de ejemplo fijos en la interfaz

- **Pedido:** buscar mejoras que no dependieran de las claves externas.
- **Propuesta de la IA:** reemplazar textos inventados ("Empresa XYZ", "48 Páginas · 142 Vectores", "RAG v2.4", "Suchus-Legal-v2.1") por datos reales del contrato; hacer funcionar "Exportar Dictamen" con `window.print()` y estilos de impresión; mostrar el mail y el último contrato real en el modal de cierre de sesión.
- **Corrección / descarte:** se sacó la frase "búsqueda semántica vectorial" del chat porque hoy el chat **no** usa embeddings (ver pendiente RAG abajo). No prometer en la interfaz algo que no existe.
- **Validación:** build, lint y TypeScript OK. No probado visualmente (falta login).
- **Archivos:** `.../contracts/[id]/page.tsx`, `.../[id]/chat/page.tsx`, `frontend/src/app/dashboard/SignOutModal.tsx`, `frontend/src/app/globals.css`
- **Revisión del equipo:** [ ] Pendiente

### 2026-10-31 — CI con GitHub Actions

- **Pedido:** implementar la integración continua prometida en el One-Pager.
- **Propuesta de la IA:** workflow `ci.yml` con dos jobs en paralelo. Frontend: `npm ci`, ESLint, TypeScript, build y `npm audit` de producción. Backend: Python 3.11 (igual que el Dockerfile), instalación, verificación de que la app importa y `pytest`.
- **Corrección / descarte:** no usa secretos reales; las variables de Supabase son de mentira porque el build solo necesita que existan.
- **Validación:** los mismos pasos se corrieron localmente y pasan. El backend se probó con Python 3.14 (no había 3.11 en la máquina); la confirmación con 3.11 se verá en la pestaña Actions después del primer push.
- **Archivos:** `.github/workflows/ci.yml`
- **Revisión del equipo:** [ ] Pendiente

### 2026-10-31 — Tests del backend y dos fallas encontradas

- **Pedido:** agregar tests automáticos del backend.
- **Propuesta de la IA:** suite con `pytest` + `mongomock-motor` (MongoDB en memoria, sin Docker) que cubre login (ES256/HS256 y rechazos), contratos y aislamiento entre usuarios, validación de URLs de Azure, webhooks de n8n, chat y CORS. 52 tests.
- **Corrección / descarte:** los tests encontraron dos fallas que se corrigieron **después** de ver los tests fallar:
  1. Si `N8N_WEBHOOK_SECRET` estaba vacío, el webhook aceptaba `"secret": ""` → ahora rechaza todo si no hay secret, y compara con `hmac.compare_digest`.
  2. IDs mal formados en chat y webhooks daban error 500 → ahora 404.
  También se reemplazaron `datetime.utcnow()` y la `class Config` de Pydantic (obsoletos).
- **Validación:** 5 tests fallaban antes del arreglo; después, 52/52 en verde y sin warnings.
- **Archivos:** `backend-info/tests/`, `backend-info/pytest.ini`, `backend-info/requirements-dev.txt`, `backend-info/app/routes/webhooks.py`, `backend-info/app/routes/chat.py`, `backend-info/app/models/`, `backend-info/app/core/config.py`
- **Revisión del equipo:** [ ] Pendiente

### 2026-10-31 — CORS configurable por variable de entorno

- **Pedido:** dejar preparado el pendiente "agregar el dominio real en `allow_origins`".
- **Propuesta de la IA:** leer los orígenes de `CORS_ORIGINS` (separados por coma) en vez de tenerlos escritos en `main.py`.
- **Corrección / descarte:** se quitó `https://tu-dominio.vercel.app`, un dominio de ejemplo que quedaba habilitado.
- **Validación:** 3 tests de CORS y prueba contra el backend en Docker (`localhost:3000` permitido).
- **Archivos:** `backend-info/app/core/config.py`, `backend-info/app/main.py`, `backend-info/.env.example`, `DEPLOY.md`
- **Revisión del equipo:** [ ] Pendiente

### 2026-10-31 — Workflow de n8n: secret inválido, errores y respuesta inmediata

- **Pedido:** importar y activar el workflow en el n8n local.
- **Propuesta de la IA:** al probarlo se detectaron tres problemas y se rearmaron las conexiones:
  1. Con secret incorrecto, el workflow notificaba "error" al backend **usando el secret verdadero**: cualquiera con el ID de un contrato podía marcarlo como fallido → ahora el pedido se ignora.
  2. Si fallaba la descarga, la extracción o GPT, nadie avisaba y el contrato quedaba "pendiente" para siempre → esos nodos ahora desvían el error a "Notificar Backend - Error".
  3. n8n respondía al backend recién al terminar el análisis (el backend corta a los 15 s) → ahora responde apenas recibe el pedido.
- **Corrección / descarte:** no se cambió el prompt de análisis ni el modelo.
- **Validación:** prueba contra n8n en Docker con un contrato temporal en MongoDB: secret incorrecto → sigue "pendiente"; PDF inexistente → pasa a "error". El contrato de prueba se borró.
- **Archivos:** `n8n-workflows/contract-analysis.json`
- **Revisión del equipo:** [ ] Pendiente

### 2026-10-31 — Imagen Docker del backend sin secretos

- **Pedido:** revisión general de lo que faltaba.
- **Propuesta de la IA:** no había `.dockerignore`, así que `COPY . .` metía `backend-info/.env` (con todas las claves) dentro de la imagen. Se agregó `.dockerignore` (excluye `.env`, tests y caché), la imagen corre con un usuario sin privilegios (`appuser`) y sin `--reload`. El `--reload` pasa a `docker-compose.yml`, solo para desarrollo.
- **Corrección / descarte:** se mantuvo el montaje de `./backend-info:/app` en docker-compose para que en local siga la recarga automática.
- **Validación:** se reconstruyó la imagen y se listó su contenido (sin `.env` ni `tests/`); el contenedor corre como `appuser`, `/health` responde y conecta a MongoDB.
- **Archivos:** `backend-info/.dockerignore`, `backend-info/Dockerfile`, `docker-compose.yml`
- **Revisión del equipo:** [ ] Pendiente

---

## Pendientes conocidos

- **El chat no es RAG todavía.** El One-Pager promete búsqueda semántica con citas de cláusula y página. Hoy el chat envía a GPT el análisis + los primeros 8.000 caracteres del contrato, sin embeddings. Queda para cuando se pueda probar con claves reales.
- **Flujo completo sin probar** (login → subida → análisis → chat): faltan las claves de Supabase, Azure y OpenAI.
- **Rotar el legacy JWT secret de Supabase** (se compartió por chat en la sesión anterior).
