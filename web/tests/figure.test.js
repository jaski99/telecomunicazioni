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
  assert.ok(frecce[0].inizio.x < nodi[0].x && frecce[0].fine.x < nodi[1].x); assert.match(disegnaBlocco(nodi[0]), /class="blocco ingresso"/); assert.match(disegnaFreccia(frecce[0]), /<path/);
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
  const tratto = /<path d="M ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+)" fill="none"/.exec(verticale.svgInner).map(Number);
  assert.equal(tratto[3], linea[1]); assert.equal(tratto[4], linea[2]);
  assert.equal((verticale.svgInner.match(/ Z" fill="#111827"/g) || []).length, 1);
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

test('ingressi e uscite collegati: una sola punta, segmento verticale nel flusso verticale', () => {
  for (const verticale of [false, true]) {
    const blocchi = [
      { id: 'i', forma: 'ingresso', etichetta: 'x(t)', colonna: 0, riga: 0 },
      { id: 'b', forma: 'rettangolo', etichetta: 'Filtro', colonna: verticale ? 0 : 1, riga: verticale ? 1 : 0 },
      { id: 'u', forma: 'uscita', etichetta: 'y(t)', colonna: verticale ? 0 : 2, riga: verticale ? 2 : 0 },
    ];
    const nodi = layoutBlocchi(blocchi), [entrata, uscita] = layoutCollegamenti(nodi, [{ da: 'i', a: 'b' }, { da: 'b', a: 'u' }]);
    assert.equal(nodi[0].servito, true);
    assert.doesNotMatch(disegnaBlocco(nodi[0]), /<line|<path/);
    assert.equal((disegnaFreccia(entrata).match(/ Z"/g) || []).length, 1);
    assert.equal((disegnaFreccia(uscita).match(/ Z"/g) || []).length, 0);
    assert.equal((disegnaBlocco(nodi[2]).match(/ Z"/g) || []).length, 1);
    if (verticale) {
      assert.equal(entrata.inizio.x, entrata.fine.x);
      assert.ok(entrata.inizio.y < entrata.fine.y);
      assert.equal(uscita.inizio.x, uscita.fine.x);
      assert.match(disegnaBlocco(nodi[2]), /<line x1="([\d.]+)" y1="[\d.]+" x2="\1"/);
    }
  }
});

test('tutte le figure a blocchi del grafo: nessuna punta coincide con inizio di altro segmento', () => {
  const figure = leggiGraph().nodi.flatMap(n => (n.dimostrazione?.figure || []).filter(f => f.tipo === 'blocchi'));
  assert.ok(figure.length >= 16, `attese almeno 16 figure a blocchi, trovate ${figure.length}`);
  for (const f of figure) for (const larghezzaMassima of [210, 700]) {
    const svg = renderBlocchi(f, { larghezzaMassima }).svgInner;
    const linee = [...svg.matchAll(/<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/g)]
      .map(m => [Number(m[1]), Number(m[2])]);
    const segmenti = [...svg.matchAll(/<path d="M ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+)" fill="none"/g)]
      .map(m => [Number(m[1]), Number(m[2])]);
    const punte = [...svg.matchAll(/<path d="M ([-\d.]+) ([-\d.]+) L [-\d.]+ [-\d.]+ L [-\d.]+ [-\d.]+ Z" fill="#111827"/g)]
      .map(m => [Number(m[1]), Number(m[2])]);
    for (const p of punte) for (const inizio of [...linee, ...segmenti])
      assert.ok(Math.hypot(p[0] - inizio[0], p[1] - inizio[1]) > .1, `${f.id} ${larghezzaMassima}: punta ${p} all'inizio di ${inizio}`);
  }
});

test('la punta di ogni uscita prosegue concorde col connettore a 210, 390 e 700', () => {
  const figure = leggiGraph().nodi.flatMap(n => (n.dimostrazione?.figure || []).filter(f => f.tipo === 'blocchi'));
  let controllate = 0;
  // 318 e' la larghezza CSS disponibile con viewport 390: copre i cinque ritorni a sinistra.
  for (const f of figure) for (const larghezzaMassima of [210, 318, 700]) {
    const r = renderBlocchi(f, { larghezzaMassima });
    for (const c of r.frecce) {
      const n = r.nodi.find(n => String(n.blocco.id) === String(f.collegamenti[c.indice].a));
      if (n?.forma !== 'uscita') continue;
      const d = n.verticale ? (n.verso === 'su' ? -1 : 1) : 0;
      const orizzontale = n.verticale ? 0 : (n.verso === 'sinistra' ? -1 : 1);
      const coda = { x: n.x - 16 * orizzontale, y: n.y - 16 * d };
      const punta = { x: n.x + 16 * orizzontale, y: n.y + 16 * d };
      assert.ok(Math.hypot(c.fine.x - coda.x, c.fine.y - coda.y) < .1,
        `${f.id}/${n.blocco.id} ${larghezzaMassima}: connettore non agganciato alla coda`);
      const punti = c.punti || [c.inizio, c.fine], precedente = punti.at(-2);
      const prodotto = (c.fine.x - precedente.x) * (punta.x - coda.x) + (c.fine.y - precedente.y) * (punta.y - coda.y);
      assert.ok(prodotto > 0, `${f.id}/${n.blocco.id} ${larghezzaMassima}: punta discorde dal connettore`);
      controllate++;
    }
  }
  assert.ok(controllate >= 17 * 3, `poche uscite controllate: ${controllate}`);
});

function trattoIntersecaRettangolo(a, b, r) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy], q = [a[0] - r[0], r[2] - a[0], a[1] - r[1], r[3] - a[1]];
  let inizio = 0, fine = 1;
  for (let i = 0; i < 4; i++) {
    if (!p[i]) { if (q[i] < 0) return false; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > fine) return false; inizio = Math.max(inizio, t); }
    else { if (t < inizio) return false; fine = Math.min(fine, t); }
  }
  return true;
}

test('nessun rect di etichetta di ingresso copre un connettore o una punta a 210 e 700', () => {
  const figure = leggiGraph().nodi.flatMap(n => [n.lezione, n.dimostrazione]
    .flatMap(s => (s?.figure || []).filter(f => f.tipo === 'blocchi')));
  let controllate = 0;
  for (const f of figure) for (const larghezzaMassima of [210, 700]) {
    const svg = renderBlocchi(f, { larghezzaMassima }).svgInner;
    const segmenti = [...svg.matchAll(/<path d="M ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+)" fill="none"/g)]
      .map(m => m.slice(1).map(Number));
    const punte = [...svg.matchAll(/<path d="M ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+) Z" fill="#111827"/g)]
      .map(m => m.slice(1).map(Number));
    for (const gruppo of svg.matchAll(/<g id="blocco-([^"]+)" class="blocco ingresso"[^>]*>([\s\S]*?)<\/g>/g)) {
      for (const rect of gruppo[2].matchAll(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)" fill="#fff"/g)) {
        const [x, y, w, h] = rect.slice(1).map(Number), r = [x, y, x + w, y + h];
        for (const s of segmenti) assert.ok(!trattoIntersecaRettangolo(s.slice(0, 2), s.slice(2), r),
          `${f.id}/${gruppo[1]} ${larghezzaMassima}: rect dell'etichetta sul connettore ${s}`);
        for (const p of punte) {
          const xs = [p[0], p[2], p[4]], ys = [p[1], p[3], p[5]];
          const sovrapposta = r[0] <= Math.max(...xs) && r[2] >= Math.min(...xs)
            && r[1] <= Math.max(...ys) && r[3] >= Math.min(...ys);
          assert.ok(!sovrapposta, `${f.id}/${gruppo[1]} ${larghezzaMassima}: rect dell'etichetta sulla punta ${p}`);
        }
        controllate++;
      }
    }
  }
  assert.ok(controllate >= 18 * 2, `poche etichette di ingresso controllate: ${controllate}`);
});

const puntiFreccia = c => c.punti?.length ? c.punti : [c.inizio, c.fine];
const vicini = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < .1;
const trattiFreccia = c => puntiFreccia(c).slice(1).map((p, i) => [puntiFreccia(c)[i], p])
  .filter(([a, b]) => !vicini(a, b));
const boxTesto = t => [t.x - t.w / 2, t.y - t.h / 2, t.x + t.w / 2, t.y + t.h / 2];
const boxSovrapposti = (a, b) => a[0] < b[2] - .1 && a[2] > b[0] + .1 && a[1] < b[3] - .1 && a[3] > b[1] + .1;

function incrocioTratti(a, b, c, d) {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y, den = rx * sy - ry * sx;
  if (Math.abs(den) > 1e-7) {
    const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den;
    const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den;
    if (t < -1e-7 || t > 1 + 1e-7 || u < -1e-7 || u > 1 + 1e-7) return null;
    return { x: a.x + t * rx, y: a.y + t * ry };
  }
  const croce = p => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  if (Math.abs(croce(c)) > 1e-6 || Math.abs(croce(d)) > 1e-6) return null;
  const asse = Math.abs(rx) >= Math.abs(ry) ? 'x' : 'y';
  const valori = [a[asse], b[asse], c[asse], d[asse]];
  const lo = Math.max(Math.min(valori[0], valori[1]), Math.min(valori[2], valori[3]));
  const hi = Math.min(Math.max(valori[0], valori[1]), Math.max(valori[2], valori[3]));
  if (hi < lo - 1e-7) return null;
  if (hi - lo > 1e-7) return 'tratto';
  const altro = asse === 'x' ? 'y' : 'x';
  return { [asse]: lo, [altro]: [a, b, c, d].find(p => Math.abs(p[asse] - lo) < 1e-7)[altro] };
}

let casiGeometria;
function geometrieGrafo() {
  if (casiGeometria) return casiGeometria;
  const figure = leggiGraph().nodi.flatMap(n => [n.lezione, n.dimostrazione]
    .flatMap(s => (s?.figure || []).filter(f => f.tipo === 'blocchi')));
  casiGeometria = figure.flatMap(f => [210, 318, 700].map(larghezzaMassima => ({
    f, larghezzaMassima, r: renderBlocchi(f, { larghezzaMassima }),
  })));
  return casiGeometria;
}

test('geometria 210/318/700: nessun connettore si incrocia o si sovrappone e le punte entranti sono distinte', () => {
  let controllati = 0;
  for (const { f, larghezzaMassima, r } of geometrieGrafo()) {
    for (let i = 0; i < r.frecce.length; i++) for (let j = i + 1; j < r.frecce.length; j++) {
      const a = r.frecce[i], b = r.frecce[j], estremiA = puntiFreccia(a), estremiB = puntiFreccia(b);
      for (const [x, y] of trattiFreccia(a)) for (const [z, w] of trattiFreccia(b)) {
        const p = incrocioTratti(x, y, z, w);
        if (!p) continue;
        const condiviso = p !== 'tratto' && [estremiA[0], estremiA.at(-1)].some(e => vicini(p, e))
          && [estremiB[0], estremiB.at(-1)].some(e => vicini(p, e));
        assert.ok(condiviso, `${f.id} ${larghezzaMassima}: incrocio fra collegamenti ${a.indice} e ${b.indice}`);
      }
      if (!a.senzaPunta && !b.senzaPunta && f.collegamenti[a.indice].a === f.collegamenti[b.indice].a)
        assert.ok(!vicini(a.fine, b.fine), `${f.id} ${larghezzaMassima}: punte coincidenti in ${f.collegamenti[a.indice].a}`);
      controllati++;
    }
  }
  assert.ok(controllati > 17 * 3, `pochi confronti geometrici: ${controllati}`);
});

test('geometria 210/318/700: nessun connettore attraversa un blocco non proprio', () => {
  let controllati = 0;
  for (const { f, larghezzaMassima, r } of geometrieGrafo()) for (const c of r.frecce) {
    const link = f.collegamenti[c.indice], propri = new Set([String(link.da), String(link.a)]);
    for (const n of r.nodi) {
      if (propri.has(String(n.blocco.id))) continue;
      const box = [n.x - n.w / 2, n.y - n.h / 2, n.x + n.w / 2, n.y + n.h / 2];
      for (const [a, b] of trattiFreccia(c)) {
        assert.ok(!trattoIntersecaRettangolo([a.x, a.y], [b.x, b.y], box),
          `${f.id} ${larghezzaMassima}: ${link.da}>${link.a} attraversa ${n.blocco.id}`);
        controllati++;
      }
    }
  }
  assert.ok(controllati > 17 * 3, `pochi controlli sui blocchi: ${controllati}`);
});

test('geometria 210/318/700: nessun rect opaco copre connettori, punte o altro testo', () => {
  let controllati = 0;
  for (const { f, larghezzaMassima, r } of geometrieGrafo()) {
    const testi = [];
    for (const n of r.nodi) for (const [i, t] of n.testi.entries()) testi.push({
      t, n, c: null, opaco: n.forma !== 'rettangolo' && (n.forma !== 'ritardo' || i > 0),
      nome: `${n.blocco.id}:${t.originale}`,
    });
    for (const c of r.frecce) if (c.testo) testi.push({ t: c.testo, n: null, c, opaco: true, nome: `link:${c.testo.originale}` });
    const punte = r.frecce.filter(c => !c.senzaPunta).map(c => [c.fine, ...c.ali]);
    for (const n of r.nodi) {
      if (n.forma !== 'uscita') continue;
      if (n.verticale) {
        const d = n.verso === 'su' ? -1 : 1;
        punte.push([{ x: n.x, y: n.y + 16 * d }, { x: n.x - 5, y: n.y + 7 * d }, { x: n.x + 5, y: n.y + 7 * d }]);
      } else {
        const d = n.verso === 'sinistra' ? -1 : 1;
        punte.push([{ x: n.x + 16 * d, y: n.y }, { x: n.x + 7 * d, y: n.y - 5 }, { x: n.x + 7 * d, y: n.y + 5 }]);
      }
    }
    for (const item of testi) {
      if (!item.opaco) continue;
      const box = boxTesto(item.t);
      for (const c of r.frecce) {
        if (item.c === c) continue;
        for (const [a, b] of trattiFreccia(c)) assert.ok(!trattoIntersecaRettangolo([a.x, a.y], [b.x, b.y], box),
          `${f.id} ${larghezzaMassima}: ${item.nome} copre il collegamento ${c.indice}`);
      }
      for (const punti of punte) {
        const xs = punti.map(p => p.x), ys = punti.map(p => p.y);
        const coperta = box[0] <= Math.max(...xs) && box[2] >= Math.min(...xs)
          && box[1] <= Math.max(...ys) && box[3] >= Math.min(...ys);
        assert.ok(!coperta, `${f.id} ${larghezzaMassima}: ${item.nome} copre una punta`);
      }
      for (const altro of testi) if (altro !== item) assert.ok(!boxSovrapposti(box, boxTesto(altro.t)),
        `${f.id} ${larghezzaMassima}: ${item.nome} copre ${altro.nome}`);
      controllati++;
    }
  }
  assert.ok(controllati > 17 * 3, `poche etichette controllate: ${controllati}`);
});

test('geometria 210/318/700: le due diramazioni x(t) partono dal centro comune con punto di giunzione', () => {
  const figure = leggiGraph().nodi.flatMap(n => [n.lezione, n.dimostrazione]
    .flatMap(s => (s?.figure || []).filter(f => ['schema-filtro-trasversale', 'linea-ritardo-prese'].includes(f.id))));
  assert.equal(figure.length, 2);
  for (const f of figure) for (const larghezzaMassima of [210, 318, 700]) {
    const r = renderBlocchi(f, { larghezzaMassima }), n = r.nodi.find(n => n.blocco.id === 'in');
    const uscenti = r.frecce.filter(c => f.collegamenti[c.indice].da === 'in');
    assert.ok(uscenti.length > 1 && n.diramazione);
    for (const c of uscenti) assert.ok(vicini(c.inizio, n), `${f.id} ${larghezzaMassima}: ramo fuori dal centro comune`);
    assert.match(disegnaBlocco(n), /<circle cx="[-\d.]+" cy="[-\d.]+" r="4" fill="#111827"\/>/);
  }
});

const boxForma = n => {
  if (n.forma === 'ingresso' || n.forma === 'uscita') {
    if (n.forma === 'ingresso' && n.servito)
      return n.diramazione ? [n.x - 4, n.y - 4, n.x + 4, n.y + 4] : [n.x, n.y, n.x, n.y];
    return n.verticale ? [n.x - 5, n.y - 16, n.x + 5, n.y + 16] : [n.x - 16, n.y - 5, n.x + 16, n.y + 5];
  }
  return [n.x - n.w / 2, n.y - n.h / 2, n.x + n.w / 2, n.y + n.h / 2];
};

function paralleliSegmenti([a, b], [c, d]) {
  const ah = Math.abs(b.y - a.y) < .01, av = Math.abs(b.x - a.x) < .01;
  const bh = Math.abs(d.y - c.y) < .01, bv = Math.abs(d.x - c.x) < .01;
  if (ah && bh) {
    const lo = Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x));
    const hi = Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x));
    return { overlap: hi - lo, dist: Math.abs(a.y - c.y) };
  }
  if (av && bv) {
    const lo = Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y));
    const hi = Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y));
    return { overlap: hi - lo, dist: Math.abs(a.x - c.x) };
  }
  return null;
}

