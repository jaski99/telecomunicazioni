import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderFigura } from '../js/figure/index.js';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const specGrafico = { id: 'g1', tipo: 'grafico', titolo: 'Spettro PAM', descrizione: 'Spettro a righe del segnale PAM, asse omega.', asse_x: { etichetta: 'ω', min: -10, max: 10 }, asse_y: { etichetta: 'G(ω)', min: 0, max: 5 }, serie: [ { stile: 'righe', punti: [[-2, 3], [0, 5], [2, 3]], etichetta: 'G' }, { stile: 'linea', punti: [[-10, 0.5], [0, 1], [10, 0.5]], etichetta: 'involucro' }, { stile: 'punti', punti: [[-4, 2], [4, 2]], etichetta: 'campioni' }, { stile: 'tratteggio', punti: [[-6, 1], [6, 1]], etichetta: 'limite' } ], annotazioni: [{ x: 0, y: 5, testo: 'picco' }] };
const specBlocchi = { id: 'b1', tipo: 'blocchi', titolo: 'Filtro trasversale', descrizione: 'Schema a blocchi: ingresso, sommatore, moltiplicatore, uscita.', blocchi: [ { id: 'in', etichetta: 'x(t)', forma: 'ingresso', colonna: 0, riga: 1 }, { id: 's', etichetta: 'somma', forma: 'sommatore', colonna: 2, riga: 1 }, { id: 'm', etichetta: 'H(omega)', forma: 'rettangolo', colonna: 5, riga: 1 }, { id: 'out', etichetta: 'y(t)', forma: 'uscita', colonna: 8, riga: 1 } ], collegamenti: [ { da: 'in', a: 's', etichetta: 'segnale' }, { da: 's', a: 'm', etichetta: 'al sommatore' }, { da: 'm', a: 'out', etichetta: 'uscita' } ] };
const specTemporale = { id: 't1', tipo: 'temporale', titolo: 'Sliding window', descrizione: 'Timeline mittente e ricevitore.', asse_t: { etichetta: 't', min: 0, max: 20 }, corsie: [ { id: 'mittente', etichetta: 'mittente' }, { id: 'ricevitore', etichetta: 'ricevitore' } ], intervalli: [ { corsia: 'mittente', t0: 0, t1: 4, etichetta: 'frame 1', stile: 'trasmissione' }, { corsia: 'mittente', t0: 5, t1: 9, etichetta: 'frame 2', stile: 'trasmissione' }, { corsia: 'ricevitore', t0: 8, t1: 10, etichetta: 'ACK 1', stile: 'ack' } ], frecce: [ { da: { corsia: 'mittente', t: 4 }, a: { corsia: 'ricevitore', t: 8 }, etichetta: 'arrivo' } ], marcatori: [{ t: 4, etichetta: 't0' }] };
const FIGURE_DISPONIBILI = [specGrafico, specBlocchi, specTemporale];

function nessunTestoVietato(html) { return !/\b(null|undefined|NaN)\b/.test(html); }
function estraiViewBox(html) { const m = /viewBox="0 0 (\d+) (\d+)"/.exec(html); return m ? { w: Number(m[1]), h: Number(m[2]) } : null; }

