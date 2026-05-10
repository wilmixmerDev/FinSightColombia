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
                
                # Buscamos los contenedores de noticias
                # Selectores típicos de Portafolio (pueden variar, se ajustan en campo)
                articulos = await page.query_selector_all("div.listing-item, article")
                
                for art in articulos[:10]: # Tomamos las 10 más recientes por sección
                    try:
                        titulo_elem = await art.query_selector("h2 a, .title a")
                        resumen_elem = await art.query_selector(".description, p")
                        
                        if titulo_elem:
                            titulo = (await titulo_elem.inner_text()).strip()
                            enlace = await titulo_elem.get_attribute("href")
                            if enlace and enlace.startswith("/"):
                                enlace = f"https://www.portafolio.co{enlace}"
                            
                            resumen = ""
                            if resumen_elem:
                                resumen = (await resumen_elem.inner_text()).strip()

                            noticia = {
                                "fuente": self.fuente,
                                "url": enlace,
                                "titulo": titulo,
                                "resumen": resumen,
                                "fecha": datetime.now().date(),
                                "categoria": "Economía/Negocios",
                                "sentimiento": None, # Se llena en PASO 5
                                "puntaje": None,     # Se llena en PASO 5
                                "tema": "General"    # Se clasifica en PASO 5
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
