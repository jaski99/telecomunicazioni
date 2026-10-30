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
    nid = "serie-fourier"
    nodo = next((n for n in GRAFO.get("nodi", []) if n.get("id") == nid), None)
    assert nodo and nodo.get("lezione"), f"nodo {nid} deve avere lezione"
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
            assert href.startswith(f"#/nodo/{nid}?sezione="), href
            numero = href.split("?sezione=", 1)[1]
            assert numero.isdigit() and page.locator(f"#sez-{numero}").count() == 1, href

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
            tipo, idDest = href.removeprefix("#/").split("/", 1)
            assert idDest in idValidi, f"[{nid}] link nav verso nodo inesistente: {idDest}"
            destinazione = next(n for n in grafo["nodi"] if n["id"] == idDest)
            assert tipo == ("dim" if destinazione.get("dimostrazione") else "nodo")

        scroll_ok = page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        assert scroll_ok is True
        assert not errori, f"[{nid}] errori JS: {errori}"
    finally:
        context.close()


def test_listener_rivelatore_dopo_navigazioni(server, browser):
    page = browser.new_page()
    page.goto(f"{server}/index.html#/nodo/serie-fourier", wait_until="load")
    page.wait_for_selector(".js-rivelatore")
    page.goto(f"{server}/index.html#/nodo/energia-potenza-spettri", wait_until="load")
    page.wait_for_selector(".js-rivelatore")
    page.evaluate("location.hash = '#/nodo/serie-fourier'")
    page.wait_for_selector(".nodo-testata h1:has-text('Serie di Fourier')")
    button = page.locator(".js-rivelatore").first
    button.click()
    assert button.get_attribute("aria-expanded") == "true"
    assert page.locator("#" + button.get_attribute("data-target")).is_visible()
    button.click()
    assert button.get_attribute("aria-expanded") == "false"
    page.close()


def test_link_dimostrazioni_capitoli_e_sequenza(server, browser):
    page = browser.new_page()
    nodi = GRAFO['nodi']
    for area in GRAFO['aree']:
        page.goto(f"{server}/index.html#/area/{area['id']}", wait_until="load")
        page.wait_for_selector('.area-criteri')
        for nodo in (n for n in nodi if n['area'] == area['id'] and n.get('dimostrazione')):
            assert page.locator(f".area-node__titolo[href='#/dim/{nodo['id']}']").count() == 1
    for nodo in (n for n in nodi if n.get('lezione')):
        page.goto(f"{server}/index.html#/nodo/{nodo['id']}", wait_until="load")
        page.wait_for_selector('.nav-sequenza')
        for href in page.locator('.nav-sequenza a').evaluate_all("els => els.map(e => e.getAttribute('href'))"):
            tipo, ident = href.removeprefix('#/').split('/', 1)
            destinazione = next(n for n in nodi if n['id'] == ident)
            assert tipo == ('dim' if destinazione.get('dimostrazione') else 'nodo')
    page.close()


def test_indice_permalink_e_chiave(server, browser):
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(f"{server}/index.html#/nodo/serie-fourier", wait_until="load")
    page.wait_for_selector('.indice-pagina a')
    assert page.locator('nav nav').count() == 0
    chiave = page.locator('.chiave')
    assert chiave.locator('.blocco__etichetta').text_content() == 'Da ricordare'
    assert chiave.evaluate("e => parseFloat(getComputedStyle(e).paddingLeft)") >= 16
    assert chiave.locator('.formula-inline, .formula-box').count() >= 1
    href = page.locator('.indice-pagina a').nth(1).get_attribute('href')
    assert href.startswith('#/nodo/serie-fourier?sezione=')
    page.locator('.indice-pagina a').nth(1).click()
    page.wait_for_function("href => location.hash === href", arg=href)
    numero = href.split('=')[-1]
    assert page.locator(f'#sez-{numero}').is_visible()
    page.close()


def test_listener_capitolo_dopo_navigazioni(server, browser):
    page = browser.new_page()
    page.goto(f"{server}/index.html#/area/1", wait_until="load")
    page.wait_for_selector('.area-risposta')
    page.evaluate("location.hash = '#/area/2'")
    page.wait_for_selector('h1:has-text("Capitolo 2")')
    page.evaluate("location.hash = '#/area/1'")
    page.wait_for_selector('h1:has-text("Capitolo 1")')
    button = page.locator('.area-risposta').first
    button.click()
    assert button.get_attribute('aria-expanded') == 'true'
    assert button.locator('+ .area-soluzione').inner_text()
    button.click()
    assert button.get_attribute('aria-expanded') == 'false'
    page.close()