test('renderFigura grafico valido: SVG con viewBox stretto, title, desc, role img', () => {
  const html = renderFigura(specGrafico);
  assert.ok(html.includes('<figure')); assert.ok(html.includes('role="img"')); assert.ok(html.includes('<svg'));
  const vb = estraiViewBox(html); assert.ok(vb); assert.ok(vb.w <= 720); assert.ok(vb.h <= 480);
  assert.ok(/<title[^>]*>Spettro PAM<\/title>/.test(html)); assert.ok(nessunTestoVietato(html));
});
test('renderFigura grafico: tutte le serie renderizzano senza eccezioni', () => {
  assert.doesNotThrow(() => renderFigura(specGrafico)); const html = renderFigura(specGrafico);
  assert.ok(html.includes('<rect') || html.includes('<path') || html.includes('<circle')); assert.ok(html.includes('limite'));
});
test('renderFigura grafico con asse non valide -> fallback solo testo', () => {
  const html = renderFigura({ ...specGrafico, asse_x: { etichetta: 'x', min: 5, max: 5 } });
  assert.ok(html.includes('<figure')); assert.ok(html.includes('Spettro a righe del segnale PAM, asse omega.')); assert.ok(nessunTestoVietato(html)); assert.ok(!html.includes('<svg'));
});
test('renderFigura spec mancante o invalida -> figure con sola descrizione, mai eccezione', () => {
  assert.doesNotThrow(() => renderFigura(null)); assert.doesNotThrow(() => renderFigura({}));
  assert.doesNotThrow(() => renderFigura({ tipo: 'sconosciuto', titolo: 'T', descrizione: 'D' }));
  const html = renderFigura({ tipo: 'sconosciuto', titolo: 'T', descrizione: 'Descrizione testuale.' });
  assert.ok(html.includes('<figure')); assert.ok(html.includes('Descrizione testuale.')); assert.ok(!html.includes('<svg')); assert.ok(nessunTestoVietato(html));
});
test('renderFigura blocchi valido: blocchi e collegamenti', () => {
  const html = renderFigura(specBlocchi); assert.ok(html.includes('<figure')); assert.ok(html.includes('viewBox'));
  assert.ok(/<title[^>]*>Filtro trasversale<\/title>/.test(html)); assert.ok(html.includes('somma') || html.includes('sommatore'));
  assert.ok(html.includes('y(t)')); assert.ok(html.includes('<circle') || html.includes('<rect')); assert.ok(nessunTestoVietato(html));
});
test('renderFigura blocchi con meno di due blocchi -> fallback testo', () => {
  const html = renderFigura({ ...specBlocchi, blocchi: [specBlocchi.blocchi[0]] });
  assert.ok(html.includes('<figure')); assert.ok(html.includes('Schema a blocchi: ingresso, sommatore, moltiplicatore, uscita.')); assert.ok(nessunTestoVietato(html)); assert.ok(!html.includes('<svg'));
});
test('renderFigura blocchi tollera collegamenti verso blocchi inesistenti', () => {
  assert.doesNotThrow(() => renderFigura({ ...specBlocchi, collegamenti: [{ da: 'inesistente', a: 'x' }] }));
  const html = renderFigura({ ...specBlocchi, collegamenti: [...specBlocchi.collegamenti, { da: 'inesistente', a: 'anche-piu-inesistente' }] });
  assert.ok(nessunTestoVietato(html));
});
test('renderFigura temporale valido: corsie, intervalli, frecce, marcatori', () => {
  const html = renderFigura(specTemporale); assert.ok(html.includes('<figure')); assert.ok(html.includes('viewBox'));
  assert.ok(/<title[^>]*>Sliding window<\/title>/.test(html)); assert.ok(html.includes('mittente')); assert.ok(html.includes('ricevitore'));
  assert.ok(html.includes('frame 1')); assert.ok(html.includes('ACK 1')); assert.ok(html.includes('t0')); assert.ok(nessunTestoVietato(html));
});
test('renderFigura temporale con asse_t non valido -> fallback testo', () => {
  const html = renderFigura({ ...specTemporale, asse_t: { etichetta: 't', min: 10, max: 2 } });
  assert.ok(html.includes('<figure')); assert.ok(html.includes('Timeline mittente e ricevitore.')); assert.ok(nessunTestoVietato(html));
});

test('renderFigura con id stringa risolve la figura dall elenco disponibile', () => {
  const html = renderFigura('g1', FIGURE_DISPONIBILI); assert.ok(html.includes('<figure')); assert.ok(/<title[^>]*>Spettro PAM<\/title>/.test(html)); assert.ok(html.includes('<svg')); assert.ok(nessunTestoVietato(html));
});
test('renderFigura con id stringa inesistente -> figura non disponibile, mai eccezione', () => {
  assert.doesNotThrow(() => renderFigura('id-inesistente', FIGURE_DISPONIBILI)); const html = renderFigura('id-inesistente', FIGURE_DISPONIBILI);
  assert.ok(html.includes('<figure')); assert.ok(html.includes('figura-non-disponibile')); assert.ok(!html.includes('<svg')); assert.ok(nessunTestoVietato(html));
});
test('renderFigura con id stringa e elenco vuoto -> figura non disponibile', () => {
  const html = renderFigura('g1', []); assert.ok(html.includes('figura-non-disponibile')); assert.ok(!html.includes('<svg'));
});
test('renderFigura con oggetto spec ignora figureDisponibili e usa lo spec', () => {
  const html = renderFigura(specTemporale, [specGrafico]); assert.ok(/<title[^>]*>Sliding window<\/title>/.test(html)); assert.ok(html.includes('mittente'));
});
test('nessuna figura diventa figura-non-disponibile quando tutti gli ID esistono (0 casi)', () => {
  const ids = FIGURE_DISPONIBILI.map(f => f.id); let nessunNonDisponibile = true;
  for (const id of ids) { const html = renderFigura(id, FIGURE_DISPONIBILI); if (html.includes('figura-non-disponibile')) nessunNonDisponibile = false; assert.ok(html.includes('<svg'), `la figura ${id} deve rendere un SVG`); }
  assert.ok(nessunNonDisponibile, 'nessuna figura disponibile deve risultare non disponibile');
});

