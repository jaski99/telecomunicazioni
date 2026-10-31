"""E2E della pagina dimostrazione (D3): criteri A8, A11, A16, A17, A18 sulle 18 dimostrazioni."""
import json
import re
import sys
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from e2e_helpers import WEB, console_errors, font_sizes, katex_report, spacing_values, static_server, tap_targets  # noqa: E402

GRAFO = json.loads((WEB / 'graph.json').read_text(encoding='utf-8'))
DIMS = [n['id'] for n in GRAFO['nodi'] if n.get('dimostrazione')]
PASSI = {n['id']: len(n['dimostrazione']['passi']) for n in GRAFO['nodi'] if n.get('dimostrazione')}
VIEWPORTS = [(360, 780), (390, 844), (768, 1024), (1440, 900)]
MODALITA = ['studio', 'avocce', 'compatta', 'abuchi', 'recall']
CHIAVE = 'tlc-kg:dimostrazioni:v1.'


@pytest.fixture(scope='module')
def server():
    srv = static_server()
    yield f'http://127.0.0.1:{srv.server_port}'
    srv.shutdown()
    srv.server_close()


@pytest.fixture(scope='module')
def browser():
    with sync_playwright() as p:
        br = p.chromium.launch()
        yield br
        br.close()


def apri(browser, base, dim_id, width, height, query=''):
    page = browser.new_page(viewport={'width': width, 'height': height})
    errori = console_errors(page)
    page.goto(f'{base}/#/dim/{dim_id}{query}', wait_until='networkidle')
    page.wait_for_selector('#modo-studio .step')
    return page, errori


def mostra_tutti(page):
    riepilogo = page.locator('.dim-menu > summary')
    if riepilogo.is_visible():
        riepilogo.click()
    page.get_by_role('button', name='Mostra tutti').click()


def tab(page, modo):
    page.locator(f'[role="tab"][data-modo="{modo}"]').click()


def pannelli_visibili(page):
    return page.evaluate("() => [...document.querySelectorAll('[role=tabpanel]')].filter(e => !e.hidden).map(e => e.id)")


@pytest.mark.parametrize('dim_id', DIMS)
def test_a8_formula_chiave_dopo_mostra_tutti(browser, server, dim_id):
    page, errori = apri(browser, server, dim_id, 1440, 900)
    mostra_tutti(page)
    chiave = page.locator('#modo-studio .formula-box--key')
    assert chiave.count() == 1, dim_id
    assert chiave.is_visible(), dim_id
    assert katex_report(page)['errors'] == 0, dim_id
    assert not errori
    page.close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('dim_id', DIMS)
def test_a11_padding_gap_sovrapposizioni(browser, server, dim_id, width, height):
    page, errori = apri(browser, server, dim_id, width, height)
    mostra_tutti(page)
    for modo in MODALITA:
        tab(page, modo)
        padding = page.evaluate('''() => [...document.querySelectorAll('.card, .step, .callout, .formula-box')]
          .filter(e => e.getClientRects().length && !e.closest('.katex'))
          .map(e => { const s = getComputedStyle(e);
            return {sel: e.className.split(' ')[0], min: Math.min(...['paddingTop','paddingRight','paddingBottom','paddingLeft'].map(p => parseFloat(s[p])))}; })''')
        for x in padding:
            limite = 24 if x['sel'] == 'card' and width >= 1440 else 16
            assert x['min'] >= limite, (dim_id, modo, x)
        gap = page.evaluate('''() => [...document.querySelectorAll('.dim-pannello, .dim-passi, .dim-errori')].flatMap(p => {
            const figli = [...p.children].filter(e => e.getClientRects().length && e.matches('.card, .step, .callout, .dim-attesa, .formula, article'));
            return figli.slice(1).map((b, i) => [figli[i].getBoundingClientRect(), b.getBoundingClientRect()])
              .filter(([a, c]) => c.top >= a.bottom - 0.5).map(([a, c]) => c.top - a.bottom);
          })''')
        assert all(g >= 16 for g in gap), (dim_id, modo, min(gap, default=None))
        sovrapposti = page.evaluate('''() => {
          const vis = e => e.getClientRects().length > 0;
          const ignora = e => e.closest('.katex, svg, .dim-controlli') || e.matches('.dim-controlli');
          let n = 0;
          for (const genitore of document.querySelectorAll('main *')) {
            if (ignora(genitore) || !vis(genitore)) continue;
            const figli = [...genitore.children].filter(e => vis(e) && !ignora(e));
            figli.forEach((a, i) => figli.slice(i + 1).forEach(b => {
              const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
              if (x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) n++;
            }));
          }
          return n;
        }''')
        assert sovrapposti == 0, (dim_id, modo)
    spazi = [x for x in spacing_values(page) if min(abs(x['value'] - n) for n in (0, 1, 2)) > .5
             and abs(x['value'] - round(x['value'] / 4) * 4) > .5]
    assert not spazi, (dim_id, spazi[:5])
    sizes = font_sizes(page)
    assert all(17 <= x['size'] <= 20 and x['line'] >= x['size'] * 1.6 for x in sizes), (dim_id, sizes[:5])
    tap = [x for x in tap_targets(page) if x['height'] < 44 or x['width'] < 44]
    assert not tap, (dim_id, tap[:5])
    assert not errori
    page.close()


