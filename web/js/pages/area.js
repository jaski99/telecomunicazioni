/** web/js/pages/area.js — owner E1.
 * Pagina #/area/<n>: copertina di capitolo. Titolo, lead, elenco nodi dell'area,
 * "Che cosa saprai fare" (>= 3 criteri presi da saper_fare, 0 testo inventato),
 * "Da dove cominciare" (nodo senza prerequisiti hard), nav capitolo prev/succ.
 */
import { testoSicuro, escapeHtml } from '../core/math.js';
import { nomeArea, etichettaTipo } from './grafo.js';

function esc(s) {
  return escapeHtml(testoSicuro(s));
}

function tempoTotale(nodi) {
  const minuti = nodi.reduce((s, n) => s + Number(n.tempo_studio_min || 0), 0);
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  return h ? `${h}h ${m}′` : `${m}′`;
}

export function render(ctx, params) {
  const graph = (ctx && ctx.graph) || {};
  const nodi = (Array.isArray(graph.nodi) ? graph.nodi : []).filter(Boolean);
  const nArea = Number(params && params.n);
  const aree = (graph.aree || (graph.meta && graph.meta.aree) || []).filter(Boolean);
  const area = aree.find((a) => a && Number(a.id) === nArea);
  const titArea = area ? esc(area.titolo) : `Area ${nArea}`;
  const nodiArea = nodi.filter((n) => Number(n.area || 0) === nArea);

  // Criteri da saper_fare (>= 3 in totale, 0 testo inventato): primi 3 unici.
  const criteriVisti = new Set();
  const criteri = [];
  for (const n of nodiArea) {
    for (const c of (Array.isArray(n.saper_fare) ? n.saper_fare : [])) {
      const ct = testoSicuro(c).trim();
      if (ct && !criteriVisti.has(ct)) {
        criteriVisti.add(ct);
        criteri.push(ct);
      }
    }
  }
  const criteriPrimi = criteri.slice(0, 3);

  // Nodo senza prerequisiti hard: da dove cominciare.
  const primoNodo = nodiArea.find((n) => {
    const pre = Array.isArray(n.prerequisiti) ? n.prerequisiti : [];
    return pre.length === 0 || pre.every((p) => p && p.forza === 'soft');
  }) || nodiArea[0];

  // Elenco nodi in ordine (area, id).
  const ordinati = [...nodiArea].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
  const htmlNodi = ordinati.length
    ? ordinati.map((n) => {
      const tipo = etichettaTipo(n.tipo);
      const chipDim = (n.tipo === 'dimostrazione' || Boolean(n.dimostrazione))
        ? '<span class="chip chip--info">Dimostrazione</span>' : '';
      return `<li class="card area-node-card">
        <a class="area-node__titolo" href="#/nodo/${esc(String(n.id))}">${esc(n.titolo || n.id)}</a>
        <div class="chip-row"><span class="chip">${esc(tipo)}</span>${chipDim}</div>
      </li>`;
    }).join('')
    : '<li class="card"><p>Nessun argomento in questo capitolo.</p></li>';

  // Nav capitoli precedente/successivo.
  const areeOrdinate = [...aree].sort((a, b) => Number(a.id) - Number(b.id));
  const idx = areeOrdinate.findIndex((a) => Number(a.id) === nArea);
  const prevArea = idx > 0 ? areeOrdinate[idx - 1] : null;
  const nextArea = idx < areeOrdinate.length - 1 ? areeOrdinate[idx + 1] : null;
  let navHtml = '<nav class="area-nav" aria-label="Capitoli">';
  if (prevArea) navHtml += `<a class="btn btn--ghost" href="#/area/${prevArea.id}">← Capitolo ${esc(prevArea.id)}</a>`;
  if (nextArea) navHtml += `<a class="btn btn--primary" href="#/area/${nextArea.id}">Capitolo ${esc(nextArea.id)} →</a>`;
  navHtml += '</nav>';

  const criteriHtml = criteriPrimi.length
    ? `<ul class="area-criteri">${criteriPrimi.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`
    : '<p>Nessun criterio dichiarato per questa area.</p>';

  return `<h1>Capitolo ${nArea} — ${titArea}</h1>
<div class="prose">
  <p>${esc(nodiArea.length)} argomenti${nodiArea.length ? ', ' + tempoTotale(nodiArea) + ' stimati.' : '.'}</p>
</div>
${primoNodo ? `<section class="card area-inizio">
  <h2>Da dove cominciare</h2>
  <p>${esc(primoNodo.titolo || primoNodo.id)}</p>
  <a class="btn btn--primary" href="#/nodo/${esc(String(primoNodo.id))}">Apri l'argomento</a>
</section>` : ''}
<section class="card area-criteri-card">
  <h2>Che cosa saprai fare</h2>
  ${criteriHtml}
</section>
<section>
  <h2>Argomenti del capitolo</h2>
  <ul class="stack-list area-elenchi">${htmlNodi}</ul>
</section>
${navHtml}`;
}

export function setup() {
  // Nessun comportamento JS particolare al momento.
}
