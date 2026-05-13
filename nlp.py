import re

# ============================================================
# Analizador de sentimiento basado en léxico para español
# No requiere PyTorch ni transformers — usa diccionario de
# palabras positivas/negativas del ámbito financiero colombiano.
# ============================================================

POSITIVAS = {
    'sube', 'subió', 'suben', 'crecimiento', 'crecer', 'crece', 'creciendo',
    'ganancia', 'ganancias', 'utilidades', 'utilidad', 'beneficio', 'beneficios',
    'recupera', 'recuperación', 'mejora', 'mejoras', 'mejoró', 'optimismo',
    'optimista', 'alza', 'alzas', 'avanza', 'avance', 'avanzan',
    'récord', 'máximo', 'máximos', 'éxito', 'exitoso', 'expansión',
    'inversión', 'invirtió', 'inversiones', 'oportunidad', 'oportunidades',
    'estabilidad', 'estable', 'fortalece', 'fortalecimiento', 'impulsa',
    'impulso', 'impulsan', 'favorable', 'positivo', 'positiva',
    'aprobación', 'aprobó', 'aprueba', 'logro', 'logró', 'moderniza',
    'reduce', 'reducción', 'baja', 'bajó', 'desciende',  # reduce inflación = positivo
    'empleo', 'empleos', 'competitiva', 'innovación', 'desarrollo',
    'alianza', 'respaldo', 'respalda', 'defiende', 'protege',
    'alivio', 'alivios', 'descuento', 'descuentos', 'ahorro', 'premio',
}

NEGATIVAS = {
    'cae', 'caída', 'cayó', 'caen', 'baja', 'bajó', 'bajan',  # context-dependent
    'pérdida', 'pérdidas', 'pierde', 'pierden', 'déficit',
    'crisis', 'riesgo', 'riesgos', 'incertidumbre', 'volatilidad',
    'deuda', 'deudas', 'endeudamiento', 'inflación', 'inflaciónaria',
    'desempleo', 'desaceleración', 'recesión', 'contracción',
    'sanciones', 'sanción', 'multa', 'multas', 'embargo',
    'corrupción', 'fraude', 'ilegal', 'ilegales', 'clandestino', 'clandestinas',
    'queja', 'quejas', 'insatisfacción', 'alerta', 'alertas',
    'golpea', 'golpe', 'presiona', 'presión', 'debilitamiento',
    'error', 'falla', 'fallas', 'problema', 'problemas',
    'amenaza', 'amenazas', 'hunde', 'hundimiento', 'colapso',
    'negativo', 'negativa', 'peores', 'peor', 'vulnerables',
    'pobreza', 'conflicto', 'narcotráfico', 'violencia',
    'cierre', 'cierran', 'cerró', 'despedir', 'despido',
}

# Palabras que invierten el contexto de "baja/reduce" (ej: "inflación baja" = positivo)
CONTEXTO_INVERSO = {
    'inflación', 'inflacion', 'desempleo', 'deuda', 'déficit',
    'pobreza', 'insatisfacción', 'riesgo', 'tasa de usura',
    'siniestralidad'
}


def limpiar_texto(texto):
    """Limpia caracteres especiales y excesos de espacios."""
    if not texto: return ""
    texto = re.sub(r'[^\w\sáéíóúÁÉÍÓÚñÑ]', '', texto)
    return texto.strip().lower()


def analizar_noticia(titulo, resumen=""):
    """
    Analiza el sentimiento de una noticia usando léxico financiero.
    Retorna: sentimiento ('positivo', 'negativo', 'neutro') y puntaje (0.0-1.0).
    """
    try:
        texto = limpiar_texto(f"{titulo} {resumen}")
        palabras = texto.split()

        score_pos = 0
        score_neg = 0

        # Verificar si hay contexto inverso (ej: "inflación baja" = positivo)
        tiene_contexto_inverso = any(p in texto for p in CONTEXTO_INVERSO)

        for palabra in palabras:
            if palabra in POSITIVAS:
                score_pos += 1
            if palabra in NEGATIVAS:
                score_neg += 1

        # Ajuste de contexto: si hay palabras negativas de contexto inverso
        # y se menciona "baja/reduce/desciende", invertir la polaridad
        if tiene_contexto_inverso:
            inversores = {'baja', 'bajó', 'bajan', 'reduce', 'reducción',
                         'desciende', 'cae', 'cayó', 'caída'}
            for p in palabras:
                if p in inversores:
                    # Mover del negativo al positivo
                    score_neg = max(0, score_neg - 1)
                    score_pos += 1

        total = score_pos + score_neg
        if total == 0:
            return "neutro", 0.5

        ratio = (score_pos - score_neg) / total

        if ratio > 0.15:
            confianza = min(0.95, 0.6 + ratio * 0.3)
            return "positivo", confianza
        elif ratio < -0.15:
            confianza = min(0.95, 0.6 + abs(ratio) * 0.3)
            return "negativo", confianza
        else:
            return "neutro", 0.5 + abs(ratio) * 0.1

    except Exception as e:
        print(f"Error analizando sentimiento: {e}")
        return "neutro", 0.5


def clasificar_tema(titulo, resumen=""):
    """
    Clasifica de forma simple si la noticia trata sobre
    TRM, Inflación o Tasas.
    """
    texto = f"{titulo} {resumen}".lower()

    if any(k in texto for k in ['dólar', 'dolar', 'trm', 'divisa', 'cop', 'usd']):
        return 'TRM'
    elif any(k in texto for k in ['inflación', 'inflacion', 'ipc', 'precios', 'costo de vida']):
        return 'Inflación'
    elif any(k in texto for k in ['tasa', 'interés', 'interes', 'banrep', 'emisor']):
        return 'Tasas'
    else:
        return 'General'


if __name__ == "__main__":
    # Prueba rápida
    pruebas = [
        "El dólar cae con fuerza por optimismo en los mercados",
        "Inflación desciende en abril, mejora la economía",
        "Ganancias de Ecopetrol siguen bajando tras caída del 7%",
        "Colombia, con los peores indicadores fiscales de la región",
        "Grupo Éxito aumentó 64,6% sus utilidades",
        "Creciente inflación golpea a hogares vulnerables",
        "Deuda externa llegó a US$252.168 millones",
    ]
    for t in pruebas:
        s, p = analizar_noticia(t)
        tema = clasificar_tema(t)
        print(f"  [{s.upper()[:3]}] ({p:.2f}) [{tema}] → {t}")
