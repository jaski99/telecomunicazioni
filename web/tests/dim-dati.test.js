import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trovaDimostrazione, passi, figureDi, figureGenerali, paragrafi, proveDi } from '../js/pages/dim/dati.js';
import { dimostrazioneEsempio, graphEsempio } from './dim-fake-dom.js';

test('trovaDimostrazione restituisce nodo e dimostrazione per ID, null altrimenti', () => {
  const graph = graphEsempio();
  const trovata = trovaDimostrazione(graph, 'dim-test');
  assert.equal(trovata.dim.titolo, 'Prova di test');
  assert.equal(trovata.nodo.id, 'dim-test');
  assert.equal(trovaDimostrazione(graph, 'assente'), null);
  assert.equal(trovaDimostrazione({ nodi: [{ id: 'x' }] }, 'x'), null);
  assert.equal(trovaDimostrazione(null, 'x'), null);
});

test('passi e figureDi filtrano valori non validi', () => {
  const dim = dimostrazioneEsempio({ passi: [null, { n: 1 }], figure: [undefined, { id: 'a' }] });
  assert.deepEqual(passi(dim).map((p) => p.n), [1]);
  assert.deepEqual(figureDi(dim).map((f) => f.id), ['a']);
  assert.deepEqual(passi({}), []);
});

test('figureGenerali esclude le figure già agganciate a un passo', () => {
  const dim = dimostrazioneEsempio();
  assert.deepEqual(figureGenerali(dim).map((f) => f.id), ['fig-b']);
});

test('paragrafi divide solo sulle righe vuote', () => {
  assert.deepEqual(paragrafi('Uno.\n\nDue.\n \nTre.'), ['Uno.', 'Due.', 'Tre.']);
  assert.deepEqual(paragrafi('Una riga sola\nancora nella stessa.'), ['Una riga sola\nancora nella stessa.']);
  assert.deepEqual(paragrafi(null), []);
});

test('proveDi unisce titolo e punti solo se numerici', () => {
  const graph = graphEsempio();
  assert.deepEqual(proveDi(dimostrazioneEsempio(), graph), [{ id: 'T2', titolo: 'Trasformata impulsiva', punti: 10 }]);
  graph.esame[0].punti = 'NON TROVATO';
  assert.equal(proveDi(dimostrazioneEsempio(), graph)[0].punti, null);
  assert.equal(proveDi(dimostrazioneEsempio({ domande_esame: ['T9'] }), graph)[0].titolo, '');
});
