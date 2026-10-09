# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Suchus Contract AI": users upload contract PDFs, an n8n workflow analyzes them with an LLM in the background, and users then chat with an LLM about the analyzed contract. Code, comments, docs, and UI text are in Spanish — keep new code consistent.

Three parts:
- `frontend/` — Next.js 16 (App Router, React 19, Tailwind v4), Supabase auth. Has its own `frontend/CLAUDE.md` → `AGENTS.md`: **this Next.js version has breaking changes; read `frontend/node_modules/next/dist/docs/` before writing Next.js code.**
- `backend-info/` — FastAPI + Beanie (async MongoDB ODM via Motor) + OpenAI.
- `n8n-workflows/contract-analysis.json` — exported n8n workflow, imported into n8n by hand.

## Commands

```bash
# Full stack (MongoDB :27017, FastAPI :8000, n8n :5678). backend-info is bind-mounted and runs uvicorn --reload.
docker-compose up -d --build

# Backend standalone (from backend-info/, needs backend-info/.env)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000     # Swagger at /docs, health at /health

# Frontend (from frontend/, needs frontend/.env.local — see .env.local.example)
npm install
npm run dev      # next dev --webpack, port 3000
npm run build
npm run lint     # eslint 9 flat config
```

There are no tests in either project.

## Architecture / data flow

1. **Auth**: Supabase (email + Google OAuth). `frontend/src/proxy.ts` (Next 16 rename of `middleware.ts`) refreshes the session and redirects unauthenticated users away from non-public routes; `app/auth/callback/route.ts` does the OAuth code exchange. Supabase clients live in `frontend/src/lib/supabase/{client,server}.ts`. The frontend sends the Supabase access token as `Authorization: Bearer`; the backend verifies it in `app/core/auth.py` (`verify_supabase_token`, audience `authenticated`): ES256/RS256 tokens against the project's JWKS at `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (cached 10 min, refetched on unknown `kid`), legacy HS256 tokens against `SUPABASE_JWT_SECRET`. This project currently signs with ES256. The backend uses `payload["sub"]` as the user ID.
2. **Upload (direct-to-cloud)**: `components/UploadContract.tsx` calls the server action `src/actions/azure.ts` → `generateUploadUrl()`, which returns a write-only SAS URL (10 min) for Azure Blob Storage (`AZURE_STORAGE_ACCOUNT_NAME/KEY/CONTAINER_NAME`, server-only env vars). The browser PUTs the PDF straight to Azure at `contratos/{userId}/{uuid}.pdf` (PDF only, max 3 MB), then POSTs `{contrato_url, nombre_archivo}` to FastAPI.
3. **Register + trigger**: `POST /api/contratos/analizar` (`routes/contratos.py`, auth required; the owner comes from the token, not the body) rejects any `contrato_url` that isn't `contratos/{user_id}/…` in the configured container (`services/azure_storage.py`), inserts a `Contrato` (`estado="pendiente"`) and a `BackgroundTask` (`services/n8n.py`) POSTs `{secret, contrato_id, contrato_url, usuario_id}`, where `contrato_url` is a 1-hour read SAS URL (the container is private), to `N8N_WEBHOOK_URL` (n8n path `analizar-contrato`). The same router serves list/detail/delete (delete also removes the blob in a background task), mapping Spanish `estado` values to the English `status` values the frontend expects (`pending|processing|completed|error`).
4. **Analysis**: n8n downloads the PDF from `contrato_url`, extracts its text, runs GPT-4o-mini, and calls back to `POST /webhooks/n8n/analysis-complete` (and optionally `/analysis-progress`) on `http://backend-info:8000`. Callbacks are authenticated by a `secret` field in the body matching `N8N_WEBHOOK_SECRET`. On success the backend inserts an `Analysis` document and sets `Contrato.estado="completado"`, `analisis_ia=summary`.
5. **Chat**: `POST /chat/{contrato_id}` (auth required, contract must be owned by user and `completado`, else 404/409) → `services/llm.py` builds a system prompt from the `Analysis` (summary, parties, dates, risks, clauses, first 8000 chars of `raw_text`) plus the last 10 messages of the `ChatSession`, calls `gpt-4o-mini`, and appends both turns to the session.

MongoDB collections (Beanie `Document`s, registered in `app/core/database.py` — new models must be added to `document_models` there): `contratos` (`Contrato`, Spanish field names), `analyses` (`Analysis`), `chat_sessions` (`ChatSession`). Note the naming mismatch: `Contrato` uses `usuario_id`, while `Analysis`/`ChatSession` use `user_id`/`contract_id`.

Settings come from `app/core/config.py` (pydantic-settings, reads `.env`, unknown keys ignored).

## Configuration

Three env files (templates alongside each): root `.env` (only `N8N_WEBHOOK_SECRET`, substituted into the n8n container by docker-compose), `backend-info/.env` (required by docker-compose's `env_file`), and `frontend/.env.local` (Next.js only reads env files inside `frontend/`). `N8N_WEBHOOK_SECRET` must match between root and backend; the `AZURE_STORAGE_*` vars must match between backend and frontend. Browser uploads require a CORS rule on the Azure Storage account (see `DEPLOY.md`).
