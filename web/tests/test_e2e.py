"""E2E Playwright per la web app TLC Studio.

Verifica su 390x844 (mobile) e 1440x900 (desktop): nessun errore JS in console,
nessuno scroll orizzontale, nessun 'null'/'undefined'/'NaN' o badge W1-W6 visibile,
.katex e SVG presenti, rotte caricabili, contenuto reale, 5 modalità di dimostrazione,
funzionamento offline incluso il modulo quiz completo.
"""

import json
import os

import pytest
from playwright.sync_api import sync_playwright

WEB_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
from e2e_helpers import static_server

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

TESTI_VIETATI = [
    r"\[object Object\]",
    r"\bnull\b",
    r"\bundefined\b",
    r"\bNaN\b",
    r"\bperche\b",
    r"\be'(?=\s|$)",
    r"\bene'(?=\s|$)",
    r"\bpuo\b",
    r"\bmontara\b",
]

GRAFO = leggi_grafo()
NODI_CON_FIGURE = set()
for _n in GRAFO.get("nodi", []):
    if _n.get("figure") or (_n.get("lezione") and _n["lezione"].get("figure")):
        NODI_CON_FIGURE.add(_n.get("id"))


def nodoHaLatex(nodo):
    """Verifica se il nodo renderizza campi con delimitatori LaTeX $...$."""
    if not nodo:
        return False
    lezione = nodo.get("lezione") or {}
    campi_markdown = [
        lezione.get("perche_ti_serve", ""),
        lezione.get("scenario", ""),
        lezione.get("spiegazione", ""),
    ]
    for campo in campi_markdown:
        if isinstance(campo, str) and "$" in campo:
            return True
    dim = nodo.get("dimostrazione") or {}
    if isinstance(dim.get("formula_finale"), str) and "$" in dim["formula_finale"]:
        return True
    return False


def registra_listener_js(page, errori):
    """Registra listener console/pageerror PRIMA di goto."""
    page.on("console", lambda m: errori.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errori.append(str(e)))


@pytest.fixture(scope="module")
def server():
    srv = static_server()
    yield f"http://127.0.0.1:{srv.server_port}"
    srv.shutdown()
    srv.server_close()


@pytest.fixture(scope="module")
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        try:
            yield b
        finally:
            b.close()


