from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
from db import ejecutar_consulta, obtener_conexion

router = APIRouter(prefix="/auth", tags=["auth"])

# Configuración de seguridad
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600 # 10 horas

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def obtener_usuario_actual(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

def crear_token_acceso(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    sql = "SELECT * FROM usuarios WHERE email = %s"
    usuarios = ejecutar_consulta(sql, (form_data.username,))
    
    if not usuarios:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    
    usuario = usuarios[0]
    # Importante: Comparar con el hash correcto
    if not pwd_context.verify(form_data.password, usuario['password_hash']):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    
    access_token = crear_token_acceso(data={
        "sub": usuario['email'], 
        "rol": usuario['rol'],
        "nombre": usuario['nombre']
    })
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "nombre": usuario['nombre'],
        "rol": usuario['rol']
    }

@router.post("/crear-usuario")
def crear_usuario(nombre: str, email: str, password: str, rol: str = "user", current_user: dict = Depends(obtener_usuario_actual)):
    # VALIDACIÓN: Solo un admin puede crear usuarios
    if current_user.get("rol") != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para crear usuarios")
    
    # Verificar si ya existe
    if ejecutar_consulta("SELECT id FROM usuarios WHERE email = %s", (email,)):
        raise HTTPException(status_code=400, detail="El email ya existe")
    
    hash_pass = pwd_context.hash(password)
    conn = obtener_conexion()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (%s, %s, %s, %s)",
        (nombre, email, hash_pass, rol)
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return {"mensaje": f"Usuario {rol} creado con éxito"}
