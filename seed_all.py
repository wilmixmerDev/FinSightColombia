
import random
from datetime import datetime, timedelta
from db import ejecutar_consulta, guardar_dato_mercado, guardar_indice_sentimiento

def seed():
    print("Iniciando seed completo...")
    fecha_fin = datetime.now().date()
    trm_base = 3900.0

    # 1. Limpiar
    ejecutar_consulta("DELETE FROM noticias", es_select=False)
    ejecutar_consulta("DELETE FROM predicciones", es_select=False)
    ejecutar_consulta("DELETE FROM datos_mercado", es_select=False)
    ejecutar_consulta("DELETE FROM indices_sentimiento", es_select=False)

    # 2. Mercado e índices (60 días)
    for i in range(60, -1, -1):
        fecha = fecha_fin - timedelta(days=i)
        volatilidad = random.uniform(-35, 40)
        trm_base += volatilidad
        guardar_dato_mercado('TRM', round(trm_base, 2), fecha, 'Yahoo Finance')
        
        indice = (1 if volatilidad < 0 else -1) * random.uniform(0.1, 0.8)
        guardar_indice_sentimiento('TRM', fecha, round(indice, 2), random.randint(10, 25))

    # 3. Noticias
    noticias_test = [
        ("La economía crece un 4% superando expectativas", "Portafolio", "POS"),
        ("Inversión extranjera récord en el sector energético", "La República", "POS"),
        ("Nuevos acuerdos comerciales impulsan el peso", "El Tiempo", "POS"),
        ("Preocupación por inflación en alimentos", "Semana", "NEG"),
        ("Déficit fiscal aumenta más de lo previsto", "Portafolio", "NEG"),
        ("Incertidumbre por reformas en el congreso", "La República", "NEG"),
        ("Banco Mundial mejora perspectiva para Colombia", "El Tiempo", "POS"),
        ("Sectores industriales reportan caída en ventas", "Semana", "NEG"),
    ]
    
    sql_news = "INSERT INTO noticias (titulo, fuente, sentimiento, fecha, url, tema) VALUES (%s, %s, %s, %s, %s, 'TRM')"
    for i, (tit, fue, sent) in enumerate(noticias_test):
        # Noticias de hoy y ayer
        fecha = fecha_fin if i < 5 else (fecha_fin - timedelta(days=1))
        ejecutar_consulta(sql_news, (tit, fue, sent, fecha, f"https://google.com/q={i}"), es_select=False)

    # 4. Predicción
    sql_pred = "INSERT INTO predicciones (variable, prediccion, confianza, fecha, version_modelo) VALUES (%s, %s, %s, %s, %s)"
    ejecutar_consulta(sql_pred, ('TRM', 'sube', 82.5, fecha_fin, 'RF_v2'), es_select=False)

    print("Seed completado exitosamente.")

if __name__ == "__main__":
    seed()