const latiDi = box => [
  [{ x: box[0], y: box[1] }, { x: box[2], y: box[1] }],
  [{ x: box[0], y: box[3] }, { x: box[2], y: box[3] }],
  [{ x: box[0], y: box[1] }, { x: box[0], y: box[3] }],
  [{ x: box[2], y: box[1] }, { x: box[2], y: box[3] }],
];

test('geometria 210/318/700: nessun rect opaco sta sulla forma di un blocco, a cominciare dal proprio', () => {
  let controllati = 0;
  for (const { f, larghezzaMassima, r } of geometrieGrafo()) {
    const testi = [];
    for (const n of r.nodi) for (const [i, t] of n.testi.entries())
      if (n.forma !== 'rettangolo' && (n.forma !== 'ritardo' || i > 0))
        testi.push({ t, nome: `${n.blocco.id}:${t.originale}` });
    for (const c of r.frecce) if (c.testo) testi.push({ t: c.testo, nome: `link${c.indice}:${c.testo.originale}` });
    for (const item of testi) {
      const box = boxTesto(item.t);
      for (const n of r.nodi) assert.ok(!boxSovrapposti(box, boxForma(n)),
        `${f.id} ${larghezzaMassima}: ${item.nome} sulla forma di ${n.blocco.id}`);
      controllati++;
    }
  }
  assert.ok(controllati > 17 * 3, `poche etichette controllate: ${controllati}`);
});

