# Suchus Contract AI — Análisis de Contratos con IA

Sistema para subir contratos en PDF, analizarlos automáticamente con IA en segundo plano y luego hacer preguntas sobre el análisis mediante un chat.

## Arquitectura

```
Navegador ──PUT (SAS escritura)──> Azure Blob Storage
    │                                     ▲
    │ JWT Supabase                        │ GET (SAS lectura)
    ▼                                     │
Frontend (Next.js) ──> Backend (FastAPI) ──webhook──> n8n ──> OpenAI
                            │   ▲                      │
                            ▼   └──── resultado ───────┘
                         MongoDB
```

1. El usuario inicia sesión con Supabase (email o Google).
2. El frontend pide un SAS de escritura (Server Action) y sube el PDF directo a Azure Blob Storage.
3. El frontend registra el contrato en FastAPI, que lo guarda en MongoDB y dispara el webhook de n8n con una URL de lectura temporal.
4. n8n descarga el PDF, extrae el texto, lo analiza con GPT-4o-mini y envía el resultado al backend.
5. El usuario consulta el análisis y chatea sobre el contrato.

## Servicios

| Servicio      | Tecnología                  | Puerto local |
|---------------|-----------------------------|--------------|
| Frontend      | Next.js 16 + Supabase Auth  | 3000         |
| Backend Info  | FastAPI + Beanie            | 8000         |
| n8n           | n8n                         | 5678         |
| MongoDB       | MongoDB 7                   | 27017        |
| Archivos      | Azure Blob Storage          | —            |

## Levantar en local

```bash
cp .env.example .env                                  # secreto de n8n
cp backend-info/.env.example backend-info/.env        # backend
cp frontend/.env.local.example frontend/.env.local    # frontend

docker-compose up -d --build   # MongoDB, FastAPI y n8n

cd frontend
npm install
npm run dev
```

Después importá y activá el workflow de n8n (ver [DEPLOY.md](DEPLOY.md), paso 5).

## Estructura

```
/
├── frontend/          # Next.js + Supabase Auth + subida directa a Azure
├── backend-info/      # FastAPI - contratos, chat, webhooks de n8n
├── n8n-workflows/     # Workflow exportado de n8n
├── docs/              # Documentación y diagramas
├── docker-compose.yml
└── README.md
```
