from fastapi import APIRouter, BackgroundTasks
import asyncio
from market_data import descargar_trm_historica
from extraccion.portafolio import RaspadorPortafolio
from extraccion.larepublica import RaspadorLaRepublica
from extraccion.eltiempo import RaspadorElTiempo
from extraccion.semana import RaspadorSemana
from extraccion.dinero import RaspadorDinero
from indices import calcular_indice_diario
from modelo import ModeloMercado
from db import ejecutar_consulta

router = APIRouter(prefix="/scraper", tags=["scraper"])

async def tarea_completa_extraccion():
    """Ejecuta todo el flujo: Mercado -> Noticias -> Índices -> Modelo."""
    print("Iniciando proceso de actualización total...")
    
    # 1. Datos de mercado
    descargar_trm_historica(7) # Última semana
    
    # 2. Raspado de noticias (Multifuente)
    scrapers = [
        RaspadorPortafolio(),
        RaspadorLaRepublica(),
        RaspadorElTiempo(),
        RaspadorSemana(),
        RaspadorDinero()
    ]
    
    for s in scrapers:
        try:
            await s.extraer_noticias()
        except Exception as e:
            print(f"Error en raspador {s.fuente}: {e}")
    
    # 3. Procesamiento NLP e Índices
    # (Nota: En un flujo real, el scraper ya debería haber llamado a nlp)
    calcular_indice_diario()
    
    # 4. Re-entrenamiento rápido y Predicción
    modelo = ModeloMercado('TRM')
    modelo.entrenar()
    
    print("Actualización finalizada con éxito.")

@router.post("/ejecutar")
async def ejecutar_scraper(background_tasks: BackgroundTasks):
    """Lanza el proceso de scraping en segundo plano."""
    background_tasks.add_task(tarea_completa_extraccion)
    return {"status": "iniciado", "mensaje": "El proceso de captura y análisis ha comenzado en segundo plano."}

@router.get("/estado")
def consultar_estado():
    """Consulta cuántas noticias se han capturado hoy."""
    sql = "SELECT COUNT(*) FROM noticias WHERE fecha = CURRENT_DATE"
    res = ejecutar_consulta(sql)
    return {"noticias_hoy": res[0]['count'] if res else 0}

@router.post("/seed")
async def seed_datos():
    """Puebla la base de datos con datos históricos sintéticos."""
    from datetime import datetime, timedelta
    import random
    from db import guardar_dato_mercado, guardar_indice_sentimiento
    
    print("Iniciando seeding de datos históricos...")
    fecha_fin = datetime.now().date()
    trm_base = 3900.0
    
    for i in range(60, 0, -1):
        fecha = fecha_fin - timedelta(days=i)
        volatilidad = random.uniform(-30, 35)
        trm_base += volatilidad
        guardar_dato_mercado('TRM', round(trm_base, 2), fecha, 'Histórico Generado')
        
        # Sentimiento correlacionado para que el gráfico se vea bien
        sentimiento = (1 if volatilidad > 0 else -1) * random.uniform(0.1, 0.7)
        guardar_indice_sentimiento('TRM', fecha, round(sentimiento, 2), random.randint(5, 15))
    
    return {"status": "completado", "mensaje": "60 días de historia generados."}
