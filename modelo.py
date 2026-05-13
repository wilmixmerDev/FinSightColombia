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
        self.accuracy = 0.0
        self.ruta_modelo = f"modelos/random_forest_{variable.lower()}.joblib"

    def preparar_datos(self):
        """Prepara datos combinando noticias_historicas + datos_mercado + sentimiento."""
        # Datos de noticias históricas etiquetadas
        sql_hist = """
            SELECT fecha, AVG(puntaje) as puntaje_promedio,
                   COUNT(*) as volumen,
                   probabilidad_direccion
            FROM noticias_historicas
            WHERE tema = %s
            GROUP BY fecha, probabilidad_direccion
            ORDER BY fecha
        """
        hist = ejecutar_consulta(sql_hist, (self.variable,))
        if not hist:
            return None

        df_hist = pd.DataFrame(hist)
        if df_hist.empty:
            return None

        df_hist['target'] = (df_hist['probabilidad_direccion'] == 'sube').astype(int)
        df_hist['puntaje_lag'] = df_hist['puntaje_promedio'].shift(1)
        df_hist['volumen_norm'] = df_hist['volumen'] / df_hist['volumen'].max()

        # Agregar datos de mercado si existen
        sql_mkt = "SELECT fecha, valor FROM datos_mercado WHERE variable = %s ORDER BY fecha"
        mkt = ejecutar_consulta(sql_mkt, (self.variable,))

        if mkt:
            df_mkt = pd.DataFrame(mkt)
            df_mkt['retorno'] = df_mkt['valor'].pct_change()
            df_hist = pd.merge(df_hist, df_mkt[['fecha', 'retorno']], on='fecha', how='left')
            df_hist['retorno'] = df_hist['retorno'].fillna(0)
        else:
            df_hist['retorno'] = 0

        return df_hist.dropna()

    def entrenar(self):
        """Entrena el RandomForest con datos históricos etiquetados."""
        df = self.preparar_datos()
        if df is None or len(df) < 10:
            print(f"[Modelo] Datos insuficientes para {self.variable} ({0 if df is None else len(df)} registros)")
            return False

        features = ['puntaje_promedio', 'puntaje_lag', 'volumen_norm', 'retorno']
        X = df[features]
        y = df['target']

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        self.modelo = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42)
        self.modelo.fit(X_train, y_train)

        self.accuracy = accuracy_score(y_test, self.modelo.predict(X_test))
        print(f"[Modelo] {self.variable} entrenado. Accuracy: {self.accuracy:.2%} ({len(df)} muestras)")

        if not os.path.exists('modelos'):
            os.makedirs('modelos')
        joblib.dump(self.modelo, self.ruta_modelo)
        return True

    def cargar(self):
        """Carga modelo guardado."""
        if os.path.exists(self.ruta_modelo):
            self.modelo = joblib.load(self.ruta_modelo)
            return True
        return False

    def predecir_hoy(self, sentimiento_hoy, retorno_hoy, sentimiento_ayer):
        """Genera predicción combinando modelo + heurística."""
        score = (sentimiento_hoy * 0.7) + (sentimiento_ayer * 0.3)

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

        if self.modelo is None:
            self.cargar()

        if self.modelo:
            try:
                X_input = pd.DataFrame(
                    [[sentimiento_hoy, sentimiento_ayer, 0.5, retorno_hoy]],
                    columns=['puntaje_promedio', 'puntaje_lag', 'volumen_norm', 'retorno']
                )
                m_pred = "sube" if self.modelo.predict(X_input)[0] == 1 else "baja"
                m_prob = float(self.modelo.predict_proba(X_input).max())

                if m_pred == pred:
                    prob = max(prob, m_prob) + 0.05
                else:
                    pred, prob = m_pred, m_prob * 0.9
            except Exception as e:
                print(f"[Modelo] Error en predicción ML: {e}")

        return pred, min(0.99, float(prob))

    def predecir_con_noticias(self, noticias_hoy):
        """Genera predicción directa desde noticias scrapeadas."""
        if not noticias_hoy:
            return "mantiene", 0.50

        puntajes = [n.get('puntaje', 0) for n in noticias_hoy if n.get('puntaje') is not None]
        if not puntajes:
            return "mantiene", 0.50

        avg_puntaje = np.mean(puntajes)
        vol = len(puntajes)

        sql_mkt = "SELECT valor FROM datos_mercado WHERE variable = %s ORDER BY fecha DESC LIMIT 2"
        mkt = ejecutar_consulta(sql_mkt, (self.variable,))
        retorno = 0
        if mkt and len(mkt) >= 2:
            retorno = (mkt[0]['valor'] - mkt[1]['valor']) / mkt[1]['valor']

        return self.predecir_hoy(avg_puntaje, retorno, avg_puntaje * 0.8)

if __name__ == "__main__":
    m = ModeloMercado('TRM')
    if m.entrenar():
        pred, prob = m.predecir_hoy(0.3, -0.005, 0.2)
        print(f"Predicción: {pred} ({prob:.2%})")
