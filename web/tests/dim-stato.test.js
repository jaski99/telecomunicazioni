import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chiaveStato, clampRivelati, leggiRivelati, scriviRivelati } from '../js/pages/dim/stato.js';
import { memoria } from './dim-fake-dom.js';

test('chiaveStato usa il prefisso di KEY_DIMOSTRAZIONI con l\'ID', () => {
  assert.equal(chiaveStato('dim-x'), 'tlc-kg:dimostrazioni:v1.dim-x');
});

test('clampRivelati porta il valore nell\'intervallo [0, totale]', () => {
  assert.equal(clampRivelati(-3, 4), 0);
  assert.equal(clampRivelati(9, 4), 4);
  assert.equal(clampRivelati(2.9, 4), 2);
  assert.equal(clampRivelati('abc', 4), 0);
  assert.equal(clampRivelati(1, undefined), 0);
});

test('leggiRivelati ripristina il valore salvato con il formato esistente', () => {
  const storage = memoria({ 'tlc-kg:dimostrazioni:v1.dim-x': JSON.stringify({ passiRivelati: 2 }) });
  assert.equal(leggiRivelati(storage, 'dim-x', 5), 2);
  assert.equal(leggiRivelati(storage, 'altra', 5), 0);
});

test('leggiRivelati tollera JSON rotto, valori mancanti e storage assente', () => {
  const rotto = memoria({ 'tlc-kg:dimostrazioni:v1.dim-x': '{non json' });
  assert.equal(leggiRivelati(rotto, 'dim-x', 5), 0);
  const vuoto = memoria({ 'tlc-kg:dimostrazioni:v1.dim-x': '{}' });
  assert.equal(leggiRivelati(vuoto, 'dim-x', 5), 0);
  assert.equal(leggiRivelati(null, 'dim-x', 5), 0);
  const fuori = memoria({ 'tlc-kg:dimostrazioni:v1.dim-x': JSON.stringify({ passiRivelati: 99 }) });
  assert.equal(leggiRivelati(fuori, 'dim-x', 3), 3);
});

test('scriviRivelati salva nel formato { passiRivelati } e segnala il successo', () => {
  const storage = memoria();
  assert.equal(scriviRivelati(storage, 'dim-x', 3), true);
  assert.equal(storage.dati['tlc-kg:dimostrazioni:v1.dim-x'], '{"passiRivelati":3}');
  assert.equal(scriviRivelati(null, 'dim-x', 1), false);
  const pieno = { setItem() { throw new Error('quota'); } };
  assert.equal(scriviRivelati(pieno, 'dim-x', 1), false);
});
