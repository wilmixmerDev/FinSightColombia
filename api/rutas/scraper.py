import threading
from fastapi import APIRouter
from seed_trm import obtener_trm_banrep, generar_trm_aproximada
from extraccion.portafolio import RaspadorPortafolio
from extraccion.larepublica import RaspadorLaRepublica
from extraccion.eltiempo import RaspadorElTiempo
from extraccion.semana import RaspadorSemana
from extraccion.dinero import RaspadorDinero
from indices import calcular_indice_diario
from modelo import ModeloMercado
from db import ejecutar_consulta

router = APIRouter(prefix="/scraper", tags=["scraper"])

scraper_logs = []
scraper_running = False

def log(msg):
    scraper_logs.append(msg)
    print(msg)

@router.post("/seed-trm")
def seed_trm_historico(dias: int = 90):
    """Pobla datos_mercado con TRM histórica del BanRep. Seguro ejecutar varias veces."""
    import requests
    from datetime import date, timedelta
    results = {"insertados": 0, "fuente": "", "error": None}
    try:
        fecha_ini = date.today() - timedelta(days=dias)
        api = (
            f"https://www.datos.gov.co/resource/32sa-8pi3.json"
            f"?$where=vigenciadesde>='{fecha_ini.isoformat()}'"
            f"&$order=vigenciadesde DESC&$limit=500"
        )
        r = requests.get(api, timeout=20)
        datos = {}
        if r.status_code == 200:
            for row in r.json():
                try:
                    f = row['vigenciadesde'][:10]
                    v = float(row['valor'])
                    datos[f] = v
                except Exception:
                    continue
            results["fuente"] = "datos.gov.co (BanRep)"
        
        # Fallback si no llegaron datos
        if len(datos) < 5:
            import random
            val = 4200.0
            hoy = date.today()
            for i in range(dias, -1, -1):
                fd = hoy - timedelta(days=i)
                if fd.weekday() < 5:
                    val = max(3800, min(4600, val + random.gauss(0, 14)))
                    datos[str(fd)] = round(val, 2)
            results["fuente"] = "Generación aproximada (API no disponible)"

        for fecha_str, valor in datos.items():
            ejecutar_consulta(
                "INSERT INTO datos_mercado (variable, valor, fecha, fuente) VALUES (%s,%s,%s,%s) ON CONFLICT (variable,fecha) DO UPDATE SET valor=EXCLUDED.valor",
                ('TRM', valor, fecha_str, results["fuente"]),
                es_select=False
            )
            results["insertados"] += 1
    except Exception as e:
        results["error"] = str(e)

    return results


def _run_scraper_sync():
    """Ejecuta el flujo completo en un hilo separado."""
    global scraper_running
    scraper_running = True
    scraper_logs.clear()

    log("=== INICIANDO PROCESO DE ACTUALIZACION ===")

    # 1. Mercado
    log("[1/5] Descargando datos de mercado TRM...")
    try:
        from datetime import date, timedelta
        fecha_ini = date.today() - timedelta(days=7)
        datos = obtener_trm_banrep(fecha_ini, date.today())
        if len(datos) < 2:
            datos = generar_trm_aproximada(7)
        for fecha, valor in datos.items():
            ejecutar_consulta(
                "INSERT INTO datos_mercado (variable, valor, fecha, fuente) VALUES (%s,%s,%s,%s) ON CONFLICT (variable,fecha) DO UPDATE SET valor=EXCLUDED.valor",
                ('TRM', valor, str(fecha), 'BanRep / datos.gov.co'),
                es_select=False
            )
        log(f"  OK: {len(datos)} días de TRM actualizados")
    except Exception as e:
        log(f"  X Error en datos de mercado: {e}")

    # 2. Scraping con requests + BeautifulSoup (ya NO usa Playwright)
    log("[2/5] Iniciando extracción de noticias...")
    scrapers = [
        RaspadorPortafolio(),
        RaspadorLaRepublica(),
        RaspadorElTiempo(),
        RaspadorSemana(),
        RaspadorDinero()
    ]

    total_noticias = 0
    for s in scrapers:
        try:
            log(f"  → {s.fuente}: Extrayendo...")
            s.extraer_noticias()
            sql = "SELECT COUNT(*) FROM noticias WHERE fuente = %s AND fecha = CURRENT_DATE"
            res = ejecutar_consulta(sql, (s.fuente,))
            count = res[0]['count'] if res else 0
            total_noticias += count
            log(f"  ✓ {s.fuente}: {count} noticias capturadas")
        except Exception as e:
            log(f"  ✗ {s.fuente}: Error - {e}")

    log(f"  Total noticias extraídas: {total_noticias}")

    # 3. NLP (sentimiento ya se calcula durante el scraping, pero recalculamos índice)
    log("[3/5] Calculando índice de sentimiento...")
    try:
        calcular_indice_diario()
        log("  ✓ Índice de sentimiento calculado")
    except Exception as e:
        log(f"  ✗ Error en índices: {e}")

    # 4. Modelo
    log("[4/5] Entrenando modelo predictivo...")
    try:
        modelo = ModeloMercado('TRM')
        modelo.entrenar()

        sql_hoy = "SELECT puntaje, sentimiento FROM noticias WHERE fecha = CURRENT_DATE"
        noticias_hoy = ejecutar_consulta(sql_hoy)

        if noticias_hoy:
            pred, prob = modelo.predecir_con_noticias(noticias_hoy)
            log(f"  ✓ Predicción TRM: {pred.upper()} ({prob:.0%})")

            from datetime import datetime
            guardar_pred_sql = """
                INSERT INTO predicciones (variable, prediccion, confianza, fecha, version_modelo)
                VALUES ('TRM', %s, %s, CURRENT_DATE, 'RF_v2')
                ON CONFLICT DO NOTHING
            """
            ejecutar_consulta(guardar_pred_sql, (pred, prob), es_select=False)

            update_sql = """
                UPDATE noticias SET probabilidad_direccion = %s
                WHERE fecha = CURRENT_DATE AND probabilidad_direccion IS NULL
            """
            ejecutar_consulta(update_sql, (pred,), es_select=False)
            log(f"  ✓ Dirección '{pred}' asignada a noticias de hoy")
        else:
            log("  ⚠ Sin noticias de hoy para predicción")
    except Exception as e:
        log(f"  ✗ Error en modelo: {e}")

    # 5. Resumen
    log("[5/5] Resumen final:")
    sql_resumen = "SELECT COUNT(*) FROM noticias WHERE fecha = CURRENT_DATE"
    res = ejecutar_consulta(sql_resumen)
    n = res[0]['count'] if res else 0
    log(f"  Noticias procesadas hoy: {n}")

    sql_pred = "SELECT prediccion, confianza FROM predicciones WHERE fecha = CURRENT_DATE AND variable = 'TRM' ORDER BY id DESC LIMIT 1"
    pred_res = ejecutar_consulta(sql_pred)
    if pred_res:
        log(f"  Predicción TRM: {pred_res[0]['prediccion'].upper()} ({pred_res[0]['confianza']:.0%})")

    log("=== PROCESO COMPLETADO ===")
    scraper_running = False

