import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { elenco, chipStato, linkNodo } from '../js/ui.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

test('B11: .formula-gruppo definito solo in components.css', () => {
  const webDir = path.join(__dirname, '..');
  const definizioni = {};
  for (const f of ['css/components.css', 'css/pages/nodo.css', 'css/pages/esercizi.css']) {
    const c = fs.readFileSync(path.join(webDir, f), 'utf8');
    definizioni[f] = (c.match(/\.formula-gruppo\s*\{/g) || []).length;
  }
  assert.strictEqual(definizioni['css/components.css'], 1);
  assert.strictEqual(definizioni['css/pages/nodo.css'], 0);
  assert.strictEqual(definizioni['css/pages/esercizi.css'], 0);
});
