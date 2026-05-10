import asyncio
import random
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

class RaspadorBase:
    def __init__(self):
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
        ]

    async def obtener_pagina(self, browser, url):
        """Crea una nueva página con stealth y un User-Agent aleatorio."""
        ua = random.choice(self.user_agents)
        context = await browser.new_context(user_agent=ua)
        page = await context.new_page()
        
        # Aplicamos modo sigiloso
        await stealth_async(page)
        
        print(f"Navegando a: {url}")
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        # Pausa aleatoria para imitar humano
        await asyncio.sleep(random.uniform(2, 5))
        
        return page

    async def extraer_noticias(self):
        """Método que debe ser implementado por cada raspador específico."""
        raise NotImplementedError("Cada raspador debe implementar su propia lógica de extracción")