test('ogni figura blocchi di web/graph.json: vbW <= 700, nessun testo fuori viewBox', () => {
  const graph = leggiGraph(); let totale = 0;
  for (const nodo of graph.nodi) { if (!nodo || !nodo.dimostrazione) continue; const dim = nodo.dimostrazione; const figs = Array.isArray(dim.figure) ? dim.figure : []; for (const p of (Array.isArray(dim.passi) ? dim.passi : [])) { if (!p || !p.figura) continue; const specOId = p.figura; let spec = typeof specOId === 'string' ? figs.find(f => f && String(f.id) === specOId) : specOId; if (!spec || spec.tipo !== 'blocchi') continue; totale++; const html = renderFigura(specOId, figs); assert.ok(html.includes('<svg'), `passo ${p.n} di ${nodo.id}: figura blocchi non risolta`); const vb = estraiViewBox(html); assert.ok(vb, `passo ${p.n} di ${nodo.id}: viewBox mancante`); assert.ok(vb.w <= 700, `passo ${p.n} di ${nodo.id}: vbW ${vb.w} > 700`); const testi = [...html.matchAll(/<text[^>]*?\sx="([\d\.]+)"[^>]*?\sy="([\d\.]+)"[^>]*>([^<]*)<\/text>/g)]; for (const t of testi) { const x = Number(t[1]); assert.ok(x >= 0 && x <= vb.w + 1, `passo ${p.n} di ${nodo.id}: testo x=${x} fuori viewBox [0,${vb.w}]`); } } }
  assert.ok(totale > 0, 'nessuna figura blocchi trovata nei passi di graph.json');
});

test('renderFigura blocchi: viewBox ragionevole (non gonfiato), testo dentro i bordi', () => {
  const html = renderFigura(specBlocchi);
  const vb = estraiViewBox(html); assert.ok(vb); assert.ok(vb.w <= 960, `viewBox troppo largo: ${vb.w}`); assert.ok(vb.h <= 480, `viewBox troppo alto: ${vb.h}`);
  // Nessun attributo x con segno negativo (testo fuori a sinistra prima del translate)
  const xsNeg = html.matchAll(/x="-\d+/g);
  let trovatoNegativo = false;
  for (const _m of xsNeg) { trovatoNegativo = true; break; }
  assert.ok(!trovatoNegativo, 'nessun testo con x negativo');
  // Il viewBox inizia da 0 (dopo il translate di centratura)
  assert.ok(html.includes('viewBox="0 0'), 'viewBox parte da 0');
});

function leggiGraph() { return JSON.parse(readFileSync(join(__dirname, '../graph.json'), 'utf8')); }

test('ogni passo.figura di web/graph.json risolta per ID contiene <svg', () => {
  const graph = leggiGraph(); let totale = 0;
  for (const nodo of graph.nodi) { if (!nodo || !nodo.dimostrazione) continue; const dim = nodo.dimostrazione; const figs = Array.isArray(dim.figure) ? dim.figure : []; for (const p of (Array.isArray(dim.passi) ? dim.passi : [])) { if (!p || !p.figura) continue; totale++; const html = renderFigura(p.figura, figs); assert.ok(html.includes('<svg'), `passo ${p.n} di ${nodo.id}: figura ${p.figura} non risolta per ID`); } }
  assert.ok(totale > 0, 'nessuna figura trovata nei passi di graph.json');
});
