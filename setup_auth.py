import psycopg2
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()
# Ajustamos para evitar errores de versión con bcrypt
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def setup_auth():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD")
        )
        cur = conn.cursor()
        
        # Crear tabla
        cur.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100),
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                rol VARCHAR(20) DEFAULT 'admin',
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Crear usuario admin inicial (opcional)
        email_admin = "admin@finsight.com"
        cur.execute("SELECT id FROM usuarios WHERE email = %s", (email_admin,))
        if not cur.fetchone():
            hash_pass = pwd_context.hash("admin123")
            cur.execute(
                "INSERT INTO usuarios (nombre, email, password_hash) VALUES (%s, %s, %s)",
                ("Administrador", email_admin, hash_pass)
            )
            print(f"Usuario admin creado: {email_admin} / admin123")
        
        conn.commit()
        print("✅ Configuración de usuarios completada.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup_auth()
