import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderFigura } from '../js/figure/index.js';
import { FS_BLOCCHI, INTERLINEA, testoARighe, misuraTesto, layoutBlocchi, layoutCollegamenti } from '../js/figure/blocchi-layout.js';
import { disegnaTesto, disegnaBlocco, disegnaFreccia } from '../js/figure/blocchi-forme.js';
import { bboxBlocchi, renderBlocchi } from '../js/figure/blocchi.js';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const specGrafico = { id: 'g1', tipo: 'grafico', titolo: 'Spettro PAM', descrizione: 'Spettro a righe del segnale PAM, asse omega.', asse_x: { etichetta: 'ω', min: -10, max: 10 }, asse_y: { etichetta: 'G(ω)', min: 0, max: 5 }, serie: [ { stile: 'righe', punti: [[-2, 3], [0, 5], [2, 3]], etichetta: 'G' }, { stile: 'linea', punti: [[-10, 0.5], [0, 1], [10, 0.5]], etichetta: 'involucro' }, { stile: 'punti', punti: [[-4, 2], [4, 2]], etichetta: 'campioni' }, { stile: 'tratteggio', punti: [[-6, 1], [6, 1]], etichetta: 'limite' } ], annotazioni: [{ x: 0, y: 5, testo: 'picco' }] };
const specBlocchi = { id: 'b1', tipo: 'blocchi', titolo: 'Filtro trasversale', descrizione: 'Schema a blocchi: ingresso, sommatore, moltiplicatore, uscita.', blocchi: [ { id: 'in', etichetta: 'x(t)', forma: 'ingresso', colonna: 0, riga: 1 }, { id: 's', etichetta: 'somma', forma: 'sommatore', colonna: 2, riga: 1 }, { id: 'm', etichetta: 'H(omega)', forma: 'rettangolo', colonna: 5, riga: 1 }, { id: 'out', etichetta: 'y(t)', forma: 'uscita', colonna: 8, riga: 1 } ], collegamenti: [ { da: 'in', a: 's', etichetta: 'segnale' }, { da: 's', a: 'm', etichetta: 'al sommatore' }, { da: 'm', a: 'out', etichetta: 'uscita' } ] };
const specTemporale = { id: 't1', tipo: 'temporale', titolo: 'Sliding window', descrizione: 'Timeline mittente e ricevitore.', asse_t: { etichetta: 't', min: 0, max: 20 }, corsie: [ { id: 'mittente', etichetta: 'mittente' }, { id: 'ricevitore', etichetta: 'ricevitore' } ], intervalli: [ { corsia: 'mittente', t0: 0, t1: 4, etichetta: 'frame 1', stile: 'trasmissione' }, { corsia: 'mittente', t0: 5, t1: 9, etichetta: 'frame 2', stile: 'trasmissione' }, { corsia: 'ricevitore', t0: 8, t1: 10, etichetta: 'ACK 1', stile: 'ack' } ], frecce: [ { da: { corsia: 'mittente', t: 4 }, a: { corsia: 'ricevitore', t: 8 }, etichetta: 'arrivo' } ], marcatori: [{ t: 4, etichetta: 't0' }] };
const FIGURE_DISPONIBILI = [specGrafico, specBlocchi, specTemporale];

function nessunTestoVietato(html) { return !/\b(null|undefined|NaN)\b/.test(html); }
function estraiViewBox(html) { const m = /viewBox="0 0 (\d+) (\d+)"/.exec(html); return m ? { w: Number(m[1]), h: Number(m[2]) } : null; }

