import asyncio
from playwright.async_api import async_playwright
from extraccion.scraper_base import RaspadorBase
from db import guardar_noticia
from datetime import datetime

class RaspadorPortafolio(RaspadorBase):
    def __init__(self):
        super().__init__()
        self.fuente = "Portafolio"
        self.urls_objetivo = [
            "https://www.portafolio.co/negocios",
            "https://www.portafolio.co/economia"
        ]

    async def extraer_noticias(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            for url in self.urls_objetivo:
                page = await self.obtener_pagina(browser, url)
                
                # Nuevos selectores de Portafolio (Actualizado 2026)
                articulos = await page.query_selector_all(".c-articulo__titulo__txt")
                
                for art in articulos[:10]:
                    try:
                        titulo = (await art.inner_text()).strip()
                        enlace = await art.get_attribute("href")
                        
                        if enlace and enlace.startswith("/"):
                            enlace = f"https://www.portafolio.co{enlace}"
                        
                        noticia = {
                            "fuente": self.fuente,
                            "url": enlace,
                            "titulo": titulo,
                            "resumen": "",
                            "fecha": datetime.now().date(),
                            "categoria": "Economía/Negocios",
                            "sentimiento": None,
                            "puntaje": None,
                            "tema": "TRM" 
                        }
                        
                        guardar_noticia(noticia)
                        print(f"Noticia capturada: {titulo[:50]}...")
                            
                    except Exception as e:
                        print(f"Error procesando artículo en Portafolio: {e}")
                
                await page.close()
            
            await browser.close()

if __name__ == "__main__":
    raspador = RaspadorPortafolio()
    asyncio.run(raspador.extraer_noticias())
