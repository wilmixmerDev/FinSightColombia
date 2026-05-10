"""
test_mvp.py — Script para verificar que el MVP funciona correctamente.
Prueba las funciones principales sin necesidad de la BD.
"""
import sys
import numpy as np
from datetime import datetime

def test_nlp():
    """Prueba análisis de sentimiento."""
    print("\n" + "="*60)
    print("TEST 1: Análisis de Sentimiento (NLP)")
    print("="*60)
    
    try:
        from nlp import analizar, detectar_tema
        
        # Test 1: Noticia positiva sobre TRM
        titulo = "Dólar cae ante fortaleza del peso"
        resumen = "El dólar alcanzó nuevos mínimos después de meses de estabilidad"
        
        resultado = analizar(titulo, resumen)
        print(f"\n✓ Noticia: '{titulo}'")
        print(f"  - Sentimiento: {resultado['sentimiento']}")
        print(f"  - Puntaje: {resultado['puntaje']:.2f}")
        print(f"  - Tema: {resultado['tema']}")
        
        # Test 2: Noticia sobre inflación
        titulo2 = "Inflación desciende en abril"
        resultado2 = analizar(titulo2)
        print(f"\n✓ Noticia: '{titulo2}'")
        print(f"  - Tema: {resultado2['tema']}")
        
        # Test 3: Detección de tema
        tema = detectar_tema("Las tasas de intervención del BanRep suben")
        print(f"\n✓ Detección de tema: {tema}")
        
        print("\n✅ NLP: OK")
        return True
    except Exception as e:
        print(f"\n❌ NLP Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_modelo():
    """Prueba modelo de predicción."""
    print("\n" + "="*60)
    print("TEST 2: Modelo de Predicción (ML)")
    print("="*60)
    
    try:
        from modelo import ModeloPrediccion
        
        # Crear modelo
        modelo = ModeloPrediccion('TRM', '1.0')
        print("\n✓ Modelo Random Forest creado")
        
        # Generar datos de entrenamiento (simulado)
        np.random.seed(42)
        X_train = np.random.randn(50, 5)
        y_train = np.random.choice([-1, 0, 1], 50)
        
        # Entrenar
        modelo.entrenar(X_train, y_train)
        print("✓ Modelo entrenado")
        
        # Predicción
        X_test = np.random.randn(1, 5)
        prediccion = modelo.predecir(X_test[0])
        
        print(f"\n✓ Predicción realizada:")
        print(f"  - Tendencia: {prediccion['prediccion']}")
        print(f"  - Confianza: {prediccion['confianza']:.1f}%")
        
        print("\n✅ Modelo: OK")
        return True
    except Exception as e:
        print(f"\n❌ Modelo Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_fastapi():
    """Verifica que FastAPI esté disponible."""
    print("\n" + "="*60)
    print("TEST 3: FastAPI Setup")
    print("="*60)
    
    try:
        from main import app
        print("\n✓ FastAPI app cargada correctamente")
        
        # Verificar rutas
        routes = [route.path for route in app.routes]
        endpoints_esperados = ['/mercado', '/prediccion', '/noticias']
        
        for endpoint in endpoints_esperados:
            rutas_endpoint = [r for r in routes if endpoint in r]
            if rutas_endpoint:
                print(f"✓ {endpoint}: {len(rutas_endpoint)} endpoints registrados")
            else:
                print(f"⚠ {endpoint}: No hay endpoints")
        
        print("\n✅ FastAPI: OK")
        return True
    except Exception as e:
        print(f"\n❌ FastAPI Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_dependencias():
    """Verifica que todas las dependencias estén instaladas."""
    print("\n" + "="*60)
    print("TEST 0: Verificar Dependencias")
    print("="*60)
    
    dependencias = {
        'fastapi': 'FastAPI',
        'uvicorn': 'Uvicorn',
        'psycopg2': 'PostgreSQL',
        'pandas': 'Pandas',
        'sklearn': 'Scikit-learn',
        'torch': 'PyTorch',
        'yfinance': 'yfinance',
        'playwright': 'Playwright'
    }
    
    todas_ok = True
    for modulo, nombre in dependencias.items():
        try:
            __import__(modulo)
            print(f"✓ {nombre}")
        except ImportError:
            print(f"❌ {nombre} - No instalado (pip install {modulo})")
            todas_ok = False
    
    if todas_ok:
        print("\n✅ Todas las dependencias: OK")
    else:
        print("\n⚠ Faltan dependencias. Ejecutar: pip install -r requirements.txt")
    
    return todas_ok

def main():
    """Ejecuta todos los tests."""
    print("\n")
    print("╔" + "═"*58 + "╗")
    print("║" + " "*15 + "FinSight Colombia - MVP Test Suite" + " "*9 + "║")
    print("╚" + "═"*58 + "╝")
    
    resultados = []
    
    # Test 0: Dependencias
    resultados.append(("Dependencias", test_dependencias()))
    
    # Test 1: NLP
    resultados.append(("NLP", test_nlp()))
    
    # Test 2: Modelo
    resultados.append(("Modelo ML", test_modelo()))
    
    # Test 3: FastAPI
    resultados.append(("FastAPI", test_fastapi()))
    
    # Resumen
    print("\n" + "="*60)
    print("RESUMEN DE TESTS")
    print("="*60)
    
    for nombre, resultado in resultados:
        estado = "✅ PASS" if resultado else "❌ FAIL"
        print(f"{nombre:<20} {estado}")
    
    todos_pasaron = all(r for _, r in resultados)
    
    print("\n" + "="*60)
    if todos_pasaron:
        print("✅ Todos los tests PASARON")
        print("\nPróximos pasos:")
        print("1. Ejecutar: python setup.py")
        print("2. Terminal 1: python main.py")
        print("3. Terminal 2: cd views && npm run dev")
        print("4. Abrir: http://localhost:5173")
    else:
        print("❌ Algunos tests FALLARON")
        print("\nVerifica los errores arriba y instala dependencias faltantes.")
    print("="*60 + "\n")
    
    return 0 if todos_pasaron else 1

if __name__ == "__main__":
    sys.exit(main())
