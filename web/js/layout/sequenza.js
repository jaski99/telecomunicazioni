/** web/js/layout/sequenza.js — owner E1.
 * Ordine di studio (piano di studio): algoritmo di Kahn deterministico
 * (come scripts/topo.py): a parità di vincoli, priorita alta -> media ->
 * bassa, poi (area, id). Rispetta i prerequisiti hard.
 * Esporta prossimoNodo / nodoPrecedente per la nav prev/succ di ogni pagina.
 */
const PRIORITA_ORDINE = { alta: 0, media: 1, bassa: 2 };

function livelloPriorita(nodo) {
  return PRIORITA_ORDINE[(nodo && nodo.priorita && nodo.priorita.livello) || 'media'] ?? 1;
}

/** Ordine topologico dei nodi (Kahn). Rispetta i prerequisiti hard e soft. */
export function ordinePianoDiStudio(graph) {
  const nodi = Array.isArray(graph && graph.nodi) ? graph.nodi : [];
  const mappa = new Map(nodi.filter((n) => n && n.id).map((n) => [String(n.id), n]));
  const gradi = new Map();
  const successori = new Map();
  for (const n of mappa.values()) {
    gradi.set(String(n.id), 0);
    successori.set(String(n.id), []);
  }
  for (const n of mappa.values()) {
    const pre = Array.isArray(n.prerequisiti) ? n.prerequisiti : [];
    for (const p of pre) {
      const pid = String(p && p.id);
      if (mappa.has(pid)) {
        gradi.set(String(n.id), (gradi.get(String(n.id)) || 0) + 1);
        successori.get(pid).push(String(n.id));
      }
    }
  }
  // Nodi senza prerequisiti non risolti (pendenti): non bloccano, entrano subito.
  const disponibili = [...mappa.keys()].filter((id) => (gradi.get(id) || 0) === 0);
  disponibili.sort((a, b) => confronta(mappa.get(a), mappa.get(b)));

  const ordine = [];
  while (disponibili.length > 0) {
    const corrente = disponibili.shift();
    ordine.push(corrente);
    const appenaResiDisponibili = [];
    for (const succ of successori.get(corrente)) {
      gradi.set(succ, (gradi.get(succ) || 1) - 1);
      if ((gradi.get(succ) || 0) === 0) appenaResiDisponibili.push(succ);
    }
    appenaResiDisponibili.sort((a, b) => confronta(mappa.get(a), mappa.get(b)));
    disponibili.push(...appenaResiDisponibili);
    disponibili.sort((a, b) => confronta(mappa.get(a), mappa.get(b)));
  }
  return ordine;
}

function confronta(a, b) {
  const pa = livelloPriorita(a);
  const pb = livelloPriorita(b);
  if (pa !== pb) return pa - pb;
  if ((a.area || 0) !== (b.area || 0)) return (a.area || 0) - (b.area || 0);
  return String(a.id || '').localeCompare(String(b.id || ''));
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
  const next = i >= 0 && i < ordine.length - 1 ? mappa.get(ordine[i + 1]) : null;
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
  const href = (nodo) => `#/${nodo.dimostrazione ? 'dim' : 'nodo'}/${esc(String(nodo.id))}`;
  let html = '<nav class="nav-sequenza" aria-label="Navigazione sequenziale">';
  if (prev) html += `<a class="btn btn--ghost" href="${href(prev)}" rel="prev"><span>←</span> ${esc(prev.titolo || prev.id)}</a>`;
  if (next) html += `<a class="btn btn--primary" href="${href(next)}" rel="next">${esc(next.titolo || next.id)} <span>→</span></a>`;
  html += '</nav>';
  return html;
}
