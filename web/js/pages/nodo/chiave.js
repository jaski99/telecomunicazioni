/** web/js/pages/nodo/chiave.js — owner E1.
 * Blocchi di apertura della scheda nodo: .chiave, .scenario, .analogia.
 */
import { renderProsaMarkdown, blocchi, esc } from './util.js';
import { tokenizzaMatematica } from '../../core/math.js';

export function primaFrase(testo) {
  const tokens = tokenizzaMatematica(typeof testo === 'string' ? testo.trim() : '');
  let risultato = '';
  let formule = 0;
  for (const token of tokens) {
    if (token.type !== 'text') {
      if (formule++) break;
      const delimitatore = token.type === 'display' ? '$$' : '$';
      risultato += delimitatore + token.body + delimitatore;
      continue;
    }
    const fine = token.body.match(/[.!?](?=\s|$)/);
    risultato += fine ? token.body.slice(0, fine.index + 1) : token.body;
    if (fine) break;
  }
  return risultato.trim().replace(/(?:\s+(?:e|o|è|sono|vale|per|con|di|a|in|=)|[,;:])\s*$/i, '');
}

export function renderChiave(nodo) {
  const lezione = nodo.lezione || {};
  const testo = primaFrase(lezione.riepilogo || lezione.definizione_esame?.definizione);
  if (!testo) return '';
  return `<aside class="chiave" aria-labelledby="chiave-${esc(nodo.id)}"><p class="blocco__etichetta" id="chiave-${esc(nodo.id)}">Da ricordare</p>${renderProsaMarkdown(testo)}</aside>`;
}

export function renderScenario(nodo) {
  if (!nodo.lezione?.scenario) return '';
  return `<div class="scenario">${renderProsaMarkdown(nodo.lezione.scenario)}</div>`;
}

export function renderAnalogia(lezione) {
  if (!lezione || !lezione.analogia || !lezione.analogia.testo) return '';
  const an = lezione.analogia;
  return `<div class="analogia">${blocchi(an.testo)}${an.limite ? `<p class="analogia__limite"><span class="errore-blocco__label">Limite</span>${blocchi(an.limite)}</p>` : ''}</div>`;
}
