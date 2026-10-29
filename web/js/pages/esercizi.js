/**
 * Pagina #/esercizi: card per ogni esercizio guidato con prova d'esame,
 * chip testuale di difficoltà ("Difficoltà 1/3" .. "3/3"), sintesi con formule
 * e link alla lezione svolta. Esporta il formatter condiviso con #/nodo/*.
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
import { formattaParoleIntere } from './grafo.js';

/** Normalizza lacune d'esame e rimuove eventuali riferimenti interni ai worker. */
export function puliziaTesto(testo) {
  return testoSicuro(testo)
    .replace(/_{2,}/g, '[…]')
    .replace(/(?:,\s*di competenza di|\s+da)\s+W[1-6]\b/g, '');
}

/** Avvolge una formula inline insieme all'eventuale punteggiatura immediatamente seguente. */
export function formulaConPunteggiatura(corpo, punteggiatura = '') {
  const html = formulaInline(corpo);
  return punteggiatura
    ? `<span class="formula-gruppo">${html}${escapeHtml(punteggiatura)}</span>`
    : html;
}

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

/**
 * Converte testo misto a formule LaTeX in paragrafi + .formula-box (blocchi=true)
 * oppure in frammento inline per voci d'elenco e titoli (blocchi=false),
 * legando sempre la punteggiatura iniziale del testo seguente in .formula-gruppo.
 */
export function paragrafoConFormule(testo, { blocchi = true, prefisso = '', soloInline = false } = {}) {
  const s = puliziaTesto(testo);
  if (!s) return '';
  const tokens = tokenizzaMatematica(s).map((t) => ({ ...t }));
  const isolata = blocchi && !prefisso && formulaIsolata(tokens);
  const parti = [];
  let bufferInline = prefisso ? `<strong>${escapeHtml(prefisso)}</strong> ` : '';
  let dopoBox = false;
  const svuota = () => {
    if (bufferInline.trim()) parti.push(`<p>${bufferInline}</p>`);
    bufferInline = '';
  };
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    const inDisplay = t.type !== 'text' && !soloInline
      && (t.type === 'display' || isolata || t.body.length > 48 || devePromuovereInDisplay(t.body));
    if (t.type === 'text') {
      const pulito = dopoBox
        ? t.body.replace(/^[.,;:]+\s*/, '').replace(/^([a-zà-ÿ])/, (c) => c.toUpperCase())
        : t.body;
      if (pulito) {
        bufferInline += escapeHtml(pulito);
        dopoBox = false;
      }
    } else if (inDisplay) {
      if (blocchi) {
        svuota();
        parti.push(formulaBlock(t.body));
      } else {
        bufferInline += formulaBlock(t.body);
      }
      dopoBox = true;
    } else {
      const succ = tokens[i + 1];
      const matchPunct = succ && succ.type === 'text' ? succ.body.match(/^([.,;:)]+)/) : null;
      const punct = matchPunct ? matchPunct[1] : '';
      if (punct) tokens[i + 1] = { type: 'text', body: succ.body.slice(punct.length) };
      bufferInline += formulaConPunteggiatura(t.body, punct);
      dopoBox = false;
    }
  }
  if (!blocchi) return bufferInline;
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
    const titolo = formattaParoleIntere(n.titolo || n.id);
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
