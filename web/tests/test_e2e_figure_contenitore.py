"""Le figure a blocchi entrano nel loro contenitore, senza scorrimento.

A 360 e 390 px ogni schema a blocchi (lezione, dimostrazione e ogni passo delle
dimostrazioni progressive) deve stare dentro il riquadro della figura senza
scorrimento orizzontale, e il testo del disegno non deve scendere sotto 11 px.
"""

import json
import os
import sys

import pytest
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(__file__))
from e2e_helpers import WEB, console_errors, static_server  # noqa: E402

MOBILE = [(360, 780), (390, 844)]

MISURA = """() => [...document.querySelectorAll('figure.figure--blocchi')].map(f => {
  const svg = f.querySelector('svg.figura-svg'), box = f.querySelector('.scroll-x') || f;
  const w = svg.getBoundingClientRect().width, cw = box.clientWidth;
  const vb = svg.viewBox.baseVal.width || w;
  const testi = [...svg.querySelectorAll('text')].map(t => parseFloat(getComputedStyle(t).fontSize) * w / vb);
  return {id: f.id, larghezza: w, contenitore: cw,
          scorrimento: box.scrollWidth > box.clientWidth + 1,
          minimo: testi.length ? Math.min(...testi) : null};
})"""


def _grafo():
    with open(os.path.join(str(WEB), 'graph.json'), 'r', encoding='utf-8') as f:
        return json.load(f)


def _nodi_con_blocchi():
    """(id nodo, passi della dimostrazione) per i nodi con almeno uno schema."""
    casi = []
    for nodo in _grafo().get('nodi', []):
        figure = (nodo.get('lezione') or {}).get('figure') or []
        figure += (nodo.get('dimostrazione') or {}).get('figure') or []
        if not any(f and f.get('tipo') == 'blocchi' for f in figure):
            continue
        passi = [p.get('n') for p in ((nodo.get('dimostrazione') or {}).get('passi') or [])
                 if isinstance(p.get('n'), int)]
        casi.append((nodo['id'], sorted(set(passi))))
    return casi


CASI = _nodi_con_blocchi()


@pytest.fixture(scope='module')
def server():
    srv = static_server()
    yield f'http://127.0.0.1:{srv.server_port}'
    srv.shutdown()
    srv.server_close()


@pytest.mark.parametrize('width,height', MOBILE)
@pytest.mark.parametrize('idnodo,passi', CASI, ids=[c[0] for c in CASI])
def test_figure_a_blocchi_dentro_il_contenitore(server, width, height, idnodo, passi):
    pagine = [f'nodo/{idnodo}']
    pagine += [f'dim/{idnodo}?passo={n}' for n in passi] or [f'dim/{idnodo}']
    misurate = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
            errori = console_errors(page)
            for rotta in pagine:
                page.goto(f'{server}/#/{rotta}', wait_until='networkidle')
                for misura in page.evaluate(MISURA):
                    misurate += 1
                    assert misura['larghezza'] <= misura['contenitore'] + 1, \
                        f"[{rotta} {width}px] {misura['id']}: {misura['larghezza']:.1f} px " \
                        f"in un contenitore da {misura['contenitore']} px"
                    assert not misura['scorrimento'], \
                        f"[{rotta} {width}px] {misura['id']}: la figura scorre dentro .scroll-x"
                    if misura['minimo'] is not None:
                        assert misura['minimo'] >= 11, \
                            f"[{rotta} {width}px] {misura['id']}: testo a {misura['minimo']:.1f} px"
            assert not errori, errori
        finally:
            browser.close()
    assert misurate > 0, f'[{idnodo}] nessuna figura a blocchi misurata'
