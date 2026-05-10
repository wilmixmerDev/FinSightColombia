"""
main.py — Punto de entrada de la aplicación FastAPI.
Registra todos los routers y arranca el servidor con uvicorn.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.rutas import mercado, prediccion, noticias
import uvicorn

# Crear aplicación FastAPI
app = FastAPI(
    title="FinSight Colombia API",
    description="API para predicciones de indicadores financieros colombianos",
    version="1.0.0 - SIMULACION (sin BD)"
)

# Configurar CORS para permitir el frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
try:
    app.include_router(mercado.router)
    app.include_router(prediccion.router)
    app.include_router(noticias.router)
except Exception as e:
    print(f"⚠️ Aviso al registrar routers: {e}")

@app.get("/")
async def root():
    """Endpoint raíz con información de la API."""
    return {
        "nombre": "FinSight Colombia",
        "version": "1.0.0 - SIMULACION",
        "descripcion": "Predicción de indicadores financieros con IA (SIN BD)",
        "modo": "SIMULACION - Datos en memoria",
        "endpoints": {
            "mercado": "/mercado/tendencia",
            "predicción": "/prediccion/hoy",
            "noticias": "/noticias/recientes",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Verificar salud de la API."""
    return {"status": "ok", "modo": "simulacion"}

if __name__ == "__main__":
    # Ejecutar con: python main.py
    print("\n" + "="*60)
    print("🚀 FinSight Colombia - MVP en SIMULACIÓN")
    print("="*60)
    print("✅ Modo: SIN BASE DE DATOS (datos en memoria)")
    print("📊 API en: http://localhost:8000")
    print("📚 Docs en: http://localhost:8000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
