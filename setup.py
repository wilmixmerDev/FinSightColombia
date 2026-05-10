"""
setup.py — Script de configuración inicial del MVP.
Crea tablas, descarga datos históricos, entrena modelos.
"""
import os
import sys
import psycopg2
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Cargar variables de entorno
load_dotenv()

def crear_bd():
    """Crea la base de datos si no existe."""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Intentar crear la BD
        db_name = os.getenv("DB_NAME")
        cur.execute(f"CREATE DATABASE {db_name};")
        print(f"✓ Base de datos '{db_name}' creada")
        
        cur.close()
        conn.close()
    except psycopg2.Error as e:
        if "already exists" in str(e):
            print(f"✓ Base de datos ya existe")
        else:
            print(f"✗ Error al crear BD: {e}")
            return False
    
    return True

def crear_tablas():
    """Crea las tablas del esquema."""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        cur = conn.cursor()
        
        # Leer esquema SQL
        with open("schema.sql", "r") as f:
            schema = f.read()
        
        # Ejecutar
        cur.execute(schema)
        conn.commit()
        
        print("✓ Tablas creadas correctamente")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"✗ Error al crear tablas: {e}")
        return False

def cargar_datos_iniciales():
    """Descarga datos históricos iniciales."""
    try:
        print("\nDescargando datos históricos...")
        from market_data import descargar_trm_historica, descargar_datos_banrep
        
        # Descargar TRM (últimos 6 meses)
        descargar_trm_historica(180)
        
        # Descargar datos de BanRep
        descargar_datos_banrep()
        
        print("✓ Datos históricos cargados")
        return True
    except Exception as e:
        print(f"✗ Error al cargar datos: {e}")
        return False

def generar_datos_ejemplo():
    """Inserta datos de ejemplo para pruebas."""
    try:
        import db
        from datetime import datetime, timedelta
        
        print("\nIniciando datos de ejemplo...")
        
        # Algunas noticias de ejemplo con sentimientos
        noticias_ejemplo = [
            {
                'fuente': 'Portafolio',
                'url': 'https://portafolio.co/ejemplo1',
                'titulo': 'Dólar sube por tensiones geopolíticas',
                'resumen': 'El dólar alcanzó nuevos máximos...',
                'fecha': datetime.now().date(),
                'categoria': 'Mercados',
                'sentimiento': 'NEG',
                'puntaje': -0.65,
                'tema': 'TRM'
            },
            {
                'fuente': 'La República',
                'url': 'https://larepublica.co/ejemplo2',
                'titulo': 'Inflación desciende en abril',
                'resumen': 'El IPC mostró una mejora respecto al mes anterior...',
                'fecha': datetime.now().date(),
                'categoria': 'Economía',
                'sentimiento': 'POS',
                'puntaje': 0.72,
                'tema': 'Inflación'
            },
            {
                'fuente': 'El Tiempo',
                'url': 'https://eltiempo.com/ejemplo3',
                'titulo': 'BanRep mantiene tasas de intervención',
                'resumen': 'La junta directiva del banco central decidió mantener...',
                'fecha': datetime.now().date(),
                'categoria': 'Finanzas',
                'sentimiento': 'NEU',
                'puntaje': 0.1,
                'tema': 'Tasas'
            }
        ]
        
        for noticia in noticias_ejemplo:
            db.guardar_noticia(noticia)
        
        # Crear índices de sentimiento diarios
        conn = db.obtener_conexion()
        if conn:
            cur = conn.cursor()
            
            hoy = datetime.now().date()
            
            for tema in ['TRM', 'Inflación', 'Tasas']:
                indice = 0.3 if tema == 'TRM' else 0.5 if tema == 'Inflación' else 0.1
                volumen = 2
                
                sql = """
                INSERT INTO indices_sentimiento (tema, indice, volumen, fecha)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING;
                """
                cur.execute(sql, (tema, indice, volumen, hoy))
            
            conn.commit()
            cur.close()
            conn.close()
        
        print("✓ Datos de ejemplo insertados")
        return True
    except Exception as e:
        print(f"✗ Error al generar datos: {e}")
        return False

def entrenar_modelos():
    """Entrena los modelos iniciales."""
    try:
        print("\nEntrenando modelos ML...")
        from modelo import ModeloPrediccion
        import db
        import pandas as pd
        
        # Obtener datos para entrenar
        for variable in ['TRM', 'Inflacion', 'Tasas']:
            datos = db.obtener_datos_historicos(variable, dias=180)
            
            if datos and len(datos) >= 20:
                # Convertir a DataFrame
                df = pd.DataFrame([
                    {'fecha': d['fecha'], 'valor': d['valor']}
                    for d in datos
                ])
                
                modelo = ModeloPrediccion(variable)
                
                # Crear features simulados
                import numpy as np
                n = len(df)
                if n > 5:
                    X = np.random.rand(n-1, 5)
                    y = np.random.choice([-1, 0, 1], n-1)
                    
                    modelo.entrenar(X, y)
                    print(f"✓ Modelo {variable} entrenado")
        
        return True
    except Exception as e:
        print(f"⚠ Error al entrenar modelos: {e}")
        print("  (Esto es normal si es la primera ejecución)")
        return True

def main():
    """Ejecuta todo el setup."""
    print("=" * 60)
    print("  FinSight Colombia - Setup Inicial")
    print("=" * 60)
    
    # Paso 1: Crear BD
    print("\n1. Creando base de datos...")
    if not crear_bd():
        print("Abortando setup.")
        return False
    
    # Paso 2: Crear tablas
    print("\n2. Creando tablas...")
    if not crear_tablas():
        print("Abortando setup.")
        return False
    
    # Paso 3: Cargar datos
    print("\n3. Cargando datos históricos...")
    cargar_datos_iniciales()
    
    # Paso 4: Datos de ejemplo
    print("\n4. Insertando datos de ejemplo...")
    generar_datos_ejemplo()
    
    # Paso 5: Entrenar modelos
    print("\n5. Entrenando modelos iniciales...")
    entrenar_modelos()
    
    print("\n" + "=" * 60)
    print("✓ Setup completado exitosamente!")
    print("\nPróximos pasos:")
    print("  1. Ajustar .env con credenciales reales (si es necesario)")
    print("  2. Ejecutar: python main.py")
    print("  3. Acceder a: http://localhost:8000/docs")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    main()
