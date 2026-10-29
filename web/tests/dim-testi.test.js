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

test('Compatta elenca le righe chiave come lista ordinata', () => {
  const html = renderCompatta(dimostrazioneEsempio({ versione_compatta: ['Uno $a$', 'Due'] }));
  assert.match(html, /<ol class="dim-compatta"><li>Uno \$a\$<\/li><li>Due<\/li><\/ol>/);
});

test('Compatta senza righe non rompe il pannello', () => {
  const html = renderCompatta(dimostrazioneEsempio({ versione_compatta: undefined }));
  assert.match(html, /<ol class="dim-compatta"><\/ol>/);
});
