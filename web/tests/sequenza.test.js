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

test('ordinePianoDiStudio: priorita alta prima, poi area, poi id', () => {
  const ordine = ordinePianoDiStudio(GRAFO);
  assert.deepStrictEqual(ordine, ['b-beta', 'e-epsilon', 'a-alfa', 'd-delta', 'c-gamma']);
});

test('prossimoNodo: restituisce il successore nell ordine di studio', () => {
  assert.strictEqual(prossimoNodo(GRAFO, 'b-beta'), 'e-epsilon');
  assert.strictEqual(prossimoNodo(GRAFO, 'e-epsilon'), 'a-alfa');
  assert.strictEqual(prossimoNodo(GRAFO, 'c-gamma'), null);
  assert.strictEqual(prossimoNodo(GRAFO, 'inesistente'), null);
});

test('nodoPrecedente: restituisce il predecessore nell ordine di studio', () => {
  assert.strictEqual(nodoPrecedente(GRAFO, 'e-epsilon'), 'b-beta');
  assert.strictEqual(nodoPrecedente(GRAFO, 'a-alfa'), 'e-epsilon');
  assert.strictEqual(nodoPrecedente(GRAFO, 'b-beta'), null);
  assert.strictEqual(nodoPrecedente(GRAFO, 'inesistente'), null);
});

test('navSequenzaHTML: genera nav prev/succ con href e titoli', () => {
  const html = navSequenzaHTML(GRAFO, 'e-epsilon');
  assert.match(html, /href="#\/nodo\/b-beta"/);
  assert.match(html, /href="#\/nodo\/a-alfa"/);
  assert.match(html, /b-beta/);
  assert.match(html, /a-alfa/);
  assert.match(html, /rel="prev"/);
  assert.match(html, /rel="next"/);
});

test('navSequenzaHTML: primo nodo ha solo next, ultimo solo prev', () => {
  const primo = navSequenzaHTML(GRAFO, 'b-beta');
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
