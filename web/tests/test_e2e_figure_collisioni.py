"""Verifica in Chromium i fili e gli ostacoli di ogni schema reso sulla pagina."""
import pytest
from playwright.sync_api import sync_playwright

from e2e_helpers import console_errors, static_server
from test_e2e_figure_contenitore import CASI, VIEWPORTS

# Misure nel sistema di coordinate dello schermo: il margine di 2 px è tolto
# alle forme e un contatto lungo al massimo 4 px non è un attraversamento.
# Per i fondi delle etichette si ammette solo un margine di arrotondamento.
MISURA_COLLISIONI = r'''() => {
  const visibili = [...document.querySelectorAll('figure.figure--blocchi svg.figura-svg')]
    .filter(svg => svg.getClientRects().length);
  const errori = [];
  const tag = e => e?.tagName?.toLowerCase();
  function interno(a, b, r) {
    const dx = b.x-a.x, dy = b.y-a.y;
    let lo=0, hi=1;
    for (const [p,q] of [[-dx,a.x-r.left],[dx,r.right-a.x],[-dy,a.y-r.top],[dy,r.bottom-a.y]]) {
      if (Math.abs(p) < 1e-8) { if (q < 0) return 0; continue; }
      const t=q/p;
      if (p<0) lo=Math.max(lo,t); else hi=Math.min(hi,t);
      if (lo>=hi) return 0;
    }
    return Math.hypot(dx,dy)*(hi-lo);
  }
  for (const svg of visibili) {
    const root = svg.querySelector(':scope > g');
    const figli = [...root.children];
    const nodi = figli.filter(e => e.classList.contains('blocco'));
    const ostacoli = [];
    for (const nodo of nodi) {
      if (!['ingresso','uscita'].some(c => nodo.classList.contains(c))) {
        const forma = [...nodo.children].find(e => ['circle','rect'].includes(tag(e)));
        if (forma) {
          const r=forma.getBoundingClientRect();
          ostacoli.push({ tipo:'forma', nome:nodo.id, left:r.left+2, right:r.right-2,
                          top:r.top+2, bottom:r.bottom-2 });
        }
      }
    }
    for (const testo of svg.querySelectorAll('text')) {
      const precedente = testo.previousElementSibling;
      // Le etichette esterne hanno un fondo opaco: misuriamo quello, non solo
      // i glifi. I testi dentro i blocchi non hanno un fondo separato.
      const fondo = tag(precedente)==='rect' && !precedente.hasAttribute('stroke') ? precedente : testo;
      const r=fondo.getBoundingClientRect();
      ostacoli.push({tipo:'etichetta', nome:testo.getAttribute('aria-label') || testo.textContent,
        left:r.left, right:r.right, top:r.top, bottom:r.bottom});
    }
    for (const linea of svg.querySelectorAll('.blocco > line')) {
      const m=linea.getScreenCTM();
      const a=new DOMPoint(Number(linea.getAttribute('x1')),Number(linea.getAttribute('y1'))).matrixTransform(m);
      const b=new DOMPoint(Number(linea.getAttribute('x2')),Number(linea.getAttribute('y2'))).matrixTransform(m);
      for (const r of ostacoli) {
        const lunghezza=interno(a,b,r);
        if (lunghezza>(r.tipo==='etichetta' ? 0.2 : 4.01)) errori.push({figura:svg.closest('figure').id,
          collegamento:'porta', ostacolo:r.tipo, nome:r.nome, lunghezza:Math.round(lunghezza*10)/10});
      }
    }
    const gruppi = figli.filter(e => tag(e)==='g' && !e.classList.contains('blocco'));
    for (const [indice, gruppo] of gruppi.entries()) {
      const path = [...gruppo.children].find(e => tag(e)==='path' && e.getAttribute('fill')==='none');
      if (!path) continue;
      const tokens = path.getAttribute('d').match(/[ML]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || [];
      const punti=[];
      for (let i=0; i<tokens.length; i+=3) {
        if (!['M','L'].includes(tokens[i])) throw new Error('Percorso non supportato: '+path.getAttribute('d'));
        punti.push(new DOMPoint(Number(tokens[i+1]),Number(tokens[i+2])).matrixTransform(path.getScreenCTM()));
      }
      for (let i=1; i<punti.length; i++) for (const r of ostacoli) {
        const lunghezza=interno(punti[i-1],punti[i],r);
        if (lunghezza>(r.tipo==='etichetta' ? 0.2 : 4.01)) errori.push({figura:svg.closest('figure').id, collegamento:indice,
          ostacolo:r.tipo, nome:r.nome, lunghezza:Math.round(lunghezza*10)/10});
      }
    }
  }
  return {numero:visibili.length,errori};
}'''


