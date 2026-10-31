import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { render, setup } from '../js/pages/dim/index.js';
import { graphEsempio, memoria, elemento, documentoFinto } from './dim-fake-dom.js';

test('render compone testata, tabs, controlli e le cinque modalità', () => {
  const html = render({ graph: graphEsempio(), storage: memoria() }, { id: 'dim-test' });
  assert.match(html, /<header class="dim-testata">/);
  assert.match(html, /class="chiave dim-chiave"/);
  assert.ok(html.indexOf('class="chiave dim-chiave"') < html.indexOf('class="dim-tabs"'));
  assert.match(html, /<div class="dim-tabs">/);
  assert.match(html, /class="dim-corpo dim-corpo--studio"/);
  for (const modo of ['studio', 'avocce', 'compatta', 'abuchi', 'recall']) {
    assert.match(html, new RegExp(`id="modo-${modo}"`));
  }
});

test('la pagina offre indice in testa e navigazione sequenziale dai moduli di E1', () => {
  const html = render({ graph: graphEsempio(), storage: memoria() }, { id: 'dim-test' });
  assert.match(html, /<div class="indice-in-testa"><nav class="indice-pagina" aria-label="Indice della pagina">/);
  assert.match(html, /href="#\/dim\/dim-test\?sezione=1">Enunciato<\/a>/);
  assert.ok(html.indexOf('indice-in-testa') > html.indexOf('class="dim-tabs"'), 'indice dopo le tabs sticky');
  assert.ok(html.indexOf('indice-in-testa') < html.indexOf('dim-corpo dim-corpo--studio'), 'indice prima del corpo');
  assert.match(html, /<nav class="nav-sequenza" aria-label="Navigazione sequenziale">/);
  assert.ok(html.indexOf('nav-sequenza') > html.indexOf('dim-corpo dim-corpo--studio'), 'nav a fine pagina');
});

test('render ripristina i passi rivelati dal localStorage', () => {
  const storage = memoria({ 'tlc-kg:dimostrazioni:v1.dim-test': JSON.stringify({ passiRivelati: 2 }) });
  const html = render({ graph: graphEsempio(), storage }, { id: 'dim-test' });
  assert.match(html, /Passo 2 di 3/);
});

test('?passo=n rivela il passo richiesto senza modificare la memoria salvata', () => {
  const vecchia = globalThis.location;
  globalThis.location = { hash: '#/dim/dim-test?passo=2' };
  const storage = memoria({ 'tlc-kg:dimostrazioni:v1.dim-test': JSON.stringify({ passiRivelati: 1 }) });
  try {
    const html = render({ graph: graphEsempio(), storage }, { id: 'dim-test' });
    assert.match(html, /Passo 2 di 3/);
    assert.match(html, /id="passo-2" data-passo="2"[\s\S]*?class="step__corpo"/);
    assert.equal(JSON.parse(storage.dati['tlc-kg:dimostrazioni:v1.dim-test']).passiRivelati, 1);
  } finally {
    if (vecchia === undefined) delete globalThis.location; else globalThis.location = vecchia;
  }
});

test('una dimostrazione inesistente mostra un messaggio, senza ID grezzi né null', () => {
  const html = render({ graph: graphEsempio(), storage: memoria() }, { id: 'dim-assente' });
  assert.match(html, /Dimostrazione non trovata/);
  assert.match(html, /<strong>dim-assente<\/strong>/);
  assert.equal(setup(elemento(), { graph: graphEsempio(), storage: memoria() }, { id: 'dim-assente' }), undefined);
});

test('setup collega i listener e la funzione restituita li rimuove', () => {
  const doc = documentoFinto();
  globalThis.document = doc;
  const pannello = elemento({ attrs: { id: 'modo-studio' } });
  const contenitore = elemento({ children: { '[role="tablist"]': elemento(), '#modo-studio': pannello, '.dim-controlli': elemento() } });
  const ctx = { graph: graphEsempio(), storage: memoria() };
  const smonta = setup(contenitore, ctx, { id: 'dim-test' });
  assert.equal(typeof smonta, 'function');
  assert.equal(doc.ascoltatori(), 1);
  smonta();
  assert.equal(doc.ascoltatori(), 0);
});

test('tutte le 18 dimostrazioni del grafo costruito si renderizzano senza termini proibiti visibili', () => {
  const graph = JSON.parse(fs.readFileSync(new URL('../graph.json', import.meta.url), 'utf8'));
  const nodi = graph.nodi.filter((n) => n.dimostrazione);
  assert.equal(nodi.length, 18);
  for (const nodo of nodi) {
    const html = render({ graph, storage: memoria() }, { id: nodo.id });
    const visibile = html.replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(visibile, /\b(undefined|null|NaN)\b|\[object Object\]/, nodo.id);
    assert.doesNotMatch(visibile, /\bW[1-6]\b/, nodo.id);
    assert.match(html, /<h1>/, nodo.id);
  }
});

test('dimostrazione.js ri-esporta render e setup della nuova pagina', async () => {
  const modulo = await import('../js/pages/dimostrazione.js');
  assert.equal(modulo.render, render);
  assert.equal(modulo.setup, setup);
});
