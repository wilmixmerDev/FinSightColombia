-- Tabla de noticias históricas para entrenamiento de IA
-- Contiene datos etiquetados con la dirección real del mercado al día siguiente
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

CREATE INDEX IF NOT EXISTS idx_hist_fecha ON noticias_historicas(fecha);
CREATE INDEX IF NOT EXISTS idx_hist_direccion ON noticias_historicas(probabilidad_direccion);

-- Agregar columna de dirección a la tabla de noticias scrapeadas
ALTER TABLE noticias ADD COLUMN IF NOT EXISTS probabilidad_direccion VARCHAR(10);
