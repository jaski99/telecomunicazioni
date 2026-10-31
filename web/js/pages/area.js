/** web/js/pages/area.js — owner E1.
 * Pagina #/area/<n>: copertina di capitolo. Titolo, lead (--fs-lead), elenco nodi
 * e dimostrazioni in ordine di piano di studio, "Che cosa saprai fare" (>= 3
 * criteri da saper_fare, 0 testo inventato), "Da dove cominciare", nav prev/succ.
 */
import { testoSicuro, escapeHtml } from '../core/math.js';
import { etichettaTipo } from './grafo.js';
import { ordinePianoDiStudio } from '../layout/sequenza.js';

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

  // Nodi dell'area in ordine di piano di studio.
  const ordine = ordinePianoDiStudio(graph);
  const nodiArea = ordine.map((id) => nodi.find((n) => String(n.id) === id)).filter(Boolean).filter((n) => Number(n.area || 0) === nArea);
  const dimostrazioni = nodiArea.filter((n) => n.tipo === 'dimostrazione');
  const concetti = nodiArea.filter((n) => n.tipo !== 'dimostrazione');

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

  const lista = (nodi) => nodi.length
    ? nodi.map((n) => {
      const tipo = etichettaTipo(n.tipo);
      const chipDim = n.tipo === 'dimostrazione' ? '<span class="chip chip--info">Dimostrazione</span>' : '';
      return `<li class="card area-node-card"><a class="area-node__titolo" href="#/${n.dimostrazione ? 'dim' : 'nodo'}/${esc(String(n.id))}">${esc(n.titolo || n.id)}</a><div class="chip-row"><span class="chip">${esc(tipo)}</span>${chipDim}</div></li>`;
    }).join('')
    : '<li class="card"><p>Nessun argomento.</p></li>';

  // Nav capitoli prev/succ.
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

  const domande = (ctx?.quiz?.elementi || []).filter((e) => Number(e.area) === nArea).slice(0, 3);
  const checkpoint = domande.length ? `<section class="verifica"><h2>Checkpoint</h2><ol>${domande.map((d) => `<li><p>${esc(d.domanda)}</p><button class="btn btn--ghost area-risposta" type="button" data-id="${esc(d.id)}" aria-expanded="false">Mostra risposta</button><div class="area-soluzione"></div></li>`).join('')}</ol></section>` : '';

  const demoHtml = dimostrazioni.length
    ? `<h3>Dimostrazioni</h3><ul class="area-elenchi">${lista(dimostrazioni)}</ul>`
    : '';
  const concHtml = concetti.length
    ? `<h3>Argomenti</h3><ul class="area-elenchi">${lista(concetti)}</ul>`
    : '';

  return `<h1>Capitolo ${nArea} — ${titArea}</h1>
<p class="area-lead">${esc(nodiArea.length)} argomenti · ${dimostrazioni.length} ${dimostrazioni.length === 1 ? 'dimostrazione' : 'dimostrazioni'} · ${tempoTotale(nodiArea)} stimati.</p>
${primoNodo ? `<section class="card area-inizio"><h2>Da dove cominciare</h2><p>${esc(primoNodo.titolo || primoNodo.id)}</p><a class="btn btn--primary" href="#/${primoNodo.dimostrazione ? 'dim' : 'nodo'}/${esc(String(primoNodo.id))}">Apri l'argomento</a></section>` : ''}
<section class="card area-criteri-card"><h2>Che cosa saprai fare</h2>${criteriHtml}</section>
<section>${concHtml}${demoHtml}</section>${navHtml}
${checkpoint}
<p><a class="btn btn--primary" href="#/quiz?area=${nArea}">Checkpoint del capitolo</a></p>`;
}

export function setup(container, ctx) {
  const onClick = (event) => {
    const button = event.target.closest('.area-risposta');
    if (!button) return;
    const soluzione = button.nextElementSibling;
    const aperta = button.getAttribute('aria-expanded') === 'true';
    soluzione.textContent = '';
    if (!aperta) {
      const domanda = (ctx?.quiz?.elementi || []).find((d) => String(d.id) === button.dataset.id);
      const opzione = domanda?.opzioni?.find((o) => o.id === domanda.corretta);
      soluzione.textContent = opzione?.testo || String(domanda?.corretta ?? '');
    }
    button.setAttribute('aria-expanded', String(!aperta));
    button.textContent = aperta ? 'Mostra risposta' : 'Nascondi risposta';
  };
  container.addEventListener('click', onClick);
  return () => container.removeEventListener('click', onClick);
}
