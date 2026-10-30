/** web/js/layout/sequenza.js — owner E1.
 * Ordine di studio (piano di studio): priorità alta → media → bassa, poi (area, id).
 * Esporta prossimoNodo / nodoPrecedente per la nav prev/succ di ogni pagina.
 */
const PRIORITA_ORDINE = { alta: 0, media: 1, bassa: 2 };

function livelloPriorita(nodo) {
  return PRIORITA_ORDINE[(nodo && nodo.priorita && nodo.priorita.livello) || 'media'] ?? 1;
}

/** Restituisce gli ID dei nodi nell'ordine del piano di studio. */
export function ordinePianoDiStudio(graph) {
  const nodi = Array.isArray(graph && graph.nodi) ? graph.nodi : [];
  return [...nodi]
    .filter((n) => n && n.id)
    .sort((a, b) => {
      const pa = livelloPriorita(a);
      const pb = livelloPriorita(b);
      if (pa !== pb) return pa - pb;
      if ((a.area || 0) !== (b.area || 0)) return (a.area || 0) - (b.area || 0);
      return String(a.id || '').localeCompare(String(b.id || ''));
    })
    .map((n) => n.id);
}

/** Nodo successivo nell'ordine di studio, o null se non c'è. */
export function prossimoNodo(graph, id) {
  const ordine = ordinePianoDiStudio(graph);
  const i = ordine.indexOf(String(id));
  return i >= 0 && i < ordine.length - 1 ? ordine[i + 1] : null;
}

/** Nodo precedente nell'ordine di studio, o null se non c'è. */
export function nodoPrecedente(graph, id) {
  const ordine = ordinePianoDiStudio(graph);
  const i = ordine.indexOf(String(id));
  return i > 0 ? ordine[i - 1] : null;
}

/** HTML della nav precedente/successivo per un nodo. */
export function navSequenzaHTML(graph, id) {
  const ordine = ordinePianoDiStudio(graph);
  const i = ordine.indexOf(String(id));
  const mappa = new Map((graph.nodi || []).map((n) => [String(n.id), n]));
  const prev = i > 0 ? mappa.get(ordine[i - 1]) : null;
  const next = i < ordine.length - 1 ? mappa.get(ordine[i + 1]) : null;
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const href = (id) => `#/nodo/${esc(String(id))}`;
  let html = '<nav class="nav-sequenza" aria-label="Navigazione sequenziale">';
  if (prev) html += `<a class="btn btn--ghost" href="${href(prev.id)}" rel="prev"><span>←</span> ${esc(prev.titolo || prev.id)}</a>`;
  if (next) html += `<a class="btn btn--primary" href="${href(next.id)}" rel="next">${esc(next.titolo || next.id)} <span>→</span></a>`;
  html += '</nav>';
  return html;
}
