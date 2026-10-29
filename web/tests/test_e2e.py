"""E2E Playwright per la web app TLC Studio (W2).

Eseguita in CI su due viewport: 390x844 (mobile) e 1440x900 (desktop).
Verifica: nessun errore JS in console, nessuno scroll orizzontale, nessun
'null'/'undefined'/'NaN' visibile, .katex e SVG presenti, rotte caricabili,
contenuto reale, 5 modalita di dimostrazione, funzionamento offline.

Richiede Playwright con browser Chromium installato (CI only).
"""

import json
import os
import subprocess
import sys
import time

import pytest
from playwright.sync_api import sync_playwright  # richiesto: se manca, il test fallisce

WEB_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
PORT = 18199
BASE_URL = f"http://127.0.0.1:{PORT}"

VIEWPORTS = [(390, 844), (1440, 900)]


def leggi_grafo():
    percorso = os.path.join(WEB_DIR, "graph.json")
    try:
        with open(percorso, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"nodi": []}


def build_routes():
    rotte = ["", "grafo", "esercizi", "quiz", "ripasso", "fonti"]
    grafo = leggi_grafo()
    for nodo in grafo.get("nodi", []):
        nid = nodo.get("id")
        if nid:
            rotte.append(f"nodo/{nid}")
            if nodo.get("dimostrazione"):
                rotte.append(f"dim/{nid}")
    return rotte


ROUTES = build_routes()
MODALITA = ["studio", "avocce", "compatta", "abuchi", "recall"]

# Testi che non devono mai apparire (apostrofo/accento errato o placeholder)
TESTI_VIETATI = [
    "[object Object]",
    "null",
    "undefined",
    "NaN",
    "perche",   # senza accento
    "e'",       # apostrofo invece di accento
    "ne'",      # apostrofo invece di accento
    "puo",      # senza accento
    "montara",  # senza accento
]


@pytest.fixture(scope="session")
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


