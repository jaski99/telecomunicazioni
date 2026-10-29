/** Modalità «A voce» (testo parlato in paragrafi) e «Compatta» (righe da memorizzare). */
import { escapeHtml, formulaBlock, formulaInline, testoSicuro, tokenizzaMatematica } from '../../core/math.js';
import { paragrafi } from './dati.js';

/** Voce che è solo una formula, con punteggiatura finale opzionale: va in un blocco formula. */
const FORMULA_SOLA = /^\$([^$]+)\$([.,;:]?)$/;

/** Testo con formule in linea: restano inline (niente promozione a display), così la punteggiatura non va a capo. */
function testoConFormuleInline(testo) {
  return tokenizzaMatematica(testo)
    .map((t) => (t.type === 'text' ? escapeHtml(t.body) : formulaInline(t.body)))
    .join('');
}

/** La punteggiatura finale entra nella formula, così non resta un «.» isolato su una riga. */
function voceCompatta(voce) {
  const testo = testoSicuro(voce).trim();
  const sola = testo.match(FORMULA_SOLA);
  if (sola) return `<li>${formulaBlock(sola[1] + sola[2])}</li>`;
  return `<li><div class="scroll-x" tabindex="0" role="region" aria-label="Riga compatta"><p>${testoConFormuleInline(testo)}</p></div></li>`;
}

export function renderAVoce(dim) {
  const righe = paragrafi(dim.a_voce).map((p) => `<p>${escapeHtml(testoSicuro(p))}</p>`).join('');
  return `<section class="card" aria-labelledby="titolo-avoce"><h2 class="card__title" id="titolo-avoce">A voce</h2><div class="prose">${righe}</div></section>`;
}

export function renderCompatta(dim) {
  const voci = Array.isArray(dim.versione_compatta) ? dim.versione_compatta : [];
  return `<section class="card" aria-labelledby="titolo-compatta"><h2 class="card__title" id="titolo-compatta">Versione compatta</h2><ol class="dim-compatta">${voci.map(voceCompatta).join('')}</ol></section>`;
}