test('geometria 210/318/700: corsie a >=8 px fra loro e dai blocchi, nessun tratto a <2 px da un lato', () => {
  let controllati = 0;
  for (const { f, larghezzaMassima, r } of geometrieGrafo()) {
    for (let i = 0; i < r.frecce.length; i++) for (let j = i + 1; j < r.frecce.length; j++)
      for (const s of trattiFreccia(r.frecce[i])) for (const t of trattiFreccia(r.frecce[j])) {
        const info = paralleliSegmenti(s, t);
        if (info && info.overlap > .1) assert.ok(info.dist >= 8 - .01,
          `${f.id} ${larghezzaMassima}: corsie ${r.frecce[i].indice}/${r.frecce[j].indice} a ${info.dist.toFixed(1)} px`);
      }
    for (const c of r.frecce) {
      const link = f.collegamenti[c.indice], tratti = trattiFreccia(c);
      for (const n of r.nodi) {
        if (n.forma === 'ingresso' || n.forma === 'uscita') continue;
        const box = [n.x - n.w / 2, n.y - n.h / 2, n.x + n.w / 2, n.y + n.h / 2];
        for (const [si, s] of tratti.entries()) {
          const moncone = (String(n.blocco.id) === String(link.da) && si === 0)
            || (String(n.blocco.id) === String(link.a) && si === tratti.length - 1);
          for (const lato of latiDi(box)) {
            const info = paralleliSegmenti(s, lato);
            if (!info || info.overlap <= .1) continue;
            assert.ok(info.dist >= 2 - .01,
              `${f.id} ${larghezzaMassima}: ${link.da}>${link.a} a ${info.dist.toFixed(1)} px da un lato di ${n.blocco.id}`);
            if (!moncone) assert.ok(info.dist >= 8 - .01,
              `${f.id} ${larghezzaMassima}: corsia ${link.da}>${link.a} a ${info.dist.toFixed(1)} px da ${n.blocco.id}`);
            controllati++;
          }
        }
      }
    }
  }
  assert.ok(controllati > 17 * 3, `pochi controlli sulle corsie: ${controllati}`);
});

