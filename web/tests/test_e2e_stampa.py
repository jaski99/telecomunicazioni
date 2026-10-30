"""E2E Playwright — criterio B14 (Stampa): @media print senza !important,
sezioni aperte, nav nascosta, URL dei link stampati."""
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

WEB_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
PORT = 18197
BASE_URL = f"http://127.0.0.1:{PORT}"
VIEWPORTS = [(390, 844), (1440, 900)]
CSS_DIR = Path(WEB_DIR) / "css"


def leggi_grafo():
    percorso = os.path.join(WEB_DIR, "graph.json")
    try:
        with open(percorso, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"nodi": []}


import json  # noqa: E402  (serve dopo la definizione di leggi_grafo)


def build_dim_routes():
    grafo = leggi_grafo()
    rotte = []
    for nodo in grafo.get("nodi", []):
        if nodo.get("dimostrazione"):
            rotte.append(f"dim/{nodo.get('id')}")
    return rotte[:2] or ["dim/dim-teorema-campionamento"]


DIM_ROUTES = build_dim_routes()


def registra_listener_js(page, errori):
    page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errori.append(str(e)))


@pytest.fixture(scope="module")
def server():
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT)],
        cwd=WEB_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    deadline = time.time() + 15
    while time.time() < deadline:
        try:
            import urllib.request
            urllib.request.urlopen(BASE_URL + "/index.html", timeout=1)
            break
        except OSError:
            time.sleep(0.2)
    yield BASE_URL
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        try:
            yield b
        finally:
            b.close()


def test_b14_stampa_zero_important():
    """0 !important in web/css/** (eccetto [hidden] già in base.css)."""
    importanti = []
    for css_file in CSS_DIR.rglob("*.css"):
        contenuto = css_file.read_text(encoding="utf-8")
        for match in re.finditer(r"!important", contenuto):
            importanti.append(f"{css_file.relative_to(WEB_DIR)}:riga {contenuto[:match.start()].count(chr(10)) + 1}")
    assert not importanti, f"!important trovati: {importanti}"


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", DIM_ROUTES)
def test_b14_stampa_sezioni_visibili_nav_nascosta(server, browser, width, height, route):
    """Con emulate_media(print): tutte le sezioni visibili, nav nascosta."""
    context = browser.new_context(viewport={"width": width, "height": height}, locale="it-IT")
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)
        page.goto(f"{BASE_URL}/index.html#/{route}", wait_until="load")
        page.wait_for_timeout(150)
        page.emulate_media(media="print")
        page.wait_for_timeout(100)

        # Nav e controlli nascosti
        nascosti = [
            "header", ".site-header", ".nav-principale", ".dim-controlli",
            ".dim-tabs", ".dim-indice", ".site-footer", ".nav-sequenza",
        ]
        for sel in nascosti:
            conta = page.locator(sel).count()
            for i in range(conta):
                vis = page.locator(sel).nth(i).is_visible()
                assert not vis, f"[{route}] {sel} visibile in stampa"

        # Tutti gli .step__corpo visibili (anche senza "Mostra tutti")
        passi = page.locator(".step__corpo")
        for i in range(passi.count()):
            assert passi.nth(i).is_visible(), f"[{route}] passo {i} nascosto in stampa"

        assert not errori, f"[{route}] errori JS: {errori}"
    finally:
        context.close()
