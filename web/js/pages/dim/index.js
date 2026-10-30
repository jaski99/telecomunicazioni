/** Pagina #/dim/<id>: testata, modalità (tabs sticky) e pannelli. Compone i moduli di dim/. */
import { escapeHtml } from '../../core/math.js';
import { passi, trovaDimostrazione } from './dati.js';
import { renderTestata } from './testata.js';
import { renderPannello, renderTabs, setupModalita } from './modalita.js';
import { renderAVoce, renderCompatta } from './testi.js';
import { renderControlli } from './controlli.js';
import { renderStudio, setupStudio } from './studio.js';
import { renderABuchi, setupABuchi } from './abuchi.js';
import { renderRecall, setupRecall } from './recall.js';
import { renderIdea } from './sezioni.js';
import './cache.js';
import { leggiRivelati, parsePasso } from './stato.js';

function richiestaPasso(totale) {
  const query = typeof location === 'undefined' ? '' : String(location.hash).split('?')[1] || '';
  return parsePasso(query, totale);
}

function nonTrovata(id) {
  return `<h1>Dimostrazione non trovata</h1><div class="callout callout--warn"><p>Nessuna dimostrazione per il nodo <strong>${escapeHtml(String(id))}</strong> (in arrivo).</p></div>`;
}

function idRotta(params) { return String(params && params.id || '').split('?')[0]; }

export function render(ctx, params) {
  const id = idRotta(params);
  const trovata = trovaDimostrazione(ctx.graph, id);
  if (!trovata) return nonTrovata(id);
  const { nodo, dim } = trovata;
  const richiesto = richiestaPasso(passi(dim).length);
  const rivelati = richiesto == null ? leggiRivelati(ctx.storage, dim.id, passi(dim).length) : richiesto;
  return [
    renderTestata(dim, nodo, ctx.graph),
    renderIdea(dim),
    renderTabs(),
    '<div class="dim-corpo dim-corpo--studio">',
    renderControlli(dim, rivelati),
    renderPannello('studio', renderStudio(dim, rivelati, ctx.graph && ctx.graph.meta, nodo.area )),
    renderPannello('avocce', renderAVoce(dim)),
    renderPannello('compatta', renderCompatta(dim)),
    renderPannello('abuchi', renderABuchi(dim)),
    renderPannello('recall', renderRecall(dim)),
    '</div>',
  ].join('');
}

export function setup(container, ctx, params) {
  const trovata = trovaDimostrazione(ctx.graph, idRotta(params));
  if (!trovata) return undefined;
  const { nodo, dim } = trovata;
  const richiesto = richiestaPasso(passi(dim).length);
  setupModalita(container);
  const smonta = [
    setupStudio(container, dim, ctx.storage, nodo.area, richiesto),
    setupABuchi(container, dim),
    setupRecall(container),
  ];
  return () => smonta.forEach((fine) => fine());
}