@pytest.mark.parametrize('width,height', [(390, 844), (1440, 900)])
@pytest.mark.parametrize('dim_id', DIMS)
def test_a16_tabs_nel_primo_viewport_e_pannelli(browser, server, dim_id, width, height):
    page, errori = apri(browser, server, dim_id, width, height)
    limite = 844 if width == 390 else 900
    top = page.locator('.dim-tabs').bounding_box()['y']
    assert top < limite, (dim_id, top)
    for modo in MODALITA:
        tab(page, modo)
        assert pannelli_visibili(page) == [f'modo-{modo}'], (dim_id, modo)
        assert page.locator(f'[role="tab"][data-modo="{modo}"]').get_attribute('aria-selected') == 'true'
    assert not errori
    page.close()


@pytest.mark.parametrize('width,height', [(390, 844), (1440, 900)])
@pytest.mark.parametrize('dim_id', DIMS)
def test_a17_avanti_indietro_persistenza(browser, server, dim_id, width, height):
    page, errori = apri(browser, server, dim_id, width, height)
    progresso = page.locator('.progress[role="progressbar"]')
    assert progresso.get_attribute('aria-valuenow') == '0'
    page.get_by_role('button', name='Prossimo passo').click()
    assert progresso.get_attribute('aria-valuenow') == '1', dim_id
    in_vista = page.evaluate('''() => { const r = document.getElementById('passo-1').getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight; }''')
    assert in_vista, dim_id
    assert page.evaluate("() => document.activeElement && document.activeElement.id") == 'passo-1'
    page.keyboard.press('ArrowRight')
    assert progresso.get_attribute('aria-valuenow') == '2', dim_id
    page.get_by_role('button', name='Indietro').click()
    assert progresso.get_attribute('aria-valuenow') == '1', dim_id
    salvato = page.evaluate(f"() => localStorage.getItem('{CHIAVE}{dim_id}')")
    assert json.loads(salvato)['passiRivelati'] == 1, dim_id
    page.reload(wait_until='networkidle')
    page.wait_for_selector('#modo-studio .step')
    assert page.locator('.progress[role="progressbar"]').get_attribute('aria-valuenow') == '1', dim_id
    assert not errori
    page.close()


TESTO_VISIBILE = '''() => { const m = document.querySelector('main').cloneNode(true);
  m.querySelectorAll('[hidden], .katex-mathml, script, style, svg').forEach(e => e.remove());
  return m.textContent; }'''


@pytest.mark.parametrize('width,height', [(390, 844), (1440, 900)])
@pytest.mark.parametrize('dim_id', DIMS)
def test_a18_testo_senza_underscore_ne_badge(browser, server, dim_id, width, height):
    page, errori = apri(browser, server, dim_id, width, height)
    mostra_tutti(page)
    for modo in MODALITA:
        tab(page, modo)
        testo = page.evaluate(TESTO_VISIBILE)
        fuori_formula = re.sub(r'\$[^$]*\$', ' ', testo)
        assert not re.search(r'[A-Za-zÀ-ÿ0-9]_[A-Za-zÀ-ÿ0-9]', fuori_formula), (dim_id, modo)
        assert not re.search(r'\bW[1-6]\b', testo), (dim_id, modo)
        assert not re.search(r'\b(undefined|null|NaN)\b|\[object Object\]', testo), (dim_id, modo)
    assert katex_report(page)['errors'] == 0, dim_id
    assert not errori
    page.close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('dim_id', DIMS)
