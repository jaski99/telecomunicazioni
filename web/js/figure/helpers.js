/* Utilità condivise dai renderer SVG (grafico, blocchi, temporale). */

export function testoSicuro(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  return String(v);
}

export function fmtAsse(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '0';
  return Number.isInteger(v) ? String(v) : v.toFixed(3);
}

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function scala(value, min, max, pixMin, pixMax) {
  const range = max - min; if (!Number.isFinite(range) || range <= 0) return pixMin;
  return pixMin + ((value - min) / range) * (pixMax - pixMin);
}

export function stimaLarghezzaTesto(s, fontSize = 14) {
  if (!s) return 0; return String(s).length * fontSize * 0.62 + 8;
}

/* Font-size del disegno in unita' di viewBox: senza cap, il rendering e' sempre
   15 px a larghezza minima 480 px (>= 11 px) e 22.5 px a larghezza massima 720 px (<= 24 px). */
export function fontSize(viewBoxW) { return Math.max(11, Math.round(viewBoxW / 32)); }

export const PALETTE = ['#1f6feb', '#d03a2d', '#2e8b57', '#b07a1e', '#6a4c93', '#1b9aaa', '#c44d58'];

/* Colore testo su barre: scuro su chiari, bianco su colori molto scuri (contrasto >= 4.5:1). */
export function testoSuColore(c) {
  const scuri = ['#b00020', '#1f6feb', '#6a4c93', '#c44d58']; return scuri.includes(String(c).toLowerCase()) ? '#ffffff' : '#111827';
}

export function figuraSVG(spec, svg, serie) {
  const titolo = testoSicuro(spec && spec.titolo ? spec.titolo : 'Figura');
  const descrizione = testoSicuro(spec && spec.descrizione ? spec.descrizione : '');
  const idAttr = spec && spec.id ? ` id="${escapeHtml(String(spec.id))}"` : '';
  const legenda = renderLegenda(serie);
  return `<figure${idAttr} role="img" aria-label="${escapeHtml(titolo)}" class="figure">
<div class="scroll-x" tabindex="0" role="region" aria-label="Figura">${svg}${legenda}</div>
<figcaption class="figure__caption"><span class="figure__caption-title">${escapeHtml(titolo)}</span>${descrizione ? `<span class="figure__caption-desc">${escapeHtml(descrizione)}</span>` : ''}</figcaption>
</figure>`;
}

function renderLegenda(serie) {
  if (!Array.isArray(serie) || !serie.length) return '';
  return `<div class="figure__legend">${serie.map(s => {
    const col = s && s.colore ? String(s.colore) : '#6b7280'; const dash = s && s.stile === 'tratteggio' ? 'stroke-dasharray="6,4"' : '';
    return `<span class="figure__legend-item"><svg class="figure__legend-sample" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><line x1="2" y1="9" x2="16" y2="9" stroke="${escapeHtml(col)}" stroke-width="2.5" ${dash} /></svg>${escapeHtml(testoSicuro(s && s.etichetta))}</span>`;
  }).join('')}</div>`;
}

export function figuraSoloTesto(spec) {
  const titolo = testoSicuro(spec && spec.titolo ? spec.titolo : 'Figura');
  const descrizione = testoSicuro(spec && spec.descrizione ? spec.descrizione : 'Figura non disponibile.');
  return `<figure role="img" aria-label="${escapeHtml(titolo)}" class="figure figura-non-disponibile"><p>${escapeHtml(descrizione)}</p></figure>`;
}

export function svgBase(spec, width, height, inner, fs = 14) {
  const titolo = testoSicuro(spec && spec.titolo ? spec.titolo : 'Figura');
  const descrizione = testoSicuro(spec && spec.descrizione ? spec.descrizione : '');
  const id = spec && spec.id ? String(spec.id) : 'figura';
  // width in px così il font si rende a 15 px (fs unità viewBox * 15/fs = 15 px reso)
  const renderWidth = Math.round(width * 15 / fs);
  return `<svg role="img" viewBox="0 0 ${width} ${height}" width="${renderWidth}" xmlns="http://www.w3.org/2000/svg" class="figura-svg" aria-labelledby="tit-${id} desc-${id}"><title id="tit-${id}">${escapeHtml(titolo)}</title><desc id="desc-${id}">${escapeHtml(descrizione)}</desc>${inner}</svg>`;
}
