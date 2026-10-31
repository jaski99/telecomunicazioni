import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderStudio, setupStudio, vociIndiceStudio } from '../js/pages/dim/studio.js';
import { indiceHTML } from '../js/layout/indice.js';
import { dimostrazioneEsempio, elemento, memoria, documentoFinto } from './dim-fake-dom.js';

const dim = dimostrazioneEsempio();
const meta = { fonti: {} };

test('Studio contiene nell\'ordine enunciato, passi, formula finale, errori, figure, fonti', () => {
  const html = renderStudio(dim, 0, meta);
  const ordine = ['titolo-enunciato', 'titolo-ipotesi', 'titolo-notazione', '>Passi</h2>', 'data-finale', 'titolo-errori', 'titolo-figure', 'dim-fonti'];
  let ultimo = -1;
  for (const marcatore of ordine) {
    const pos = html.indexOf(marcatore);
    assert.ok(pos > ultimo, `${marcatore} fuori ordine`);
    ultimo = pos;
  }
});

test('le sezioni di Studio sono ancorabili e l\'indice usa il modulo unico di E1', () => {
  const html = renderStudio(dim, 3, meta);
  const numeri = [...html.matchAll(/id="sez-(\d+)"/g)].map((m) => Number(m[1]));
  assert.deepEqual(numeri, [1, 2, 3, 4, 5, 6, 7]);
  const voci = vociIndiceStudio(dim, meta, 1, 'dim-test');
  assert.deepEqual(voci.map((v) => v.id), numeri.map((n) => `sez-${n}`));
  assert.deepEqual(voci.map((v) => v.href), numeri.map((n) => `#/dim/dim-test?sezione=${n}`));
  assert.deepEqual(voci.map((v) => v.titolo), ['Enunciato', 'Ipotesi', 'Notazione', 'Passi', 'Errori frequenti', 'Figure generali', 'Fonti, varianti e verifica']);
  assert.match(indiceHTML(voci), /<nav class="indice-pagina" aria-label="Indice della pagina"><ol><li class="livello-2"><a href="#\/dim\/dim-test\?sezione=1">Enunciato<\/a><\/li>/);
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

test('il menu «Altro» è aperto da 1024 px e la sincronizzazione si rimuove allo smontaggio', () => {
  const ascoltatori = [];
  const media = { matches: true, addEventListener: (t, f) => ascoltatori.push(f), removeEventListener: (t, f) => ascoltatori.splice(ascoltatori.indexOf(f), 1) };
  globalThis.matchMedia = () => media;
  const menu = elemento({ classi: [] });
  menu.open = false;
  const controlli = elemento({ children: { '.dim-menu': menu } });
  const pannello = elemento({ attrs: { id: 'modo-studio' } });
  const contenitore = elemento({ children: { '#modo-studio': pannello, '.dim-controlli': controlli } });
  globalThis.document = documentoFinto();
  const smonta = setupStudio(contenitore, dim, memoria());
  assert.equal(menu.open, true);
  assert.equal(ascoltatori.length, 1);
  media.matches = false;
  ascoltatori[0]();
  assert.equal(menu.open, false);
  smonta();
  assert.equal(ascoltatori.length, 0);
  delete globalThis.matchMedia;
});

function pulsanteConfronto(passo, id) {
  const bottone = elemento({ attrs: { 'aria-controls': id, 'aria-expanded': 'false' } });
  bottone.closest = (sel) => (sel === '.step' ? passo : (sel.startsWith('.figura-confronta') ? bottone : null));
  return bottone;
}

test('il confronto apre il pannello del proprio passo anche con id omonimi nella pagina', () => {
  const { pannello } = montaStudio(0);
  const id = 'confronto-passo-2';
  const fabbrica = () => {
    const foglio = elemento({ attrs: { id }, hidden: true });
    const passo = elemento({ children: { '[id]': [foglio] } });
    return { passo, foglio, bottone: pulsanteConfronto(passo, id) };
  };
  const [reale, fixture] = [fabbrica(), fabbrica()];
  pannello.dispatch('click', { target: fixture.bottone });
  assert.equal(fixture.foglio.hidden, false);
  assert.equal(fixture.bottone.getAttribute('aria-expanded'), 'true');
  assert.equal(reale.foglio.hidden, true);
  assert.equal(reale.bottone.getAttribute('aria-expanded'), 'false');
  pannello.dispatch('click', { target: fixture.bottone });
  assert.equal(fixture.foglio.hidden, true);
  assert.equal(fixture.bottone.getAttribute('aria-expanded'), 'false');
});

test('un pulsante di confronto fuori da un passo non apre nulla', () => {
  const { pannello } = montaStudio(0);
  const foglio = elemento({ attrs: { id: 'confronto-passo-3' }, hidden: true });
  const orfano = elemento({ attrs: { 'aria-controls': 'confronto-passo-3' } });
  orfano.closest = (sel) => (sel.startsWith('.figura-confronta') ? orfano : null);
  pannello.children['[id]'] = [foglio];
  pannello.dispatch('click', { target: orfano });
  assert.equal(foglio.hidden, true);
  assert.equal(orfano.getAttribute('aria-expanded'), null);
});
