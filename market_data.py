import yfinance as yf
import pandas as pd
import requests
from datetime import datetime, timedelta
from db import guardar_dato_mercado

def descargar_trm_historica(dias=365):
    """Descarga el precio del dólar (COP=X) desde Yahoo Finance."""
    print(f"Descargando TRM de los últimos {dias} días...")
    try:
        ticker = "USDCOP=X"
        fin = datetime.now()
        inicio = fin - timedelta(days=dias)
        
        data = yf.download(ticker, start=inicio, end=fin)
        
        if data.empty:
            print("No se encontraron datos de TRM")
            return
        
        # Procesamos cada fila para guardarla en la BD
        for fecha, fila in data.iterrows():
            valor = float(fila['Close'])
            # Yahoo Finance a veces da el inverso o valores extraños, 
            # aseguramos que esté en el rango esperado para pesos colombianos
            if valor < 100: # Si es < 100 probablemente es USD/COP invertido o error
                valor = 1 / valor if valor != 0 else 0
            
            guardar_dato_mercado('TRM', valor, fecha.date(), 'Yahoo Finance')
            
        print("TRM actualizada correctamente")
    except Exception as e:
        print(f"Error al descargar TRM: {e}")

def descargar_datos_banrep():
    """
    Descarga datos de inflación y tasas desde el Banco de la República.
    Nota: BanRep suele publicar CSVs o series históricas.
    Para este ejemplo usamos URLs directas de sus series de tiempo públicas.
    """
    print("Descargando datos del Banco de la República...")
    
    # Ejemplo: Tasas de intervención (Serie histórica)
    # En un caso real, BanRep tiene una API (SICEP) o archivos fijos
    # Aquí simulamos la captura de los valores más recientes
    try:
        # Aquí se integraría la descarga de los CSV oficiales del BanRep
        # Por ahora, solo descargamos la TRM que es 100% automatizada.
        print("Módulo BanRep: Integración con series de tiempo CSV pendiente.")
        pass
    except Exception as e:
        print(f"Error al procesar datos de BanRep: {e}")

if __name__ == "__main__":
    # Si se ejecuta este script directamente, actualiza todo
    descargar_trm_historica(30) # Probamos con 30 días primero
    descargar_datos_banrep()
