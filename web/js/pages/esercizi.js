/**
 * Pagina #/esercizi: card per ogni esercizio guidato con prova d'esame,
 * chip testuale di difficoltà ("Difficoltà 1/3" .. "3/3"), sintesi con formule
 * e link alla lezione svolta.
 */

import {
  testoSicuro,
  escapeHtml,
  tokenizzaMatematica,
  formulaBlock,
  formulaInline,
  devePromuovereInDisplay,
  formulaIsolata,
} from '../core/math.js';

/** Calcola la difficoltà 1..3 in modo deterministico dai metadati del nodo. */
export function calcolaDifficolta(nodo) {
  if (!nodo || typeof nodo !== 'object') return 1;
  const esplicita = Number(nodo.difficolta);
  if ([1, 2, 3].includes(esplicita)) return esplicita;
  const nPrereq = Array.isArray(nodo.prerequisiti) ? nodo.prerequisiti.length : 0;
  const minuti = Number(nodo.tempo_studio_min || 30);
  const area = Number(nodo.area || 1);
  if (nPrereq >= 2 || minuti >= 45 || area >= 6) return 3;
  if (area >= 3 || minuti > 35) return 2;
  return 1;
}

export function paragrafoConFormule(testo) {
  const s = testoSicuro(testo);
  if (!s) return '';
  const tokens = tokenizzaMatematica(s);
  const isolata = formulaIsolata(tokens);
  const parti = [];
  let bufferInline = '';
  let dopoBox = false;
  const svuota = () => {
    if (bufferInline.trim()) parti.push(`<p>${bufferInline}</p>`);
    bufferInline = '';
  };
  for (const t of tokens) {
    if (t.type === 'text') {
      const pulito = dopoBox
        ? t.body.replace(/^[.,;:]+\s*/, '').replace(/^([a-zà-ÿ])/, (c) => c.toUpperCase())
        : t.body;
      if (pulito) {
        bufferInline += escapeHtml(pulito);
        dopoBox = false;
      }
    } else if (t.type === 'display' || isolata || devePromuovereInDisplay(t.body)) {
      svuota();
      parti.push(formulaBlock(t.body));
      dopoBox = true;
    } else {
      bufferInline += formulaInline(t.body);
      dopoBox = false;
    }
  }
  svuota();
  return parti.join('');
}

export function render(ctx) {
  const graph = (ctx && ctx.graph) || {};
  const nodi = Array.isArray(graph.nodi) ? graph.nodi : [];
  const esercizi = nodi.filter((n) => n && n.tipo === 'tipo_esercizio');

  if (esercizi.length === 0) {
    return `<h1>Esercizi d'esame</h1>
<div class="callout callout--warn"><p>Nessun esercizio caricato nel grafo corrente.</p></div>`;
  }

  const classeChip = { 1: 'chip--ok', 2: 'chip--info', 3: 'chip--warn' };
  const cards = esercizi.map((n) => {
    const id = escapeHtml(testoSicuro(n.id));
    const titolo = escapeHtml(testoSicuro(n.titolo || n.id));
    const diff = calcolaDifficolta(n);
    const prove = Array.isArray(n.domande_esame) && n.domande_esame.length
      ? n.domande_esame.map((d) => `<span class="chip chip--info">Prova ${escapeHtml(testoSicuro(d))}</span>`).join('')
      : '<span class="chip">Approfondimento</span>';
    return `<li class="card esercizio-card">
      <div class="chip-row">
        ${prove}
        <span class="chip ${classeChip[diff]}">Difficoltà ${diff}/3</span>
        <span class="chip">Area ${escapeHtml(testoSicuro(n.area || 1))}</span>
      </div>
      <h2 class="esercizio-card__titolo">${titolo}</h2>
      <div class="prose esercizio-card__sintesi">${paragrafoConFormule(n.sapere)}</div>
      <div class="esercizio-card__azioni">
        <a class="btn btn--primary" href="#/nodo/${id}">Svolgi esercizio</a>
      </div>
    </li>`;
  }).join('');

  return `<h1>Esercizi d'esame</h1>
<div class="prose">
  <p>Ogni scheda raccoglie un esercizio ricorrente d'esame con esempio guidato passo per passo, problema di completamento ed esercizio autonomo di verifica.</p>
</div>
<ul class="stack-list esercizi-griglia">${cards}</ul>`;
}
