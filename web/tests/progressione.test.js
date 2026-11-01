import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progressione } from '../js/figure/progressione.js';
import { renderFigura } from '../js/figure/index.js';

const asse = { etichetta: 'x', min: -2, max: 2, tacche: [-2, 0, 2] };
const serie = (etichetta, punti) => ({ stile: 'linea', etichetta, punti });
const grafico = (items, annotazioni = [], extra = {}) => ({ tipo: 'grafico', asse_x: asse, asse_y: { ...asse, etichetta: 'y' }, serie: items, annotazioni, ...extra });

test('grafico: richiede stesso tipo, assi identici, prefisso delle serie e almeno un elemento nuovo', () => {
  const a = serie('segnale', [[-1, 0], [0, 1], [1, 0]]), b = serie('replica', [[-2, 0], [-1, 1], [0, 0]]);
  const prec = grafico([a]);
  assert.deepEqual(progressione(prec, grafico([a, b])).nuovi, [{ tipo: 'serie', indice: 1, etichetta: 'replica' }]);
  assert.equal(progressione(prec, grafico([a])).compatibile, false);
  assert.equal(progressione(prec, grafico([b, a])).compatibile, false);
  assert.equal(progressione(prec, grafico([a, b], [], { asse_x: { ...asse, max: 3 } })).compatibile, false);
  assert.equal(progressione(prec, { tipo: 'temporale' }).compatibile, false);
});

test('grafico: annotazioni ereditate sono sottoinsieme profondo e le nuove conservano etichetta', () => {
  const old = { x: 0, y: 1, testo: 'centro' }, added = { x: 1, y: 1, testo: 'replica' };
  const r = progressione(grafico([], [old]), grafico([], [old, added]));
  assert.deepEqual(r.nuovi, [{ tipo: 'annotazione', indice: 1, etichetta: 'replica' }]);
  assert.equal(progressione(grafico([], [old]), grafico([], [{ ...old, y: 2 }, added])).compatibile, false);
});

test('blocchi: blocchi e collegamenti ereditati restano invariati e la struttura cresce', () => {
  const a = { id: 'in', forma: 'ingresso', etichetta: 'x(t)', colonna: 0, riga: 0 };
  const b = { id: 'f', forma: 'rettangolo', etichetta: 'Filtro', colonna: 1, riga: 0 };
  const c = { id: 'out', forma: 'uscita', etichetta: 'y(t)', colonna: 2, riga: 0 };
  const link = { da: 'in', a: 'f', etichetta: 'segnale' };
  const prima = { tipo: 'blocchi', blocchi: [a, b], collegamenti: [link] };
  const dopo = { tipo: 'blocchi', blocchi: [a, b, c], collegamenti: [link, { da: 'f', a: 'out', etichetta: 'uscita' }] };
  const r = progressione(prima, dopo);
  assert.equal(r.compatibile, true);
  assert.deepEqual(r.nuovi.map(x => [x.tipo, x.id || x.indice]), [['blocco', 'out'], ['collegamento', 1]]);
  assert.equal(progressione(prima, { ...prima, blocchi: [a, { ...b, colonna: 3 }] }).compatibile, false);
  assert.equal(progressione(prima, prima).compatibile, false);
});

test('temporale: assi e corsie sono identici e avanzano intervalli, frecce o marcatori', () => {
  const comune = { tipo: 'temporale', asse_t: { etichetta: 't', min: 0, max: 4 }, corsie: [{ id: 'a', etichetta: 'A' }], intervalli: [{ corsia: 'a', t0: 0, t1: 1, etichetta: 'invio' }], frecce: [], marcatori: [] };
  const aggiunta = { corsia: 'a', t0: 1, t1: 2, etichetta: 'attesa' };
  const r = progressione(comune, { ...comune, intervalli: [...comune.intervalli, aggiunta] });
  assert.deepEqual(r.nuovi, [{ tipo: 'intervallo', indice: 1, etichetta: 'attesa' }]);
  assert.equal(progressione(comune, { ...comune, asse_t: { ...comune.asse_t, max: 5 }, marcatori: [{ t: 2, etichetta: 't2' }] }).compatibile, false);
});

test('B5: scala e tacche restano identiche; i punti oltre gli assi sono clip-path', () => {
  const a = grafico([serie('segnale', [[-1, 0], [0, 1], [1, 0]])]);
  const b = grafico([a.serie[0], serie('replica', [[-5, 0], [5, 1]])]);
  const rel = progressione(a, b);
  const htmlA = renderFigura(a), htmlB = renderFigura(b, [], { progressione: rel });
  const view = html => /viewBox="0 0 (\d+) (\d+)"/.exec(html).slice(1).map(Number);
  const ticks = html => [...html.matchAll(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="(middle|end)"[^>]*>(-?\d+(?:\.\d+)?)<\/text>/g)].map(x => [x[1], x[2], x[3], x[4]]);
  assert.deepEqual(view(htmlA), view(htmlB));
  assert.deepEqual(ticks(htmlA), ticks(htmlB));
  assert.match(htmlB, /<clipPath id="clip-/);
  assert.match(htmlB, /clip-path="url\(#clip-/);
  assert.match(htmlB, /data-nuovo="true"/);
  assert.match(htmlB, /data-ereditato="true"/);
  assert.match(htmlB, /stroke="#1f6feb"/);
  assert.match(htmlB, /stroke="#d03a2d"/);
});
