/** Chiusura di Studio: formula finale (rivelata a fine passi), errori frequenti, figure generali. */
import { escapeHtml, formulaBlock, testoSicuro } from '../../core/math.js';
import { renderFigura } from '../../figure/index.js';
import { figureGenerali } from './dati.js';

/** La formula finale è nascosta finché non sono rivelati tutti i passi; il segnaposto la annuncia. */
export function renderFormulaFinale(dim, rivelata) {
  if (!dim.formula_finale) return '';
  return `<p class="dim-attesa" data-finale-attesa${rivelata ? ' hidden' : ''}>Formula finale: si rivela dopo l'ultimo passo.</p>
<div class="formula" data-finale${rivelata ? '' : ' hidden'}>${formulaBlock(dim.formula_finale, { variante: 'chiave', etichetta: 'Formula finale' })}</div>`;
}

export function aggiornaFinale(root, rivelata) {
  const formula = root.querySelector('[data-finale]');
  const attesa = root.querySelector('[data-finale-attesa]');
  if (formula) formula.hidden = !rivelata;
  if (attesa) attesa.hidden = rivelata;
}

export function renderErrori(dim) {
  const errori = Array.isArray(dim.errori_frequenti) ? dim.errori_frequenti.filter((e) => e && typeof e === 'object') : [];
  if (!errori.length) return '';
  const items = errori
    .map((e) => `<article class="callout callout--error"><p class="callout__title">Errore: ${escapeHtml(testoSicuro(e.errore))}</p><p><strong>Perché è sbagliato:</strong> ${escapeHtml(testoSicuro(e.perche_sbagliato))}</p><p><strong>Correzione:</strong> ${escapeHtml(testoSicuro(e.correzione))}</p></article>`)
    .join('');
  return `<section class="card" aria-labelledby="titolo-errori"><h2 class="card__title" id="titolo-errori">Errori frequenti</h2><div class="dim-errori">${items}</div></section>`;
}

export function renderFigureGenerali(dim) {
  const figure = figureGenerali(dim);
  if (!figure.length) return '';
  return `<section class="card" aria-labelledby="titolo-figure"><h2 class="card__title" id="titolo-figure">Figure generali</h2>${figure.map((f) => renderFigura(f)).join('')}</section>`;
}
