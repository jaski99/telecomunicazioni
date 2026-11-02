/* Renderer grafico: assi dichiarati, palette stabile e ritaglio dei dati eccedenti. */
import { testoSicuro, fmtAsse, escapeHtml, scala, PALETTE, fontSize, stimaLarghezzaTesto, attributiProgressivi } from './helpers.js';

const VIEW_W = 600, VIEW_H = 360, MARGIN = { left: 80, right: 30, top: 40, bottom: 65 };
const STILE_DASH = { linea: 'solid', tratteggio: '6,4', righe: 'solid', punti: 'solid' };

function taccheDefault(min, max) {
  const passi = [1, 2, 2.5, 5, 10], range = max - min; let passo = 1;
  for (const p of passi) { const c = range / p; if (c >= 4 && c <= 8) { passo = p; break; } }
  const out = []; let v = Math.ceil(min / passo) * passo;
  for (let i = 0; i <= Math.floor(range / passo) + 1; i++) {
    const val = v + i * passo; if (val >= min - 1e-9 && val <= max + 1e-9) out.push(val);
    if (out.length > 12) break;
  }
  return out.length ? out : [min, max];
}

function tick(t) { return typeof t === 'number' ? { valore: t } : { valore: Number(t && t.valore), etichetta: t.etichetta }; }

