"""E2E Playwright — criterio B13 (Manuale): .chiave, indice, figure numerate,
#/area/<n> con >= 3 criteri da saper_fare, nav prev/succ, ?sezione=."""
import json
import os
import subprocess
import sys
import time

import pytest
from playwright.sync_api import sync_playwright

WEB_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
PORT = 18198
BASE_URL = f"http://127.0.0.1:{PORT}"
VIEWPORTS = [(390, 844), (1440, 900)]


def leggi_grafo():
    percorso = os.path.join(WEB_DIR, "graph.json")
    try:
        with open(percorso, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"nodi": [], "aree": []}


def build_routes():
    rotte = ["", "grafo", "esercizi", "quiz", "ripasso", "fonti"]
    grafo = leggi_grafo()
    for nodo in grafo.get("nodi", []):
        nid = nodo.get("id")
        if nid:
            rotte.append(f"nodo/{nid}")
            if nodo.get("dimostrazione"):
                rotte.append(f"dim/{nid}")
    for a in grafo.get("aree", []) or []:
        rotte.append(f"area/{a.get('id')}")
    return rotte


ROUTES = build_routes()
GRAFO = leggi_grafo()


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


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", ROUTES)
def test_b13_manuale_niente_scroll_né_errori(server, browser, width, height, route):
    context = browser.new_context(viewport={"width": width, "height": height}, locale="it-IT")
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)
        url = f"{BASE_URL}/index.html#/{route}" if route else f"{BASE_URL}/index.html#/"
        page.goto(url, wait_until="load")
        page.wait_for_timeout(150)
        scroll_ok = page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        h1 = page.locator("h1").count()
    finally:
        context.close()

    assert errori == [], f"[{route}] errori JS: {errori}"
    assert scroll_ok is True, f"[{route}] scroll orizzontale su {width}x{height}"
    assert h1 > 0, f"[{route}] manca h1"


@pytest.mark.parametrize("width,height", [(390, 844), (1440, 900)])
@pytest.mark.parametrize("narea", [1, 2, 3, 4, 5, 6, 7])
def test_b13_area_criteri_da_saper_fare(server, browser, width, height, narea):
    context = browser.new_context(viewport={"width": width, "height": height}, locale="it-IT")
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)
        page.goto(f"{BASE_URL}/index.html#/area/{narea}", wait_until="load")
        page.wait_for_timeout(150)

        h1 = page.locator("h1").first
        assert h1.count() > 0, f"[area/{narea}] manca h1"
        titolo = h1.text_content() or ""
        assert f"Capitolo {narea}" in titolo, f"[area/{narea}] h1 senza numero capitolo: {titolo!r}"

        # >= 3 criteri da saper_fare nella lista .area-criteri
        criteri = page.locator(".area-criteri li").count()
        assert criteri >= 3, f"[area/{narea}] criteri da saper_fare: {criteri} (attesi >= 3)"

        # Nav capitoli prev/succ
        nav = page.locator(".area-nav")
        assert nav.count() > 0, f"[area/{narea}] manca nav capitoli"

        # Nessun testo inventato: ogni criterio deve corrispondere a un saper_fare del grafo
        grafo = leggi_grafo()
        nodi_area = [n for n in grafo.get("nodi", []) if n.get("area") == narea]
        saper_fare_tutti = []
        for n in nodi_area:
            saper_fare_tutti.extend(n.get("saper_fare", []) or [])
        testi_criteri = page.locator(".area-criteri li").all_text_contents()
        for testo in testi_criteri:
            assert any(testo == sf for sf in saper_fare_tutti), (
                f"[area/{narea}] criterio non trovato in saper_fare: {testo!r}"
            )

        scroll_ok = page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        assert scroll_ok is True
        assert not errori, f"[area/{narea}] errori JS: {errori}"
    finally:
        context.close()


@pytest.mark.parametrize("width,height", [(390, 844), (1440, 900)])
def test_b13_nodo_chiave_indice_figurenumerate(server, browser, width, height):
    """Su un nodo con lezione: .chiave, indice >= 2 voci, figure 'Figura n.m'."""
    nid = "dim-teorema-campionamento"
    nodo = next((n for n in GRAFO.get("nodi", []) if n.get("id") == nid), None)
    if not nodo or not nodo.get("lezione"):
        pytest.skip(f"nodo {nid} senza lezione")
    context = browser.new_context(viewport={"width": width, "height": height}, locale="it-IT")
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)
        page.goto(f"{BASE_URL}/index.html#/nodo/{nid}", wait_until="load")
        page.wait_for_timeout(150)

        # .chiave presente e visibile nel primo viewport
        chiave = page.locator(".chiave")
        assert chiave.count() > 0, f"[{nid}] manca .chiave"
        assert chiave.first.is_visible(), f"[{nid}] .chiave non visibile"

        # Indice con >= 2 voci e ancore funzionanti
        indice = page.locator(".indice-in-testa .indice-pagina li")
        assert indice.count() >= 2, f"[{nid}] indice con {indice.count()} voci (attese >= 2)"

        # Ogni ancore dell'indice punta a un id esistente
        hrefs = indice.locator("a").evaluate_all("els => els.map(e => e.getAttribute('href'))")
        for href in hrefs:
            target = href.lstrip("#")
            assert page.locator(f"#{target}").count() > 0, f"[{nid}] ancore indice {href} senza target"

        # Figure numerate "Figura n.m" in ordine
        figNumeri = page.locator(".figura-numerata .figure__numero").all_text_contents()
        if figNumeri:
            numeri = []
            for t in figNumeri:
                puro = t.replace("Figura ", "").strip()
                if puro.isdigit():
                    numeri.append(int(puro))
            assert numeri == sorted(numeri), f"[{nid}] numeri figure non ordinati: {numeri}"

        scroll_ok = page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        assert scroll_ok is True
        assert not errori, f"[{nid}] errori JS: {errori}"
    finally:
        context.close()


@pytest.mark.parametrize("width,height", [(390, 844), (1440, 900)])
def test_b13_nav_sequenza_prev_succ(server, browser, width, height):
    """Nav precedente/successivo coerente con ordine piano di studio."""
    nid = "serie-fourier"
    context = browser.new_context(viewport={"width": width, "height": height}, locale="it-IT")
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)
        page.goto(f"{BASE_URL}/index.html#/nodo/{nid}", wait_until="load")
        page.wait_for_timeout(150)

        nav = page.locator(".nav-sequenza")
        assert nav.count() > 0, f"[{nid}] manca nav sequenza"

        link = nav.locator("a")
        assert link.count() >= 1, f"[{nid}] nav senza link"

        # Ogni link punta a un nodo esistente
        hrefs = link.evaluate_all("els => els.map(e => e.getAttribute('href'))")
        grafo = leggi_grafo()
        idValidi = set(n.get("id") for n in grafo.get("nodi", []))
        for href in hrefs:
            idDest = href.replace("#/nodo/", "")
            assert idDest in idValidi, f"[{nid}] link nav verso nodo inesistente: {idDest}"

        scroll_ok = page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        assert scroll_ok is True
        assert not errori, f"[{nid}] errori JS: {errori}"
    finally:
        context.close()
