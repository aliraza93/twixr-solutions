"""Render product graphics to PNG.

Usage: python3 scripts/product-graphics/render.py
Needs Playwright for Python and a local Chrome (set CHROME_PATH if it is not
/usr/bin/google-chrome). Each <section class="card" id="..."> in the HTML is
captured at 1600x840 to public/products/<product>/<file>.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
JOBS = {
    "gta6shorts": {
        "html": ROOT / "scripts/product-graphics/gta6shorts.html",
        "files": {
            "hero": "launch-hero.png",
            "workflow": "workflow.png",
            "detect": "moment-detection.png",
            "vertical": "vertical-captions.png",
            "campaigns": "campaign-board.png",
            "earnings": "earnings-tracker.png",
            "pricing": "pricing.png",
            "sources": "sources.png",
            "stack": "architecture.png",
        },
    },
}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get("CHROME_PATH", "/usr/bin/google-chrome"))
    page = browser.new_page(viewport={"width": 1700, "height": 1000})
    for product, job in JOBS.items():
        out = ROOT / "public/products" / product
        out.mkdir(parents=True, exist_ok=True)
        page.goto(job["html"].as_uri())
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(300)
        for card_id, name in job["files"].items():
            page.locator(f"#{card_id}").screenshot(path=str(out / name))
            print("wrote", out / name)
    browser.close()
