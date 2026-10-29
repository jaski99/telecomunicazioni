"""Misure riutilizzabili per il controllo della shell e delle pagine."""
import json
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from functools import partial

WEB = Path(__file__).resolve().parents[1]
VIEWPORTS = [(360, 780), (390, 844), (768, 1024), (1440, 900)]


def routes():
    graph = json.loads((WEB / 'graph.json').read_text(encoding='utf-8'))
    result = ['', 'grafo', 'esercizi', 'quiz', 'ripasso', 'fonti']
    for node in graph['nodi']:
        result.append('nodo/' + node['id'])
        if node.get('dimostrazione'):
            result.append('dim/' + node['id'])
    return result


def static_server():
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(WEB)))
    Thread(target=server.serve_forever, daemon=True).start()
    return server


def overflow_report(page):
    return page.evaluate('''() => ({width: document.scrollingElement.scrollWidth, viewport: innerWidth,
      elements: [...document.querySelectorAll('body *')].filter(e => {
        const r=e.getBoundingClientRect(), s=getComputedStyle(e);
        return r.width && r.height && s.visibility !== 'hidden' && !e.closest('.scroll-x') &&
          (r.left < -1 || r.right > innerWidth + 1);
      }).map(e => e.outerHTML.slice(0, 160))})''')


def tap_targets(page):
    return page.evaluate('''() => [...document.querySelectorAll('a,button,input,select,[role=tab],label.quiz-option')]
      .filter(e => !e.closest('p') && e.getClientRects().length)
      .map(e => ({text:e.textContent.trim(), width:e.getBoundingClientRect().width, height:e.getBoundingClientRect().height}))''')


def font_sizes(page):
    return page.evaluate('''() => [...document.querySelectorAll('main p, main li')].filter(e => e.getClientRects().length)
      .map(e => ({size:parseFloat(getComputedStyle(e).fontSize), line:parseFloat(getComputedStyle(e).lineHeight)}))''')


def katex_report(page):
    return page.evaluate("() => ({count:document.querySelectorAll('.katex').length, errors:document.querySelectorAll('.katex-error,.katex-err').length})")


def svg_text_report(page):
    return page.evaluate("() => [...document.querySelectorAll('svg text')].map(e => ({text:e.textContent, height:e.getBoundingClientRect().height}))")


def console_errors(page):
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
    page.on('response', lambda response: errors.append(response.url) if response.status == 404 else None)
    return errors


def contrasto(foreground, background):
    """Rapporto WCAG per due triple RGB (0–255)."""
    def luminance(rgb):
        def linear(value):
            value /= 255
            return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4
        return sum(weight * linear(value) for weight, value in zip((0.2126, 0.7152, 0.0722), rgb))
    a, b = sorted((luminance(foreground), luminance(background)))
    return (b + 0.05) / (a + 0.05)


def sibling_overlaps(page):
    return page.evaluate('''() => [...document.querySelectorAll('main *')].flatMap(parent => {
      const children = [...parent.children].filter(e => e.getClientRects().length);
      return children.flatMap((a, i) => children.slice(i + 1).filter(b => {
        const x=a.getBoundingClientRect(), y=b.getBoundingClientRect();
        return x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top;
      }).map(b => [a.tagName, b.tagName]));
    })''')


def spacing_values(page):
    return page.evaluate('''() => [...document.querySelectorAll('main, main *')].flatMap(e => {
      const s=getComputedStyle(e);
      return ['marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight',
        'paddingBottom','paddingLeft','rowGap','columnGap'].map(p => ({property:p, value:parseFloat(s[p]) || 0}));
    })''')
