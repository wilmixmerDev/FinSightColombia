import asyncio
from playwright.async_api import async_playwright
from extraccion.scraper_base import RaspadorBase
from db import guardar_noticia
from datetime import datetime

class RaspadorSemana(RaspadorBase):
    def __init__(self):
        super().__init__()
        self.fuente = "Semana"
        self.urls_objetivo = [
            "https://www.semana.com/economia"
        ]

    async def extraer_noticias(self):
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            for url in self.urls_objetivo:
                page = await self.obtener_pagina(browser, url)
                
                # Selector para Semana (Actualizado 2026)
                # h2 a.c-link o h3 a.c-link
                articulos = await page.query_selector_all("h2 a.c-link, h3 a.c-link")
                
                for art in articulos[:10]:
                    try:
                        titulo = (await art.inner_text()).strip()
                        enlace = await art.get_attribute("href")
                        
                        if enlace and enlace.startswith("/"):
                            enlace = f"https://www.semana.com{enlace}"
                        
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
    raspador = RaspadorSemana()
    asyncio.run(raspador.extraer_noticias())
