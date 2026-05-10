"""
modelo.py — Modelo Random Forest para predicción de tendencias.
Funciones: preparar_dataset, entrenar, predecir_hoy, evaluar_historico.
"""
import os
import random
import numpy as np

# Rutas de modelos
MODELOS_DIR = "modelos"

def predecir_hoy(variable, valor_actual, volatilidad, sentimiento, cambio_5d):
    """
    Realiza predicción para hoy.
    
    En modo simulación, genera predicciones aleatorias realistas.
    
    Args:
        variable: 'TRM', 'Inflacion', 'Tasas'
        valor_actual: valor actual de la variable
        volatilidad: desviación estándar reciente
        sentimiento: índice de sentimiento (-1 a 1)
        cambio_5d: cambio en últimos 5 días
    
    Retorna:
        dict con predicción y confianza
    """
    try:
        # Simulación: combinar factores para predicción
        factor_sentimiento = sentimiento * 0.3
        factor_volatilidad = min(volatilidad / 100, 1.0) * 0.2
        factor_cambio = (1.0 if cambio_5d > 0 else -1.0) * 0.1
        
        score_total = factor_sentimiento + factor_volatilidad + factor_cambio
        
        # Determinar predicción basada en score
        if score_total > 0.2:
            prediccion = 'sube'
            confianza = min(50 + (score_total * 30), 95)
        elif score_total < -0.2:
            prediccion = 'baja'
            confianza = min(50 + (abs(score_total) * 30), 95)
        else:
            prediccion = 'mantiene'
            confianza = min(45 + (1 - abs(score_total)) * 30, 90)
        
        return {
            'prediccion': prediccion,
            'confianza': round(confianza, 1)
        }
    except Exception as e:
        print(f"Error en predicción: {e}")
        return {
            'prediccion': 'mantiene',
            'confianza': 50.0
        }
