/** web/js/pages/nodo/chiave.js — owner E1.
 * Blocchi di apertura della scheda nodo: .chiave, .scenario, .analogia.
 */
import { renderProsaMarkdown, blocchi, voce, esc } from './util.js';

export function renderChiave(nodo) {
  const testo = testoSicuro(nodo.perche_ti_serve || '');
  return `<aside class="chiave chiave--def" aria-labelledby="chiave-${esc(nodo.id)}"><p class="chiave__etichetta" id="chiave-${esc(nodo.id)}">Perché ti serve</p><p>${renderProsaMarkdown(testo)}</p></aside>`;
}

export function renderScenario(nodo) {
  if (!nodo.scenario) return '';
  return `<div class="scenario">${renderProsaMarkdown(nodo.scenario)}</div>`;
}

export function renderAnalogia(lezione) {
  if (!lezione || !lezione.analogia || !lezione.analogia.testo) return '';
  const an = lezione.analogia;
  return `<div class="analogia">${blocchi(an.testo)}${an.limite ? `<p class="analogia__limite"><span class="errore__label">Limite</span>${blocchi(an.limite)}</p>` : ''}</div>`;
}

function testoSicuro(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  return String(v);
}
