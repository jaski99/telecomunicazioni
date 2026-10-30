"""E2E Playwright per formule e figure (criteri A6, A7, A9, A10) — worker D2.

Usa web/tests/e2e_helpers.py (main) per server, rotte e report KaTeX/SVG.
Eseguire dopo `python scripts/kg.py build && sh web/build.sh` così che web/graph.json esista.
Richiede Playwright con Chromium.
"""

import json
import os
import re
import sys

import pytest
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import WEB, routes, static_server, console_errors  # noqa: E402

WEB_DIR = str(WEB)
VIEWPORTS = [(360, 780), (390, 844), (1440, 900)]

DISPLAY_CMD = re.compile(r"\\(?:frac|dfrac|sum|int|prod|lim)")


def leggi_grafo():
    percorso = os.path.join(WEB_DIR, "graph.json")
    with open(percorso, "r", encoding="utf-8") as f:
        return json.load(f)


def promuovibile(s):
    """True se una formula inline sorgente viene promossa in display (§3.2)."""
    return bool(s) and len(s) > 40 and bool(DISPLAY_CMD.search(s))


def atteso_display(dim):
    conta = 0
    for p in (dim.get("passi") or []):
        if promuovibile(p.get("formula")):
            conta += 1
    if promuovibile(dim.get("formula_finale")):
        conta += 1
    return conta


def build_routes():
    grafo = leggi_grafo()
    rotte = []
    for nodo in grafo.get("nodi", []):
        nid = nodo.get("id")
        if nid:
            rotte.append(("nodo", nid))
            if nodo.get("dimostrazione"):
                rotte.append(("dim", nid))
    return rotte


ROUTES = build_routes()


# Un solo oggetto passato a page.evaluate (coordinatore: niente 3 argomenti).
JS_MISURE = """
(p) => {
  const atteso = p.attesoDisplay; const isMobile = p.isMobile; const isDesktop = p.isDesktop;
  const r = { katexError: 0, displayCount: 0, displayAtteso: atteso, svgTooWide: 0, textOutside: 0,
              textTooSmall: 0, textTooBig: 0, inlineTooTall: 0, inlineOverlap: 0 };
  r.katexError = document.querySelectorAll('.katex-error, .katex-err').length;
  if (typeof atteso === 'number') { r.displayCount = document.querySelectorAll('.formula-box .katex-display').length; }
  const svgs = document.querySelectorAll('svg');
  const bodyFont = parseFloat(getComputedStyle(document.body).fontSize) || 16;
  for (const svg of svgs) {
    const sr = svg.getBoundingClientRect(); const vb = svg.viewBox.baseVal;
    const scale = sr.width / (vb && vb.width ? vb.width : sr.width);
    if (sr.width > 761) r.svgTooWide++;
    const texts = svg.querySelectorAll('text');
    for (const t of texts) {
      const tr = t.getBoundingClientRect();
      if (tr.right > sr.right + 4 || tr.left < sr.left - 4 || tr.bottom > sr.bottom + 4 || tr.top < sr.top - 4) {
        r.textOutside++;
      }
      const fs = parseFloat(getComputedStyle(t).fontSize) || 0;
      const fsCalcolato = fs * scale; // font-size calcolato x (larghezza resa/viewBox.width)
      if (isMobile && fsCalcolato < 11) r.textTooSmall++;
      if (isDesktop && fsCalcolato > 24) r.textTooBig++;
    }
  }
  const inlineK = Array.from(document.querySelectorAll('.katex')).filter(k => !k.closest('.formula-box'));
  for (const k of inlineK) {
    const rect = k.getBoundingClientRect();
    if (rect.height > 2.4 * bodyFont) r.inlineTooTall++;
  }
  const rows = {};
  for (const k of inlineK) { const rect = k.getBoundingClientRect(); const key = Math.round(rect.top); (rows[key] = rows[key] || []).push(rect); }
  for (const key of Object.keys(rows)) {
    const rects = rows[key].sort((a, b) => a.left - b.left);
    for (let i = 1; i < rects.length; i++) { if (rects[i].left < rects[i - 1].right - 1) r.inlineOverlap++; }
  }
  return r;
}
"""


@pytest.fixture(scope="session")
def server():
    srv = static_server()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


