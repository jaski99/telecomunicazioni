"""B4/B15: prova Chromium reale con fixture di catena, dato che il grafo base non ne ha ancora."""
from pathlib import Path
import sys

import pytest
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from e2e_helpers import console_errors, static_server  # noqa: E402

VIEWPORTS = [(360, 780), (390, 844), (768, 1024), (1440, 900)]


@pytest.fixture(scope='module')
def server():
    srv = static_server()
    yield f'http://127.0.0.1:{srv.server_port}'
    srv.shutdown()
    srv.server_close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
def test_catena_fixture_nuovi_confronto_e_movimento(server, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
            errori = console_errors(page)
            page.goto(f'{server}/#/dim/dim-teorema-campionamento?passo=4', wait_until='networkidle')
            assert page.locator('.progress[role="progressbar"]').get_attribute('aria-valuenow') == '4'
            page.evaluate('''async () => {
              const { renderPasso } = await import('./js/pages/dim/passi.js');
              const assi = { etichetta: 'ω', min: -2, max: 2, tacche: [-2, 0, 2] };
              const base = { tipo: 'grafico', asse_x: assi, asse_y: { ...assi, etichetta: 'X(ω)' },
                serie: [{ stile: 'linea', etichetta: 'spettro centrale', punti: [[-1,0],[0,1],[1,0]] }], annotazioni: [] };
              const finale = { ...base, serie: [...base.serie,
                { stile: 'linea', etichetta: 'repliche laterali', punti: [[-2,0],[-1,1],[0,0]] }] };
              const dim = { figure: [{ ...base, id: 'stato-centrale', titolo: 'Spettro centrale', descrizione: 'È presente lo spettro centrale.' },
                { ...finale, id: 'stato-repliche', titolo: 'Spettro con repliche', descrizione: 'Si aggiungono le repliche laterali.' }],
                passi: [{ n: 1, figura: 'stato-centrale' }, { n: 2, figura: 'stato-repliche' }] };
              const p2 = { n: 2, figura: 'stato-repliche', testo: 'Il nuovo stato aggiunge le repliche.', formula: '', perche: 'La periodicità dello spettro giustifica le repliche.' };
              const lista = document.createElement('ol'); lista.className = 'dim-passi';
              lista.innerHTML = renderPasso(p2, dim, true, 1);
              lista.dataset.fixture = 'progressione'; document.querySelector('#modo-studio').append(lista);
            }''')
            nuova = page.locator('[data-nuovo="true"]')
            ereditata = page.locator('[data-ereditato="true"]')
            assert nuova.count() >= 1
            assert ereditata.count() >= 1
            assert float(ereditata.first.evaluate('(e) => getComputedStyle(e).opacity')) < 1
            assert 'Figura 1.2 — nuovo in questo passo: repliche laterali' in page.locator('.figure__caption-title').last.inner_text()
            pulsante = page.get_by_role('button', name='Confronta con il passo precedente')
            assert pulsante.count() == 1
            pulsante.click()
            assert pulsante.get_attribute('aria-expanded') == 'true'
            allineamento = page.locator('.figura-confronto').evaluate('(e) => { const r = [...e.children].map(x => x.getBoundingClientRect()); return r[1].top <= r[0].bottom - 1; }')
            assert allineamento is (width >= 768)
            durata = page.locator('[data-progressivo]').first.evaluate('(e) => getComputedStyle(e).transitionDuration')
            assert all(float(x.rstrip('s')) == 0 for x in durata.split(',')), durata
            Path('/tmp/tlc-shots').mkdir(parents=True, exist_ok=True)
            page.screenshot(path=f'/tmp/tlc-shots/figure-progressive-{width}.png', full_page=True)
            assert not errori, errori
        finally:
            browser.close()
