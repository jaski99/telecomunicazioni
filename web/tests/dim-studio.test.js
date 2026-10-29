import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderStudio, setupStudio } from '../js/pages/dim/studio.js';
import { dimostrazioneEsempio, elemento, memoria, documentoFinto } from './dim-fake-dom.js';

const dim = dimostrazioneEsempio();
const meta = { fonti: {} };

test('Studio contiene nell\'ordine enunciato, passi, formula finale, errori, figure, fonti', () => {
  const html = renderStudio(dim, 0, meta);
  const ordine = ['titolo-enunciato', 'titolo-ipotesi', 'titolo-notazione', 'Idea', '<h2>Passi</h2>', 'data-finale', 'titolo-errori', 'titolo-figure', 'dim-fonti'];
  let ultimo = -1;
  for (const marcatore of ordine) {
    const pos = html.indexOf(marcatore);
    assert.ok(pos > ultimo, `${marcatore} fuori ordine`);
    ultimo = pos;
  }
});

test('la formula finale è nascosta finché non sono rivelati tutti i passi', () => {
  assert.match(renderStudio(dim, 2, meta), /data-finale hidden/);
  assert.doesNotMatch(renderStudio(dim, 3, meta), /data-finale hidden/);
});

function pannelloFinto() {
  const lis = dim.passi.map((p) => elemento({ dataset: { passo: String(p.n) }, classi: [], children: { '.step__corpo': elemento(), '.step__figura[data-figura]': elemento() } }));
  const finale = elemento();
  const attesa = elemento();
  const pannello = elemento({ children: { '.step[data-passo]': lis, '[data-finale]': finale, '[data-finale-attesa]': attesa } });
  pannello.id = 'modo-studio';
  pannello.focalizzati = [];
  lis.forEach((li) => { li.focus = () => pannello.focalizzati.push(li.dataset.passo); li.scrollIntoView = () => {}; });
  pannello.querySelector = (sel) => (sel.startsWith('.step[data-passo="') ? lis.find((li) => sel.includes(`"${li.dataset.passo}"`)) : (sel === '[data-finale]' ? finale : null));
  return { pannello, lis, finale };
}

function controlliFinti() {
  const azioni = {};
  for (const nome of ['indietro', 'avanti', 'tutti', 'ricomincia']) {
    azioni[`[data-azione="${nome}"]`] = elemento({ matches: ['[data-azione]'], dataset: { azione: nome }, attrs: { 'data-azione': nome } });
  }
  const controlli = elemento({ children: { ...azioni, '[data-indice]': [] } });
  controlli.azioni = azioni;
  controlli.querySelector = (sel) => azioni[sel] || null;
  return controlli;
}

function montaStudio(rivelati = 0) {
  const storage = memoria({ 'tlc-kg:dimostrazioni:v1.dim-test': JSON.stringify({ passiRivelati: rivelati }) });
  const { pannello, lis } = pannelloFinto();
  const controlli = controlliFinti();
  const contenitore = elemento({ children: { '#modo-studio': pannello, '.dim-controlli': controlli } });
  const doc = documentoFinto();
  globalThis.document = doc;
  const smonta = setupStudio(contenitore, dim, storage);
  return { storage, controlli, lis, doc, smonta, pannello };
}

test('Prossimo passo incrementa, salva e porta il passo in vista con focus', () => {
  const { storage, controlli, lis, pannello } = montaStudio(0);
  controlli.dispatch('click', { target: controlli.azioni['[data-azione="avanti"]'] });
  assert.equal(lis[0].classList.contains('step--rivelato'), true);
  assert.equal(JSON.parse(storage.dati['tlc-kg:dimostrazioni:v1.dim-test']).passiRivelati, 1);
  assert.deepEqual(pannello.focalizzati, ['1']);
});

test('Indietro decrementa e Ricomincia azzera; Mostra tutti rivela tutto', () => {
  const { controlli, lis } = montaStudio(2);
  controlli.dispatch('click', { target: controlli.azioni['[data-azione="indietro"]'] });
  assert.equal(lis[1].classList.contains('step--rivelato'), false);
  controlli.dispatch('click', { target: controlli.azioni['[data-azione="tutti"]'] });
  assert.ok(lis.every((li) => li.classList.contains('step--rivelato')));
  controlli.dispatch('click', { target: controlli.azioni['[data-azione="ricomincia"]'] });
  assert.ok(lis.every((li) => !li.classList.contains('step--rivelato')));
});

test('le frecce passano avanti e indietro; il focus su un campo le ignora', () => {
  const { doc, lis, smonta } = montaStudio(0);
  doc.dispatch('keydown', { key: 'ArrowRight', target: elemento({ tag: 'BODY' }) });
  assert.equal(lis[0].classList.contains('step--rivelato'), true);
  doc.dispatch('keydown', { key: 'ArrowLeft', target: elemento({ tag: 'BODY' }) });
  assert.equal(lis[0].classList.contains('step--rivelato'), false);
  doc.dispatch('keydown', { key: 'ArrowRight', target: elemento({ tag: 'INPUT' }) });
  assert.equal(lis[0].classList.contains('step--rivelato'), false);
  smonta();
  assert.equal(doc.ascoltatori(), 0);
});

test('Spazio avanza solo se il focus non è su un controllo', () => {
  const { doc, lis } = montaStudio(0);
  doc.dispatch('keydown', { key: ' ', target: elemento({ tag: 'BUTTON' }) });
  assert.equal(lis[0].classList.contains('step--rivelato'), false);
  doc.dispatch('keydown', { key: ' ', target: elemento({ tag: 'LI' }) });
  assert.equal(lis[0].classList.contains('step--rivelato'), true);
});

test('senza pannello o controlli setupStudio non fa nulla', () => {
  const smonta = setupStudio(elemento(), dim, memoria());
  assert.equal(typeof smonta, 'function');
  smonta();
});
