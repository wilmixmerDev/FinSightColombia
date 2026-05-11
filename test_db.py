import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def verificar_bd():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        tablas = cur.fetchall()
        print("Conexión exitosa.")
        print("Tablas en la base de datos:")
        for t in tablas:
            print(f"- {t[0]}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error de conexión: {e}")

if __name__ == "__main__":
    verificar_bd()
