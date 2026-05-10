"""
api/rutas/mercado.py — Ruta FastAPI para GET /mercado/tendencia
y GET /mercado/historico con evolución histórica por variable.
"""
from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import db
import random

router = APIRouter(prefix="/mercado", tags=["mercado"])

@router.get("/tendencia")
async def obtener_tendencia(variable: str = Query("TRM", description="TRM, Inflacion, o Tasas")):
    """
    Retorna la tendencia actual de una variable de mercado.
    
    Ejemplo: GET /mercado/tendencia?variable=TRM
    """
    try:
        datos = db.obtener_datos_historicos(variable, 2)
        
        if not datos or len(datos) < 1:
            # Generar datos aleatorios de ejemplo
            valor_base = {'TRM': 4250, 'Inflacion': 7.16, 'Tasas': 11.75}
            valor = valor_base.get(variable, 4250) + random.uniform(-50, 50)
            
            return {
                "variable": variable,
                "valor_actual": round(valor, 2),
                "fecha": datetime.now().date(),
                "cambio_24h": round(random.uniform(-50, 50), 2),
                "cambio_porcentaje": round(random.uniform(-2, 2), 2),
                "tendencia": random.choice(['al_alza', 'a_la_baja', 'estable']),
                "modo": "simulacion"
            }
        
        valor_actual = datos[0]['valor']
        fecha_actual = datos[0]['fecha']
        
        cambio_24h = 0
        cambio_porcentaje = 0
        tendencia = "estable"
        
        if len(datos) >= 2:
            valor_anterior = datos[1]['valor']
            cambio_24h = valor_actual - valor_anterior
            cambio_porcentaje = (cambio_24h / valor_anterior * 100) if valor_anterior != 0 else 0
            
            if cambio_24h > 0:
                tendencia = "al_alza"
            elif cambio_24h < 0:
                tendencia = "a_la_baja"
        
        return {
            "variable": variable,
            "valor_actual": round(valor_actual, 2),
            "fecha": fecha_actual,
            "cambio_24h": round(cambio_24h, 2),
            "cambio_porcentaje": round(cambio_porcentaje, 2),
            "tendencia": tendencia,
            "modo": "simulacion"
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/historico")
async def obtener_historico(
    variable: str = Query("TRM", description="TRM, Inflacion, o Tasas"),
    dias: int = Query(30, description="Número de días hacia atrás")
):
    """
    Retorna datos históricos de una variable.
    
    Ejemplo: GET /mercado/historico?variable=TRM&dias=30
    """
    try:
        datos = db.obtener_datos_historicos(variable, dias)
        
        if not datos:
            return {
                "variable": variable,
                "datos": [],
                "mensaje": "Sin datos disponibles",
                "modo": "simulacion"
            }
        
        return {
            "variable": variable,
            "cantidad": len(datos),
            "datos": [
                {
                    "fecha": str(d['fecha']),
                    "valor": round(d['valor'], 2)
                }
                for d in datos
            ],
            "modo": "simulacion"
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/estadisticas")
async def obtener_estadisticas(variable: str = Query("TRM"), dias: int = Query(90)):
    """
    Retorna estadísticas de una variable.
    
    Retorna: min, max, promedio, volatilidad
    """
    try:
        datos = db.obtener_datos_historicos(variable, dias)
        
        if not datos or len(datos) == 0:
            return {"error": "Sin datos suficientes"}
        
        valores = [d['valor'] for d in datos]
        
        import numpy as np
        minimo = min(valores)
        maximo = max(valores)
        promedio = np.mean(valores)
        volatilidad = np.std(valores)
        
        return {
            "variable": variable,
            "periodo_dias": dias,
            "minimo": round(minimo, 2),
            "maximo": round(maximo, 2),
            "promedio": round(promedio, 2),
            "volatilidad": round(volatilidad, 2),
            "modo": "simulacion"
        }
    except Exception as e:
        return {"error": str(e)}