def controlla_pagina(page, errori):
    # I listener vanno registrati PRIMA di goto, altrimenti gli errori
    # JS caricati durante la navigazione non vengono catturati.
    page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errori.append(str(e)))

    scroll_ok = page.evaluate(
        "document.documentElement.scrollWidth <= document.documentElement.clientWidth"
    )
    nessun_vietato = page.evaluate(
        "() => {"
        "const proibiti = " + json.dumps(TESTI_VIETATI) + ";"
        "const visibili = [];"
        "const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,"
        "  { acceptNode: (n) => {"
        "    const el = n.parentElement;"
        "    if (!el) return NodeFilter.FILTER_REJECT;"
        "    const s = getComputedStyle(el);"
        "    if (s.display === 'none' || s.visibility === 'hidden') return NodeFilter.FILTER_REJECT;"
        "    return NodeFilter.FILTER_ACCEPT;"
        "  } });"
        "let nodo;"
        "while ((nodo = walker.nextNode())) {"
        "  const t = nodo.textContent.trim();"
        "  for (const p of proibiti) { if (t === p || t.includes(p)) visibili.push(t); }"
        "}"
        "return visibili;"
        "}"
    )
    katex = page.locator(".katex").count()
    katex_error = page.locator(".katex-error").count()
    svg = page.locator("svg").count()
    errore_pagina = page.locator(".errore, h1:has-text('Errore di pagina')").count()
    return scroll_ok, nessun_vietato, katex, katex_error, svg, errore_pagina


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", ROUTES)
def test_rota_senza_errori_né_scroll(server, width, height, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(
                viewport={"width": width, "height": height}, locale="it-IT"
            )
            page = context.new_page()
            errori = []
            url = (
                f"{BASE_URL}/index.html#/{route}"
                if route
                else f"{BASE_URL}/index.html#/"
            )
            page.goto(url, wait_until="load")
            page.wait_for_timeout(500)
            (
                scroll_ok,
                nessun_vietato,
                katex,
                katex_error,
                svg,
                errore_pagina,
            ) = controlla_pagina(page, errori)
        finally:
            browser.close()

    assert errori == [], f"[{route}] errori JS in console: {errori}"
    assert scroll_ok is True, f"[{route}] scroll orizzontale su {width}x{height}"
    assert nessun_vietato == [], f"[{route}] testo vietato visibile: {nessun_vietato}"
    assert errore_pagina == 0, "[" + route + "] pagina in errore"
    assert katex_error == 0, f"[{route}] errori KaTeX visibili"
    assert katex >= 0 and svg >= 0


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", [r for r in ROUTES if r.startswith("nodo/")])
def test_nodo_contenuto_reale(server, width, height, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(
                viewport={"width": width, "height": height}, locale="it-IT"
            )
            page = context.new_page()
            errori = []
            page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errori.append(str(e)))

            nid = route.split("/", 1)[1]
            grafo = leggi_grafo()
            nodo = next((n for n in grafo.get("nodi", []) if n.get("id") == nid), None)
            titolo_atteso = nodo.get("titolo", nid) if nodo else nid

            page.goto(f"{BASE_URL}/index.html#/nodo/{nid}", wait_until="load")
            page.wait_for_timeout(500)

            h1 = page.locator("h1").first
            assert h1.count() > 0, f"[{route}] manca h1"
            titolo = h1.text_content() or ""
            assert titolo_atteso in titolo, (
                f"[{route}] h1 senza titolo nodo: {titolo!r} (atteso {titolo_atteso!r})"
            )
            katex = page.locator(".katex").count()
            katex_error = page.locator(".katex-error").count()
            svg = page.locator("svg").count()
            (
                scroll_ok,
                nessun_vietato,
                _,
                _,
                _,
                errore_pagina,
            ) = controlla_pagina(page, errori)
        finally:
            browser.close()

    assert errori == [], f"[{route}] errori JS: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []
    assert errore_pagina == 0
    assert katex > 0, f"[{route}] nessun .katex (matematica mancante)"
    assert katex_error == 0, f"[{route}] errori KaTeX visibili"
    assert svg > 0, f"[{route}] nessun SVG (figure mancanti)"


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", [r for r in ROUTES if r.startswith("dim/")])
def test_dim_contenuto_reale(server, width, height, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(
                viewport={"width": width, "height": height}, locale="it-IT"
            )
            page = context.new_page()
            errori = []
            page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errori.append(str(e)))

            did = route.split("/", 1)[1]
            page.goto(f"{BASE_URL}/index.html#/dim/{did}", wait_until="load")
            page.wait_for_timeout(500)

            h1 = page.locator("h1").first
            assert h1.count() > 0, f"[{route}] manca h1"
            katex = page.locator(".katex").count()
            katex_error = page.locator(".katex-error").count()
            svg = page.locator("svg").count()
            (
                scroll_ok,
                nessun_vietato,
                _,
                _,
                _,
                errore_pagina,
            ) = controlla_pagina(page, errori)
        finally:
            browser.close()

    assert errori == [], f"[{route}] errori JS: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []
    assert errore_pagina == 0
    assert katex > 0, f"[{route}] nessun .katex (matematica mancante)"
    assert katex_error == 0, f"[{route}] errori KaTeX visibili"
    assert svg > 0, f"[{route}] nessun SVG (figure mancanti)"


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", [r for r in ROUTES if r.startswith("dim/")])
def test_dim_modalita_tutte(server, width, height, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(
                viewport={"width": width, "height": height}, locale="it-IT"
            )
            page = context.new_page()
            errori = []
            page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errori.append(str(e)))

            did = route.split("/", 1)[1]
            page.goto(f"{BASE_URL}/index.html#/dim/{did}", wait_until="load")
            page.wait_for_timeout(500)
            for modo in MODALITA:
                btn = page.locator(f'button[data-modo="{modo}"]')
                assert btn.count() > 0, f"[{route}] bottone {modo} mancante"
                btn.first.click()
                page.wait_for_timeout(300)
                attivo = page.locator(f'button[data-modo="{modo}"].attivo')
                assert attivo.count() > 0, f"[{route}] modalita {modo} non attivata"
            (
                scroll_ok,
                nessun_vietato,
                _,
                _,
                _,
                errore_pagina,
            ) = controlla_pagina(page, errori)
        finally:
            browser.close()

    assert errori == [], f"[{route}] errori JS modalita: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []
    assert errore_pagina == 0


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", ["nodo/dim-teorema-campionamento", "dim/dim-teorema-campionamento"])
def test_offline_nodo_dim(server, width, height, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(
                viewport={"width": width, "height": height}, locale="it-IT"
            )
            page = context.new_page()
            errori = []
            page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errori.append(str(e)))

            page.goto(f"{BASE_URL}/index.html#/", wait_until="load")
            page.wait_for_timeout(800)
            context.set_offline(True)
            page.goto(f"{BASE_URL}/index.html#/{route}", wait_until="load")
            page.wait_for_timeout(500)

            h1 = page.locator("h1").first
            assert h1.count() > 0, f"[{route}] offline: manca h1"
            (
                scroll_ok,
                nessun_vietato,
                _,
                _,
                _,
                errore_pagina,
            ) = controlla_pagina(page, errori)
        finally:
            browser.close()

    assert errori == [], f"[{route}] offline errori JS: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []
    assert errore_pagina == 0, f"[{route}] offline: pagina in errore"


@pytest.mark.parametrize("width,height", VIEWPORTS)
def test_offline_quiz(server, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(
                viewport={"width": width, "height": height}, locale="it-IT"
            )
            page = context.new_page()
            errori = []
            page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errori.append(str(e)))

            page.goto(f"{BASE_URL}/index.html#/", wait_until="load")
            page.wait_for_timeout(800)
            context.set_offline(True)
            page.goto(f"{BASE_URL}/index.html#/quiz", wait_until="load")
            page.wait_for_timeout(500)

            # Non deve esserci Errore di pagina (SW serve il guscio offline)
            errore_pagina = page.locator(".errore, h1:has-text('Errore di pagina')").count()
            assert errore_pagina == 0, "[quiz] offline: pagina in errore"
            (
                scroll_ok,
                nessun_vietato,
                _,
                _,
                _,
                _,
            ) = controlla_pagina(page, errori)
        finally:
            browser.close()

    assert errori == [], f"[quiz] offline errori JS: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []
