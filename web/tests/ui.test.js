import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elenco, chipStato, linkNodo } from '../js/ui.js';

test('elenco rende una lista di elementi', () => {
  const html = elenco(['a', 'b', 'c']);
  assert.strictEqual(html, '<ul><li>a</li><li>b</li><li>c</li></ul>');
});

test('elenco array vuoto o non array restituisce stringa vuota', () => {
  assert.strictEqual(elenco([]), '');
  assert.strictEqual(elenco(null), '');
  assert.strictEqual(elenco(undefined), '');
});

test('chipStato con tipi diversi', () => {
  assert.ok(chipStato('ok').includes('chip-ok'));
  assert.ok(chipStato('in arrivo', 'in-arrivo').includes('chip-in-arrivo'));
  assert.ok(chipStato('avviso', 'avviso').includes('chip-avviso'));
  assert.ok(!chipStato(null).includes('null'));
});

test('linkNodo verso nodo esistente genera href', () => {
  const html = linkNodo('dim-teorema-campionamento', 'Titolo', true);
  assert.ok(html.includes('href="#/nodo/dim-teorema-campionamento"'));
  assert.ok(html.includes('Titolo'));
  assert.ok(!html.includes('in arrivo'));
});

test('linkNodo verso nodo in arrivo non genera href e segnala lo stato', () => {
  const html = linkNodo('trasformata-fourier', 'Trasformata', false);
  assert.ok(!html.includes('href'));
  assert.ok(html.includes('in arrivo'));
  assert.ok(!html.includes('null'));
});
