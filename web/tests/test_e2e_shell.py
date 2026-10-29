import pytest
from playwright.sync_api import sync_playwright
from e2e_helpers import VIEWPORTS, console_errors


@pytest.mark.parametrize('width,height', VIEWPORTS)
def test_a2_a15_shell(shell_server, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        errors = console_errors(page)
        page.goto(shell_server, wait_until='networkidle')
        assert page.locator('.brand').count() == 1
        assert page.locator('header').bounding_box()['height'] <= (64 if width < 768 else 72)
        assert page.locator('nav [aria-current=page]').count() == 1
        for selector in ['html', 'body', 'main', '.page']:
            assert page.locator(selector).first.evaluate("e => getComputedStyle(e).overflowX") not in ('hidden', 'clip')
        assert not errors
        browser.close()


# Le pagine restano quelle legacy; questi controlli esercitano la shell su
# contenuti diversi senza modificare il markup delle pagine di D3 e D4.
from e2e_helpers import overflow_report, font_sizes, spacing_values, contrasto

SAMPLE_ROUTES = ['', 'nodo/dim-teorema-campionamento', 'dim/dim-teorema-campionamento']


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('route', SAMPLE_ROUTES)
def test_a1_a3_a11_a13_a14_shell(shell_server, width, height, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        errors = console_errors(page)
        page.goto(f'{shell_server}/#/{route}', wait_until='networkidle')
        report = overflow_report(page)
        assert report['width'] <= report['viewport'] and not report['elements'], report
        sizes = font_sizes(page)
        assert sizes
        assert all(17 <= x['size'] <= 20 and x['line'] >= x['size'] * 1.6 for x in sizes), sizes
        gutter = page.locator('main').evaluate("e => parseFloat(getComputedStyle(e).paddingLeft)")
        assert gutter >= (24 if width >= 768 else 16)
        links = page.locator('.brand, .nav-lista a')
        boxes = [links.nth(i).bounding_box() for i in range(links.count())]
        assert all(box['width'] >= 44 and box['height'] >= 44 for box in boxes), boxes
        for i, a in enumerate(boxes):
            for b in boxes[i + 1:]:
                assert not (a['x'] < b['x'] + b['width'] and b['x'] < a['x'] + a['width'] and
                            a['y'] < b['y'] + b['height'] and b['y'] < a['y'] + a['height'])
        colors = links.evaluate_all('''elements => elements.map(e => {
          const s = getComputedStyle(e);
          return {color:s.color, background:getComputedStyle(document.querySelector('header')).backgroundColor};
        })''')
        import re
        for color in colors:
            fg = tuple(map(int, re.findall(r'\d+', color['color'])[:3]))
            bg = tuple(map(int, re.findall(r'\d+', color['background'])[:3]))
            assert contrasto(fg, bg) >= 4.5, color
        assert not errors
        browser.close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
def test_a5_prose_component(shell_server, width, height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.goto(shell_server, wait_until='networkidle')
        size = page.evaluate('''() => {
          const prose = document.createElement('div'); prose.className = 'prose';
          prose.innerHTML = '<p>Una misura di lettura per la prosa.</p>';
          document.querySelector('main').append(prose);
          const p = prose.querySelector('p'), zero = document.createElement('span');
          zero.textContent = '0'; p.append(zero);
          return {width:p.getBoundingClientRect().width, zero:zero.getBoundingClientRect().width};
        }''')
        assert 280 <= size['width'] <= 75 * size['zero'], size
        browser.close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('route', SAMPLE_ROUTES)
def test_a12_spaziature_main(shell_server, width, height, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.goto(f'{shell_server}/#/{route}', wait_until='networkidle')
        values = spacing_values(page)
        bad = [x for x in values if min(abs(x['value'] - n) for n in (0, 1, 2)) > .5
               and abs(x['value'] - round(x['value'] / 4) * 4) > .5]
        assert not bad, bad[:10]
        browser.close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('route', SAMPLE_ROUTES + ['nodo/serie-fourier'])
def test_formule_senza_overflow_verticale(shell_server, width, height, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.goto(f'{shell_server}/#/{route}', wait_until='networkidle')
        clipped = page.locator('main .katex').evaluate_all('''elements => elements
            .filter(e => e.scrollHeight > e.clientHeight)
            .map(e => ({height: e.clientHeight, scrollHeight: e.scrollHeight, text: e.textContent.slice(0, 80)}))''')
        assert not clipped, clipped
        browser.close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('route', ['', 'fonti'])
def test_tabelle_mantengono_parole_e_url_scrollabili(shell_server, width, height, route):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.goto(f'{shell_server}/#/{route}', wait_until='networkidle')
        table = page.locator('table.tabella').first
        assert table.evaluate("e => getComputedStyle(e).overflowX") == 'auto'
        cells = table.locator('th, td')
        assert cells.count() > 0
        assert all(value == 'break-word' for value in cells.evaluate_all(
            "es => es.map(e => getComputedStyle(e).overflowWrap)"))
        links = table.locator('td a')
        assert links.count() > 0
        assert all(value == 'anywhere' for value in links.evaluate_all(
            "es => es.map(e => getComputedStyle(e).overflowWrap)"))
        browser.close()