def test_a1_nessuno_scroll_orizzontale_in_nessuna_modalita(browser, server, dim_id, width, height):
    page, errori = apri(browser, server, dim_id, width, height)
    for modo in MODALITA:
        tab(page, modo)
        misura = page.evaluate('''() => {
          const fuori = [];
          const dentroScorrevole = (e) => {
            for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
              if (/auto|scroll|hidden/.test(getComputedStyle(a).overflowX)) return true;
            }
            return false;
          };
          for (const e of document.querySelectorAll('body *')) {
            if (!e.getClientRects().length || e.closest('.katex-mathml') || dentroScorrevole(e)) continue;
            const r = e.getBoundingClientRect();
            if (r.right > innerWidth + 1 || r.left < -1) fuori.push(e.tagName + '.' + e.className);
          }
          return {scroll: document.scrollingElement.scrollWidth, vw: innerWidth, fuori: fuori.slice(0, 5)};
        }''')
        assert misura['scroll'] <= misura['vw'], (dim_id, modo, misura)
        assert not misura['fuori'], (dim_id, modo, misura)
    assert not errori
    page.close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('dim_id', DIMS)
def test_progress_visibile_e_notazione_raggiungibile(browser, server, dim_id, width, height):
    page, errori = apri(browser, server, dim_id, width, height)
    altezza = page.locator('.progress').bounding_box()['height']
    assert altezza >= 8, (dim_id, altezza)
    simboli = page.evaluate('''() => [...document.querySelectorAll('.dim-notazione strong')].filter(e => e.getClientRects().length).map(e => {
        const eccede = e.scrollWidth > e.clientWidth + 1;
        const contenitore = e.getBoundingClientRect();
        const formula = e.querySelector('.katex').getBoundingClientRect();
        const scorre = getComputedStyle(e).overflowX;
        e.scrollLeft = e.scrollWidth;
        const fineRaggiunta = e.querySelector('.katex').getBoundingClientRect().right <= contenitore.right + 1;
        e.scrollLeft = 0;
        const inizioRaggiunto = formula.left >= contenitore.left - 1;
        return {eccede, scorre, fineRaggiunta, inizioRaggiunto, testo: e.textContent.slice(0, 30)};
      })''')
    for x in simboli:
        assert not x['eccede'] or x['scorre'] in ('auto', 'scroll'), (dim_id, x)
        assert x['fineRaggiunta'] and x['inizioRaggiunto'], (dim_id, x)
    assert not errori
    page.close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('dim_id', DIMS)
def test_b13_chiave_e_numerazione_figure(browser, server, dim_id, width, height):
    page, errori = apri(browser, server, dim_id, width, height)
    mostra_tutti(page)
    dati = page.evaluate('''() => ({
      chiave: document.querySelectorAll('main .chiave').length,
      didascalie: [...document.querySelectorAll('#modo-studio .figure__caption-title')]
        .filter(e => !e.closest('.figura-confronto')).map(e => e.textContent.trim()),
      idDuplicati: [...document.querySelectorAll('[id]')].map(e => e.id)
        .filter((id, i, ids) => ids.indexOf(id) !== i),
    })''')
    assert dati['chiave'] == 1, (dim_id, dati['chiave'])
    numeri = []
    for didascalia in dati['didascalie']:
        match = re.match(r'^Figura (\d+)\.(\d+) — ', didascalia)
        assert match, (dim_id, didascalia)
        numeri.append(int(match.group(2)))
    assert numeri == list(range(1, len(numeri) + 1)), (dim_id, numeri)
    assert not dati['idDuplicati'], (dim_id, dati['idDuplicati'])
    assert not errori, (dim_id, errori)
    page.close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('passo', [1, 2, 6])
@pytest.mark.parametrize('dim_id', DIMS)
def test_b8_passo_permalink_e_overflow(browser, server, dim_id, passo, width, height):
    n = min(passo, PASSI[dim_id])
    page, errori = apri(browser, server, dim_id, width, height, f'?passo={n}')
    assert page.locator('.progress[role="progressbar"]').get_attribute('aria-valuenow') == str(n), dim_id
    assert page.locator(f'#passo-{n}.step--rivelato').count() == 1, dim_id
    misura = page.evaluate('''() => ({scroll: document.scrollingElement.scrollWidth, client: document.scrollingElement.clientWidth,
      viewport: innerWidth, body: document.body.scrollWidth})''')
    assert misura['scroll'] <= misura['client'], (dim_id, width, misura)
    assert misura['body'] <= misura['client'], (dim_id, width, misura)
    assert not errori, (dim_id, width, errori)
    page.close()


