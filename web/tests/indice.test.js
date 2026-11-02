import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indiceHTML } from '../js/layout/indice.js';

test('indiceHTML: restituisce nav con ol e ancore per le voci', () => {
  const voci = [
    { id: 's1', titolo: 'Definizione', href: '#s1', livello: 2 },
    { id: 's2', titolo: 'Spiegazione', href: '#s2', livello: 2 },
    { id: 's21', titolo: '2.1 Sottotitolo', href: '#s21', livello: 3 },
  ];
  const html = indiceHTML(voci);
  assert.match(html, /<nav class="indice-pagina".*<ol>/s);
  assert.match(html, /href="#s1"/);
  assert.match(html, /href="#s2"/);
  assert.match(html, /href="#s21"/);
  assert.match(html, /Definizione/);
  assert.match(html, /Spiegazione/);
  assert.match(html, /2\.1 Sottotitolo/);
  assert.match(html, /class="livello-2"/);
  assert.match(html, /class="livello-3"/);
});

test('indiceHTML: voce attiva ha aria-current e classe attiva', () => {
  const html = indiceHTML([{ id: 's1', titolo: 'Definizione', href: '#s1', attiva: true }]);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /class="attiva"/);
});

test('indiceHTML: array vuoto restituisce stringa vuota', () => {
  assert.strictEqual(indiceHTML([]), '');
  assert.strictEqual(indiceHTML(null), '');
  assert.strictEqual(indiceHTML(undefined), '');
});

test('indiceHTML: non espone mai null/undefined nei titoli', () => {
  const html = indiceHTML([{ id: 's1', titolo: null, href: '#s1' }]);
  assert.doesNotMatch(html, /\bnull\b|\bundefined\b/);
});