test('geometria 210/318/700: punte sullo stesso blocco a >=14 px e tutto dentro il viewBox', () => {
  let controllate = 0;
  for (const { f, larghezzaMassima, r } of geometrieGrafo()) {
    const perBlocco = new Map();
    for (const c of r.frecce) {
      if (c.senzaPunta) continue;
      const a = String(f.collegamenti[c.indice].a);
      if (!perBlocco.has(a)) perBlocco.set(a, []);
      perBlocco.get(a).push(c);
    }
    for (const [a, cs] of perBlocco) for (let i = 0; i < cs.length; i++)
      for (let j = i + 1; j < cs.length; j++) {
        const d = Math.hypot(cs[i].fine.x - cs[j].fine.x, cs[i].fine.y - cs[j].fine.y);
        assert.ok(d >= 14 - .01, `${f.id} ${larghezzaMassima}: punte su ${a} a ${d.toFixed(1)} px`);
        controllate++;
      }
    const m = /translate\(([-0-9.]+),([-0-9.]+)\)/.exec(r.svgInner);
    const dx = Number(m[1]), dy = Number(m[2]);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const estendi = (x, y, pad = 0) => {
      minX = Math.min(minX, x - pad); minY = Math.min(minY, y - pad);
      maxX = Math.max(maxX, x + pad); maxY = Math.max(maxY, y + pad);
    };
    for (const n of r.nodi) {
      const b = boxForma(n);
      estendi(b[0] + dx, b[1] + dy); estendi(b[2] + dx, b[3] + dy);
      for (const t of n.testi) { const tb = boxTesto(t); estendi(tb[0] + dx, tb[1] + dy); estendi(tb[2] + dx, tb[3] + dy); }
    }
    for (const c of r.frecce) {
      for (const p of [...puntiFreccia(c), c.base, ...c.ali]) estendi(p.x + dx, p.y + dy, 1);
      if (c.testo) { const tb = boxTesto(c.testo); estendi(tb[0] + dx, tb[1] + dy); estendi(tb[2] + dx, tb[3] + dy); }
    }
    assert.ok(minX >= -.01 && minY >= -.01 && maxX <= r.viewBox.w + .01 && maxY <= r.viewBox.h + .01,
      `${f.id} ${larghezzaMassima}: ingombri [${minX.toFixed(1)},${minY.toFixed(1)},${maxX.toFixed(1)},${maxY.toFixed(1)}] fuori da ${r.viewBox.w}x${r.viewBox.h}`);
  }
  assert.ok(controllate > 0, 'nessuna coppia di punte controllata');
});