@pytest.mark.parametrize("width,height", VIEWPORTS)
@pytest.mark.parametrize("tipo,idnodo", ROUTES)
def test_formule_e_figura(server, width, height, tipo, idnodo):
    grafo = leggi_grafo()
    nodo = next((n for n in grafo.get("nodi", []) if n.get("id") == idnodo), None)
    atteso = atteso_display(nodo.get("dimostrazione") or {}) if (tipo == "dim" and nodo) else None
    isMobile = width <= 390
    isDesktop = width >= 1440

    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(viewport={"width": width, "height": height}, locale="it-IT")
            page = context.new_page()
            errori = console_errors(page)
            page.goto(f"{server}#/{tipo}/{idnodo}", wait_until="load")
            page.wait_for_timeout(700)
            misure = page.evaluate(JS_MISURE, {"attesoDisplay": atteso, "isMobile": isMobile, "isDesktop": isDesktop})
        finally:
            browser.close()

    assert errori == [], f"[{tipo}/{idnodo}] errori JS {width}x{height}: {errori}"
    assert misure["katexError"] == 0, f"[{tipo}/{idnodo}] errori KaTeX: {misure['katexError']}"
    assert misure["svgTooWide"] == 0, f"[{tipo}/{idnodo}] svg > 760 px: {misure['svgTooWide']}"
    assert misure["textOutside"] == 0, f"[{tipo}/{idnodo}] text fuori viewBox: {misure['textOutside']}"
    if isMobile:
        assert misure["textTooSmall"] == 0, f"[{tipo}/{idnodo}] text svg < 11 px mobile: {misure['textTooSmall']}"
    if isDesktop:
        assert misure["textTooBig"] == 0, f"[{tipo}/{idnodo}] text svg > 24 px desktop: {misure['textTooBig']}"
    assert misure["inlineTooTall"] == 0, f"[{tipo}/{idnodo}] katex inline troppo alti: {misure['inlineTooTall']}"
    assert misure["inlineOverlap"] == 0, f"[{tipo}/{idnodo}] katex inline sovrapposti: {misure['inlineOverlap']}"
    if tipo == "dim" and atteso is not None:
        assert misure["displayCount"] >= atteso, (f"[{tipo}/{idnodo}] display {misure['displayCount']} < atteso {atteso} ({width}x{height})")


