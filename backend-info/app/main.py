from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import connect_db
from app.routes import contracts, chat, webhooks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Conecta a MongoDB al iniciar y desconecta al cerrar."""
    await connect_db()
    yield


app = FastAPI(
    title="API de Contratos",
    description="Backend para gestion y analisis de contratos con IA",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS para el frontend de Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://tu-dominio.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(contracts.router)
app.include_router(chat.router)
app.include_router(webhooks.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "backend-info"}