// Distanze usate dai controlli sulle etichette: scatole e segmenti.
const distanzaBoxBox = (a, b) => Math.hypot(
  Math.max(0, b[0] - a[2], a[0] - b[2]), Math.max(0, b[1] - a[3], a[1] - b[3]));
const distanzaPuntoSegmento = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
const distanzaSegmentoBox = (a, b, r) => {
  if (trattoIntersecaRettangolo([a.x, a.y], [b.x, b.y], r)) return 0;
  const vertici = [[r[0], r[1]], [r[2], r[1]], [r[0], r[3]], [r[2], r[3]]].map(([x, y]) => ({ x, y }));
  let d = Infinity;
  for (const p of [a, b]) for (let i = 0; i < 4; i++) d = Math.min(d, distanzaPuntoSegmento(p, vertici[i], vertici[(i + 1) % 4]));
  for (const p of vertici) d = Math.min(d, distanzaPuntoSegmento(p, a, b));
  return d;
};

test('geometria 210/318/700: nessun tratto di un connettore torna indietro', () => {
  let controllati = 0;
  for (const { f, larghezzaMassima, r } of geometrieGrafo()) for (const c of r.frecce) {
    const punti = puntiFreccia(c), link = f.collegamenti[c.indice];
    for (let i = 2; i < punti.length; i++) {
      const a = punti[i - 2], b = punti[i - 1], d = punti[i];
      const prodotto = (b.x - a.x) * (d.x - b.x) + (b.y - a.y) * (d.y - b.y);
      assert.ok(prodotto > -.01,
        `${f.id} ${larghezzaMassima}: ${link.da}>${link.a} torna indietro al punto ${i} (${prodotto.toFixed(1)})`);
      controllati++;
    }
  }
  assert.ok(controllati > 17 * 3, `pochi tratti controllati: ${controllati}`);
});

