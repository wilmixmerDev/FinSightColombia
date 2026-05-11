from pysentimiento import create_analyzer
import re

# Cargamos el analizador de sentimiento para español
# Lo inicializamos una sola vez para ahorrar memoria
print("Cargando modelo de análisis de sentimiento (esto puede tardar la primera vez)...")
analizador = create_analyzer(task="sentiment", lang="es")

def limpiar_texto(texto):
    """Limpia caracteres especiales y excesos de espacios."""
    if not texto: return ""
    texto = re.sub(r'[^\w\sáéíóúÁÉÍÓÚñÑ]', '', texto)
    return texto.strip().lower()

def analizar_noticia(titulo, resumen=""):
    """
    Analiza el sentimiento de una noticia combinando título y resumen.
    Retorna: sentimiento (pos, neg, neu) y el puntaje (score).
    """
    try:
        texto_completo = f"{titulo}. {resumen}"
        # Solo analizamos los primeros 512 caracteres (límite de muchos modelos transformer)
        resultado = analizador.predict(texto_completo[:512])
        
        sentimiento = resultado.output.lower() # POS, NEG, NEU
        # El score es la probabilidad del sentimiento predominante
        puntaje = resultado.probas[resultado.output]
        
        # Mapeamos a nombres más naturales en español
        mapeo = {
            'pos': 'positivo',
            'neg': 'negativo',
            'neu': 'neutro'
        }
        
        return mapeo.get(sentimiento, 'neutro'), float(puntaje)
    except Exception as e:
        print(f"Error analizando sentimiento: {e}")
        return "neutro", 0.0

def clasificar_tema(titulo, resumen=""):
    """
    Clasifica de forma simple si la noticia trata sobre 
    TRM, Inflación o Tasas.
    """
    texto = f"{titulo} {resumen}".lower()
    
    if any(k in texto for k in ['dólar', 'dolar', 'trm', 'divisa', 'cop']):
        return 'TRM'
    elif any(k in texto for k in ['inflación', 'inflacion', 'ipc', 'precios', 'costo de vida']):
        return 'Inflación'
    elif any(k in texto for k in ['tasa', 'interés', 'interes', 'banrep', 'emisor']):
        return 'Tasas'
    else:
        return 'General'

if __name__ == "__main__":
    # Prueba rápida
    t = "El dólar cae con fuerza por optimismo en los mercados"
    s, p = analizar_noticia(t)
    tema = clasificar_tema(t)
    print(f"Noticia: {t}")
    print(f"Sentimiento: {s} ({p:.2f}) | Tema: {tema}")
