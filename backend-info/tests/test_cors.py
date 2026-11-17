"""CORS: solo los dominios de CORS_ORIGINS pueden llamar al backend desde el navegador."""

from app.core.config import Settings


def test_parsea_la_lista_de_origenes():
    s = Settings(cors_origins=" http://localhost:3000 , https://suchus.vercel.app/ ,")
    assert s.cors_origins_list == ["http://localhost:3000", "https://suchus.vercel.app"]


async def test_permite_el_frontend_local(client):
    r = await client.options("/health", headers={
        "Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET",
    })
    assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"


async def test_rechaza_otros_origenes(client):
    r = await client.options("/health", headers={
        "Origin": "https://sitio-malicioso.com", "Access-Control-Request-Method": "GET",
    })
    assert "access-control-allow-origin" not in r.headers
