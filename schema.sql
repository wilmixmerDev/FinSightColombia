-- FinSight Colombia - Esquema de Base de Datos
-- Tablas necesarias para el sistema de análisis y predicción

-- 1. Tabla de noticias extraídas
CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,
    fuente VARCHAR(50) NOT NULL,
    url TEXT UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    resumen TEXT,
    fecha DATE NOT NULL,
    categoria VARCHAR(50),
    sentimiento VARCHAR(20), -- positivo, negativo, neutro
    puntaje FLOAT,           -- score de pysentimiento
    tema VARCHAR(50),        -- TRM, Inflación, Tasas
    fecha_extraccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de índices de sentimiento agregados por día
CREATE TABLE IF NOT EXISTS indices_sentimiento (
    id SERIAL PRIMARY KEY,
    tema VARCHAR(50) NOT NULL,
    indice FLOAT NOT NULL,    -- promedio ponderado (-1 a 1)
    volumen INTEGER NOT NULL, -- cantidad de noticias ese día
    fecha DATE NOT NULL,
    UNIQUE(tema, fecha)
);

-- 3. Tabla de datos reales del mercado
CREATE TABLE IF NOT EXISTS datos_mercado (
    id SERIAL PRIMARY KEY,
    variable VARCHAR(50) NOT NULL, -- TRM, Inflacion, Tasas
    valor FLOAT NOT NULL,
    fecha DATE NOT NULL,
    fuente VARCHAR(50),           -- Yahoo Finance, BanRep
    UNIQUE(variable, fecha)
);

-- 4. Tabla de predicciones generadas por el modelo
CREATE TABLE IF NOT EXISTS predicciones (
    id SERIAL PRIMARY KEY,
    variable VARCHAR(50) NOT NULL,
    prediccion VARCHAR(50) NOT NULL, -- sube, baja, mantiene
    confianza FLOAT NOT NULL,        -- % de probabilidad
    fecha DATE NOT NULL,
    version_modelo VARCHAR(20),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de comparativo histórico (Aciertos vs Realidad)
CREATE TABLE IF NOT EXISTS comparativo (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    variable VARCHAR(50) NOT NULL,
    prediccion_hecha VARCHAR(50) NOT NULL,
    valor_real FLOAT,
    acierto BOOLEAN,
    UNIQUE(fecha, variable)
);

-- Índices para mejorar velocidad de consulta
CREATE INDEX IF NOT EXISTS idx_noticias_fecha ON noticias(fecha);
CREATE INDEX IF NOT EXISTS idx_noticias_tema ON noticias(tema);
CREATE INDEX IF NOT EXISTS idx_datos_mercado_fecha ON datos_mercado(fecha);