def test_b13_indice_e_nav_sequenza_sulla_dimostrazione(browser, server):
    """B13: indice di pagina (modulo unico di E1) con ancore vive e nav prev/succ
    coerente con l'ordine del piano di studio, anche sulla rotta #/dim/."""
    dim_id = 'dim-teorema-campionamento'
    page, errori = apri(browser, server, dim_id, 1440, 900)
    dati = page.evaluate('''() => ({
      voci: [...document.querySelectorAll('.indice-in-testa .indice-pagina li a')].map(a => a.getAttribute('href')),
      vivi: [...document.querySelectorAll('.indice-in-testa .indice-pagina li a')].map(a => {
        const m = /sezione=(\\d+)$/.exec(a.getAttribute('href') || '');
        return Boolean(m) && document.getElementById('sez-' + m[1]) !== null; }),
      nav: [...document.querySelectorAll('.nav-sequenza a')].map(a => a.getAttribute('href')),
    })''')
    assert len(dati['voci']) >= 2, dati
    assert all(dati['vivi']), dati
    assert all(v.startswith(f'#/dim/{dim_id}?sezione=') for v in dati['voci']), dati
    nodi = {n['id']: n for n in GRAFO['nodi']}
    assert dati['nav'], dati
    for href in dati['nav']:
        tipo, id_dest = href.removeprefix('#/').split('/', 1)
        assert id_dest in nodi, href
        assert tipo == ('dim' if nodi[id_dest].get('dimostrazione') else 'nodo'), href
    page.goto(f'{server}/#/dim/{dim_id}?sezione=4', wait_until='networkidle')
    page.wait_for_selector('#modo-studio .step')
    in_vista = page.evaluate('''() => { const r = document.getElementById('sez-4').getBoundingClientRect();
      return r.top >= -1 && r.top < innerHeight; }''')
    assert in_vista, dati
    assert not errori
    page.close()


def test_note_marginale_non_restringe_formula_e_figura_a_1440(browser, server):
    page, errori = apri(browser, server, 'dim-pam-due-spettri', 1440, 900, '?passo=4')
    misure = page.evaluate('''() => {
      const corpo = document.querySelector('#passo-4 .step__corpo');
      const testo = corpo.querySelector('.step__testo').getBoundingClientRect();
      const nota = corpo.querySelector('.dim-nota').getBoundingClientRect();
      const formula = corpo.querySelector('.passo-formula').getBoundingClientRect();
      const figura = corpo.querySelector('.step__figura').getBoundingClientRect();
      const area = e => getComputedStyle(e).gridArea;
      return {larghezza: corpo.clientWidth, testo: testo.toJSON(), nota: nota.toJSON(),
        formula: formula.toJSON(), figura: figura.toJSON(), aree: [area(corpo.querySelector('.step__testo')),
          area(corpo.querySelector('.dim-nota')), area(corpo.querySelector('.passo-formula')),
          area(corpo.querySelector('.step__figura'))]};
    }''')
    assert misure['aree'] == ['testo', 'nota', 'formula', 'figura'], misure
    assert misure['testo']['right'] <= misure['nota']['left'], misure
    assert misure['formula']['width'] >= misure['larghezza'] - 1, misure
    assert misure['figura']['width'] >= misure['larghezza'] - 1, misure
    assert not errori
    page.close()


def test_nota_passo_resta_callout_verde_a_1440(browser, server):
    """La nota del passo usa la classe propria .dim-nota: sopra 1200 px non eredita il
    filetto grigio da 1 px di .nota-margine (nodo.css) e resta un callout da 4 px verdi."""
    page, errori = apri(browser, server, 'dim-pam-due-spettri', 1440, 900, '?passo=4')
    note = page.evaluate('''() => [...document.querySelectorAll('#modo-studio .step__corpo aside')]
      .filter(e => e.getClientRects().length).map(e => {
        const s = getComputedStyle(e);
        return {classi: e.className.split(' '), larghezza: s.borderLeftWidth,
          stile: s.borderLeftStyle, colore: s.borderLeftColor, corpo: parseFloat(s.fontSize)};
      })''')
    assert len(note) == 4, note
    for nota in note:
        assert nota['classi'] == ['callout', 'callout--tip', 'dim-nota'], nota
        assert nota['larghezza'] == '4px', nota
        assert nota['stile'] == 'solid', nota
        assert nota['colore'] == 'rgb(21, 128, 61)', nota  # --c-ok
        assert nota['corpo'] == 19, nota
    assert not errori
    page.close()