@pytest.mark.parametrize("width,height", VIEWPORTS)
def test_tutte_figure_blocchi_geometria_reale(server, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": width, "height": height})
            errori = console_errors(page)
            page.goto(server, wait_until="networkidle")
            risultato = page.evaluate('''async () => {
              const graph = await (await fetch('./graph.json')).json();
              const {renderFigura} = await import('./js/figure/index.js');
              const specs = graph.nodi.flatMap(n => [n.lezione, n.dimostrazione]
                .flatMap(s => (s?.figure || []).filter(f => f.tipo === 'blocchi')));
              const host = document.createElement('div');
              host.innerHTML = specs.map(s => renderFigura(s)).join('');
              document.querySelector('main').replaceChildren(host);
              await document.fonts.ready;
              const issues = [];
              for (const [i, figure] of [...host.querySelectorAll('figure')].entries()) {
                const svg = figure.querySelector('svg.figura-svg'), id = specs[i].id;
                if (!svg) { issues.push([id, 'svg assente']); continue; }
                const vb = svg.viewBox.baseVal, rect = svg.getBoundingClientRect();
                if (vb.width > 700 || rect.width > 760) issues.push([id, 'larghezza', vb.width, rect.width]);
                if (Math.abs(rect.width - Number(svg.getAttribute('width'))) > 1)
                  issues.push([id, 'larghezza intrinseca', rect.width, svg.getAttribute('width')]);
                if (svg.querySelector('text text')) issues.push([id, 'text annidato']);
                for (const e of svg.querySelectorAll('text, rect, circle, line, path')) {
                  const box = e.getBoundingClientRect();
                  if (box.left < rect.left - .5 || box.right > rect.right + .5 ||
                      box.top < rect.top - .5 || box.bottom > rect.bottom + .5)
                    issues.push([id, 'fuori viewBox', e.outerHTML.slice(0, 140), box.toJSON(), rect.toJSON()]);
                  if (e.tagName.toLowerCase() !== 'text') continue;
                  const size = parseFloat(getComputedStyle(e).fontSize) * rect.width / vb.width;
                  if (size < 11 || size > 24) issues.push([id, 'font', size]);
                  const spans = [...e.querySelectorAll('tspan')];
                  for (let j = 0; j < spans.length; j++) {
                    if (spans[j].getAttribute('x') !== e.getAttribute('x') ||
                        spans[j].getAttribute('dy') !== (j ? '1.2em' : '0'))
                      issues.push([id, 'tspan', spans[j].outerHTML]);
                    if (j && spans[j].getBoundingClientRect().top < spans[j-1].getBoundingClientRect().bottom - .5)
                      issues.push([id, 'righe sovrapposte', e.getAttribute('aria-label')]);
                  }
                }
              }
              return {count: specs.length, rendered: host.querySelectorAll('svg.figura-svg').length,
                unavailable: host.querySelectorAll('.figura-non-disponibile').length,
                pageWidth: document.scrollingElement.scrollWidth, viewport: innerWidth, issues};
            }''')
            assert risultato["count"] == risultato["rendered"] == 17
            assert risultato["unavailable"] == 0
            assert risultato["pageWidth"] <= risultato["viewport"]
            assert not risultato["issues"], risultato["issues"]
            assert not errori, errori
        finally:
            browser.close()


def test_formula_isolata_e_titoli(server):
    html = r'''<h1>Il titolo <span>$H(\omega)$</span></h1>
      <h2>$x$</h2><h3>$x$</h3><h4>$x$</h4><h5>$x$</h5><h6>$x$</h6>
      <div class="isolata">  $x=1$  </div><p class="prosa">Con <strong>$x$</strong> e prosa.</p>
      <p class="promossa">Risultato $\frac{1}{2} + \sum_{n=0}^{100} x_n + \int_0^T f(t)\,dt$ finale.</p>
      <div class="esplicita">$$x=1$$</div>'''
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": 390, "height": 844})
            errori = console_errors(page)
            page.goto(server, wait_until="networkidle")
            misure = page.evaluate('''async html => {
              const el = document.createElement('section'); el.innerHTML = html;
              document.querySelector('main').append(el);
              const {renderMath} = await import('./js/core/math.js'); await renderMath(el);
              return {titoli: [...el.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h =>
                ({inline: h.querySelectorAll('.formula-inline .katex').length, box: h.querySelectorAll('.formula-box').length})),
                isolata: el.querySelectorAll('.isolata .formula-box .katex-display').length,
                prosa: el.querySelectorAll('.prosa .formula-inline .katex').length,
                boxProsa: el.querySelectorAll('.prosa .formula-box').length,
                promossa: el.querySelectorAll('.promossa .formula-box .katex-display').length,
                esplicita: el.querySelectorAll('.esplicita .formula-box .katex-display').length};
            }''', html)
            assert all(t == {"inline": 1, "box": 0} for t in misure["titoli"])
            assert misure["isolata"] == misure["prosa"] == misure["promossa"] == misure["esplicita"] == 1
            assert misure["boxProsa"] == 0
            assert not errori, errori
        finally:
            browser.close()


def test_nuovi_moduli_figura_disponibili_dopo_ricarica_offline(server):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            context = browser.new_context(viewport={"width": 390, "height": 844})
            page = context.new_page()
            errori = console_errors(page)
            page.goto(server, wait_until="networkidle")
            page.wait_for_function('''async () => {
              await navigator.serviceWorker.ready;
              return !!(await caches.match('./js/figure/blocchi-layout.js')) &&
                     !!(await caches.match('./js/figure/blocchi-forme.js'));
            }''')
            context.set_offline(True)
            page.goto(f"{server}/#/dim/dim-conversione-ad", wait_until="load")
            page.reload(wait_until="load")
            page.locator('.sempre-visibile #catena svg.figura-svg').wait_for()
            assert page.locator('.sempre-visibile .figura-non-disponibile').count() == 0
            assert page.locator('h1').count() == 1
            assert not errori, errori
        finally:
            browser.close()


@pytest.mark.parametrize("width,height", [(360, 780), (390, 844), (768, 1024), (1440, 900)])
def test_testo_dentro_viewbox_per_ogni_figura_del_grafo(server, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": width, "height": height})
            errori = console_errors(page)
            page.goto(server, wait_until="networkidle")
            risultato = page.evaluate('''async () => {
              const graph = await (await fetch('./graph.json')).json();
              const {renderFigura} = await import('./js/figure/index.js');
              const specs = graph.nodi.flatMap(n => [n.lezione, n.dimostrazione]
                .flatMap(s => s?.figure || []));
              const host = document.createElement('div');
              host.innerHTML = specs.map(s => renderFigura(s)).join('');
              document.querySelector('main').replaceChildren(host);
              await document.fonts.ready;
              const issues = [];
              [...host.querySelectorAll('figure')].forEach((fig, i) => {
                const svg = fig.querySelector('svg.figura-svg'), spec = specs[i];
                if (!svg) { issues.push([spec.id, 'figura assente']); return; }
                const rect = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
                if (rect.width > 760) issues.push([spec.id, 'larghezza', rect.width]);
                for (const t of svg.querySelectorAll('text')) {
                  const box = t.getBoundingClientRect();
                  const size = parseFloat(getComputedStyle(t).fontSize) * rect.width / vb.width;
                  if (box.left < rect.left - .5 || box.right > rect.right + .5 ||
                      box.top < rect.top - .5 || box.bottom > rect.bottom + .5)
                    issues.push([spec.id, 'testo fuori', t.textContent, box.toJSON(), rect.toJSON()]);
                  if (size < 11 || size > 24) issues.push([spec.id, 'dimensione testo', size]);
                }
                if (spec.tipo === 'temporale') {
                  if ((spec.frecce || []).length !== svg.querySelectorAll('path[marker-end="url(#freccia-temp)"]').length)
                    issues.push([spec.id, 'frecce mancanti']);
                  const texts = [...svg.querySelectorAll('text')];
                  if (!texts.some(t => Math.abs(parseFloat(getComputedStyle(t).fontSize) * rect.width / vb.width - 15) < .1))
                    issues.push([spec.id, 'testo principale non a 15 px']);
                  for (let j = 0; j < texts.length; j++) for (let k = j + 1; k < texts.length; k++) {
                    const a = texts[j].getBoundingClientRect(), b = texts[k].getBoundingClientRect();
                    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > .5 &&
                        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > .5)
                      issues.push([spec.id, 'etichette sovrapposte', texts[j].textContent, texts[k].textContent]);
                  }
                }
              });
              return {count: specs.length, rendered: host.querySelectorAll('svg.figura-svg').length,
                issues, scroll: document.scrollingElement.scrollWidth, viewport: innerWidth};
            }''')
            assert risultato["count"] == risultato["rendered"] == 63
            assert risultato["scroll"] <= risultato["viewport"]
            assert not risultato["issues"], risultato["issues"]
            assert not errori, errori
        finally:
            browser.close()


@pytest.mark.parametrize("width,height", [(390, 844), (1440, 900)])
def test_formule_pure_display_e_scorrimento_completo(server, width, height):
    dimostrazioni = [n["dimostrazione"] for n in leggi_grafo()["nodi"] if n.get("dimostrazione")]
    assert len(dimostrazioni) == 18
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": width, "height": height})
            errori = console_errors(page)
            for dim in dimostrazioni:
                page.goto(f'{server}/#/dim/{dim["id"]}', wait_until="networkidle")
                attese = sum(bool(passo.get("formula")) for passo in dim["passi"])
                assert page.locator('.passo-formula .formula-box .katex-display').count() == attese, dim["id"]
                assert page.locator('.sempre-visibile > .formula .formula-box .katex-display').count() == 1, dim["id"]
                problemi = page.evaluate('''() => {
                  const bad = [], body = parseFloat(getComputedStyle(document.body).fontSize);
                  for (const sc of document.querySelectorAll('.formula-box .scroll-x')) {
                    const display = sc.querySelector('.katex-display'), k = display?.querySelector(':scope > .katex');
                    if (!k || !sc.getBoundingClientRect().height) continue;
                    const r = sc.getBoundingClientRect(), font = parseFloat(getComputedStyle(k).fontSize);
                    if (font + .1 < body * (innerWidth < 600 ? 1.15 : 1.2)) bad.push(['font', font, body]);
                    const bases = [...sc.querySelectorAll('.katex-html > .base')];
                    if (!bases.length) continue;
                    sc.scrollLeft = 0;
                    if (bases[0].getBoundingClientRect().left < r.left - 1) bad.push(['inizio tagliato']);
                    sc.scrollLeft = sc.scrollWidth;
                    if (bases[bases.length - 1].getBoundingClientRect().right > r.right + 1) bad.push(['fine tagliata']);
                    for (const base of bases) {
                      const b = base.getBoundingClientRect();
                      if (b.top < r.top - 1 || b.bottom > r.bottom + 1) bad.push(['taglio verticale', b.toJSON(), r.toJSON()]);
                    }
                    sc.scrollLeft = 0;
                  }
                  return bad;
                }''')
                assert not problemi, (dim["id"], problemi)
                assert page.evaluate('document.scrollingElement.scrollWidth <= innerWidth'), dim["id"]
            assert not errori, errori
        finally:
            browser.close()


@pytest.mark.parametrize("width,height", [(360, 780), (390, 844), (1440, 900)])
def test_notazione_lunga_scrollabile_e_frazioni_non_tagliate(server, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={"width": width, "height": height})
            errori = console_errors(page)
            for idnodo in ("dim-pam-due-spettri", "dim-filtro-trasversale"):
                page.goto(f"{server}/#/dim/{idnodo}", wait_until="networkidle")
                page.evaluate('document.fonts.ready')
                misure = page.evaluate('''() => {
                  const bad = [], body = parseFloat(getComputedStyle(document.body).fontSize);
                  let scrollabili = 0, frazioni = 0;
                  for (const sc of document.querySelectorAll('.sempre-visibile li > strong:has(> .katex)')) {
                    const r = sc.getBoundingClientRect(), k = sc.querySelector(':scope > .katex');
                    const bases = [...k.querySelectorAll('.katex-html > .base')];
                    if (!r.height || !bases.length) continue;
                    if (k.querySelector('.mfrac')) frazioni++;
                    if (k.getBoundingClientRect().height > 2.4 * body) bad.push('formula a capo o troppo alta');
                    if (sc.scrollWidth > sc.clientWidth) scrollabili++;
                    sc.scrollLeft = 0;
                    if (bases[0].getBoundingClientRect().left < r.left - 1) bad.push('inizio tagliato');
                    sc.scrollLeft = sc.scrollWidth;
                    if (bases[bases.length - 1].getBoundingClientRect().right > r.right + 1) bad.push('fine tagliata');
                    for (const base of bases) {
                      const b = base.getBoundingClientRect();
                      if (b.top < r.top - 1 || b.bottom > r.bottom + 1) bad.push('taglio verticale');
                    }
                    sc.scrollLeft = 0;
                  }
                  return {bad, scrollabili, frazioni, overflow: document.scrollingElement.scrollWidth > innerWidth};
                }''')
                assert not misure["bad"] and not misure["overflow"], (idnodo, misure)
                if idnodo == "dim-pam-due-spettri" and width <= 390:
                    assert misure["scrollabili"] >= 2, misure
                if idnodo == "dim-filtro-trasversale":
                    assert misure["frazioni"] >= 1, misure
            assert not errori, errori
        finally:
            browser.close()
"""B9: verifica che la punteggiatura adiacente alle inline non migri a una riga nuova."""

R1_DIMS = [
    'dim-teorema-campionamento',
    'dim-modulazione-prodotto-qam-errore-fase',
    'dim-spettri-modulazione-prodotto',
    'dim-poisson-tempo-residuo',
    'dim-filtro-trasversale',
    'dim-quadripoli-passa-basso-equivalente',
]
R1_VIEWPORTS = [(360, 780), (390, 844), (768, 1024), (1440, 900)]


@pytest.mark.parametrize('width,height', R1_VIEWPORTS)
@pytest.mark.parametrize('dim_id', R1_DIMS)
def test_b9_punteggiatura_inline_non_orfana(server, width, height, dim_id):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': width, 'height': height})
            errori = console_errors(page)
            page.goto(f'{server}#/dim/{dim_id}?passo=4', wait_until='networkidle')
            sommario = page.locator('.dim-menu > summary')
            if sommario.is_visible() and not page.get_by_role('button', name='Mostra tutti').is_visible():
                sommario.click()
            page.get_by_role('button', name='Mostra tutti').click()
            risultati = page.evaluate('''() => {
              const orfani = [];
              for (const formula of document.querySelectorAll('.formula-inline')) {
                let nodo = formula.nextSibling;
                while (nodo && nodo.nodeType === Node.TEXT_NODE && !nodo.textContent.trim()) nodo = nodo.nextSibling;
                if (!nodo || nodo.nodeType !== Node.TEXT_NODE) continue;
                const match = /^(\\s*)([,.;:)])/.exec(nodo.textContent);
                if (!match) continue;
                const range = document.createRange();
                range.setStart(nodo, match[1].length); range.setEnd(nodo, match[1].length + 1);
                const a = formula.getBoundingClientRect(), b = range.getBoundingClientRect();
                    const sogliaRiga = (parseFloat(getComputedStyle(formula.parentElement).fontSize) || 16) * 1.3;
                    if (Math.abs(a.top - b.top) > sogliaRiga || b.left < a.left - 1) orfani.push({formula: formula.textContent, segno: match[2], y1: a.top, y2: b.top});
              }
              return orfani;
            }''')
            assert risultati == [], (dim_id, width, risultati)
            assert not errori, (dim_id, width, errori)
            page.close()
        finally:
            browser.close()
