import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compilaLatex, compilaLatexSicuro, renderMath, tokenizzaMatematica, testoSicuro, formulaBlock, formulaInline, devePromuovereInDisplay, formulaIsolata } from '../js/core/math.js';

test('tokenizzaMatematica separa testo, inline $...$ e display $$...$$', () => {
  const toks = tokenizzaMatematica('costo $x=1$ e $$y=2$$ finale');
  assert.deepStrictEqual(toks.map(t => t.type), ['text', 'inline', 'text', 'display', 'text']);
  assert.strictEqual(toks[0].body, 'costo '); assert.strictEqual(toks[1].body, 'x=1');
  assert.strictEqual(toks[2].body, ' e '); assert.strictEqual(toks[3].body, 'y=2'); assert.strictEqual(toks[4].body, ' finale');
});

test('tokenizzaMatematica senza formule restituisce un solo token testo', () => {
  const toks = tokenizzaMatematica('solo testo, $ non chiuso');
  assert.deepStrictEqual(toks.map(t => t.type), ['text']); assert.strictEqual(toks.length, 1);
});

test('compilaLatex compila una formula LaTeX valida e restituisce HTML+MathML', () => {
  const html = compilaLatex('x=\\frac{1}{2}\\,\\omega');
  assert.ok(typeof html === 'string' && html.length > 0);
  assert.ok(html.includes('class="katex"')); assert.ok(html.includes('<math')); assert.ok(html.includes('semantics'));
});

test('compilaLatex formula display con integrale', () => {
  const html = compilaLatex('\\int_{-\\infty}^{+\\infty} x(t)e^{-j\\omega t}\\,dt');
  assert.ok(html.includes('class="katex"')); assert.ok(html.includes('<math'));
});

test('compilaLatex lancia errore con throwOnError su comando inesistente', () => {
  assert.throws(() => compilaLatex('\\comandoInesistente{'), /KaTeX parse error/);
});

test('compilaLatex stringa vuota restituisce stringa vuota', () => { assert.strictEqual(compilaLatex(''), ''); });

test('compilaLatexSicuro non lancia mai eccezioni e segnala l errore in katex-err', () => {
  assert.doesNotThrow(() => compilaLatexSicuro('\\comandoInesistente{'));
  const html = compilaLatexSicuro('\\comandoInesistente{');
  assert.ok(typeof html === 'string' && html.length > 0);
  assert.ok(html.includes('katex-err')); assert.ok(html.includes('comandoInesistente'));
  assert.strictEqual(compilaLatexSicuro(''), ''); assert.strictEqual(compilaLatexSicuro(null), '');
});

test('testoSicuro non mostra mai null, undefined o NaN', () => {
  assert.strictEqual(testoSicuro(null), ''); assert.strictEqual(testoSicuro(undefined), '');
  assert.strictEqual(testoSicuro(NaN), ''); assert.strictEqual(testoSicuro(42), '42');
  assert.strictEqual(testoSicuro(3.5), '3.5'); assert.strictEqual(testoSicuro('ciao'), 'ciao'); assert.strictEqual(testoSicuro(0), '0');
});

test('renderMath in assenza di DOM non solleva eccezioni', () => { assert.doesNotThrow(() => renderMath({})); });

test('formulaInline restituisce HTML inline con classe formula-inline (senza aria-hidden)', () => {
  const html = formulaInline('x=1');
  assert.ok(typeof html === 'string' && html.length > 0);
  assert.ok(html.includes('class="formula-inline"')); assert.ok(!/<span[^>]*class="formula-inline"[^>]*aria-hidden/.test(html));
  assert.ok(html.includes('class="katex"'));
});

test('formulaInline stringa vuota restituisce stringa vuota', () => { assert.strictEqual(formulaInline(''), ''); assert.strictEqual(formulaInline(null), ''); });

test('formulaInline mai eccezione su LaTeX invalido', () => {
  assert.doesNotThrow(() => formulaInline('\\comandoInesistente{'));
  const html = formulaInline('\\comandoInesistente{'); assert.ok(html.includes('katex-err'));
});

