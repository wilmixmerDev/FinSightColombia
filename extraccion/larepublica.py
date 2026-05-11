import asyncio
from playwright.async_api import async_playwright
from extraccion.scraper_base import RaspadorBase
from db import guardar_noticia
from datetime import datetime

class RaspadorLaRepublica(RaspadorBase):
    def __init__(self):
        super().__init__()
        self.fuente = "La República"
        self.urls_objetivo = [
            "https://www.larepublica.co/economia"
        ]

    async def extraer_noticias(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            for url in self.urls_objetivo:
                page = await self.obtener_pagina(browser, url)
                
                # Selectores para La República (Actualizado 2026)
                # a.economiaSect suele ser el título y link
                articulos = await page.query_selector_all("a.economiaSect")
                
                for art in articulos[:10]:
                    try:
                        titulo = (await art.inner_text()).strip()
                        enlace = await art.get_attribute("href")
                        
                        if not titulo or not enlace:
                            continue

                        noticia = {
                            "fuente": self.fuente,
                            "url": enlace,
                            "titulo": titulo,
                            "resumen": "",
                            "fecha": datetime.now().date(),
                            "categoria": "Economía",
                            "sentimiento": None,
                            "puntaje": None,
                            "tema": "General" 
                        }
                        
                        guardar_noticia(noticia)
                        print(f"[{self.fuente}] Capturada: {titulo[:50]}...")
                            
                    except Exception as e:
                        print(f"Error procesando artículo en {self.fuente}: {e}")
                
                await page.close()
            
            await browser.close()

if __name__ == "__main__":
    raspador = RaspadorLaRepublica()
    asyncio.run(raspador.extraer_noticias())