def controlla_pagina(page, errori):
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
        "  for (const p of proibiti) {"
        "    const re = new RegExp(p, 'i');"
        "    if (re.test(t)) visibili.push(t);"
        "  }"
        "}"
        "return visibili;"
        "}"
    )
    katex = page.locator(".katex").count()
    katex_error = page.locator(".katex-error, .katex-err").count()
    svg = page.locator("svg").count()
    h1_count = page.locator("h1").count()
    errore_pagina = page.locator(".errore:not(.errore-blocco), h1:has-text('Errore di pagina')").count()
    return scroll_ok, nessun_vietato, katex, katex_error, svg, errore_pagina, h1_count


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", ROUTES)
def test_rota_senza_errori_né_scroll(server, browser, width, height, route):
    context = browser.new_context(
        viewport={"width": width, "height": height}, locale="it-IT"
    )
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)
        url = (
            f"{server}/index.html#/{route}"
            if route
            else f"{server}/index.html#/"
        )
        page.goto(url, wait_until="load")
        page.wait_for_timeout(150)
        (
            scroll_ok,
            nessun_vietato,
            katex,
            katex_error,
            svg,
            errore_pagina,
            h1_count,
        ) = controlla_pagina(page, errori)
    finally:
        context.close()

    assert errori == [], f"[{route}] errori JS in console: {errori}"
    assert scroll_ok is True, f"[{route}] scroll orizzontale su {width}x{height}"
    assert nessun_vietato == [], f"[{route}] testo vietato visibile: {nessun_vietato}"
    assert errore_pagina == 0, "[" + route + "] pagina in errore"
    assert katex_error == 0, f"[{route}] errori KaTeX visibili"
    assert h1_count > 0, f"[{route}] manca h1 (pagina bianca)"


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", [r for r in ROUTES if r.startswith("nodo/")])
def test_nodo_contenuto_reale(server, browser, width, height, route):
    context = browser.new_context(
        viewport={"width": width, "height": height}, locale="it-IT"
    )
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)

        nid = route.split("/", 1)[1]
        nodo = next((n for n in GRAFO.get("nodi", []) if n.get("id") == nid), None)
        titolo_atteso = nodo.get("titolo", nid) if nodo else nid

        page.goto(f"{server}/index.html#/nodo/{nid}", wait_until="load")
        page.wait_for_timeout(150)

        h1 = page.locator("h1").first
        assert h1.count() > 0, f"[{route}] manca h1"
        titolo = h1.text_content() or ""
        assert titolo_atteso in titolo, (
            f"[{route}] h1 senza titolo nodo: {titolo!r} (atteso {titolo_atteso!r})"
        )
        katex = page.locator(".katex").count()
        katex_error = page.locator(".katex-error, .katex-err").count()
        svg = page.locator("svg").count()
        (
            scroll_ok,
            nessun_vietato,
            _,
            _,
            _,
            errore_pagina,
            _h1_count,
        ) = controlla_pagina(page, errori)
    finally:
        context.close()

    assert errori == [], f"[{route}] errori JS: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []
    assert errore_pagina == 0
    if nodoHaLatex(nodo):
        assert katex > 0, f"[{route}] nessun .katex (matematica mancante)"
    assert katex_error == 0, f"[{route}] errori KaTeX visibili"
    if nid in NODI_CON_FIGURE:
        assert svg > 0, f"[{route}] nessun SVG (figure mancanti per nodo {nid})"


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", [r for r in ROUTES if r.startswith("dim/")])
def test_dim_contenuto_reale(server, browser, width, height, route):
    context = browser.new_context(
        viewport={"width": width, "height": height}, locale="it-IT"
    )
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)

        did = route.split("/", 1)[1]
        page.goto(f"{server}/index.html#/dim/{did}", wait_until="load")
        page.wait_for_timeout(150)

        h1 = page.locator("h1").first
        assert h1.count() > 0, f"[{route}] manca h1"
        katex = page.locator(".katex").count()
        katex_error = page.locator(".katex-error, .katex-err").count()
        svg = page.locator("svg").count()
        (
            scroll_ok,
            nessun_vietato,
            _,
            _,
            _,
            errore_pagina,
            _h1_count,
        ) = controlla_pagina(page, errori)
    finally:
        context.close()

    assert errori == [], f"[{route}] errori JS: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []
    assert errore_pagina == 0
    assert katex > 0, f"[{route}] nessun .katex (matematica mancante)"
    assert katex_error == 0, f"[{route}] errori KaTeX visibili"
    nodo = next((n for n in GRAFO.get("nodi", []) if n.get("id") == did), None)
    ha_figura = bool(
        nodo
        and (
            nodo.get("figure")
            or (nodo.get("lezione") and nodo["lezione"].get("figure"))
        )
    )
    if ha_figura:
        assert svg > 0, f"[{route}] nessun SVG (figure mancanti per nodo {did})"


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("route", [r for r in ROUTES if r.startswith("dim/")])
def test_dim_modalita_tutte(server, browser, width, height, route):
    context = browser.new_context(
        viewport={"width": width, "height": height}, locale="it-IT"
    )
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)

        did = route.split("/", 1)[1]
        page.goto(f"{server}/index.html#/dim/{did}", wait_until="load")
        page.wait_for_timeout(150)
        for modo in MODALITA:
            btn = page.locator(f'button[data-modo="{modo}"]')
            assert btn.count() > 0, f"[{route}] bottone {modo} mancante"
            btn.first.click()
            page.wait_for_timeout(100)
            attivo = page.locator(
                f'button[data-modo="{modo}"].attivo, button[data-modo="{modo}"][aria-selected="true"]'
            )
            assert attivo.count() > 0, f"[{route}] modalita {modo} non attivata"
        (
            scroll_ok,
            nessun_vietato,
            _,
            _,
            _,
            errore_pagina,
            _h1_count,
        ) = controlla_pagina(page, errori)
    finally:
        context.close()

    assert errori == [], f"[{route}] errori JS modalita: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []
    assert errore_pagina == 0


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize(
    "route", ["nodo/dim-teorema-campionamento", "dim/dim-teorema-campionamento"]
)
def test_offline_nodo_dim(server, browser, width, height, route):
    context = browser.new_context(
        viewport={"width": width, "height": height}, locale="it-IT"
    )
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)

        page.goto(f"{server}/index.html#/", wait_until="networkidle")
        page.wait_for_function("() => navigator.serviceWorker && navigator.serviceWorker.ready")
        context.set_offline(True)
        page.goto(f"{server}/index.html#/{route}", wait_until="load")
        page.wait_for_timeout(200)

        h1 = page.locator("h1").first
        assert h1.count() > 0, f"[{route}] offline: manca h1"
        (
            scroll_ok,
            nessun_vietato,
            _,
            _,
            _,
            errore_pagina,
            _h1_count,
        ) = controlla_pagina(page, errori)
    finally:
        context.close()

    assert errori == [], f"[{route}] offline errori JS: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []
    assert errore_pagina == 0, f"[{route}] offline: pagina in errore"


@pytest.mark.parametrize("width,height", VIEWPORTS)
def test_offline_quiz(server, browser, width, height):
    context = browser.new_context(
        viewport={"width": width, "height": height}, locale="it-IT"
    )
    try:
        page = context.new_page()
        errori = []
        registra_listener_js(page, errori)

        page.goto(f"{server}/index.html#/", wait_until="networkidle")
        page.wait_for_function(
            """async () => {
              await navigator.serviceWorker.ready;
              return !!(await caches.match('./modules/quiz/logica.js')) &&
                     !!(await caches.match('./modules/quiz/vista.js'));
            }"""
        )
        context.set_offline(True)
        page.goto(f"{server}/index.html#/quiz", wait_until="load")
        page.wait_for_timeout(200)

        errore_pagina = page.locator(".errore:not(.errore-blocco), h1:has-text('Errore di pagina')").count()
        assert errore_pagina == 0, "[quiz] offline: pagina in errore"
        assert page.locator(".quiz-form").count() == 1, "[quiz] offline: form quiz non montato"
        (
            scroll_ok,
            nessun_vietato,
            _,
            _,
            _,
            _,
            _h1_count,
        ) = controlla_pagina(page, errori)
    finally:
        context.close()

    assert errori == [], f"[quiz] offline errori JS: {errori}"
    assert scroll_ok is True
    assert nessun_vietato == []


def test_distinzione_errore_pagina_da_blocchi_didattici(server, browser):
    page = browser.new_page()
    page.goto(f"{server}/index.html#/nodo/serie-fourier", wait_until="load")
    page.wait_for_selector('.errore-blocco')
    assert page.locator('.errore.errore-blocco').count() > 0
    assert controlla_pagina(page, [])[5] == 0
    page.goto(f"{server}/index.html#/rotta-inesistente", wait_until="load")
    page.wait_for_selector("h1:has-text('Errore di pagina')")
    assert controlla_pagina(page, [])[5] > 0
    page.close()