export function renderGrafico(spec, opzioni = {}) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const ax = spec.asse_x, ay = spec.asse_y;
  if (!ax || !ay || typeof ax.min !== 'number' || typeof ax.max !== 'number' || typeof ay.min !== 'number' || typeof ay.max !== 'number' || !Array.isArray(spec.serie) || !(ax.max > ax.min) || !(ay.max > ay.min)) throw new Error('assi o serie non valide');
  const fs = fontSize(VIEW_W), fst = Math.max(10, fs - 4);
  const viewH = Math.max(VIEW_H, Math.ceil(stimaLarghezzaTesto(testoSicuro(ay.etichetta), fs) + 20));
  const px = x => scala(x, ax.min, ax.max, MARGIN.left, VIEW_W - MARGIN.right);
  const py = y => scala(y, ay.min, ay.max, viewH - MARGIN.bottom, MARGIN.top);
  const tx = (ax.tacche || taccheDefault(ax.min, ax.max)).map(tick).filter(t => Number.isFinite(t.valore) && t.valore >= ax.min && t.valore <= ax.max);
  const ty = (ay.tacche || taccheDefault(ay.min, ay.max)).map(tick).filter(t => Number.isFinite(t.valore) && t.valore >= ay.min && t.valore <= ay.max);
  const plotW = VIEW_W - MARGIN.left - MARGIN.right, plotH = viewH - MARGIN.top - MARGIN.bottom;
  const clipId = `clip-${String(spec.id || 'grafico').replace(/[^a-zA-Z0-9_-]/g, '-')}-${opzioni.istanza || 'stato'}`;
  let inner = `<defs><clipPath id="${escapeHtml(clipId)}"><rect x="${MARGIN.left}" y="${MARGIN.top}" width="${plotW}" height="${plotH}"/></clipPath></defs>`;
  inner += `<rect x="${MARGIN.left}" y="${MARGIN.top}" width="${plotW}" height="${plotH}" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>`;
  for (const t of tx) { const x = px(t.valore); inner += `<line x1="${x}" y1="${MARGIN.top}" x2="${x}" y2="${viewH - MARGIN.bottom}" stroke="#f3f4f6"/>`; }
  for (const t of ty) { const y = py(t.valore); inner += `<line x1="${MARGIN.left}" y1="${y}" x2="${VIEW_W - MARGIN.right}" y2="${y}" stroke="#f3f4f6"/>`; }
  inner += `<line x1="${MARGIN.left}" y1="${viewH - MARGIN.bottom}" x2="${VIEW_W - MARGIN.right}" y2="${viewH - MARGIN.bottom}" stroke="#111827" stroke-width="2"/><line x1="${MARGIN.left}" y1="${MARGIN.top}" x2="${MARGIN.left}" y2="${viewH - MARGIN.bottom}" stroke="#111827" stroke-width="2"/>`;
  inner += `<text x="${(MARGIN.left + VIEW_W - MARGIN.right) / 2}" y="${viewH - 8}" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${fs}">${escapeHtml(testoSicuro(ax.etichetta))}</text>`;
  inner += `<text x="26" y="${viewH / 2}" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${fs}" transform="rotate(-90 26,${viewH / 2})">${escapeHtml(testoSicuro(ay.etichetta))}</text>`;
  for (const t of tx) inner += tickLabel(t, px(t.valore), viewH - MARGIN.bottom, fst, true);
  for (const t of ty) inner += tickLabel(t, py(t.valore), MARGIN.left, fst, false);
  let plot = '', serieOut = [];
  spec.serie.forEach((s, index) => {
    if (!Array.isArray(s.punti) || !s.punti.length) return;
    const colore = PALETTE[index % PALETTE.length], dash = STILE_DASH[s.stile] || 'solid';
    const label = testoSicuro(s.etichetta || `serie ${index + 1}`), attrs = attributiProgressivi(opzioni.progressione, 'serie', index);
    const punti = s.punti.filter(p => p && p.length >= 2).map(p => [Number(p[0]), Number(p[1])]).filter(p => p.every(Number.isFinite));
    if (!punti.length) return;
    if (s.stile === 'righe') {
      const base = py(0); plot += `<g ${attrs}>${punti.map(([x,y]) => `<line x1="${px(x)}" y1="${base}" x2="${px(x)}" y2="${py(y)}" stroke="${colore}" stroke-width="1.4"/><circle cx="${px(x)}" cy="${py(y)}" r="3" fill="${colore}"/>`).join('')}</g>`;
    } else if (s.stile === 'punti') {
      plot += `<g ${attrs}>${punti.map(([x,y]) => `<circle cx="${px(x)}" cy="${py(y)}" r="3.5" fill="${colore}"/>`).join('')}</g>`;
    } else {
      plot += `<g ${attrs}><path d="${punti.map(([x,y],i) => `${i ? 'L' : 'M'}${px(x)},${py(y)}`).join('')}" fill="none" stroke="${colore}" stroke-width="2" stroke-dasharray="${dash}"/>${punti.map(([x,y]) => `<circle cx="${px(x)}" cy="${py(y)}" r="2.6" fill="${colore}"/>`).join('')}</g>`;
    }
    serieOut.push({ etichetta: label, colore, stile: s.stile });
  });
  (spec.annotazioni || []).forEach((a, index) => {
    const x = Number(a.x), y = Number(a.y); if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const cx = px(x), cy = py(y), label = testoSicuro(a.testo), w = stimaLarghezzaTesto(label, fst);
    const tx2 = Math.min(Math.max(cx + 7, 6), VIEW_W - 6 - w);
    plot += `<g ${attributiProgressivi(opzioni.progressione, 'annotazione', index)}><circle cx="${cx}" cy="${cy}" r="4" fill="#b00020"/><text x="${tx2}" y="${Math.max(cy - 7, 12)}" fill="#b00020" font-family="sans-serif" font-size="${fst}" font-weight="bold">${escapeHtml(label)}</text></g>`;
  });
  inner += `<g clip-path="url(#${escapeHtml(clipId)})">${plot}</g>`;
  return { svgInner: inner, viewBox: { w: VIEW_W, h: viewH }, serie: serieOut, fs };
}

function tickLabel(t, pos, base, size, orizzontale) {
  const label = testoSicuro(t.etichetta !== undefined ? t.etichetta : fmtAsse(t.valore));
  return orizzontale
    ? `<line x1="${pos}" y1="${base}" x2="${pos}" y2="${base + 4}" stroke="#111827"/><text x="${pos}" y="${base + 14}" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${size}">${escapeHtml(label)}</text>`
    : `<line x1="${base - 4}" y1="${pos}" x2="${base}" y2="${pos}" stroke="#111827"/><text x="${base - 8}" y="${pos + 4}" text-anchor="end" fill="#111827" font-family="sans-serif" font-size="${size}">${escapeHtml(label)}</text>`;
}
