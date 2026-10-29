/* Utilità condivise dai renderer SVG (grafico, blocchi, temporale). */

/**
 * Testo sicuro: mai 'null'/'undefined'/'NaN' a schermo.
 * @param {unknown} v
 * @returns {string}
 */
export function testoSicuro(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '';
    return String(v);
  }
  return String(v);
}

/**
 * Formatta un numero per un asse: massimo 3 decimali, niente segnale inesistente.
 * @param {number} v
 * @returns {string}
 */
export function fmtAsse(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '0';
  return Number.isInteger(v) ? String(v) : v.toFixed(3);
}

/**
 * Escaping HTML per etichette e annotazioni SVG.
 * @param {string} s
 * @returns {string}
 */
export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * mappa un valore dal dominio dati al pixel del viewport.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @param {number} pixMin
 * @param {number} pixMax
 * @returns {number}
 */
export function scala(value, min, max, pixMin, pixMax) {
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) return pixMin;
  const t = (value - min) / range;
  return pixMin + t * (pixMax - pixMin);
}

/**
 * Palette discreta (non il colore è l'unico portatore di significato:
 * le serie hanno anche stile di linea e etichetta di legenda).
 */
export const PALETTE = [
  '#1f6feb', '#d03a2d', '#2e8b57', '#b07a1e', '#6a4c93', '#1b9aaa', '#c44d58',
];

/**
 * Avvolge un SVG nella figure accessibile: viewBox, role, title, desc.
 * @param {object} spec {id?, tipo, titolo, descrizione}
 * @param {string} svg
 * @returns {string}
 */
export function figuraSVG(spec, svg) {
  const titolo = testoSicuro(spec && spec.titolo ? spec.titolo : 'Figura');
  const descrizione = testoSicuro(spec && spec.descrizione ? spec.descrizione : '');
  const idAttr = spec && spec.id ? ` id="${escapeHtml(String(spec.id))}"` : '';
  return `<figure${idAttr} role="img" aria-label="${escapeHtml(titolo)}" class="figura">
${svg}
</figure>`;
}

/**
 * Figura di fallback per spec non valida: solo la descrizione testuale,
 * mai eccezioni e mai testi 'null'.
 * @param {object} spec
 * @returns {string}
 */
export function figuraSoloTesto(spec) {
  const titolo = testoSicuro(spec && spec.titolo ? spec.titolo : 'Figura');
  const descrizione = testoSicuro(spec && spec.descrizione ? spec.descrizione : 'Figura non disponibile.');
  return `<figure role="img" aria-label="${escapeHtml(titolo)}" class="figura figura-non-disponibile">
<p>${escapeHtml(descrizione)}</p>
</figure>`;
}

/**
 * SVG di base con assi visibili, title e desc.
 * @param {object} spec {titolo, descrizione}
 * @param {number} width
 * @param {number} height
 * @param {string} inner
 * @returns {string}
 */
export function svgBase(spec, width, height, inner) {
  const titolo = testoSicuro(spec && spec.titolo ? spec.titolo : 'Figura');
  const descrizione = testoSicuro(spec && spec.descrizione ? spec.descrizione : '');
  return `<svg role="img" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"
class="figura-svg" aria-labelledby="tit-${spec.id} desc-${spec.id}">
<title id="tit-${spec.id}">${escapeHtml(titolo)}</title>
<desc id="desc-${spec.id}">${escapeHtml(descrizione)}</desc>
${inner}
</svg>`;
}
