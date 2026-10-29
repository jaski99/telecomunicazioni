/**
 * Pagina #/grafo: nodi raggruppati per area con card compatte, etichette
 * umane, filtro per area e ricerca testuale. Tollerante verso nodi pendenti.
 */
import { testoSicuro, escapeHtml } from '../core/math.js';

const TIPI_UMANI = { concetto: 'Concetto', dimostrazione: 'Dimostrazione', tipo_esercizio: 'Esercizio guidato' };
const PRIORITA_UMANE = { alta: 'Priorità alta', media: 'Priorità media', bassa: 'Approfondimento' };

export function etichettaTipo(tipo) {
  const t = testoSicuro(tipo).trim();
  return t ? (TIPI_UMANI[t] || t.replace(/_/g, ' ')) : 'Argomento';
}

export function etichettaPriorita(livello) {
  return PRIORITA_UMANE[testoSicuro(livello).trim()] || 'Priorità standard';
}

export function nomeArea(graph, areaNum) {
  const fontiAree = [graph && graph.aree, graph && graph.meta && graph.meta.aree];
  for (const lista of fontiAree) {
    const trovata = Array.isArray(lista) && lista.find((a) => a && Number(a.id) === Number(areaNum));
    if (trovata && trovata.titolo) return testoSicuro(trovata.titolo);
  }
  return '';
}

export function chipNodoLink(id, mappaNodi) {
  const chiave = testoSicuro(id).trim();
  const nodo = mappaNodi && mappaNodi.get(chiave);
  const etichetta = escapeHtml(testoSicuro((nodo && nodo.titolo) || chiave || 'Argomento'));
  return nodo
    ? `<a class="chip chip--info link-nodo-chip" href="#/nodo/${escapeHtml(chiave)}">${etichetta}</a>`
    : `<span class="chip chip--warn" aria-label="${etichetta}, in arrivo">${etichetta} · in arrivo</span>`;
}

function renderCardNodo(n, mappa) {
  const id = escapeHtml(testoSicuro(n.id));
  const titolo = escapeHtml(testoSicuro(n.titolo || n.id));
  const prereq = Array.isArray(n.prerequisiti) ? n.prerequisiti : [];
  const nPre = prereq.length;
  const testoPre = nPre === 0 ? 'Nessun prerequisito' : nPre === 1 ? '1 prerequisito' : `${nPre} prerequisiti`;
  const chipDim = (Boolean(n.dimostrazione) || n.tipo === 'dimostrazione')
    ? `<a class="chip chip--info link-nodo-chip" href="#/dim/${id}">Dimostrazione</a>` : '';
  const ricerca = escapeHtml(`${testoSicuro(n.titolo)} ${etichettaTipo(n.tipo)}`.toLocaleLowerCase('it-IT'));
  const prereqHtml = nPre > 0
    ? `<div class="nodo-card__prereq"><span class="nodo-card__label">Prerequisiti:</span><div class="chip-row">${prereq.map((p) => chipNodoLink(p && p.id, mappa)).join('')}</div></div>`
    : '';
  return `<li class="card nodo-card" data-area="${escapeHtml(String(n.area || 0))}" data-ricerca="${ricerca}">
    <a class="nodo-card__titolo" href="#/nodo/${id}">${titolo}</a>
    <div class="chip-row"><span class="chip">${escapeHtml(etichettaTipo(n.tipo))}</span><span class="chip">${escapeHtml(testoPre)}</span>${chipDim}</div>
    ${prereqHtml}
  </li>`;
}

