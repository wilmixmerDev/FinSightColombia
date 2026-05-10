"""
api/rutas/noticias.py — Ruta FastAPI para el endpoint GET /noticias.
Permite filtrar por fuente, tema y rango de fechas.
"""
from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import db

router = APIRouter(prefix="/noticias", tags=["noticias"])

@router.get("/recientes")
async def obtener_noticias_recientes(
    limite: int = Query(20, ge=1, le=100),
    tema: str = Query(None, description="TRM, Inflación, o Tasas"),
    sentimiento: str = Query(None, description="POS, NEG, NEU")
):
    """
    Retorna las noticias más recientes procesadas.
    
    Ejemplo: GET /noticias/recientes?limite=20&tema=TRM&sentimiento=POS
    """
    try:
        noticias = db.obtener_noticias_recientes(limite)
        
        if not noticias:
            return {
                "total": 0,
                "noticias": [],
                "modo": "simulacion"
            }
        
        # Filtrar por tema si se especifica
        if tema:
            noticias = [n for n in noticias if n.get('tema') == tema]
        
        # Filtrar por sentimiento si se especifica
        if sentimiento:
            noticias = [n for n in noticias if n.get('sentimiento') == sentimiento]
        
        return {
            "total": len(noticias),
            "noticias": [
                {
                    "id": n.get('id', 0),
                    "fuente": n.get('fuente', 'Desconocida'),
                    "titulo": n.get('titulo', 'Sin título'),
                    "resumen": n.get('resumen', ''),
                    "url": n.get('url', ''),
                    "fecha": str(n.get('fecha', datetime.now().date())),
                    "sentimiento": n.get('sentimiento', 'NEU'),
                    "puntaje": round(n.get('puntaje', 0), 2),
                    "tema": n.get('tema', None)
                }
                for n in noticias[:limite]
            ],
            "modo": "simulacion"
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/por-tema")
async def obtener_noticias_por_tema(tema: str = Query("TRM"), dias: int = Query(7)):
    """
    Agrupa noticias por tema con resumen de sentimiento.
    
    Retorna estadísticas de noticias por tema.
    """
    try:
        noticias = db.obtener_noticias_recientes(100)
        
        if not noticias:
            return {"tema": tema, "total": 0}
        
        # Filtrar por tema
        noticias_tema = [n for n in noticias if n.get('tema') == tema]
        
        if not noticias_tema:
            return {"tema": tema, "total": 0}
        
        # Contar sentimientos
        positivas = sum(1 for n in noticias_tema if n.get('sentimiento') == 'POS')
        negativas = sum(1 for n in noticias_tema if n.get('sentimiento') == 'NEG')
        neutrales = sum(1 for n in noticias_tema if n.get('sentimiento') == 'NEU')
        
        puntajes = [n.get('puntaje', 0) for n in noticias_tema]
        puntaje_promedio = sum(puntajes) / len(puntajes) if puntajes else 0
        
        sentimientos_count = [
            ("positivo", positivas),
            ("negativo", negativas),
            ("neutro", neutrales)
        ]
        dominante = max(sentimientos_count, key=lambda x: x[1])[0]
        
        return {
            "tema": tema,
            "periodo_dias": dias,
            "total": len(noticias_tema),
            "positivas": positivas,
            "negativas": negativas,
            "neutrales": neutrales,
            "puntaje_promedio": round(puntaje_promedio, 2),
            "sentimiento_dominante": dominante,
            "modo": "simulacion"
        }
    except Exception as e:
        return {"error": str(e)}

@router.get("/estadisticas")
async def obtener_estadisticas_noticias(dias: int = Query(30)):
    """
    Retorna estadísticas generales de noticias.
    
    Retorna resumen de noticias procesadas.
    """
    try:
        noticias = db.obtener_noticias_recientes(1000)
        
        if not noticias:
            return {"error": "Sin datos"}
        
        # Contar fuentes únicas
        fuentes = set(n.get('fuente') for n in noticias if n.get('fuente'))
        temas = set(n.get('tema') for n in noticias if n.get('tema'))
        
        # Distribución por tema
        distribucion_temas = []
        for tema in temas:
            cantidad = sum(1 for n in noticias if n.get('tema') == tema)
            distribucion_temas.append({"tema": tema, "cantidad": cantidad})
        
        # Fuentes principales
        fuentes_count = {}
        for n in noticias:
            fuente = n.get('fuente', 'Desconocida')
            fuentes_count[fuente] = fuentes_count.get(fuente, 0) + 1
        
        fuentes_principales = [
            {"fuente": f, "cantidad": c}
            for f, c in sorted(fuentes_count.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        
        fecha_inicio = min(
            (n.get('fecha') for n in noticias if n.get('fecha')),
            default=datetime.now().date()
        )
        fecha_fin = max(
            (n.get('fecha') for n in noticias if n.get('fecha')),
            default=datetime.now().date()
        )
        
        return {
            "periodo_dias": dias,
            "total_noticias": len(noticias),
            "fuentes_unicas": len(fuentes),
            "temas_cubiertos": len(temas),
            "rango_fechas": {
                "inicio": str(fecha_inicio),
                "fin": str(fecha_fin)
            },
            "distribucion_temas": distribucion_temas,
            "fuentes_principales": fuentes_principales,
            "modo": "simulacion"
        }
    except Exception as e:
        return {"error": str(e)}
