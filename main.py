from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.rutas import noticias, prediccion, scraper, auth, mercado
import uvicorn

app = FastAPI(title="FinSight Colombia API", version="1.0.0")

# Configuración de CORS para que el dashboard de React pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción se debe restringir a la URL del dashboard
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de rutas
app.include_router(noticias.router)
app.include_router(prediccion.router)
app.include_router(scraper.router)
app.include_router(auth.router)
app.include_router(mercado.router)

@app.get("/")
def home():
    return {"status": "online", "mensaje": "Bienvenido a FinSight Colombia API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