@pytest.mark.parametrize('width,height', [(360, 780), (390, 844)])
def test_pam_schema_e_formula_senza_scroll_interno(browser, server, width, height):
    page, errori = apri(browser, server, 'dim-pam-due-spettri', width, height, '?passo=4')
    misura = page.evaluate('''() => {
      const selettori = ['#passo-2 .step__figura .scroll-x', '#passo-2 .passo-formula .scroll-x',
        '#passo-2 .passo-formula .formula-box', '#passo-4 .passo-formula .scroll-x', '#passo-4 .passo-formula .formula-box'];
      const elementi = [...new Set(selettori.flatMap(s => [...document.querySelectorAll(s)]))]
        .filter(e => e.getClientRects().length);
      const overflow = elementi.map(e => ({classe: e.className, scroll: e.scrollWidth, client: e.clientWidth}))
        .filter(x => x.scroll > x.client + 1);
      const figura = document.querySelector('#passo-2 .step__figura svg');
      const svg = figura?.getBoundingClientRect(), vb = figura?.viewBox.baseVal;
      const dimensioni = figura ? [...figura.querySelectorAll('text')].map(t =>
        parseFloat(getComputedStyle(t).fontSize) * svg.width / vb.width) : [];
      const uscita = figura?.querySelector('.blocco.uscita');
      const lineaUscita = uscita?.querySelector('line');
      const collegamenti = [...(figura?.querySelectorAll('path[fill="none"]') || [])];
      const punta = collegamenti[1]?.nextElementSibling?.getAttribute('d')?.match(/^M\\s*(-?[\\d.]+)\\s+(-?[\\d.]+)/);
      const x = Number(lineaUscita?.getAttribute('x1')), y = Number(lineaUscita?.getAttribute('y1'));
      const uscitaCollegata = { collegata: Boolean(punta && Math.hypot(Number(punta[1]) - x, Number(punta[2]) - y) < .1),
        etichetta: uscita?.textContent || '' };
      return {overflow, dimensioni, schema: Boolean(figura), uscitaCollegata,
        passi: [...document.querySelectorAll('#passo-2.step--rivelato, #passo-4.step--rivelato')].length};
    }''')
    assert misura['passi'] == 2, (width, misura)
    assert misura['schema'], (width, misura)
    assert misura['overflow'] == [], (width, misura)
    assert misura['uscitaCollegata']['collegata'], (width, misura['uscitaCollegata'])
    assert 's(t)' in misura['uscitaCollegata']['etichetta'], (width, misura['uscitaCollegata'])
    assert all(size >= 11 for size in misura['dimensioni']), (width, misura['dimensioni'])
    assert not errori, (width, errori)
    if width == 390:
        page.screenshot(path='/tmp/pam-390.png', full_page=True)
    page.close()


@pytest.mark.parametrize('width,height', [(390, 844), (1440, 900)])
@pytest.mark.parametrize('dim_id', DIMS)
def test_passo_n_diretto_porta_il_passo_nel_viewport(browser, server, dim_id, width, height):
    """Difetto E2-1: il carico diretto di ?passo=n rivela il passo E lo porta nel viewport."""
    for scelta in sorted({1, 4, PASSI[dim_id]}):
        n = min(scelta, PASSI[dim_id])
        page, errori = apri(browser, server, dim_id, width, height, query=f'?passo={scelta}')
        page.wait_for_timeout(200)  # lascia correre il doppio requestAnimationFrame di dopoRender
        box = page.evaluate("""(n) => {
          const li = document.querySelector(`#passo-${n}`);
          if (!li) return null;
          const b = li.getBoundingClientRect();
          return { top: b.top, bottom: b.bottom, h: innerHeight, y: scrollY };
        }""", n)
        assert box, (dim_id, scelta, 'passo richiesto non presente nel DOM')
        assert box['top'] < box['h'] and box['bottom'] > 0, (dim_id, scelta, width, box)
        if n > 1:
            assert box['y'] > 0, (dim_id, scelta, width, 'pagina rimasta in cima')
        assert not errori
        page.close()
