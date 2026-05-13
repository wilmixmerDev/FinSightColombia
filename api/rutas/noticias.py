from fastapi import APIRouter
from db import ejecutar_consulta

router = APIRouter(prefix="/noticias", tags=["noticias"])

@router.get("/")
def obtener_noticias(limit: int = 10):
    """Retorna las últimas noticias procesadas."""
    sql = "SELECT * FROM noticias ORDER BY id DESC LIMIT %s"
    return ejecutar_consulta(sql, (limit,))


@router.get("/sentimiento-historial")
def obtener_sentimiento_historial(tema: str = "TRM"):
    """Retorna el historial de índices de sentimiento para el gráfico."""
    sql = "SELECT fecha, indice FROM indices_sentimiento WHERE tema = %s ORDER BY fecha ASC LIMIT 30"
    return ejecutar_consulta(sql, (tema,))
