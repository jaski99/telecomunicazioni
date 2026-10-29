/**
 * Pagina #/esercizi: elenco dei nodi tipo_esercizio con link alla lezione.
 */

import { linkNodo, elenco, chipStato } from '../ui.js';
import { testoSicuro, escapeHtml } from '../core/math.js';

export function render(ctx) {
  const { graph } = ctx;
  const nodi = Array.isArray(graph.nodi) ? graph.nodi : [];
  const esercizi = nodi.filter((n) => n && n.tipo === 'tipo_esercizio');

  if (esercizi.length === 0) {
    return `<h1>Esercizi</h1><p class="avviso">Nessun esercizio caricato (in arrivo).</p>`;
  }

  let html = `<h1>Esercizi</h1>
<p>Gli esercizi si collegano alle dimostrazioni e ai nodi concetto del percorso d'esame (E1-E9 e tipo_esercizio extra).</p>
<ul class="lista-esercizi">`;
  for (const n of esercizi) {
    const domande = Array.isArray(n.domande_esame) && n.domande_esame.length
      ? n.domande_esame.map((d) => `<span class="badge">${escapeHtml(d)}</span>`).join(' ')
      : chipStato('nessuna prova diretta', 'ok');
    html += `<li>
      <a href="#/nodo/${escapeHtml(String(n.id))}">${escapeHtml(testoSicuro(n.titolo || n.id))}</a>
      <span class="meta">${escapeHtml(testoSicuro(String(n.area || '?')))} ${domande}</span>
    </li>`;
  }
  html += '</ul>';
  return html;
}