@pytest.mark.parametrize('nodo', [n for n in GRAFO['nodi'] if n.get('dimostrazione')], ids=lambda n: n['id'])
def test_nodi_dimostrazione_chiave_e_indice(server, browser, nodo):
    page = browser.new_page()
    page.goto(f"{server}/index.html#/nodo/{nodo['id']}", wait_until='load')
    page.wait_for_selector('.indice-pagina a')
    assert page.locator('.chiave').count() == 1
    assert page.locator('.indice-pagina a').count() >= 2
    assert 'Indice non disponibile.' not in page.locator('#app').inner_text()
    for href in page.locator('.indice-pagina a').evaluate_all('els => els.map(e => e.getAttribute("href"))'):
        assert href.startswith(f"#/nodo/{nodo['id']}?sezione=")
        numero = href.split('=')[-1]
        assert numero.isdigit() and page.locator(f'#sez-{numero}').count() == 1
    page.close()


@pytest.mark.parametrize('nodo', [n for n in GRAFO['nodi'] if n.get('lezione')], ids=lambda n: n['id'])
def test_tutti_campi_testuali_lezione(server, browser, nodo):
    import re
    page = browser.new_page()
    page.goto(f"{server}/index.html#/nodo/{nodo['id']}", wait_until='load')
    page.wait_for_selector('.indice-pagina')
    page.wait_for_function("() => !document.querySelector('[data-latex]')")
    testo = page.locator('#app').evaluate("""e => {
      const c = e.cloneNode(true);
      c.querySelectorAll('.katex, svg').forEach(x => x.remove());
      return c.textContent;
    }""")
    normalizza = lambda s: re.sub(r'[\W_]+', '', s, flags=re.UNICODE).lower()
    testo = normalizza(testo)
    def stringhe(x, path=''):
        if isinstance(x, dict):
            for k, v in x.items():
                if k not in ('id', 'figure'):
                    yield from stringhe(v, f'{path}.{k}')
        elif isinstance(x, list):
            for v in x:
                yield from stringhe(v, path)
        elif isinstance(x, str):
            yield path, x
    campi = list(stringhe(nodo['lezione']))
    for figura in nodo['lezione'].get('figure', []):
        for campo in ('titolo', 'descrizione'):
            if figura.get(campo):
                campi.append((f'.figure.{campo}', figura[campo]))
    for path, value in campi:
        value = re.sub(r'(?:,\s*di competenza di|\s+da)\s+W[1-6]\b', '', value)
        # Confronta tutti i frammenti di prosa; le formule sono renderizzate da KaTeX.
        for parte in re.split(r'\$\$.*?\$\$|\$[^$]*\$|\n+', value, flags=re.S):
            parte = normalizza(parte)
            if parte:
                assert parte in testo, f"{nodo['id']} {path}: {parte[:100]}"
    blocchi = page.locator('.errore-blocco')
    assert blocchi.count() == len(nodo['lezione'].get('errori_trappole', []))
    for i, errore in enumerate(nodo['lezione'].get('errori_trappole', [])):
        blocco = blocchi.nth(i)
        labels = blocco.locator('.blocco__etichetta').all_text_contents()
        assert 'Errore' in labels and 'Perché è sbagliato' in labels
        assert ('Correzione' in labels) == bool(errore.get('correzione'))
    page.close()


@pytest.mark.parametrize('nodo', [n for n in GRAFO['nodi'] if n.get('lezione') or n.get('dimostrazione')], ids=lambda n: n['id'])
def test_chiave_corrisponde_a_frase_intera(server, browser, nodo):
    import re
    page = browser.new_page()
    page.goto(f"{server}/index.html#/nodo/{nodo['id']}", wait_until='load')
    page.wait_for_selector('.chiave')
    page.wait_for_function("() => !document.querySelector('[data-latex]')")
    lezione = nodo.get('lezione') or {}
    fonte = lezione.get('riepilogo') or (lezione.get('definizione_esame') or {}).get('definizione') or nodo.get('dimostrazione', {}).get('idea')
    frase = page.evaluate("""async fonte => {
      const { primaFrase } = await import('./js/pages/nodo/chiave.js');
      return primaFrase(fonte);
    }""", fonte)
    assert frase and fonte.startswith(frase) and frase[-1] in '.!?'
    blocco = page.locator('.chiave')
    testo = blocco.evaluate("""e => {
      const c = e.cloneNode(true);
      c.querySelectorAll('.katex, .blocco__etichetta').forEach(x => x.remove());
      return c.textContent;
    }""")
    normalizza = lambda s: re.sub(r'[\W_]+', '', s, flags=re.UNICODE).lower()
    parti = re.split(r'\$\$.*?\$\$|\$[^$]*\$', frase, flags=re.S)
    assert normalizza(''.join(parti)) == normalizza(testo)
    formule = re.findall(r'\$\$(.*?)\$\$|\$([^$]*?)\$', frase, flags=re.S)
    attese = [a or b for a, b in formule]
    trovate = blocco.locator('.katex-mathml annotation[encoding="application/x-tex"]').all_text_contents()
    assert trovate == attese
    page.close()