test('geometria 210/318/700: ogni etichetta resta accanto alla propria forma e lontana dai connettori', () => {
  let controllati = 0;
  for (const { f, larghezzaMassima, r } of geometrieGrafo()) {
    const incidenti = n => r.frecce.filter(c => [f.collegamenti[c.indice].da, f.collegamenti[c.indice].a]
      .some(id => String(id) === String(n.blocco.id))).length;
    const testi = [];
    for (const n of r.nodi) for (const [i, t] of n.testi.entries())
      if (n.forma !== 'rettangolo' && (n.forma !== 'ritardo' || i > 0))
        testi.push({ t, n, c: null, nome: `${n.blocco.id}:${t.originale}` });
    for (const c of r.frecce) if (c.testo) testi.push({ t: c.testo, n: null, c, nome: `link${c.indice}:${c.testo.originale}` });
    for (const item of testi) {
      const box = boxTesto(item.t);
      const dOwn = item.n ? distanzaBoxBox(box, boxForma(item.n))
        : Math.min(...trattiFreccia(item.c).map(([a, b]) => distanzaSegmentoBox(a, b, box)));
      // Uno snodo con tre o piu' connettori non lascia spazio sul bordo: le
      // porte occupano tutto il perimetro e il nome resta appena piu' discosto.
      const soglia = item.n && incidenti(item.n) >= 3 ? 16 : 12;
      assert.ok(dOwn <= soglia + .01,
        `${f.id} ${larghezzaMassima}: ${item.nome} a ${dOwn.toFixed(1)} px dalla propria forma`);
      for (const n of r.nodi) {
        if (n === item.n) continue;
        assert.ok(distanzaBoxBox(box, boxForma(n)) >= dOwn - .05,
          `${f.id} ${larghezzaMassima}: ${item.nome} e' piu' vicina a ${n.blocco.id} che alla propria forma`);
      }
      for (const c of r.frecce) {
        if (item.c === c) continue; // l'etichetta di un connettore vive sul proprio filo
        for (const [a, b] of trattiFreccia(c)) {
          const d = distanzaSegmentoBox(a, b, box);
          assert.ok(d >= 4 - .01, `${f.id} ${larghezzaMassima}: ${item.nome} a ${d.toFixed(1)} px dal collegamento ${c.indice}`);
        }
      }
      controllati++;
    }
  }
  assert.ok(controllati > 17 * 3, `poche etichette controllate: ${controllati}`);
});

