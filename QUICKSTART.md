# ⚡ FinSight Colombia - MVP Quick Start

## ✨ ¿Qué es el MVP?

Un **Minimum Viable Product** funcional que integra:
- ✅ API REST completa (FastAPI)
- ✅ Análisis de sentimiento (NLP)
- ✅ Modelo ML para predicciones
- ✅ Dashboard React en tiempo real
- ✅ Base de datos PostgreSQL

---

## 📋 Requisitos

```
✓ Python 3.11 o superior
✓ PostgreSQL 12+
✓ Node.js 18+
✓ Git
```

---

## 🚀 Setup en 5 Minutos

### Paso 1: Verificar Dependencias

```bash
python test_mvp.py
```

Si todo está verde ✅, continúa. Si no, instala lo faltante:

```bash
pip install -r requirements.txt
```

### Paso 2: Configurar Base de Datos

```bash
# Editar .env con tus credenciales PostgreSQL
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=tu_password

# Ejecutar setup
python setup.py
```

Esto:
- ✓ Crea la BD `finsight_colombia`
- ✓ Crea todas las tablas
- ✓ Carga datos históricos de yfinance
- ✓ Inserta datos de ejemplo
- ✓ Entrena modelos iniciales

### Paso 3: Iniciar Backend (Terminal 1)

```bash
python main.py
```

Verás:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Prueba la API: http://localhost:8000/docs

### Paso 4: Iniciar Frontend (Terminal 2)

```bash
cd views
npm install
npm run dev
```

Verás:
```
VITE v4.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Paso 5: Abrir Dashboard

Abre en tu navegador:
```
http://localhost:5173
```

🎉 ¡Listo!

---

## 🧪 Probar la API

### Predicción de Hoy (TRM)
```bash
curl http://localhost:8000/prediccion/hoy?variable=TRM
```

Respuesta:
```json
{
  "variable": "TRM",
  "prediccion": "sube",
  "confianza": 75.5,
  "fecha": "2025-05-06",
  "sentimiento_actual": 0.45
}
```

### Datos de Mercado
```bash
curl http://localhost:8000/mercado/tendencia?variable=TRM
```

### Noticias Recientes
```bash
curl http://localhost:8000/noticias/recientes?limite=5
```

---

## 📚 Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `main.py` | Servidor FastAPI |
| `setup.py` | Inicialización de BD |
| `nlp.py` | Análisis de sentimiento |
| `modelo.py` | Modelo de predicciones |
| `test_mvp.py` | Suite de tests |
| `views/src/App.jsx` | Dashboard React |

---

## 🛠️ Troubleshooting

### Error: "Module not found: psycopg2"
```bash
pip install psycopg2-binary
```

### Error: "Connection refused" (PostgreSQL)
Verifica que PostgreSQL esté corriendo:
- Windows: Services → PostgreSQL → Start
- Mac: `brew services start postgresql`
- Linux: `sudo systemctl start postgresql`

### Error: "Port 8000 already in use"
```bash
python main.py --port 8001
```

### Error: "Port 5173 already in use"
```bash
cd views && npm run dev -- --port 5174
```

---

## 📊 Próximas Mejoras

1. **Scraping Automático**
   - Implementar scrapers para Portafolio, La República, El Tiempo
   - Ejecutar cada 6 horas

2. **Notificaciones**
   - Email cuando confianza > 80%
   - Webhooks para trading bots

3. **Dashboard Avanzado**
   - Más gráficos y estadísticas
   - Exportación a PDF
   - Comparativo de modelos

4. **API Publica**
   - Deploy en AWS/Google Cloud
   - Rate limiting
   - Autenticación OAuth2

---

## 📞 Soporte

Si algo no funciona:

1. Revisa `test_mvp.py` para validar setup
2. Verifica logs de FastAPI (`http://localhost:8000/docs`)
3. Revisa consola del React (`F12` → Console)
4. Abre un issue en GitHub

---

**¡Disfruta tu MVP! 🚀**
