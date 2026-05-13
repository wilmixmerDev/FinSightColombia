from extraccion.scraper_base import RaspadorBase
from db import guardar_noticia
from nlp import analizar_noticia, clasificar_tema
from datetime import datetime

class RaspadorLaRepublica(RaspadorBase):
    def __init__(self):
        super().__init__()
        self.fuente = "La República"
        self.urls_objetivo = [
            "https://www.larepublica.co/economia"
        ]

    def extraer_noticias(self):
        for url in self.urls_objetivo:
            try:
                soup = self.obtener_html(url)

                # La República usa <h2> con enlaces para los titulares
                articulos = soup.select("h2 a[href]")

                if not articulos:
                    # Fallback: buscar enlaces que contengan /economia/ en el href
                    articulos = [
                        a for a in soup.find_all("a", href=True)
                        if "/economia/" in a["href"] and a.get_text(strip=True)
                    ]

                urls_vistos = set()
                count = 0
                for art in articulos:
                    if count >= 10:
                        break
                    try:
                        titulo = art.get_text(strip=True)
                        enlace = art.get("href", "")

                        if not titulo or len(titulo) < 15:
                            continue

                        if enlace.startswith("/"):
                            enlace = f"https://www.larepublica.co{enlace}"

                        if not enlace or enlace in urls_vistos:
                            continue
                        urls_vistos.add(enlace)

                        sentimiento, puntaje = analizar_noticia(titulo)
                        tema = clasificar_tema(titulo)
                        mapeo_sent = {'positivo': 'POS', 'negativo': 'NEG', 'neutro': 'NEU'}

                        noticia = {
                            "fuente": self.fuente,
                            "url": enlace,
                            "titulo": titulo,
                            "resumen": "",
                            "fecha": datetime.now().date(),
                            "categoria": "Economía",
                            "sentimiento": mapeo_sent.get(sentimiento, 'NEU'),
                            "puntaje": round(puntaje, 4),
                            "tema": tema
                        }

                        guardar_noticia(noticia)
                        count += 1
                        print(f"  [{self.fuente}] OK: {titulo[:60]}...")

                    except Exception as e:
                        print(f"  Error procesando artículo en {self.fuente}: {e}")

                print(f"  {self.fuente} desde {url}: {count} noticias")

            except Exception as e:
                print(f"  ✗ Error descargando {url}: {e}")

if __name__ == "__main__":
    raspador = RaspadorLaRepublica()
    raspador.extraer_noticias()
