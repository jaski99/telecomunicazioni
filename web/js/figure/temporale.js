/* Renderer 'temporale': spec -> { svgInner, viewBox, serie }. */

import { testoSicuro, escapeHtml, scala, fontSize } from './helpers.js';

const LANE_H = 60, LANE_GAP = 14, ORIGINE_Y = 55, ALTEZZA_MIN = 320, VIEW_W_MAX = 960;
const STILE_COLOR = { trasmissione: '#1f6feb', attesa: '#e5e7eb', collisione: '#b00020', ack: '#2e8b57' };
const STILE_DASH = { trasmissione: 'solid', attesa: '2,2', collisione: 'solid', ack: '6,3' };

function fmtAsse(v) { if (typeof v !== 'number' || !Number.isFinite(v)) return '0'; return Number.isInteger(v) ? String(v) : v.toFixed(2); }

function attr(k, v) { return k + '="' + String(v) + '"'; }

export function renderTemporale(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const at = spec.asse_t; if (!at || typeof at.min !== 'number' || typeof at.max !== 'number' || !(at.max > at.min)) throw new Error('asse_t non valido');
  const corsie = Array.isArray(spec.corsie) ? spec.corsie : []; if (!corsie.length) throw new Error('servono almeno una corsia');
  const intervalli = Array.isArray(spec.intervalli) ? spec.intervalli : []; const frecce = Array.isArray(spec.frecce) ? spec.frecce : []; const marcatori = Array.isArray(spec.marcatori) ? spec.marcatori : [];
  let etMax = 0; for (const c of corsie) etMax = Math.max(etMax, String(c && c.etichetta || '').length);
  const areaX = 100 + etMax * 7 + 16; const nCorsie = corsie.length; const passoY = LANE_H + LANE_GAP;
  let viewBoxW = Math.max(640, areaX + 480); if (viewBoxW > VIEW_W_MAX) viewBoxW = VIEW_W_MAX;
  const viewBoxH = Math.max(ALTEZZA_MIN, ORIGINE_Y + nCorsie * passoY + 90); const fs = fontSize(viewBoxW);
  const tx = function (t) { return scala(t, at.min, at.max, areaX, areaX + (viewBoxW - areaX - 50)); };
  let inner = '';
  for (let i = 0; i < nCorsie; i++) { const y = ORIGINE_Y + i * passoY;
    inner += '<rect ' + attr('x', areaX) + ' ' + attr('y', y) + ' ' + attr('width', viewBoxW - areaX - 50) + ' ' + attr('height', LANE_H) + ' ' + attr('fill', i % 2 ? '#f9fafb' : '#ffffff') + "/>";
    const lbl = testoSicuro(corsie[i] && corsie[i].etichetta || 'corsia ' + (i + 1));
    inner += '<text ' + attr('x', areaX - 8) + ' ' + attr('y', y + LANE_H / 2 + 5) + ' text-anchor="end" fill="#374151" font-family="sans-serif" ' + attr('font-size', Math.max(10, fs - 3)) + '>' + escapeHtml(lbl) + '</text>';
    inner += '<line ' + attr('x1', areaX) + ' ' + attr('y1', y + LANE_H) + ' ' + attr('x2', viewBoxW - 50) + ' ' + attr('y2', y + LANE_H) + ' stroke="#e5e7eb" stroke-width="1"/>';
  }
  const asseY = ORIGINE_Y + nCorsie * passoY + 12;
  inner += '<line ' + attr('x1', areaX) + ' ' + attr('y1', asseY) + ' ' + attr('x2', viewBoxW - 50) + ' ' + attr('y2', asseY) + ' stroke="#111827" stroke-width="2"/>';
  inner += '<text ' + attr('x', areaX + (viewBoxW - areaX - 50) / 2) + ' ' + attr('y', asseY + 22) + ' text-anchor="middle" fill="#111827" font-family="sans-serif" ' + attr('font-size', fs) + '>' + escapeHtml(testoSicuro(at.etichetta || 't')) + '</text>';
  const nTacche = Math.min(10, Math.max(2, Math.floor((viewBoxW - areaX - 50) / 90)));
  for (let i = 0; i <= nTacche; i++) { const t = at.min + (at.max - at.min) * (i / nTacche); const x = tx(t);
    inner += '<line ' + attr('x1', x) + ' ' + attr('y1', asseY) + ' ' + attr('x2', x) + ' ' + attr('y2', asseY + 6) + ' stroke="#111827" stroke-width="1.5"/>';
    inner += '<text ' + attr('x', x) + ' ' + attr('y', asseY + 18) + ' text-anchor="middle" fill="#374151" font-family="sans-serif" ' + attr('font-size', Math.max(10, fs - 4)) + '>' + fmtAsse(t) + '</text>'; }
  for (const iv of intervalli) { const ci = corsie.findIndex(c => c && c.id === iv.corsia); if (ci < 0) continue; const t0 = Number(iv.t0), t1 = Number(iv.t1); if (!Number.isFinite(t0) || !Number.isFinite(t1) || !(t1 > t0)) continue;
    const y = ORIGINE_Y + ci * passoY + 8, h = LANE_H - 16, x0 = tx(t0), x1 = tx(t1); const col = STILE_COLOR[iv.stile] || '#6b7280'; const dash = STILE_DASH[iv.stile] || 'solid';
    inner += '<rect ' + attr('x', x0) + ' ' + attr('y', y) + ' ' + attr('width', Math.max(1, x1 - x0)) + ' ' + attr('height', h) + ' ' + attr('fill', col) + ' stroke="#111827" stroke-width="1.2" stroke-dasharray="' + dash + '" rx="4"/>';
    if (iv.etichetta) { inner += '<text ' + attr('x', x0) + ' ' + attr('y', y - 8) + ' fill="#374151" font-family="sans-serif" ' + attr('font-size', Math.max(10, fs - 4)) + '>' + escapeHtml(testoSicuro(iv.etichetta)) + '</text>'; } }
  for (const f of frecce) { const ida = corsie.findIndex(c => c && c.id === f.da && f.da.corsia), ia = corsie.findIndex(c => c && c.id === f.a && f.a.corsia); if (ida < 0 || ia < 0) continue; const tda = Number(f.da && f.da.t), ta = Number(f.a && f.a.t); if (!Number.isFinite(tda) || !Number.isFinite(ta)) continue;
    const y1 = ORIGINE_Y + ida * passoY + LANE_H / 2, y2 = ORIGINE_Y + ia * passoY + LANE_H / 2, x1 = tx(tda), x2 = tx(ta);
    inner += '<path ' + attr('d', 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2) + ' fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#freccia-temp)"/>';
    if (f.etichetta) { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 9; inner += '<text ' + attr('x', mx) + ' ' + attr('y', my) + ' text-anchor="middle" fill="#b00020" font-family="sans-serif" ' + attr('font-size', Math.max(10, fs - 4)) + ' font-weight="600">' + escapeHtml(testoSicuro(f.etichetta)) + '</text>'; } }
  for (const m of marcatori) { const t = Number(m.t); if (!Number.isFinite(t)) continue; const x = tx(t);
    inner += '<line ' + attr('x1', x) + ' ' + attr('y1', ORIGINE_Y) + ' ' + attr('x2', x) + ' ' + attr('y2', ORIGINE_Y + (nCorsie - 1) * passoY + LANE_H) + ' stroke="#6b7280" stroke-width="1" stroke-dasharray="4,3"/>';
    inner += '<text ' + attr('x', x) + ' ' + attr('y', ORIGINE_Y - 8) + ' text-anchor="middle" fill="#374151" font-family="sans-serif" ' + attr('font-size', Math.max(10, fs - 4)) + ' font-weight="600">' + fmtAsse(t) + '</text>';
    if (m.etichetta) { inner += '<text ' + attr('x', x) + ' ' + attr('y', ORIGINE_Y + nCorsie * passoY + LANE_H + 14) + ' text-anchor="middle" fill="#b00020" font-family="sans-serif" ' + attr('font-size', Math.max(10, fs - 4)) + ' font-weight="600">' + escapeHtml(testoSicuro(m.etichetta)) + '</text>'; } }
  return { svgInner: '<defs><marker id="freccia-temp" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#111827"/></marker></defs>' + inner, viewBox: { w: viewBoxW, h: viewBoxH }, serie: [], fs };
}
