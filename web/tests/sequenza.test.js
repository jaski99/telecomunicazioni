import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ordinePianoDiStudio,
  prossimoNodo,
  nodoPrecedente,
  navSequenzaHTML,
} from '../js/layout/sequenza.js';

const GRAFO = {
  versione: 1,
  nodi: [
    { id: 'a-alfa', area: 1, tipo: 'concetto', priorita: { livello: 'media' }, prerequisiti: [] },
    { id: 'b-beta', area: 1, tipo: 'dimostrazione', priorita: { livello: 'alta' }, prerequisiti: [{ id: 'a-alfa', forza: 'hard' }] },
    { id: 'c-gamma', area: 2, tipo: 'concetto', priorita: { livello: 'bassa' }, prerequisiti: [{ id: 'b-beta', forza: 'hard' }] },
    { id: 'd-delta', area: 2, tipo: 'concetto', priorita: { livello: 'media' }, prerequisiti: [] },
    { id: 'e-epsilon', area: 3, tipo: 'tipo_esercizio', priorita: { livello: 'alta' }, prerequisiti: [{ id: 'd-delta', forza: 'soft' }] },
  ],
};

test('ordinePianoDiStudio: topologico (prerequisiti prima), poi priorita/area/id', () => {
  const ordine = ordinePianoDiStudio(GRAFO);
  // a-alfa e d-delta senza pre: area 1 prima di 2. b-beta (alta, pre a-alfa) e e-epsilon (alta, pre d-delta soft): area 1 prima di 3. c-gamma (bassa) ultimo.
  assert.deepStrictEqual(ordine, ['a-alfa', 'b-beta', 'd-delta', 'e-epsilon', 'c-gamma']);
  // I prerequisiti precedono sempre i dipendenti.
  const pos = (id) => ordine.indexOf(id);
  assert.ok(pos('a-alfa') < pos('b-beta'));
  assert.ok(pos('b-beta') < pos('c-gamma'));
  assert.ok(pos('d-delta') < pos('e-epsilon'));
});

test('prossimoNodo: restituisce il successore nell ordine di studio', () => {
  assert.strictEqual(prossimoNodo(GRAFO, 'a-alfa'), 'b-beta');
  assert.strictEqual(prossimoNodo(GRAFO, 'b-beta'), 'd-delta');
  assert.strictEqual(prossimoNodo(GRAFO, 'd-delta'), 'e-epsilon');
  assert.strictEqual(prossimoNodo(GRAFO, 'c-gamma'), null);
  assert.strictEqual(prossimoNodo(GRAFO, 'inesistente'), null);
});

test('nodoPrecedente: restituisce il predecessore nell ordine di studio', () => {
  assert.strictEqual(nodoPrecedente(GRAFO, 'b-beta'), 'a-alfa');
  assert.strictEqual(nodoPrecedente(GRAFO, 'd-delta'), 'b-beta');
  assert.strictEqual(nodoPrecedente(GRAFO, 'e-epsilon'), 'd-delta');
  assert.strictEqual(nodoPrecedente(GRAFO, 'a-alfa'), null);
  assert.strictEqual(nodoPrecedente(GRAFO, 'inesistente'), null);
});

test('navSequenzaHTML: genera nav prev/succ con href e titoli', () => {
  const html = navSequenzaHTML(GRAFO, 'd-delta');
  assert.match(html, /href="#\/nodo\/b-beta"/);
  assert.match(html, /href="#\/nodo\/e-epsilon"/);
  assert.match(html, /b-beta/);
  assert.match(html, /e-epsilon/);
  assert.match(html, /rel="prev"/);
  assert.match(html, /rel="next"/);
});

test('navSequenzaHTML: primo nodo ha solo next, ultimo solo prev', () => {
  const primo = navSequenzaHTML(GRAFO, 'a-alfa');
  assert.doesNotMatch(primo, /rel="prev"/);
  assert.match(primo, /rel="next"/);
  const ultimo = navSequenzaHTML(GRAFO, 'c-gamma');
  assert.match(ultimo, /rel="prev"/);
  assert.doesNotMatch(ultimo, /rel="next"/);
});

test('navSequenzaHTML: non espone mai null/undefined', () => {
  const html = navSequenzaHTML(GRAFO, 'inesistente');
  assert.doesNotMatch(html, /\bnull\b|\bundefined\b/);
});
