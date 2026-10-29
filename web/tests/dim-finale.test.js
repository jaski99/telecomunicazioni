import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFormulaFinale, aggiornaFinale, renderErrori, renderFigureGenerali } from '../js/pages/dim/finale.js';
import { dimostrazioneEsempio, elemento } from './dim-fake-dom.js';

test('la formula finale è la variante chiave e resta nascosta finché non è rivelata', () => {
  const nascosta = renderFormulaFinale(dimostrazioneEsempio(), false);
  assert.match(nascosta, /<div class="formula" data-finale hidden>/);
  assert.match(nascosta, /formula-box formula-box--key/);
  assert.match(nascosta, /formula-box__label">Formula finale</);
  assert.match(nascosta, /data-finale-attesa>Formula finale: si rivela dopo l'ultimo passo\./);
  assert.doesNotMatch(renderFormulaFinale(dimostrazioneEsempio(), true), /data-finale hidden/);
  assert.equal(renderFormulaFinale(dimostrazioneEsempio({ formula_finale: '' }), false), '');
});

test('aggiornaFinale mostra la formula e nasconde il segnaposto', () => {
  const formula = elemento();
  const attesa = elemento();
  const radice = elemento({ children: { '[data-finale]': formula, '[data-finale-attesa]': attesa } });
  aggiornaFinale(radice, true);
  assert.equal(formula.hidden, false);
  assert.equal(attesa.hidden, true);
  aggiornaFinale(radice, false);
  assert.equal(formula.hidden, true);
  assert.equal(attesa.hidden, false);
});

test('gli errori frequenti sono callout--error con le tre parti', () => {
  const html = renderErrori(dimostrazioneEsempio());
  assert.match(html, /<article class="callout callout--error"><p class="callout__title">Errore: Sbaglio<\/p>/);
  assert.match(html, /<strong>Perché è sbagliato:<\/strong> Non vale/);
  assert.match(html, /<strong>Correzione:<\/strong> Fare così/);
  assert.equal(renderErrori(dimostrazioneEsempio({ errori_frequenti: [] })), '');
});

test('le figure generali sono quelle non agganciate a un passo', () => {
  const html = renderFigureGenerali(dimostrazioneEsempio());
  assert.match(html, /Figure generali/);
  assert.match(html, /Figura B/);
  assert.doesNotMatch(html, /Figura A/);
  assert.equal(renderFigureGenerali(dimostrazioneEsempio({ passi: [{ n: 1, figura: 'fig-a' }], figure: [{ id: 'fig-a', titolo: 'A' }] })), '');
});