test('renderFigura grafico valido: SVG con viewBox stretto, title, desc, role img', () => {
  const html = renderFigura(specGrafico);
  assert.ok(html.includes('<figure id="g1"')); assert.ok(html.includes('role="img"')); assert.ok(html.includes('<svg'));
  assert.ok(html.includes('aria-label="Spettro a righe del segnale PAM, asse omega."'));
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
test('layout: va a capo solo fra parole, mantiene intere quelle lunghe e misura ogni riga', () => {
  assert.deepEqual(testoARighe('Campionatore ideale, periodo T', 12), ['Campionatore', 'ideale,', 'periodo T']); assert.deepEqual(testoARighe('abcdefghijk', 4), ['abcdefghijk']); assert.deepEqual(testoARighe('', 8), []);
  assert.ok(misuraTesto(['WWW']).w > misuraTesto(['iii']).w); assert.ok(Math.abs(misuraTesto(['a', 'b']).h - misuraTesto(['a']).h - FS_BLOCCHI * INTERLINEA) < 1e-8);
});
test('forme: una sola etichetta SVG, tspan centrati, interlinea e testo escapato', () => {
  const t = { originale: 'a < b', righe: ['a <', 'b'], x: 55, y: 40, ...misuraTesto(['a <', 'b']) };
  const html = disegnaTesto(t, true); assert.equal((html.match(/<text\b/g) || []).length, 1);
  assert.match(html, /<tspan x="55" dy="0">a &lt;<\/tspan><tspan x="55" dy="1\.2em">b<\/tspan>/); assert.doesNotMatch(html, /<text\b[^>]*>\s*<text\b/);
});
test('geometria: colonne cumulative, frecce ai bordi, bbox e input immutato', () => {
  const input = structuredClone(specBlocchi), nodi = layoutBlocchi(input.blocchi), frecce = layoutCollegamenti(nodi, input.collegamenti);
  assert.deepEqual(input, specBlocchi); assert.ok(nodi.every((n, i) => i === 0 || n.x > nodi[i - 1].x)); assert.equal(frecce.length, input.collegamenti.length);
  assert.ok(frecce[0].inizio.x > nodi[0].x && frecce[0].fine.x < nodi[1].x); assert.match(disegnaBlocco(nodi[0]), /class="blocco ingresso"/); assert.match(disegnaFreccia(frecce[0]), /<path/);
  const box = bboxBlocchi(nodi, frecce); for (const nodo of nodi) assert.ok(nodo.box.left >= box.left && nodo.box.right <= box.right && nodo.box.top >= box.top && nodo.box.bottom <= box.bottom);
});
test('tutte le 17 figure blocchi: testi in box, nessun annidamento, colonne crescenti e viewBox non tagliato', () => {
  const figure = leggiGraph().nodi.flatMap(n => [n.lezione, n.dimostrazione].flatMap(s => (s?.figure || []).filter(f => f.tipo === 'blocchi')));
  assert.equal(figure.length, 17); const decodifica = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&');
  for (const f of figure) {
    const r = renderBlocchi(f), [ , dx, dy ] = /translate\(([-\d.]+),([-\d.]+)\)/.exec(r.svgInner).map(Number);
    assert.ok(r.viewBox.w <= 700 && r.fs === 14, f.id); assert.doesNotMatch(r.svgInner, /<text\b[^>]*>(?:(?!<\/text>)[\s\S])*<text\b/, f.id);
    const nodi = layoutBlocchi(f.blocchi), colonne = [...new Set(f.blocchi.map(b => b.colonna))].sort((a, b) => a - b);
    const xs = colonne.map(c => nodi.find(n => n.blocco.colonna === c).x); assert.ok(xs.every((x, i) => !i || x > xs[i - 1]), f.id);
    const testi = [...r.svgInner.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)]; assert.ok(testi.length, f.id);
    for (const [, xx, yy, contenuto] of testi) {
      const spans = [...contenuto.matchAll(/<tspan x="([\d.]+)" dy="([^"]+)">([^<]*)<\/tspan>/g)]; assert.ok(spans.every((s, i) => Number(s[1]) === Number(xx) && s[2] === (i ? '1.2em' : '0')), f.id);
      const righe = spans.length ? spans.map(s => decodifica(s[3])) : [decodifica(contenuto)];
      const { w, h } = misuraTesto(righe), x = Number(xx) + dx, y = Number(yy) + dy + (righe.length - 1) * FS_BLOCCHI * INTERLINEA / 2;
      assert.ok(x - w / 2 >= -0.1 && x + w / 2 <= r.viewBox.w + 0.1 && y - h / 2 >= -0.1 && y + h / 2 <= r.viewBox.h + 0.1, `${f.id}: ${righe.join(' ')}`);
    } }
});
test('layout fit: tredici colonne con etichette lunghe non vengono tagliate', () => {
  const blocchi = Array.from({ length: 13 }, (_, i) => ({ id: `${i}`, forma: 'rettangolo', colonna: i, riga: 0, etichetta: `Modulo molto lungo ${i}` }));
  const r = renderBlocchi({ blocchi, collegamenti: blocchi.slice(1).map((b, i) => ({ da: blocchi[i].id, a: b.id })) });
  assert.ok(r.viewBox.w <= 700); assert.equal((r.svgInner.match(/class="blocco rettangolo"/g) || []).length, 13); assert.ok(r.viewBox.h > 36); assert.doesNotMatch(r.svgInner, /<text\b[^>]*>\s*<text\b/);
});
test('uscita nel flusso verticale: segmento dal centro verso il basso, punta in giu, etichetta di lato', () => {
  const verticale = renderBlocchi({ blocchi: [
    { id: 'a', etichetta: 'Formatore', forma: 'rettangolo', colonna: 0, riga: 0 },
    { id: 'u', etichetta: 's(t)', forma: 'uscita', colonna: 0, riga: 1 },
  ], collegamenti: [{ da: 'a', a: 'u' }] });
  const mLinea = /<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/.exec(verticale.svgInner);
  const linea = mLinea.map(Number);
  assert.equal(linea[1], linea[3]); assert.ok(linea[4] > linea[2]); // segmento verticale, verso il basso
  const punta = /<path d="M ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+) Z"/
    .exec(verticale.svgInner.slice(mLinea.index)).map(Number); // apice del glifo, dopo il tratto
  assert.equal(punta[1], linea[1]); assert.ok(punta[2] > linea[4] && punta[2] > punta[4] && punta[2] > punta[6]);
  const apiceFreccia = /<path d="M [-\d.]+ [-\d.]+ L [-\d.]+ [-\d.]+" fill="none"[\s\S]*?<path d="M ([-\d.]+) ([-\d.]+) L/
    .exec(verticale.svgInner).map(Number); // la freccia si aggancia in cima al segmento
  assert.equal(apiceFreccia[1], linea[1]); assert.equal(apiceFreccia[2], linea[2]);
  const etichetta = /<text x="([-\d.]+)" y="([-\d.]+)"[^>]*aria-label="s\(t\)"/.exec(verticale.svgInner).map(Number);
  assert.ok(etichetta[1] > linea[1]); // a destra del segmento, non sotto la punta
  assert.ok(etichetta[2] >= linea[2] && etichetta[2] <= punta[2]); // allineata in altezza al glifo
  assert.ok(etichetta[1] > 0 && etichetta[1] < verticale.viewBox.w && etichetta[2] > 0 && etichetta[2] < verticale.viewBox.h);
});
test('uscita nel flusso orizzontale: glifo invariato, punta a destra ed etichetta sotto', () => {
  const orizzontale = renderBlocchi({ blocchi: [
    { id: 'a', etichetta: 'Formatore', forma: 'rettangolo', colonna: 0, riga: 0 },
    { id: 'u', etichetta: 's(t)', forma: 'uscita', colonna: 1, riga: 0 },
  ], collegamenti: [{ da: 'a', a: 'u' }] });
  const mLinea = /<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/.exec(orizzontale.svgInner);
  const linea = mLinea.map(Number);
  assert.equal(linea[2], linea[4]); assert.ok(linea[3] > linea[1]);
  const punta = /<path d="M ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+) Z"/
    .exec(orizzontale.svgInner.slice(mLinea.index)).map(Number);
  assert.ok(punta[1] > punta[3] && punta[1] > punta[5]); assert.equal(punta[2], linea[2]); // apice a destra, in asse
  const etichetta = /<text x="([-\d.]+)" y="([-\d.]+)"[^>]*aria-label="s\(t\)"/.exec(orizzontale.svgInner).map(Number);
  assert.equal(etichetta[1], linea[1] + 16); assert.ok(etichetta[2] > punta[2]); // centrata sotto il glifo
});
test('B12 fixture: gli span delle etichette a blocchi contengono parole intere anche oltre il limite di riga', () => {
  const etichetta = 'TrasformazioneFourier con parole intere';
  const r = renderBlocchi({ blocchi: [
    { id: 'a', forma: 'rettangolo', colonna: 0, riga: 0, etichetta },
    { id: 'b', forma: 'nodo', colonna: 1, riga: 0, etichetta: '' },
  ], collegamenti: [] });
  const righe = [...r.svgInner.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map(m => m[1].replace(/&amp;/g, '&'));
  assert.ok(righe.includes('TrasformazioneFourier'));
  assert.deepEqual(righe.join(' ').split(/\s+/u), etichetta.split(/\s+/u));
});

test('B12: tutte le figure a blocchi del grafo mantengono intere le parole nelle etichette', () => {
  const figure = leggiGraph().nodi.flatMap(n => [n.lezione, n.dimostrazione]
    .flatMap(s => (s?.figure || []).filter(f => f.tipo === 'blocchi')));
  const decodifica = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'").replace(/&amp;/g, '&');
  for (const f of figure) {
    const html = renderBlocchi(f).svgInner;
    const testi = [...html.matchAll(/<text\b[^>]*aria-label="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g)];
    for (const blocco of f.blocchi) {
      const etichetta = String(blocco.etichetta || '').trim();
      if (!etichetta || (blocco.forma === 'sommatore' && etichetta === '+')) continue;
      const trovato = testi.find(m => decodifica(m[1]).trim().replace(/\s+/gu, ' ') === etichetta.replace(/\s+/gu, ' '));
      assert.ok(trovato, `${f.id}/${blocco.id}: etichetta SVG assente`);
      const testoReso = decodifica(trovato[2].replace(/<[^>]+>/gu, ' ')).trim().replace(/\s+/gu, ' ');
      assert.deepEqual(testoReso.split(' '), etichetta.replace(/\s+/gu, ' ').split(' '), `${f.id}/${blocco.id}`);
    }
  }
});

test('grafico e temporale conservano etichette e frecce dentro gli ingombri', () => {
  const grafico = renderFigura({ ...specGrafico, asse_y: { ...specGrafico.asse_y, etichetta: 'Throughput ρ (trame riuscite per durata)' } });
  assert.ok(estraiViewBox(grafico).h > 360); const temporale = renderFigura(specTemporale);
  assert.match(temporale, /marker-end="url\(#freccia-temp\)"/); assert.match(temporale, />arrivo<\/text>/); assert.match(temporale, /width="720"/); assert.match(temporale, /font-size="20">t<\/text>/);
});
