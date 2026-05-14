from extraccion.scraper_base import RaspadorBase
from db import guardar_noticia
from nlp import analizar_noticia, clasificar_tema
from datetime import datetime
from urllib.parse import urljoin, urlparse

class RaspadorPortafolio(RaspadorBase):
    def __init__(self):
        super().__init__()
        self.fuente = "Portafolio"
        self.urls_objetivo = [
            "https://www.portafolio.co/economia",
            "https://www.portafolio.co/negocios"
        ]

    def _es_url_articulo(self, href):
        if not href:
            return False
        if href.startswith("#"):
            return False
        parsed = urlparse(href)
        path = parsed.path if parsed.scheme else href
        return (
            "/economia/" in path
            or "/negocios/" in path
            or "/contenido-patrocinado/" in path
            or "/internacional/" in path
            or "/tendencias/" in path
            or "/mis-finanzas/" in path
        )

    def _normalizar_url(self, href, base_url):
        if not href:
            return ""
        return urljoin(base_url, href)

    def extraer_noticias(self):
        for url in self.urls_objetivo:
            try:
                urls_vistos = set()
                count = 0

                # Portafolio expone más notas en varias páginas de categoría.
                # Recorremos páginas base y algunas paginadas para no quedarnos solo con la portada.
                paginas = [url] + [f"{url.rstrip('/')}/{i}" for i in range(2, 5)]

                for pagina in paginas:
                    soup = self.obtener_html(pagina)
                    articulos = []

                    # Títulos principales y bloques de noticias
                    articulos.extend(soup.select("h3 a[href], h2 a[href], article a[href]"))

                    # Fallback amplio: cualquier enlace que parezca artículo
                    if not articulos:
                        articulos = [a for a in soup.find_all("a", href=True) if self._es_url_articulo(a.get("href", ""))]

                    for art in articulos:
                        if count >= 20:
                            break
                        try:
                            titulo = art.get_text(" ", strip=True)
                            enlace = self._normalizar_url(art.get("href", ""), pagina)

                            if not titulo or len(titulo) < 18:
                                continue
                            if not self._es_url_articulo(enlace):
                                continue
                            if enlace in urls_vistos:
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
                                "categoria": "Economía/Negocios",
                                "sentimiento": mapeo_sent.get(sentimiento, 'NEU'),
                                "puntaje": round(puntaje, 4),
                                "tema": tema
                            }

                            guardar_noticia(noticia)
                            count += 1
                            print(f"  [{self.fuente}] OK: {titulo[:60]}...")

                        except Exception as e:
                            print(f"  Error procesando artículo en {self.fuente}: {e}")

                    if count >= 20:
                        break

                print(f"  {self.fuente} desde {url}: {count} noticias")

            except Exception as e:
                print(f"  ✗ Error descargando {url}: {e}")

if __name__ == "__main__":
    raspador = RaspadorPortafolio()
    raspador.extraer_noticias()
