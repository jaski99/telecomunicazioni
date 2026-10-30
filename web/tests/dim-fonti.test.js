import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFonti } from '../js/pages/dim/fonti.js';
import { dimostrazioneEsempio } from './dim-fake-dom.js';

test('Fonti è un <details> chiuso con il titolo richiesto', () => {
  const html = renderFonti(dimostrazioneEsempio(), {});
  assert.match(html, /<details class="card dim-fonti"><summary>Fonti, varianti e verifica<\/summary>/);
  assert.doesNotMatch(html, /<details[^>]* open/);
});

test('le fonti usano etichette umane, non le chiavi grezze', () => {
  const html = renderFonti(dimostrazioneEsempio(), {});
  assert.match(html, /<strong>Appunti di studente \(file1\)<\/strong>: pp\. 1-2/);
  assert.doesNotMatch(html, />FILE1</);
});

test('la verifica mostra l\'etichetta umana, la nota e i punti aperti', () => {
  const html = renderFonti(dimostrazioneEsempio(), {});
  assert.match(html, /<h3>Verifica<\/h3><p><strong>Verificata su file1 e file3<\/strong><\/p>/);
  assert.match(html, /<p>Nota\.<\/p>/);
  assert.match(html, /<h4>Punti aperti<\/h4>/);
  assert.match(html, /<li>Da chiarire<\/li>/);
});

test('le varianti di notazione compaiono solo se presenti', () => {
  assert.match(renderFonti(dimostrazioneEsempio(), {}), /Varianti di notazione/);
  const senza = renderFonti(dimostrazioneEsempio({ varianti_notazione: [] }), {});
  assert.doesNotMatch(senza, /Varianti di notazione/);
  assert.doesNotMatch(senza, /undefined|null/);
});
