from fastapi import APIRouter
from db import ejecutar_consulta

router = APIRouter(prefix="/mercado", tags=["mercado"])

@router.get("/historico")
def obtener_mercado_historico(variable: str = "TRM", limit: int = 30):
    """Retorna el histórico de valores de mercado (TRM, etc)."""
    sql = "SELECT * FROM datos_mercado WHERE variable = %s ORDER BY fecha DESC LIMIT %s"
    return ejecutar_consulta(sql, (variable, limit))
