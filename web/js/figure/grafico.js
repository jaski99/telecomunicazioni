/* Renderer 'grafico': spec -> { svgInner, viewBox, serie }. ViewBox stretto (600x360),
   testo sempre dentro il viewBox, colore scuro su sfondo chiaro. */

import { testoSicuro, fmtAsse, escapeHtml, scala, PALETTE, fontSize, stimaLarghezzaTesto } from './helpers.js';

const VIEW_W = 600, VIEW_H = 360, MARGIN = { left: 80, right: 30, top: 40, bottom: 65 };
const STILE_DASH = { linea: 'solid', tratteggio: '6,4', righe: 'solid', punti: 'solid' };

function estensione(spec) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of (Array.isArray(spec.serie) ? spec.serie : [])) {
    for (const p of (Array.isArray(s.punti) ? s.punti : [])) {
      if (p.length < 2) continue; const x = Number(p[0]), y = Number(p[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  if (minX === Infinity) return null; return { x: [minX, maxX], y: [minY, maxY] };
}
function taccheDefault(min, max) {
  const passi = [1, 2, 2.5, 5, 10]; const range = max - min; let passo = 1;
  for (const p of passi) { const cand = range / p; if (cand >= 4 && cand <= 8) { passo = p; break; } }
  const out = []; let v = Math.ceil(min / passo) * passo;
  for (let i = 0; i <= Math.floor(range / passo) + 1; i++) { const val = v + i * passo; if (val >= min - 1e-9 && val <= max + 1e-9) out.push(val); if (out.length > 12) break; }
  return out.length ? out : [min, max];
}

export function renderGrafico(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const ax = spec.asse_x, ay = spec.asse_y;
  if (!ax || !ay || typeof ax.min !== 'number' || typeof ax.max !== 'number' || typeof ay.min !== 'number' || typeof ay.max !== 'number' || !Array.isArray(spec.serie) || !(ax.max > ax.min) || !(ay.max > ay.min)) throw new Error('assi o serie non valide');
  const fs = fontSize(VIEW_W); const fst = Math.max(10, fs - 4);
  // L'etichetta dell'asse verticale, ruotata, deve stare interamente nel viewBox.
  const viewH = Math.max(VIEW_H, Math.ceil(stimaLarghezzaTesto(testoSicuro(ay.etichetta), fs) + 20));
  const d = estensione(spec);
  const xMin = d ? Math.min(ax.min, d.x[0]) : ax.min; const xMax = d ? Math.max(ax.max, d.x[1]) : ax.max;
  const yMin = d ? Math.min(ay.min, d.y[0]) : ay.min; const yMax = d ? Math.max(ay.max, d.y[1]) : ay.max;
  const px = x => scala(x, xMin, xMax, MARGIN.left, VIEW_W - MARGIN.right);
  const py = y => scala(y, yMin, yMax, viewH - MARGIN.bottom, MARGIN.top);
  const toT = t => typeof t === 'number' ? { valore: t } : { valore: Number(t && t.valore), etichetta: t.etichetta };
  const tx = (Array.isArray(ax.tacche) ? ax.tacche : taccheDefault(xMin, xMax)).map(toT).filter(t => Number.isFinite(t.valore));
  const ty = (Array.isArray(ay.tacche) ? ay.tacche : taccheDefault(yMin, yMax)).map(toT).filter(t => Number.isFinite(t.valore));
  let inner = `<rect x="${MARGIN.left}" y="${MARGIN.top}" width="${VIEW_W - MARGIN.left - MARGIN.right}" height="${viewH - MARGIN.top - MARGIN.bottom}" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>`;
  for (const t of tx) { const x = px(t.valore); inner += `<line x1="${x}" y1="${MARGIN.top}" x2="${x}" y2="${viewH - MARGIN.bottom}" stroke="#f3f4f6" stroke-width="1"/>`; }
  for (const t of ty) { const y = py(t.valore); inner += `<line x1="${MARGIN.left}" y1="${y}" x2="${VIEW_W - MARGIN.right}" y2="${y}" stroke="#f3f4f6" stroke-width="1"/>`; }
  inner += `<line x1="${MARGIN.left}" y1="${viewH - MARGIN.bottom}" x2="${VIEW_W - MARGIN.right}" y2="${viewH - MARGIN.bottom}" stroke="#111827" stroke-width="2"/>`;
  inner += `<line x1="${MARGIN.left}" y1="${MARGIN.top}" x2="${MARGIN.left}" y2="${viewH - MARGIN.bottom}" stroke="#111827" stroke-width="2"/>`;
  inner += `<text x="${(MARGIN.left + VIEW_W - MARGIN.right) / 2}" y="${viewH - 8}" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${fs}">${escapeHtml(testoSicuro(ax.etichetta))}</text>`;
  inner += `<text x="26" y="${viewH / 2}" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${fs}" transform="rotate(-90 26,${viewH / 2})">${escapeHtml(testoSicuro(ay.etichetta))}</text>`;
  for (const t of tx) { const x = px(t.valore); const lbl = testoSicuro(t.etichetta !== undefined ? t.etichetta : fmtAsse(t.valore));
    inner += `<line x1="${x}" y1="${viewH - MARGIN.bottom}" x2="${x}" y2="${viewH - MARGIN.bottom + 4}" stroke="#111827" stroke-width="1"/><text x="${x}" y="${viewH - MARGIN.bottom + 14}" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${fst}">${escapeHtml(lbl)}</text>`; }
  for (const t of ty) { const y = py(t.valore); const lbl = testoSicuro(t.etichetta !== undefined ? t.etichetta : fmtAsse(t.valore));
    inner += `<line x1="${MARGIN.left - 4}" y1="${y}" x2="${MARGIN.left}" y2="${y}" stroke="#111827" stroke-width="1"/><text x="${MARGIN.left - 8}" y="${y + 4}" text-anchor="end" fill="#111827" font-family="sans-serif" font-size="${fst}">${escapeHtml(lbl)}</text>`; }
  const yZero = py(0); const mostraZero = yZero >= MARGIN.top && yZero <= viewH - MARGIN.bottom;
  const serieOut = []; let si = 0;
  for (const s of spec.serie) {
    if (!Array.isArray(s.punti) || !s.punti.length) continue; const col = PALETTE[si % PALETTE.length]; const dash = STILE_DASH[s.stile] || 'solid';
    const etichetta = testoSicuro(s.etichetta || `serie ${si + 1}`); si++; const pv = [];
    for (const p of s.punti) { if (p.length < 2) continue; const x = Number(p[0]), y = Number(p[1]); if (Number.isFinite(x) && Number.isFinite(y)) pv.push([x, y]); }
    if (!pv.length) continue;
    if (s.stile === 'righe') { const base = mostraZero ? yZero : py(yMin);
      inner += pv.map(([x, y]) => `<line x1="${px(x)}" y1="${base}" x2="${px(x)}" y2="${py(y)}" stroke="${col}" stroke-width="1.4"/>`).join('');
      inner += pv.map(([x, y]) => `<circle cx="${px(x)}" cy="${py(y)}" r="3" fill="${col}"/>`).join(''); }
    else if (s.stile === 'punti') { inner += pv.map(([x, y]) => `<circle cx="${px(x)}" cy="${py(y)}" r="3.5" fill="${col}"/>`).join(''); }
    else { inner += `<path d="${pv.map(([x, y], i) => (i === 0 ? 'M' : 'L') + px(x) + ',' + py(y)).join('')}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="${dash}"/>`;
      inner += pv.map(([x, y]) => `<circle cx="${px(x)}" cy="${py(y)}" r="2.6" fill="${col}"/>`).join(''); }
    serieOut.push({ etichetta, colore: col, stile: s.stile });
  }
  for (const a of (Array.isArray(spec.annotazioni) ? spec.annotazioni : [])) {
    const x = Number(a.x), y = Number(a.y); if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const cx = px(x), cy = py(y); inner += `<circle cx="${cx}" cy="${cy}" r="4" fill="#b00020"/>`;
    const etW = stimaLarghezzaTesto(testoSicuro(a.testo), fst); const tx2 = Math.min(Math.max(cx + 7, 6), VIEW_W - 6 - etW); inner += `<text x="${tx2}" y="${Math.max(cy - 7, 12)}" fill="#b00020" font-family="sans-serif" font-size="${fst}" font-weight="bold">${escapeHtml(testoSicuro(a.testo))}</text>`;
  }
  return { svgInner: inner, viewBox: { w: VIEW_W, h: viewH }, serie: serieOut, fs };
}
