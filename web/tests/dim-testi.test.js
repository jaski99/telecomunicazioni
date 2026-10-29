import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAVoce, renderCompatta } from '../js/pages/dim/testi.js';
import { dimostrazioneEsempio } from './dim-fake-dom.js';

test('A voce mette ogni paragrafo in un <p> dentro .prose', () => {
  const html = renderAVoce(dimostrazioneEsempio({ a_voce: 'Primo.\n\nSecondo.' }));
  assert.match(html, /<div class="prose"><p>Primo\.<\/p><p>Secondo\.<\/p><\/div>/);
  assert.match(html, /<h2 class="card__title" id="titolo-avoce">A voce<\/h2>/);
});

test('A voce non produce testo vuoto o null quando manca il parlato', () => {
  const html = renderAVoce(dimostrazioneEsempio({ a_voce: undefined }));
  assert.doesNotMatch(html, /undefined|null/);
  assert.match(html, /<div class="prose"><\/div>/);
});

test('Compatta mette le voci che sono solo formula in un blocco formula, con la punteggiatura dentro', () => {
  const html = renderCompatta(dimostrazioneEsempio({ versione_compatta: ['$P(X>t)=e^{-\\lambda t}$.'] }));
  assert.match(html, /<ol class="dim-compatta"><li><div class="formula-box">/);
  assert.match(html, /<annotation encoding="application\/x-tex">P\(X&gt;t\)=e\^\{-\\lambda t\}\.<\/annotation>/);
  assert.doesNotMatch(html, /<li>\.<\/li>|<p>\.<\/p>/);
});

test('Compatta mette le voci con testo e formule in un contenitore .scroll-x', () => {
  const html = renderCompatta(dimostrazioneEsempio({ versione_compatta: ['Uno $a$ e $b$.'] }));
  assert.match(html, /<li><div class="scroll-x" tabindex="0" role="region" aria-label="Riga compatta"><p>Uno <span class="formula-inline">[\s\S]*<\/span> e <span class="formula-inline">[\s\S]*<\/span>\.<\/p><\/div><\/li>/);
  assert.doesNotMatch(html, /\$/);
  assert.doesNotMatch(html, /formula-box/);
});

test('Compatta senza righe non rompe il pannello', () => {
  const html = renderCompatta(dimostrazioneEsempio({ versione_compatta: undefined }));
  assert.match(html, /<ol class="dim-compatta"><\/ol>/);
});