@pytest.fixture(scope='module')
def server():
    srv = static_server()
    yield f'http://127.0.0.1:{srv.server_port}'
    srv.shutdown()
    srv.server_close()


@pytest.mark.parametrize('width,height', VIEWPORTS)
@pytest.mark.parametrize('idnodo,passi', CASI, ids=[c[0] for c in CASI])
def test_fili_non_attraversano_forme_o_etichette(server, width, height, idnodo, passi):
    pagine = [f'nodo/{idnodo}'] + ([f'dim/{idnodo}?passo={n}' for n in passi] or [f'dim/{idnodo}'])
    misurate = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
            errori = console_errors(page)
            for rotta in pagine:
                page.goto(f'{server}/#/{rotta}', wait_until='networkidle')
                # Verifica anche i confronti quando sono aperti e realmente visibili.
                for pulsante in page.locator('.figura-confronta').all():
                    if pulsante.is_visible() and pulsante.get_attribute('aria-expanded') == 'false':
                        pulsante.click()
                risultato = page.evaluate(MISURA_COLLISIONI)
                misurate += risultato['numero']
                assert not risultato['errori'], (rotta, width, risultato['errori'])
            assert not errori, errori
        finally:
            browser.close()
    assert misurate > 0, f'[{idnodo} {width}px] nessuno schema misurato'


@pytest.mark.parametrize('width', [360, 390])
def test_catena_in_fila_e_peso_adiacente(server, width):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': width, 'height': 844}, reduced_motion='reduce')
            page.goto(f'{server}/#/dim/dim-nascita-morte-equilibrio?passo=1', wait_until='networkidle')
            posizione = page.locator('#catena-nascita-morte').evaluate('''f => {
              const centro = id => {
                const r=f.querySelector(`[id^="blocco-${id}-"] circle, [id^="blocco-${id}-"] rect`).getBoundingClientRect();
                return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};
              };
              return {stati:[0,1,2,3].map(i=>centro(`stato-${i}`)),
                nascite:[0,1,2].map(i=>centro(`nascita-${i}`)),
                morti:[1,2,3].map(i=>centro(`morte-${i}`))};
            }''')
            stati = posizione['stati']
            assert all(stati[i]['x'] < stati[i + 1]['x'] for i in range(3))
            assert max(s['y'] for s in stati) - min(s['y'] for s in stati) < 2
            assert all(s['y'] < stati[0]['y'] for s in posizione['nascite'])
            assert all(s['y'] > stati[0]['y'] for s in posizione['morti'])
            page.goto(f'{server}/#/dim/dim-filtro-trasversale?passo=7', wait_until='networkidle')
            distanza = page.locator('#schema-filtro-trasversale').evaluate('''f => {
              const gruppo=f.querySelector('[id^="blocco-m2-"]');
              const a=gruppo.querySelector('circle').getBoundingClientRect();
              const b=gruppo.querySelector('text').getBoundingClientRect();
              return Math.hypot(Math.max(0,a.left-b.right,b.left-a.right),
                Math.max(0,a.top-b.bottom,b.top-a.bottom));
            }''')
            assert distanza <= 20, (width, distanza)
        finally:
            browser.close()
