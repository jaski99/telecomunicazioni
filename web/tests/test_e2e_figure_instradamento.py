"""Regressioni del tempo e degli ingombri dei connettori in Chromium."""
import time

import pytest
from playwright.sync_api import sync_playwright
from e2e_helpers import static_server


@pytest.fixture(scope='module')
def server():
    srv = static_server()
    yield f'http://127.0.0.1:{srv.server_port}'
    srv.shutdown()
    srv.server_close()


@pytest.mark.parametrize('passo', range(2, 8))
def test_trasversale_passo_diretto_rapido(server, passo):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
            start = time.monotonic()
            page.goto(f'{server}/#/dim/dim-filtro-trasversale?passo={passo}', wait_until='domcontentloaded')
            page.locator('#modo-studio .step').first.wait_for(timeout=5000)
            elapsed = time.monotonic() - start
            assert elapsed < 5, f'passo {passo}: {elapsed:.2f} s'
        finally:
            browser.close()


@pytest.mark.parametrize('width', [360, 390, 768, 1440])
@pytest.mark.parametrize('route', [
    'dim/dim-nascita-morte-equilibrio?passo=2',
    'dim/dim-filtro-trasversale?passo=7',
    'nodo/filtri-ricorrenti-trasversali',
])
def test_percorsi_visibili_dentro_viewbox(server, width, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': width, 'height': 900}, reduced_motion='reduce')
            page.goto(f'{server}/#/{route}', wait_until='networkidle')
            risultato = page.evaluate('''() => {
              const figure = [...document.querySelectorAll('figure.figure--blocchi svg')]
                .filter(svg => svg.getClientRects().length);
              const errori = [];
              for (const svg of figure) {
                const vb = svg.viewBox.baseVal;
                for (const path of svg.querySelectorAll('path')) {
                  const b = path.getBBox();
                  const m = svg.getScreenCTM().inverse().multiply(path.getScreenCTM());
                  const punti = [[b.x,b.y], [b.x+b.width,b.y], [b.x,b.y+b.height],
                    [b.x+b.width,b.y+b.height]].map(([x,y]) => new DOMPoint(x,y).matrixTransform(m));
                  if (punti.some(p => p.x < vb.x - .1 || p.y < vb.y - .1 ||
                      p.x > vb.x + vb.width + .1 || p.y > vb.y + vb.height + .1))
                    errori.push({figura: svg.closest('figure').id, path: path.getAttribute('d')});
                }
              }
              return {numero: figure.length, errori};
            }''')
            assert risultato['numero'] > 0, (route, width)
            assert not risultato['errori'], (route, width, risultato['errori'])
        finally:
            browser.close()


def test_disposizioni_desktop_e_etichetta_ingresso(server):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
            page.goto(f'{server}/#/dim/dim-nascita-morte-equilibrio?passo=1', wait_until='networkidle')
            posizioni = page.locator('#catena-nascita-morte').evaluate('''f => {
              const rect = id => {
                const r = f.querySelector(`[id^="blocco-${id}-"] circle, [id^="blocco-${id}-"] rect`).getBoundingClientRect();
                return {x:r.x+r.width/2, y:r.y+r.height/2};
              };
              return {stati:[0,1,2,3].map(i => rect(`stato-${i}`)),
                nascita:[0,1,2].map(i => rect(`nascita-${i}`)),
                morte:[1,2,3].map(i => rect(`morte-${i}`))};
            }''')
            stati = posizioni['stati']
            assert all(stati[i]['x'] < stati[i + 1]['x'] for i in range(3))
            assert max(x['y'] for x in stati) - min(x['y'] for x in stati) < 2
            assert all(x['y'] < stati[0]['y'] for x in posizioni['nascita'])
            assert all(x['y'] > stati[0]['y'] for x in posizioni['morte'])
            page.goto(f'{server}/#/nodo/filtri-ricorrenti-trasversali', wait_until='networkidle')
            width = page.locator('#linea-ritardo-prese svg').evaluate('(s) => s.getBoundingClientRect().width')
            assert width > 350, width
            page.set_viewport_size({'width': 390, 'height': 844})
            page.goto(f'{server}/#/dim/dim-filtro-trasversale?passo=7', wait_until='networkidle')
            fig = page.locator('#schema-filtro-trasversale')
            assert fig.locator('text[aria-label="x(t)"]').count() == 1
        finally:
            browser.close()
