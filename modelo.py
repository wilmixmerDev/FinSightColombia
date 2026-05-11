import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os
from db import ejecutar_consulta, guardar_prediccion

class ModeloMercado:
    def __init__(self, variable='TRM'):
        self.variable = variable
        self.modelo = None
        self.ruta_modelo = f"modelos/random_forest_{variable.lower()}.joblib"

    def preparar_datos(self):
        sql_mercado = "SELECT fecha, valor FROM datos_mercado WHERE variable = %s ORDER BY fecha"
        df_mercado = pd.DataFrame(ejecutar_consulta(sql_mercado, (self.variable,)))
        
        sql_sent = "SELECT fecha, indice as sentimiento FROM indices_sentimiento WHERE tema = %s"
        df_sent = pd.DataFrame(ejecutar_consulta(sql_sent, (self.variable,)))

        if df_mercado.empty or df_sent.empty:
            return None

        df = pd.merge(df_mercado, df_sent, on='fecha')
        df['target'] = (df['valor'].shift(-1) > df['valor']).astype(int)
        df['retorno'] = df['valor'].pct_change()
        df['sentimiento_lag'] = df['sentimiento'].shift(1)
        
        return df.dropna()

    def entrenar(self):
        df = self.preparar_datos()
        if df is None or len(df) < 5:
            return

        X = df[['sentimiento', 'retorno', 'sentimiento_lag']]
        y = df['target']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        self.modelo = RandomForestClassifier(n_estimators=100, random_state=42)
        self.modelo.fit(X_train, y_train)

        acc = accuracy_score(y_test, self.modelo.predict(X_test))
        print(f"Modelo {self.variable} OK. Acc: {acc:.2f}")

        if not os.path.exists('modelos'): os.makedirs('modelos')
        joblib.dump(self.modelo, self.ruta_modelo)

    def predecir_hoy(self, sentimiento_hoy, retorno_hoy, sentimiento_ayer):
        score = (sentimiento_hoy * 0.7) + (sentimiento_ayer * 0.3)
        
        # Heurística de respaldo
        if score > 0.4 and retorno_hoy < -0.01:
            pred, prob = "sube", 0.88
        elif score < -0.4 and retorno_hoy > 0.01:
            pred, prob = "baja", 0.82
        elif score > 0.2:
            pred, prob = "sube", 0.65 + (score * 0.2)
        elif score < -0.2:
            pred, prob = "baja", 0.65 + (abs(score) * 0.2)
        else:
            pred, prob = "mantiene", 0.50
            
        if self.modelo:
            try:
                X_input = pd.DataFrame([[sentimiento_hoy, retorno_hoy, sentimiento_ayer]], 
                                      columns=['sentimiento', 'retorno', 'sentimiento_lag'])
                m_pred = "sube" if self.modelo.predict(X_input)[0] == 1 else "baja"
                m_prob = self.modelo.predict_proba(X_input).max()
                
                if m_pred == pred:
                    prob = max(prob, m_prob) + 0.05
                else:
                    pred, prob = m_pred, m_prob * 0.9
            except:
                pass
        
        return pred, min(0.99, float(prob))

if __name__ == "__main__":
    ModeloMercado('TRM').entrenar()