export function render(ctx) {
  const graph = (ctx && ctx.graph) || {};
  const nodi = (Array.isArray(graph.nodi) ? graph.nodi : []).filter(Boolean);
  const mappa = new Map(nodi.map((n) => [String(n.id), n]));
  const ordinati = [...nodi].sort((a, b) => ((a.area || 0) - (b.area || 0)) || String(a.id || '').localeCompare(String(b.id || '')));
  if (ordinati.length === 0) {
    return `<h1>Grafo degli argomenti</h1><div class="callout callout--warn"><p>Nessun nodo caricato nel grafo corrente.</p></div>`;
  }
  const aree = [...new Set(ordinati.map((n) => Number(n.area || 0)))].sort((a, b) => a - b);
  const opzioniArea = aree.map((a) => {
    const tit = nomeArea(graph, a);
    return `<option value="${a}">Area ${a}${tit ? ' — ' + escapeHtml(tit) : ''}</option>`;
  }).join('');
  const sezioniHtml = aree.map((a) => {
    const gruppo = ordinati.filter((n) => Number(n.area || 0) === a);
    const tit = nomeArea(graph, a);
    return `<section class="grafo-sezione" data-sezione-area="${a}">
      <div class="grafo-sezione__testata">
        <h2>Area ${a}${tit ? ' — ' + escapeHtml(tit) : ''}</h2>
        <span class="chip" data-badge-area="${a}">${gruppo.length} ${gruppo.length === 1 ? 'nodo' : 'nodi'}</span>
      </div>
      <ul class="stack-list grafo-griglia">${gruppo.map((n) => renderCardNodo(n, mappa)).join('')}</ul>
    </section>`;
  }).join('');

  return `<h1>Grafo degli argomenti</h1>
<div class="prose"><p>Argomenti del corso organizzati per area tematica, con il conteggio dei prerequisiti e l'accesso diretto alle dimostrazioni. I prerequisiti non ancora caricati sono segnalati <strong>in arrivo</strong>.</p></div>
<div class="card grafo-filtri">
  <div class="grafo-filtri__campi">
    <div class="grafo-campo"><label for="grafo-ricerca">Cerca per titolo o tipologia</label><input id="grafo-ricerca" type="search" placeholder="Es. Fourier, Nyquist, ALOHA…" autocomplete="off"></div>
    <div class="grafo-campo"><label for="grafo-area">Filtra per area</label><select id="grafo-area"><option value="">Tutte le aree (${ordinati.length})</option>${opzioniArea}</select></div>
  </div>
  <div id="grafo-stato" class="grafo-stato" role="status" aria-live="polite">Mostrati ${ordinati.length} di ${ordinati.length} nodi</div>
</div>
${sezioniHtml}
<div id="grafo-vuoto" class="callout callout--warn" hidden><p>Nessun argomento corrisponde ai filtri selezionati.</p></div>`;
}

export function setup(container) {
  const input = container.querySelector('#grafo-ricerca');
  const select = container.querySelector('#grafo-area');
  if (!input || !select) return;
  const carte = [...container.querySelectorAll('.nodo-card')];
  const sezioni = [...container.querySelectorAll('.grafo-sezione')];
  const stato = container.querySelector('#grafo-stato');
  const vuoto = container.querySelector('#grafo-vuoto');
  const aggiorna = () => {
    const q = input.value.trim().toLocaleLowerCase('it-IT');
    const area = select.value;
    let visibili = 0;
    for (const c of carte) {
      c.hidden = !((!area || c.getAttribute('data-area') === area) && (!q || (c.getAttribute('data-ricerca') || '').includes(q)));
      if (!c.hidden) visibili += 1;
    }
    for (const s of sezioni) {
      const a = s.getAttribute('data-sezione-area');
      const nVis = carte.filter((c) => !c.hidden && c.getAttribute('data-area') === a).length;
      s.hidden = nVis === 0;
      const badge = s.querySelector(`[data-badge-area="${a}"]`);
      if (badge) badge.textContent = `${nVis} ${nVis === 1 ? 'nodo' : 'nodi'}`;
    }
    if (stato) stato.textContent = `Mostrati ${visibili} di ${carte.length} nodi`;
    if (vuoto) vuoto.hidden = visibili > 0;
  };
  input.addEventListener('input', aggiorna);
  select.addEventListener('change', aggiorna);
}
