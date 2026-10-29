import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  compilaLatex,
  renderMath,
  tokenizzaMatematica,
  testoSicuro,
} from '../js/core/math.js';

test('tokenizzaMatematica separa testo, inline $...$ e display $$...$$', () => {
  const toks = tokenizzaMatematica('costo $x=1$ e $$y=2$$ finale');
  assert.deepStrictEqual(toks.map((t) => t.type), [
    'text', 'inline', 'text', 'display', 'text',
  ]);
  assert.strictEqual(toks[0].body, 'costo ');
  assert.strictEqual(toks[1].body, 'x=1');
  assert.strictEqual(toks[2].body, ' e ');
  assert.strictEqual(toks[3].body, 'y=2');
  assert.strictEqual(toks[4].body, ' finale');
});

test('tokenizzaMatematica senza formule restituisce un solo token testo', () => {
  const toks = tokenizzaMatematica('solo testo, $ non chiuso');
  assert.deepStrictEqual(toks.map((t) => t.type), ['text']);
  assert.strictEqual(toks.length, 1);
});

test('compilaLatex compila una formula LaTeX valida e restituisce HTML+MathML', () => {
  const html = compilaLatex('x=\\frac{1}{2}\\,\\omega');
  assert.strictEqual(typeof html, 'string');
  assert.ok(html.length > 0);
  assert.ok(html.includes('class="katex"'));
  assert.ok(html.includes('<math'));
  assert.ok(html.includes('semantics'));
});

test('compilaLatex formula display con integrale', () => {
  const html = compilaLatex('\\int_{-\\infty}^{+\\infty} x(t)e^{-j\\omega t}\\,dt');
  assert.ok(html.includes('class="katex"'));
  assert.ok(html.includes('<math'));
});

test('compilaLatex lancia un errore con throwOnError su comando inesistente', () => {
  assert.throws(() => compilaLatex('\\comandoInesistente{'), /KaTeX parse error/);
});

test('compilaLatex stringa vuota restituisce stringa vuota', () => {
  assert.strictEqual(compilaLatex(''), '');
});

test('testoSicuro non mostra mai null, undefined o NaN', () => {
  assert.strictEqual(testoSicuro(null), '');
  assert.strictEqual(testoSicuro(undefined), '');
  assert.strictEqual(testoSicuro(NaN), '');
  assert.strictEqual(testoSicuro(42), '42');
  assert.strictEqual(testoSicuro(3.5), '3.5');
  assert.strictEqual(testoSicuro('ciao'), 'ciao');
  assert.strictEqual(testoSicuro(0), '0');
});

test('renderMath in assenza di DOM non solleva eccezioni', () => {
  // node --test non ha il DOM: renderMath deve uscire presto e in silenzio.
  assert.doesNotThrow(() => renderMath({}));
});
