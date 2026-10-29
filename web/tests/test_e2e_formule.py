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
