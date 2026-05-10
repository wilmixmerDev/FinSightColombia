"""
nlp.py — Análisis de sentimiento con pysentimiento.
Función principal: analizar(titulo, resumen) → sentimiento, score, tema
"""
import re
from pysentimiento import create_analyzer

# Inicializamos analizadores
analyzer = create_analyzer(task="sentiment", lang="es")

# Palabras clave para clasificar temas financieros
PALABRAS_CLAVE = {
    'TRM': [
        'dólar', 'trm', 'divisa', 'tipo de cambio', 'peso', 'usd',
        'bolívar', 'tipo de cambio', 'cotización', 'moneda extranjera'
    ],
    'Inflación': [
        'inflación', 'ipc', 'precios', 'alza de precios', 'costo de vida',
        'capacidad adquisitiva', 'devaluación', 'revaluación', 'alimento',
        'energía', 'combustible'
    ],
    'Tasas': [
        'tasa', 'intervención', 'banrep', 'banco de la república', 'encaje',
        'fondos interbancarios', 'usura', 'interés', 'crédito'
    ]
}

def detectar_tema(texto):
    """
    Detecta el tema financiero principal del texto.
    Retorna: 'TRM', 'Inflación', 'Tasas' o None.
    """
    texto_lower = texto.lower()
    
    # Contar coincidencias para cada tema
    scores = {}
    for tema, palabras in PALABRAS_CLAVE.items():
        matches = sum(1 for palabra in palabras if palabra in texto_lower)
        if matches > 0:
            scores[tema] = matches
    
    if not scores:
        return None
    
    return max(scores.items(), key=lambda x: x[1])[0]

def limpiar_texto(texto):
    """Limpia el texto para análisis de sentimiento."""
    if not texto:
        return ""
    # Remover URLs
    texto = re.sub(r'https?://\S+', '', texto)
    # Remover menciones
    texto = re.sub(r'@\w+', '', texto)
    # Remover caracteres especiales excesivos
    texto = re.sub(r'[^\w\s.]', '', texto)
    # Remover espacios múltiples
    texto = ' '.join(texto.split())
    return texto

def analizar(titulo, resumen=""):
    """
    Analiza el sentimiento de un artículo.
    
    Retorna:
        dict con keys: sentimiento, puntaje, tema
            - sentimiento: 'POS' (positivo), 'NEG' (negativo), 'NEU' (neutro)
            - puntaje: float (-1 a 1)
            - tema: 'TRM', 'Inflación', 'Tasas', o None
    """
    try:
        # Combinar texto
        texto_completo = f"{titulo} {resumen}"
        texto_limpio = limpiar_texto(texto_completo)
        
        if not texto_limpio or len(texto_limpio) < 3:
            return {
                'sentimiento': 'NEU',
                'puntaje': 0.0,
                'tema': None
            }
        
        # Análisis de sentimiento
        prediccion = analyzer.predict(texto_limpio)
        
        # Mapear output a formato esperado
        sentimiento_map = {
            'POS': 'POS',
            'NEG': 'NEG',
            'NEU': 'NEU'
        }
        
        sentimiento = sentimiento_map.get(prediccion.output, 'NEU')
        
        # Extraer puntuación (pysentimiento retorna scores)
        # Normalizamos a rango -1 a 1
        scores = prediccion.scores
        puntaje = scores.get('POS', 0) - scores.get('NEG', 0)
        
        # Detectar tema
        tema = detectar_tema(texto_completo)
        
        return {
            'sentimiento': sentimiento,
            'puntaje': float(puntaje),
            'tema': tema
        }
    
    except Exception as e:
        print(f"Error en análisis de sentimiento: {e}")
        return {
            'sentimiento': 'NEU',
            'puntaje': 0.0,
            'tema': None
        }

def analizar_lote(noticias):
    """
    Analiza un lote de noticias de manera eficiente.
    
    Args:
        noticias: list de dict con 'titulo' y 'resumen' (opcional)
    
    Retorna:
        list de dict con análisis para cada noticia
    """
    resultados = []
    for noticia in noticias:
        resultado = analizar(
            noticia.get('titulo', ''),
            noticia.get('resumen', '')
        )
        resultados.append(resultado)
    return resultados
