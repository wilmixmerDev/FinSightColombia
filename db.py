import os
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None
    RealDictCursor = None
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

# Cargamos variables de entorno
load_dotenv()

# MODO SIMULACIÓN - Desactivado para usar Postgres real
MODO_SIMULACION = False
DATOS_SIMULADOS = {
    'noticias': [],
    'datos_mercado': [],
    'predicciones': [],
    'indices_sentimiento': []
}

# Inicializar datos simulados
def _inicializar_datos_simulados():
    """Inicializa datos de ejemplo para simular BD."""
    global DATOS_SIMULADOS
    
    # Generar datos de mercado históricos (últimos 30 días)
    fecha_actual = datetime.now().date()
    valor_base = 4250
    
    for i in range(30, 0, -1):
        fecha = fecha_actual - timedelta(days=i)
        valor = valor_base + random.uniform(-50, 50)
        DATOS_SIMULADOS['datos_mercado'].append({
            'variable': 'TRM',
            'valor': round(valor, 2),
            'fecha': fecha
        })
    
    # Noticias de ejemplo
    noticias_ejemplo = [
        {
            'id': 1,
            'fuente': 'Portafolio',
            'url': 'https://portafolio.co/1',
            'titulo': 'Dólar sube por incertidumbre global',
            'resumen': 'El dólar alcanzó nuevo máximo...',
            'fecha': fecha_actual,
            'sentimiento': 'NEG',
            'puntaje': -0.65,
            'tema': 'TRM'
        },
        {
            'id': 2,
            'fuente': 'La República',
            'url': 'https://larepublica.co/2',
            'titulo': 'Inflación desciende en abril',
            'resumen': 'El IPC mostró mejora...',
            'fecha': fecha_actual,
            'sentimiento': 'POS',
            'puntaje': 0.72,
            'tema': 'Inflación'
        },
        {
            'id': 3,
            'fuente': 'El Tiempo',
            'url': 'https://eltiempo.com/3',
            'titulo': 'BanRep mantiene tasas estables',
            'resumen': 'La junta directiva decidió...',
            'fecha': fecha_actual,
            'sentimiento': 'NEU',
            'puntaje': 0.1,
            'tema': 'Tasas'
        }
    ]
    DATOS_SIMULADOS['noticias'] = noticias_ejemplo
    
    # Predicciones de ejemplo
    DATOS_SIMULADOS['predicciones'] = [
        {'variable': 'TRM', 'prediccion': 'sube', 'confianza': 75.5, 'fecha': fecha_actual},
        {'variable': 'Inflacion', 'prediccion': 'mantiene', 'confianza': 62.0, 'fecha': fecha_actual},
        {'variable': 'Tasas', 'prediccion': 'baja', 'confianza': 71.0, 'fecha': fecha_actual}
    ]
    
    # Índices de sentimiento
    DATOS_SIMULADOS['indices_sentimiento'] = [
        {'tema': 'TRM', 'indice': 0.3, 'volumen': 5, 'fecha': fecha_actual},
        {'tema': 'Inflación', 'indice': 0.5, 'volumen': 3, 'fecha': fecha_actual},
        {'tema': 'Tasas', 'indice': 0.1, 'volumen': 2, 'fecha': fecha_actual}
    ]

_inicializar_datos_simulados()

def obtener_conexion():
    """Establece conexión con la base de datos PostgreSQL."""
    if MODO_SIMULACION:
        return None  # No necesitamos conexión en simulación
    
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        return conn
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        return None

def ejecutar_consulta(query, params=None, es_select=True):
    """Ejecuta una consulta SQL genérica (simulada)."""
    if MODO_SIMULACION:
        return None
    
    conn = obtener_conexion()
    if not conn:
        return None
    
    resultado = None
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if es_select:
                resultado = cur.fetchall()
            else:
                conn.commit()
                resultado = True
    except Exception as e:
        print(f"Error ejecutando consulta: {e}")
        conn.rollback()
    finally:
        conn.close()
    return resultado

# --- Funciones CRUD específicas ---

def guardar_indice_sentimiento(tema, fecha, indice, volumen):
    """Guarda un índice de sentimiento en la BD."""
    sql = """
        INSERT INTO indices_sentimiento (tema, fecha, indice, volumen)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (tema, fecha) DO UPDATE SET
        indice = EXCLUDED.indice, volumen = EXCLUDED.volumen
    """
    return ejecutar_consulta(sql, (tema, fecha, indice, volumen), es_select=False)

def guardar_noticia(datos):
    """Guarda una noticia (simulado)."""
    if MODO_SIMULACION:
        datos['id'] = len(DATOS_SIMULADOS['noticias']) + 1
        DATOS_SIMULADOS['noticias'].append(datos)
        return True
    
    sql = """
    INSERT INTO noticias (fuente, url, titulo, resumen, fecha, categoria, sentimiento, puntaje, tema)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (url) DO NOTHING;
    """
    params = (
        datos['fuente'], datos['url'], datos['titulo'], datos['resumen'],
        datos['fecha'], datos['categoria'], datos['sentimiento'],
        datos['puntaje'], datos['tema']
    )
    return ejecutar_consulta(sql, params, es_select=False)

def guardar_dato_mercado(variable, valor, fecha, fuente):
    """Guarda o actualiza un dato de mercado (simulado)."""
    if MODO_SIMULACION:
        DATOS_SIMULADOS['datos_mercado'].append({
            'variable': variable,
            'valor': valor,
            'fecha': fecha,
            'fuente': fuente
        })
        return True
    
    sql = """
    INSERT INTO datos_mercado (variable, valor, fecha, fuente)
    VALUES (%s, %s, %s, %s)
    ON CONFLICT (variable, fecha) DO UPDATE SET valor = EXCLUDED.valor;
    """
    params = (variable, valor, fecha, fuente)
    return ejecutar_consulta(sql, params, es_select=False)

def guardar_prediccion(variable, prediccion, confianza, fecha, version):
    """Guarda una predicción diaria (simulada)."""
    if MODO_SIMULACION:
        DATOS_SIMULADOS['predicciones'].append({
            'variable': variable,
            'prediccion': prediccion,
            'confianza': confianza,
            'fecha': fecha,
            'version_modelo': version
        })
        return True
    
    sql = """
    INSERT INTO predicciones (variable, prediccion, confianza, fecha, version_modelo)
    VALUES (%s, %s, %s, %s, %s);
    """
    params = (variable, prediccion, confianza, fecha, version)
    return ejecutar_consulta(sql, params, es_select=False)

def obtener_noticias_recientes(limite=50):
    """Retorna las últimas noticias procesadas (simulado)."""
    if MODO_SIMULACION:
        return sorted(
            DATOS_SIMULADOS['noticias'],
            key=lambda x: x['fecha'],
            reverse=True
        )[:limite]
    
    sql = "SELECT * FROM noticias ORDER BY fecha DESC, id DESC LIMIT %s;"
    return ejecutar_consulta(sql, (limite,))

def obtener_datos_historicos(variable, dias=180):
    """Obtiene datos de mercado para el entrenamiento del modelo (simulado)."""
    if MODO_SIMULACION:
        return [
            d for d in DATOS_SIMULADOS['datos_mercado']
            if d['variable'] == variable
        ]
    
    sql = """
    SELECT valor, fecha FROM datos_mercado 
    WHERE variable = %s AND fecha >= CURRENT_DATE - INTERVAL '%s days'
    ORDER BY fecha ASC;
    """
    return ejecutar_consulta(sql, (variable, dias))
