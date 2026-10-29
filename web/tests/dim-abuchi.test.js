import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valutaBuchi, renderTestoBuchi, renderABuchi, setupABuchi } from '../js/pages/dim/abuchi.js';
import { dimostrazioneEsempio, elemento } from './dim-fake-dom.js';

test('valutaBuchi accetta ogni variante e ignora maiuscole e spazi', () => {
  const soluzioni = { 1: ['uno'], 2: ['due', '2'] };
  assert.deepEqual(valutaBuchi({ 1: ' UNO ', 2: '2' }, soluzioni), { corretti: ['1', '2'], errati: [] });
  assert.deepEqual(valutaBuchi({ 1: 'tre', 2: '' }, soluzioni), { corretti: [], errati: ['1', '2'] });
  assert.deepEqual(valutaBuchi({ 2: 'due' }, soluzioni), { corretti: ['2'], errati: ['1'] });
});

test('valutaBuchi ordina numericamente e tollera soluzioni assenti', () => {
  assert.deepEqual(valutaBuchi({}, { 10: ['a'], 2: ['b'] }).errati, ['2', '10']);
  assert.deepEqual(valutaBuchi({}, undefined), { corretti: [], errati: [] });
});

test('renderTestoBuchi sostituisce ___n___ con campi inline di testo', () => {
  const html = renderTestoBuchi('Vale ___1___ e ___12___.');
  assert.equal((html.match(/<input class="dim-buco" type="text" inputmode="text"/g) || []).length, 2);
  assert.match(html, /data-buco="12"/);
  assert.match(html, /aria-label="Buco 1"/);
  assert.doesNotMatch(html, /___/);
});

test('renderTestoBuchi escapa il testo prima dei campi', () => {
  assert.match(renderTestoBuchi('<script>x</script> ___1___'), /&lt;script&gt;x&lt;\/script&gt;/);
});

test('renderABuchi mostra Controlla e Reimposta, o un messaggio se mancano i buchi', () => {
  const html = renderABuchi(dimostrazioneEsempio());
  assert.match(html, /data-abuchi="controlla"/);
  assert.match(html, /data-abuchi="reimposta"/);
  assert.match(html, /<div class="dim-esito" aria-live="polite" data-esito><\/div>/);
  assert.match(renderABuchi(dimostrazioneEsempio({ a_buchi: null })), /Nessun esercizio a buchi/);
});

function sezioneFinta(valori) {
  const campi = Object.entries(valori).map(([buco, value]) => elemento({ dataset: { buco }, value, classi: [] }));
  const esito = elemento();
  const sezione = elemento({ children: { '[data-esito]': esito, '.dim-buco': campi } });
  return { sezione, campi, esito };
}

function bottone(tipo) {
  return elemento({ matches: ['[data-abuchi]'], dataset: { abuchi: tipo }, attrs: { 'data-abuchi': tipo } });
}

test('Controlla segna i buchi e mostra l\'esito con elenco degli errati', () => {
  const { sezione, campi, esito } = sezioneFinta({ 1: 'sbagliato', 2: 'due' });
  const container = elemento({ children: { '.dim-abuchi': sezione } });
  const smonta = setupABuchi(container, dimostrazioneEsempio());
  sezione.dispatch('click', { target: bottone('controlla') });
  assert.equal(campi[0].classList.contains('dim-buco--errore'), true);
  assert.equal(campi[1].classList.contains('dim-buco--ok'), true);
  assert.equal(esito.className, 'dim-esito callout callout--error');
  assert.match(esito.innerHTML, /<li>Buco 1<\/li>/);
  assert.doesNotMatch(esito.innerHTML, /<li>Buco 2<\/li>/);
  smonta();
});

test('tutti i buchi giusti danno callout--ok; Reimposta pulisce i campi', () => {
  const { sezione, campi, esito } = sezioneFinta({ 1: 'uno', 2: '2' });
  setupABuchi(elemento({ children: { '.dim-abuchi': sezione } }), dimostrazioneEsempio());
  sezione.dispatch('click', { target: bottone('controlla') });
  assert.equal(esito.className, 'dim-esito callout callout--ok');
  sezione.dispatch('click', { target: bottone('reimposta') });
  assert.equal(campi[0].value, '');
  assert.equal(esito.className, 'dim-esito');
  assert.equal(esito.innerHTML, '');
});

test('senza sezione o soluzioni setupABuchi non collega nulla', () => {
  assert.equal(typeof setupABuchi(elemento(), dimostrazioneEsempio()), 'function');
  assert.equal(typeof setupABuchi(elemento({ children: { '.dim-abuchi': elemento() } }), dimostrazioneEsempio({ a_buchi: { testo: 'x', soluzioni: {} } })), 'function');
});
