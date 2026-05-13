"""
Seed de noticias históricas para entrenamiento del modelo predictivo.
Genera 120 noticias etiquetadas con la dirección real del mercado.
"""
import os
import sys
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from db import ejecutar_consulta

TITULARES = {
    'sube': [
        "Dólar sube ante incertidumbre política en Colombia",
        "TRM alcanza máximo del mes por tensiones geopolíticas",
        "Petróleo cae y presiona al alza la TRM colombiana",
        "Inversionistas extranjeros retiran capital de mercados emergentes",
        "Fed mantiene tasas altas y fortalece al dólar globalmente",
        "Déficit fiscal de Colombia genera presión sobre el peso",
        "Exportaciones colombianas caen un 8% en el trimestre",
        "Riesgo país de Colombia sube tras revisión de Moody's",
        "Crisis en sector agrícola impacta la balanza comercial",
        "Banco de la República advierte sobre presiones inflacionarias",
        "Caída del café colombiano afecta ingreso de divisas",
        "Deuda externa de Colombia alcanza nuevo máximo histórico",
        "Conflicto en Medio Oriente eleva precio del crudo y golpea al peso",
        "PIB de Colombia crece menos de lo esperado en el primer trimestre",
        "Mercado reacciona negativamente a reforma tributaria",
        "Fuga de capitales en América Latina presiona monedas locales",
        "China desacelera y reduce compras de commodities colombianos",
        "Tasa de desempleo sube al 11.2% en Colombia",
        "Calificadora baja perspectiva de Colombia a negativa",
        "Inflación de alimentos sigue al alza en principales ciudades",
        "Sector construcción reporta caída del 15% anual",
        "Protestas sociales generan incertidumbre en mercados",
        "Precio del níquel cae afectando exportaciones de Cerrejón",
        "Reservas internacionales de Colombia disminuyen",
        "Peso colombiano entre las monedas más depreciadas de LatAm",
    ],
    'baja': [
        "Petróleo WTI supera los $85 y beneficia la TRM colombiana",
        "BanRep reduce tasa de interés al 9.5% estimulando inversión",
        "Inversión extranjera directa en Colombia crece un 12%",
        "Colombia firma nuevo acuerdo comercial con la Unión Europea",
        "Remesas hacia Colombia alcanzan récord histórico mensual",
        "Superávit comercial sorprende a analistas del mercado",
        "Turismo internacional en Colombia crece 23% interanual",
        "S&P confirma calificación BBB- con perspectiva estable",
        "Exportaciones de café alcanzan mejor precio en 5 años",
        "Ecopetrol reporta utilidades récord en el trimestre",
        "Gobierno anuncia plan de austeridad fiscal de $15 billones",
        "Dólar pierde fuerza global tras datos débiles de empleo en EEUU",
        "Colombia recibe $2.800M en inversión para energías limpias",
        "Producción de petróleo sube a 800 mil barriles diarios",
        "Confianza del consumidor colombiano mejora por tercer mes",
        "Banco Mundial eleva proyección de crecimiento para Colombia",
        "Sector tech colombiano atrae $500M en venture capital",
        "Inflación interanual baja al 5.8% según último dato del DANE",
        "MinHacienda confirma meta fiscal dentro del rango esperado",
        "Bolsa de Colombia cierra con ganancias por tercera semana",
        "Fed señala posible recorte de tasas para el próximo trimestre",
        "Flujo de divisas por servicios digitales crece 40%",
        "Peso colombiano se fortalece tras acuerdo con FMI",
        "Exportaciones no tradicionales crecen un 18%",
        "Panorama positivo para commodities beneficia a Colombia",
    ]
}

FUENTES = ['Portafolio', 'La República', 'El Tiempo', 'Semana', 'Dinero']

def generar_puntaje(direccion):
    if direccion == 'sube':
        return round(random.uniform(-0.85, -0.15), 2)
    else:
        return round(random.uniform(0.15, 0.85), 2)

def sentimiento_de_puntaje(puntaje):
    if puntaje > 0.2: return 'POS'
    elif puntaje < -0.2: return 'NEG'
    return 'NEU'

def run_seed():
    print("Creando tabla noticias_historicas...")
    create_sql = """
    CREATE TABLE IF NOT EXISTS noticias_historicas (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        titulo TEXT NOT NULL,
        fuente VARCHAR(50) NOT NULL,
        sentimiento VARCHAR(20) NOT NULL,
        puntaje FLOAT NOT NULL,
        tema VARCHAR(50) DEFAULT 'TRM',
        probabilidad_direccion VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    ejecutar_consulta(create_sql, es_select=False)
    
    alter_sql = "ALTER TABLE noticias ADD COLUMN IF NOT EXISTS probabilidad_direccion VARCHAR(10);"
    try:
        ejecutar_consulta(alter_sql, es_select=False)
    except:
        pass

    # Limpiar datos anteriores
    ejecutar_consulta("DELETE FROM noticias_historicas", es_select=False)
    print("Tabla limpia. Insertando 120 noticias históricas...")

    fecha_base = datetime.now().date() - timedelta(days=120)
    count = 0

    for i in range(120):
        fecha = fecha_base + timedelta(days=i)
        
        # Decidir dirección del mercado ese día (con algo de patrón)
        if i % 7 in [5, 6]:
            continue  # saltar fines de semana
        
        peso_sube = 0.5 + (0.1 * ((-1) ** (i // 10)))
        direccion = 'sube' if random.random() < peso_sube else 'baja'
        
        # 1-3 noticias por día
        n_noticias = random.randint(1, 3)
        for _ in range(n_noticias):
            titulo = random.choice(TITULARES[direccion])
            fuente = random.choice(FUENTES)
            puntaje = generar_puntaje(direccion)
            sentimiento = sentimiento_de_puntaje(puntaje)

            sql = """
            INSERT INTO noticias_historicas (fecha, titulo, fuente, sentimiento, puntaje, tema, probabilidad_direccion)
            VALUES (%s, %s, %s, %s, %s, 'TRM', %s)
            """
            ejecutar_consulta(sql, (fecha, titulo, fuente, sentimiento, puntaje, direccion), es_select=False)
            count += 1

    print(f"✓ {count} noticias históricas insertadas con dirección de mercado.")
    print("Seed completado.")

if __name__ == '__main__':
    run_seed()
