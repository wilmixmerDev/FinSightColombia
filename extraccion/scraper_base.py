import requests
import random
from bs4 import BeautifulSoup

class RaspadorBase:
    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
        ]
        self.session = requests.Session()

    def obtener_html(self, url, timeout=30):
        """Obtiene el HTML de una URL usando requests (sin navegador)."""
        ua = random.choice(self.user_agents)
        headers = {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
        print(f"Descargando: {url}")
        response = self.session.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")

    def extraer_noticias(self):
        """Método que debe ser implementado por cada raspador específico."""
        pass
