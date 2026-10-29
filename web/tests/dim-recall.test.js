import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderRecall, setupRecall } from '../js/pages/dim/recall.js';
import { dimostrazioneEsempio, elemento, documentoFinto } from './dim-fake-dom.js';

test('ogni domanda ha un bottone con aria-expanded=false e una risposta nascosta collegata', () => {
  const html = renderRecall(dimostrazioneEsempio());
  assert.match(html, /<button class="btn btn--ghost" type="button" data-recall="0" aria-expanded="false" aria-controls="recall-dim-test-0">Mostra risposta<\/button>/);
  assert.match(html, /<div class="callout dim-recall__risposta" id="recall-dim-test-0" hidden><p>Vale uno\.<\/p><\/div>/);
  assert.match(html, /Domanda 1 di 1/);
});

test('senza domande il pannello dice che non ce ne sono', () => {
  assert.match(renderRecall(dimostrazioneEsempio({ richiamo_attivo: [] })), /Nessuna domanda di recall/);
});

test('Mostra risposta apre e chiude la risposta aggiornando aria-expanded', () => {
  const risposta = elemento({ attrs: { id: 'recall-dim-test-0' }, classi: [] });
  risposta.hidden = true;
  const bottoneEl = elemento({ matches: ['[data-recall]'], attrs: { 'aria-expanded': 'false', 'aria-controls': 'recall-dim-test-0' }, dataset: { recall: '0' } });
  bottoneEl.textContent = 'Mostra risposta';
  const sezione = elemento({ children: {} });
  const contenitore = elemento({ children: { '.dim-recall': sezione } });
  const doc = documentoFinto({ 'recall-dim-test-0': risposta });
  globalThis.document = doc;
  const smonta = setupRecall(contenitore);
  sezione.dispatch('click', { target: bottoneEl });
  assert.equal(risposta.hidden, false);
  assert.equal(bottoneEl.getAttribute('aria-expanded'), 'true');
  assert.equal(bottoneEl.textContent, 'Nascondi risposta');
  sezione.dispatch('click', { target: bottoneEl });
  assert.equal(risposta.hidden, true);
  assert.equal(bottoneEl.textContent, 'Mostra risposta');
  smonta();
});

test('setupRecall senza sezione restituisce una funzione di chiusura innocua', () => {
  const smonta = setupRecall(elemento());
  assert.equal(typeof smonta, 'function');
  smonta();
});