test('formulaBlock restituisce formula-box con scroll-x e KaTeX display', () => {
  const html = formulaBlock('\\frac{1}{2}', { variante: 'normale', etichetta: 'Etichetta' });
  assert.ok(html.includes('class="formula-box"')); assert.ok(!html.includes('formula-box--key'));
  assert.ok(html.includes('class="formula-box__label"')); assert.ok(html.includes('Etichetta'));
  assert.ok(/class=["']scroll-x["']/.test(html)); assert.ok(html.includes('tabindex="0"'));
  assert.ok(html.includes('role="region"')); assert.ok(html.includes('aria-label="Formula"'));
  assert.ok(html.includes('class="katex"'));
});

test('formulaBlock variante chiave aggiunge formula-box--key', () => {
  const html = formulaBlock('x=1', { variante: 'chiave', etichetta: 'Formula finale' });
  assert.ok(html.includes('formula-box--key')); assert.ok(html.includes('Formula finale'));
});

test('formulaBlock senza etichetta non renderisce il label', () => {
  const html = formulaBlock('x=1'); assert.ok(html.includes('formula-box')); assert.ok(!html.includes('formula-box__label'));
});

test('formulaBlock mai eccezione su LaTeX invalido', () => {
  assert.doesNotThrow(() => formulaBlock('\\comandoInesistente{'));
  const html = formulaBlock('\\comandoInesistente{'); assert.ok(html.includes('katex-err')); assert.ok(html.includes('formula-box'));
});

test('formulaBlock stringa vuota restituisce box vuoto senza eccezione', () => {
  const html = formulaBlock(''); assert.ok(html.includes('formula-box')); assert.ok(/class=["']scroll-x["']/.test(html));
});

test('devePromuovereInDisplay vero per frazione/somma/integrale/limite sopra la soglia', () => {
  assert.ok(devePromuovereInDisplay('\\frac{1}{2} + \\sum_{n=0}^{N} x_n + \\int_{0}^{T} f(t) \\, dt'));
  assert.ok(devePromuovereInDisplay('\\int_{-\\infty}^{+\\infty} x(t) e^{-j\\omega t} \\, dt'));
  assert.ok(devePromuovereInDisplay('\\lim_{\\Delta \\to 0} \\frac{1}{\\Delta} \\cdot k'));
  assert.ok(devePromuovereInDisplay('\\prod_{k=1}^{n} h_k + \\sum_{j=0}^{M} g_j \\cdot 2'));
});

test('devePromuovereInDisplay falso sotto la soglia o senza comandi display', () => {
  assert.ok(!devePromuovereInDisplay('\\omega')); assert.ok(!devePromuovereInDisplay('x = 1'));
  assert.ok(!devePromuovereInDisplay('\\frac{1}{2}')); assert.ok(!devePromuovereInDisplay(''));
});

test('formulaBlock compila in display reale, anche per formule brevi', () => {
  for (const latex of ['x', 'x=1', '\\frac{1}{2}']) {
    const html = formulaBlock(latex);
    assert.match(html, /class="katex-display"/);
    assert.match(html, /<math/);
    assert.match(html, /class="scroll-x" tabindex="0" role="region" aria-label="Formula"/);
  }
  assert.doesNotMatch(formulaInline('x'), /katex-display/);
});

test('formula isolata riconosce spazi ma non testo o altre formule', () => {
  assert.ok(formulaIsolata(tokenizzaMatematica('$x$')));
  assert.ok(formulaIsolata(tokenizzaMatematica('  $x$  ')));
  assert.ok(!formulaIsolata(tokenizzaMatematica('testo $x$')));
  assert.ok(!formulaIsolata(tokenizzaMatematica('$x$ e $y$')));
  assert.ok(!formulaIsolata(tokenizzaMatematica('$$x$$')));
});

test('formulaBlock segnala il sorgente invalido senza HTML eseguibile', () => {
  const html = formulaBlock('\\comandoInesistente{<script>');
  assert.match(html, /class="katex-err"/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
