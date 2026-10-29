import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODI, renderTabs, renderPannello, mostraModo, setupModalita } from '../js/pages/dim/modalita.js';
import { elemento } from './dim-fake-dom.js';

test('le cinque modalità sono nell\'ordine del brief', () => {
  assert.deepEqual(MODI.map(([modo]) => modo), ['studio', 'avocce', 'compatta', 'abuchi', 'recall']);
});

test('renderTabs produce un tablist dentro .scroll-x, con Studio attivo', () => {
  const html = renderTabs();
  assert.match(html, /<div class="scroll-x" role="region" tabindex="0"/);
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 5);
  assert.match(html, /class="dim-tab attivo"[^>]*data-modo="studio"[^>]*aria-selected="true"/);
});

test('solo il pannello Studio è visibile di default; gli altri hanno hidden', () => {
  assert.doesNotMatch(renderPannello('studio', '<p>x</p>'), /hidden/);
  assert.match(renderPannello('studio', ''), /class="dim-pannello sempre-visibile"/);
  assert.match(renderPannello('recall', ''), /id="modo-recall"[^>]*hidden/);
});

test('mostraModo mostra solo il pannello scelto e aggiorna le schede', () => {
  const tabs = MODI.map(([modo]) => elemento({ attrs: { role: 'tab', 'data-modo': modo }, dataset: { modo } }));
  const pannelli = MODI.map(([modo]) => elemento({ attrs: { role: 'tabpanel', id: `modo-${modo}` } }));
  const controlli = elemento({ classi: [] });
  const corpo = elemento({ classi: [] });
  const contenitore = elemento({ children: { '[role="tab"]': tabs, '[role="tabpanel"]': pannelli, '.dim-controlli': controlli, '.dim-corpo': corpo } });
  mostraModo(contenitore, 'compatta');
  assert.deepEqual(pannelli.map((p) => p.hidden), [true, true, false, true, true]);
  assert.equal(controlli.hidden, true);
  assert.equal(corpo.classList.contains('dim-corpo--studio'), false);
  assert.equal(tabs[2].classList.contains('attivo'), true);
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(tabs[0].getAttribute('aria-selected'), 'false');
});

test('setupModalita collega il click sul tablist al cambio di modalità', () => {
  const tab = elemento({ matches: ['[role="tab"][data-modo]'], attrs: { role: 'tab', 'data-modo': 'recall' } });
  const lista = elemento();
  const contenitore = elemento({ children: { '[role="tablist"]': lista, '[role="tab"]': [tab], '[role="tabpanel"]': [], '.dim-controlli': null, '.dim-corpo': null } });
  setupModalita(contenitore);
  lista.dispatch('click', { target: tab });
  assert.equal(tab.classList.contains('attivo'), true);
  setupModalita(elemento());
});
