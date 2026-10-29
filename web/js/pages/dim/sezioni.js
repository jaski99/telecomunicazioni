/** Sezioni introduttive di Studio: enunciato, ipotesi, notazione, idea. */
import { compilaLatexSicuro, escapeHtml, testoSicuro } from '../../core/math.js';
import { paragrafi } from './dati.js';

function elementiLista(valori) {
  const arr = Array.isArray(valori) ? valori : [valori];
  return arr
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
    .map((v) => `<li>${escapeHtml(testoSicuro(v))}</li>`)
    .join('');
}

export function renderEnunciato(dim) {
  const righe = paragrafi(dim.enunciato).map((p) => `<p>${escapeHtml(testoSicuro(p))}</p>`).join('');
  return `<section class="card" aria-labelledby="titolo-enunciato"><h2 class="card__title" id="titolo-enunciato">Enunciato</h2><div class="prose">${righe}</div></section>`;
}

export function renderIpotesi(dim) {
  const items = elementiLista(dim.ipotesi);
  if (!items) return '';
  return `<section class="card" aria-labelledby="titolo-ipotesi"><h2 class="card__title" id="titolo-ipotesi">Ipotesi</h2><ul class="dim-lista">${items}</ul></section>`;
}

/** Simbolo in LaTeX (compilato senza eccezioni) e significato, in una lista a due colonne da desktop (1024 px). */
export function renderNotazione(dim) {
  const voci = Array.isArray(dim.notazione) ? dim.notazione.filter((v) => v && typeof v === 'object') : [];
  if (!voci.length) return '';
  const items = voci
    .map((v) => `<li><strong>${compilaLatexSicuro(String(v.simbolo || ''))}</strong><span>${escapeHtml(testoSicuro(v.significato))}</span></li>`)
    .join('');
  return `<section class="card" aria-labelledby="titolo-notazione"><h2 class="card__title" id="titolo-notazione">Notazione</h2><ul class="dim-notazione">${items}</ul></section>`;
}

export function renderIdea(dim) {
  if (!dim.idea) return '';
  return `<aside class="callout callout--tip" aria-labelledby="titolo-idea"><p class="callout__title" id="titolo-idea">Idea</p><p>${escapeHtml(testoSicuro(dim.idea))}</p></aside>`;
}
