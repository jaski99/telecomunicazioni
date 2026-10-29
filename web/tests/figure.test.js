import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFigura } from '../js/figure/index.js';

const specGrafico = {
  id: 'g1',
  tipo: 'grafico',
  titolo: 'Spettro PAM',
  descrizione: 'Spettro a righe del segnale PAM, asse omega.',
  asse_x: { etichetta: '\u03c9', min: -10, max: 10 },
  asse_y: { etichetta: 'G(\u03c9)', min: 0, max: 5 },
  serie: [
    { stile: 'righe', punti: [[-2, 3], [0, 5], [2, 3]], etichetta: 'G' },
    { stile: 'linea', punti: [[-10, 0.5], [0, 1], [10, 0.5]], etichetta: 'involucro' },
    { stile: 'punti', punti: [[-4, 2], [4, 2]], etichetta: 'campioni' },
    { stile: 'tratteggio', punti: [[-6, 1], [6, 1]], etichetta: 'limite' },
  ],
  annotazioni: [{ x: 0, y: 5, testo: 'picco' }],
};

const specBlocchi = {
  id: 'b1',
  tipo: 'blocchi',
  titolo: 'Filtro trasversale',
  descrizione: 'Schema a blocchi: ingresso, sommatore, moltiplicatore, uscita.',
  blocchi: [
    { id: 'in', etichetta: 'x(t)', forma: 'ingresso', colonna: 0, riga: 1 },
    { id: 's', etichetta: 'somma', forma: 'sommatore', colonna: 2, riga: 1 },
    { id: 'm', etichetta: 'H(omega)', forma: 'rettangolo', colonna: 5, riga: 1 },
    { id: 'out', etichetta: 'y(t)', forma: 'uscita', colonna: 8, riga: 1 },
  ],
  collegamenti: [
    { da: 'in', a: 's', etichetta: 'segnale' },
    { da: 's', a: 'm', etichetta: 'al sommatore' },
    { da: 'm', a: 'out', etichetta: 'uscita' },
  ],
};

const specTemporale = {
  id: 't1',
  tipo: 'temporale',
  titolo: 'Sliding window',
  descrizione: 'Timeline mittente e ricevitore con trasmissioni e ACK.',
  asse_t: { etichetta: 't', min: 0, max: 20 },
  corsie: [
    { id: 'mittente', etichetta: 'mittente' },
    { id: 'ricevitore', etichetta: 'ricevitore' },
  ],
  intervalli: [
    { corsia: 'mittente', t0: 0, t1: 4, etichetta: 'frame 1', stile: 'trasmissione' },
    { corsia: 'mittente', t0: 5, t1: 9, etichetta: 'frame 2', stile: 'trasmissione' },
    { corsia: 'ricevitore', t0: 8, t1: 10, etichetta: 'ACK 1', stile: 'ack' },
  ],
  frecce: [
    { da: { corsia: 'mittente', t: 4 }, a: { corsia: 'ricevitore', t: 8 }, etichetta: 'arrivo' },
  ],
  marcatori: [{ t: 4, etichetta: 't0' }],
};

function nessunTestoVietato(html) {
  return !/\b(null|undefined|NaN)\b/.test(html);
}

test('renderFigura grafico valido: SVG con viewBox, title, desc, role img', () => {
  const html = renderFigura(specGrafico);
  assert.ok(html.includes('<figure'), 'deve restituire una figure');
  assert.ok(html.includes('role="img"'));
  assert.ok(html.includes('<svg'), 'deve contenere un SVG');
  assert.ok(html.includes('viewBox="0 0 760 460"'));
  assert.ok(/<title[^>]*>Spettro PAM<\/title>/.test(html));
  assert.ok(/<desc[^>]*>Spettro a righe del segnale PAM, asse omega\.<\/desc>/.test(html));
  assert.ok(nessunTestoVietato(html));
});

