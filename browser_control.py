import asyncio
from typing import Optional
from urllib.parse import urlparse
from playwright.async_api import async_playwright

ALLOWED_DOMAINS = [
    "bing.com",
    "google.com",
    "relentlessbillionaire.com",
]

def domain_allowed(url: str) -> bool:
    try:
        netloc = urlparse(url).netloc.lower()
        for d in ALLOWED_DOMAINS:
            # Exact match or subdomain match (e.g., sub.google.com matches google.com)
            if netloc == d or netloc.endswith('.' + d):
                return True
        return False
    except Exception:
        return False

async def _run(action: str, url: Optional[str] = None,
              selector: Optional[str] = None,
              text: Optional[str] = None):
    browser = None
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            page = await browser.new_page()
            page.set_default_timeout(10000)  # 10 second default timeout

            if url:
                await page.goto(url, timeout=10000)

            if action == "click" and selector:
                await page.click(selector, timeout=10000)

            if action == "fill" and selector is not None and text is not None:
                await page.fill(selector, text)

            if action == "wait":
                await page.wait_for_timeout(5000)

            return "ok"
    except Exception as e:
        return f"error: {str(e)}"
    finally:
        if browser:
            await browser.close()

def run_browser_action(action: str, url: Optional[str] = None,
                       selector: Optional[str] = None,
                       text: Optional[str] = None):
    return asyncio.run(_run(action, url, selector, text))
