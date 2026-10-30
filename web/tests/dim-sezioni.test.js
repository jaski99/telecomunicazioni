import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderEnunciato, renderIpotesi, renderNotazione, renderIdea } from '../js/pages/dim/sezioni.js';
import { dimostrazioneEsempio } from './dim-fake-dom.js';

test('l\'enunciato è in una card con .prose e un paragrafo per blocco', () => {
  const html = renderEnunciato(dimostrazioneEsempio());
  assert.match(html, /class="card"/);
  assert.match(html, /<div class="prose"><p>Primo paragrafo\.<\/p><p>Secondo paragrafo\.<\/p><\/div>/);
});

test('ipotesi è omessa se non ci sono ipotesi', () => {
  assert.match(renderIpotesi(dimostrazioneEsempio()), /<li>Segnale limitato<\/li>/);
  assert.equal(renderIpotesi(dimostrazioneEsempio({ ipotesi: [] })), '');
});

test('la notazione compila il simbolo in LaTeX e mostra il significato', () => {
  const html = renderNotazione(dimostrazioneEsempio());
  assert.match(html, /<ul class="dim-notazione"><li><strong><span class="katex">/);
  assert.match(html, /<span>segnale<\/span>/);
  assert.equal(renderNotazione(dimostrazioneEsempio({ notazione: [null] })), '');
});

test('l\'idea è un callout--tip e manca se non c\'è', () => {
  assert.match(renderIdea(dimostrazioneEsempio()), /<aside class="callout callout--tip"[^>]*>.*Usare la linearità\./);
  assert.equal(renderIdea(dimostrazioneEsempio({ idea: '' })), '');
});