test('fixture filtro ricorrente (E3): l\'uscita resta concorde a 210, 318 e 700', () => {
  const f = JSON.parse(readFileSync(join(__dirname, 'fixtures/filtro-ricorrente-e3.json'), 'utf8'));
  assert.equal(f.id, 'schema-filtro-ricorrente-semplificato');
  assert.ok(f.blocchi.length >= 16, `fixture incompleta: ${f.blocchi.length} blocchi`);
  let controllate = 0;
  for (const larghezzaMassima of [210, 318, 700]) {
    const r = renderBlocchi(f, { larghezzaMassima });
    for (const c of r.frecce) {
      const n = r.nodi.find(n => String(n.blocco.id) === String(f.collegamenti[c.indice].a));
      if (!n || n.forma !== 'uscita') continue;
      const d = n.verticale ? (n.verso === 'su' ? -1 : 1) : 0;
      const o = n.verticale ? 0 : (n.verso === 'sinistra' ? -1 : 1);
      const coda = { x: n.x - 16 * o, y: n.y - 16 * d }, punta = { x: n.x + 16 * o, y: n.y + 16 * d };
      const punti = puntiFreccia(c), prev = punti.at(-2);
      assert.ok(vicini(c.fine, coda),
        `fixture ${larghezzaMassima}: il connettore non arriva alla coda di ${n.blocco.id}`);
      const prodotto = (c.fine.x - prev.x) * (punta.x - coda.x) + (c.fine.y - prev.y) * (punta.y - coda.y);
      assert.ok(prodotto > 0,
        `fixture ${larghezzaMassima}: punta discorde da ${n.blocco.id} (${prodotto.toFixed(1)})`);
      controllate++;
    }
  }
  assert.ok(controllate >= 3, `poche uscite controllate: ${controllate}`);
});