@router.post("/ejecutar")
async def ejecutar_scraper():
    """Lanza el scraping en un hilo separado para no bloquear FastAPI."""
    scraper_logs.clear()
    t = threading.Thread(target=_run_scraper_sync, daemon=True)
    t.start()
    return {"status": "iniciado", "mensaje": "Proceso iniciado."}

@router.get("/logs")
async def obtener_logs():
    return {"logs": scraper_logs, "running": scraper_running}


@router.get("/estado")
def consultar_estado():
    sql = "SELECT COUNT(*) FROM noticias WHERE fecha = CURRENT_DATE"
    res = ejecutar_consulta(sql)
    return {"noticias_hoy": res[0]['count'] if res else 0, "running": scraper_running}

@router.post("/seed")
async def seed_datos():
    from datetime import datetime, timedelta
    import random
    from db import guardar_dato_mercado, guardar_indice_sentimiento, ejecutar_consulta

    fecha_fin = datetime.now().date()
    trm_base = 3900.0

    # Generar 60 días de mercado e índices
    for i in range(60, 0, -1):
        fecha = fecha_fin - timedelta(days=i)
        volatilidad = random.uniform(-30, 35)
        trm_base += volatilidad
        guardar_dato_mercado('TRM', round(trm_base, 2), fecha, 'Histórico Generado')
        sentimiento = (1 if volatilidad > 0 else -1) * random.uniform(0.1, 0.7)
        guardar_indice_sentimiento('TRM', fecha, round(sentimiento, 2), random.randint(5, 15))

    # Generar noticias para HOY para que se vea el panel de explicabilidad
    noticias_test = [
        ("La economía crece un 4% superando expectativas", "Portafolio", "POS"),
        ("Inversión extranjera récord en el sector energético", "La República", "POS"),
        ("Nuevos acuerdos comerciales impulsan el peso", "El Tiempo", "POS"),
        ("Preocupación por inflación en alimentos", "Semana", "NEG"),
        ("Déficit fiscal aumenta más de lo previsto", "Portafolio", "NEG"),
        ("Incertidumbre por reformas en el congreso", "La República", "NEG"),
    ]
    
    sql_news = "INSERT INTO noticias (titulo, fuente, sentimiento, fecha, url) VALUES (%s, %s, %s, CURRENT_DATE, %s)"
    for tit, fue, sent in noticias_test:
        ejecutar_consulta(sql_news, (tit, fue, sent, "https://google.com"), es_select=False)

    return {"status": "completado", "mensaje": "Datos y noticias de prueba generados."}

@router.post("/limpiar")
def limpiar_base_datos():
    """Limpia noticias, predicciones e índices. NO toca datos_mercado (TRM histórica), ni usuarios."""
    tablas = ['noticias', 'predicciones', 'indices_sentimiento']
    for tabla in tablas:
        try:
            ejecutar_consulta(f"DELETE FROM {tabla}", es_select=False)
        except Exception as e:
            print(f"Error limpiando {tabla}: {e}")
    return {
        "status": "limpiado",
        "mensaje": "Noticias, predicciones e índices eliminados. TRM histórica y usuarios intactos."
    }
