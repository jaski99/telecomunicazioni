/**
 * Pagina #/grafo: grafo dei prerequisiti dei nodi, tollerante verso nodi
 * pendenti (etichetta 'in arrivo', nessun errore).
 */

import { linkNodo } from '../ui.js';
import { testoSicuro, escapeHtml } from '../core/math.js';

export function render(ctx) {
  const { graph } = ctx;
  const nodi = Array.isArray(graph.nodi) ? graph.nodi : [];
  const esistente = new Set(nodi.map((n) => n && n.id));

  let html = `<h1>Grafo dei prerequisiti</h1>
<p>Ogni nodo elenca i suoi prerequisiti. I collegamenti verso nodi non
ancora presenti sono etichettati <strong>in arrivo</strong>. Il grafo si
ridisegna da solo in base al contenuto di "graph.json": non ci sono
costanti sul numero di nodi o di aree.</p>`;

  // Ordine per area, poi id (stabile e derivato dai dati).
  const ordinati = [...nodi].filter((n) => n).sort((a, b) => {
    if ((a.area || 0) !== (b.area || 0)) return (a.area || 0) - (b.area || 0);
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  for (const n of ordinati) {
    const prereq = Array.isArray(n.prerequisiti) ? n.prerequisiti : [];
    let prereqHtml = '';
    if (prereq.length === 0) {
      prereqHtml = '<span class="muted">nessun prerequisito dichiarato</span>';
    } else {
      prereqHtml = prereq.map((p) => {
        const id = testoSicuro(p && p.id);
        const motivo = testoSicuro(p && p.motivo);
        const link = linkNodo(id, id, esistente.has(String(id)));
        return motivo ? `<div><span>${link}</span> <span class="muted">${escapeHtml(motivo)}</span></div>`
          : `<div>${link}</div>`;
      }).join('');
    }
    html += `<section class="nodo-grafo">
      <h3><a href="#/nodo/${escapeHtml(String(n.id))}">${escapeHtml(testoSicuro(n.titolo || n.id))}</a> <span class="badge">${escapeHtml(testoSicuro(n.tipo || ''))}</span> <span class="badge area">${escapeHtml(testoSicuro(String(n.area || '?')))}</span></h3>
      <p>${escapeHtml(testoSicuro(n.sapere || ''))}</p>
      <h4>Prerequisiti</h4>
      <div class="prereq">${prereqHtml}</div>
    </section>`;
  }

  if (ordinati.length === 0) {
    html += `<p class="avviso">Nessun nodo caricato (file graph.json vuoto o assente).</p>`;
  }
  return html;
}
