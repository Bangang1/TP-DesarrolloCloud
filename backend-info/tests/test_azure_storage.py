"""Validación de URLs de Azure: solo se aceptan PDFs del propio usuario en nuestro contenedor."""

import pytest

from app.services.azure_storage import blob_pertenece_al_usuario, generar_url_lectura

from .conftest import CONTENEDOR, CUENTA, url_blob

BASE = f"https://{CUENTA}.blob.core.windows.net/{CONTENEDOR}"


def test_acepta_un_pdf_del_usuario():
    assert blob_pertenece_al_usuario(url_blob("user-a"), "user-a")


@pytest.mark.parametrize(
    "url",
    [
        url_blob("user-b"),                                                    # de otro usuario
        f"https://otracuenta.blob.core.windows.net/{CONTENEDOR}/contratos/user-a/x.pdf",  # otra cuenta
        f"https://{CUENTA}.blob.core.windows.net/otro/contratos/user-a/x.pdf",  # otro contenedor
        f"{BASE}/contratos/user-a/../user-b/x.pdf",                            # path traversal
        f"{BASE}/contratos/user-a/x.pdf?sv=2020&sig=abc",                      # con parámetros
        f"{BASE}/contratos/user-a/x.pdf#frag",                                 # con fragmento
        "http://169.254.169.254/latest/meta-data/",                            # dirección interna
        f"{BASE}/contratos/user-a-falso/x.pdf",                                # prefijo parecido
        "no es una url",
    ],
)
def test_rechaza_urls_ajenas_o_peligrosas(url):
    assert not blob_pertenece_al_usuario(url, "user-a")


def test_url_de_lectura_tiene_sas_de_solo_lectura():
    url = generar_url_lectura(url_blob("user-a"))
    assert url.startswith(url_blob("user-a") + "?")
    assert "sp=r&" in url and "sig=" in url


def test_url_de_lectura_rechaza_urls_ajenas():
    with pytest.raises(ValueError):
        generar_url_lectura("https://otracuenta.blob.core.windows.net/x/y.pdf")
