/** Modalità «A voce» (testo parlato in paragrafi) e «Compatta» (righe da memorizzare). */
import { escapeHtml, testoSicuro } from '../../core/math.js';
import { paragrafi } from './dati.js';

export function renderAVoce(dim) {
  const righe = paragrafi(dim.a_voce).map((p) => `<p>${escapeHtml(testoSicuro(p))}</p>`).join('');
  return `<section class="card" aria-labelledby="titolo-avoce"><h2 class="card__title" id="titolo-avoce">A voce</h2><div class="prose">${righe}</div></section>`;
}

export function renderCompatta(dim) {
  const voci = Array.isArray(dim.versione_compatta) ? dim.versione_compatta : [];
  const items = voci.map((v) => `<li>${escapeHtml(testoSicuro(v))}</li>`).join('');
  return `<section class="card" aria-labelledby="titolo-compatta"><h2 class="card__title" id="titolo-compatta">Versione compatta</h2><ol class="dim-compatta">${items}</ol></section>`;
}
