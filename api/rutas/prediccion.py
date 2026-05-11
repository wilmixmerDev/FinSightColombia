from fastapi import APIRouter
from db import ejecutar_consulta

router = APIRouter(prefix="/prediccion", tags=["prediccion"])

@router.get("/actual")
def obtener_prediccion_actual():
    """Retorna la última predicción generada por el modelo."""
    sql = "SELECT * FROM predicciones ORDER BY id DESC LIMIT 3"
    return ejecutar_consulta(sql)

@router.get("/historico")
def obtener_historico_predicciones():
    """Retorna el comparativo entre predicciones y valores reales."""
    sql = "SELECT * FROM comparativo ORDER BY fecha DESC LIMIT 10"
    return ejecutar_consulta(sql)
