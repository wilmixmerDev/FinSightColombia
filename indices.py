from db import ejecutar_consulta, guardar_indice_sentimiento
from datetime import datetime

def calcular_indice_diario(fecha=None):
    """
    Calcula el índice de sentimiento consolidado para una fecha.
    Fórmula: (Positivas - Negativas) / Total
    Rango: -1 (muy negativo) a 1 (muy positivo)
    """
    if fecha is None:
        fecha = datetime.now().date()
        
    print(f"Calculando índice para la fecha: {fecha}")
    
    # Obtenemos el conteo de sentimientos por tema
    sql = """
        SELECT tema, sentimiento, COUNT(*) 
        FROM noticias 
        WHERE fecha = %s 
        GROUP BY tema, sentimiento
    """
    resultados = ejecutar_consulta(sql, (fecha,))
    
    # Agrupamos por tema
    temas = {}
    for r in resultados:
        tema = r['tema']
        if tema not in temas:
            temas[tema] = {'positivo': 0, 'negativo': 0, 'neutro': 0}
        
        sent = r['sentimiento']
        conteo = r['count']
        temas[tema][sent] = conteo

    # Calculamos el índice para cada tema
    for tema, conteos in temas.items():
        pos = conteos['positivo']
        neg = conteos['negativo']
        total = pos + neg + conteos['neutro']
        
        if total > 0:
            indice = (pos - neg) / total
            guardar_indice_sentimiento(tema, fecha, indice, total)
            print(f"Índice {tema}: {indice:.2f} (Noticias: {total})")
        else:
            print(f"Sin noticias suficientes para el tema {tema}")

if __name__ == "__main__":
    calcular_indice_diario()