test('renderFigura grafico: tutte le serie renderizzano senza eccezioni', () => {
  assert.doesNotThrow(() => renderFigura(specGrafico));
  const html = renderFigura(specGrafico);
  assert.ok(html.includes('<rect') || html.includes('<path') || html.includes('<circle'));
  assert.ok(html.includes('limite')); // etichetta della serie tratteggio nella legenda
});

test('renderFigura grafico con asse non valide -> fallback solo testo', () => {
  const html = renderFigura({
    ...specGrafico,
    asse_x: { etichetta: 'x', min: 5, max: 5 },
  });
  assert.ok(html.includes('<figure'));
  assert.ok(html.includes('Spettro a righe del segnale PAM, asse omega.'));
  assert.ok(nessunTestoVietato(html));
  assert.ok(!html.includes('<svg'));
});

test('renderFigura spec mancante o invalida -> figure con sola descrizione, mai eccezione', () => {
  assert.doesNotThrow(() => renderFigura(null));
  assert.doesNotThrow(() => renderFigura({}));
  assert.doesNotThrow(() => renderFigura({ tipo: 'sconosciuto', titolo: 'T', descrizione: 'D' }));
  const html = renderFigura({ tipo: 'sconosciuto', titolo: 'T', descrizione: 'Descrizione testuale.' });
  assert.ok(html.includes('<figure'));
  assert.ok(html.includes('Descrizione testuale.'));
  assert.ok(!html.includes('<svg'));
  assert.ok(nessunTestoVietato(html));
});

test('renderFigura blocchi valido: blocchi e collegamenti', () => {
  const html = renderFigura(specBlocchi);
  assert.ok(html.includes('<figure'));
  assert.ok(html.includes('viewBox'));
  assert.ok(/<title[^>]*>Filtro trasversale<\/title>/.test(html));
  assert.ok(html.includes('somma') || html.includes('sommatore'));
  assert.ok(html.includes('y(t)'));
  assert.ok(html.includes('<circle') || html.includes('<rect'));
  assert.ok(nessunTestoVietato(html));
});

test('renderFigura blocchi con meno di due blocchi -> fallback testo', () => {
  const html = renderFigura({
    ...specBlocchi,
    blocchi: [specBlocchi.blocchi[0]],
  });
  assert.ok(html.includes('<figure'));
  assert.ok(html.includes('Schema a blocchi: ingresso, sommatore, moltiplicatore, uscita.'));
  assert.ok(nessunTestoVietato(html));
});

test('renderFigura blocchi tollera collegamenti verso blocchi inesistenti', () => {
  const html = renderFigura({
    ...specBlocchi,
    collegamenti: [...specBlocchi.collegamenti, { da: 'inesistente', a: 'anche-piu-inesistente' }],
  });
  assert.doesNotThrow(() => renderFigura({
    ...specBlocchi,
    collegamenti: [{ da: 'inesistente', a: 'x' }],
  }));
  assert.ok(nessunTestoVietato(html));
});

test('renderFigura temporale valido: corsie, intervalli, frecce, marcatori', () => {
  const html = renderFigura(specTemporale);
  assert.ok(html.includes('<figure'));
  assert.ok(html.includes('viewBox'));
  assert.ok(/<title[^>]*>Sliding window<\/title>/.test(html));
  assert.ok(html.includes('mittente'));
  assert.ok(html.includes('ricevitore'));
  assert.ok(html.includes('frame 1'));
  assert.ok(html.includes('ACK 1'));
  assert.ok(html.includes('t0'));
  assert.ok(nessunTestoVietato(html));
});

test('renderFigura temporale con asse_t non valido -> fallback testo', () => {
  const html = renderFigura({ ...specTemporale, asse_t: { etichetta: 't', min: 10, max: 2 } });
  assert.ok(html.includes('<figure'));
  assert.ok(html.includes('Timeline mittente e ricevitore con trasmissioni e ACK.'));
  assert.ok(nessunTestoVietato(html));
});
