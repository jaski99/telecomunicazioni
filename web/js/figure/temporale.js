/* Diagrammi temporali: corsie, intervalli, frecce e marcatori leggibili. */
import { testoSicuro, escapeHtml, scala, stimaLarghezzaTesto } from './helpers.js';

const VIEW_W = 960, FS = 20, FS_TESTO = 18, PASSO = 24, BARRA = 34;
const STILE_COLOR = { trasmissione: '#1f6feb', attesa: '#e5e7eb', collisione: '#b00020', ack: '#2e8b57' };
const STILE_DASH = { trasmissione: 'solid', attesa: '2,2', collisione: 'solid', ack: '6,3' };
const attr = (k, v) => `${k}="${v}"`;
const fmt = v => Number.isInteger(v) ? String(v) : v.toFixed(2);
const larghezza = (s, fs = FS_TESTO) => stimaLarghezzaTesto(s, fs) * 1.15;

function posizione(x, testo, centrato = false) {
  const w = larghezza(testo), sx = centrato ? w / 2 : 0, dx = centrato ? w / 2 : w;
  return Math.max(8 + sx, Math.min(x, VIEW_W - 8 - dx));
}

/* Colloca le etichette su righe distinte solo quando i loro box si sovrappongono. */
function disponiEtichette(etichette) {
  const righe = [];
  for (const e of etichette.sort((a, b) => a.left - b.left)) {
    let r = righe.findIndex(fine => e.left >= fine + 8);
    if (r < 0) { r = righe.length; righe.push(0); }
    e.riga = r; righe[r] = e.right;
  }
  return righe.length;
}

function testo(x, y, label, opzioni = '', fs = FS_TESTO) {
  return `<text ${attr('x', x)} ${attr('y', y)} ${opzioni} font-family="sans-serif" font-size="${fs}">${escapeHtml(label)}</text>`;
}

export function renderTemporale(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const at = spec.asse_t;
  if (!at || typeof at.min !== 'number' || typeof at.max !== 'number' || !(at.max > at.min)) throw new Error('asse_t non valido');
  const corsie = Array.isArray(spec.corsie) ? spec.corsie : [];
  if (!corsie.length) throw new Error('servono almeno una corsia');
  const intervalli = Array.isArray(spec.intervalli) ? spec.intervalli : [];
  const marcatori = Array.isArray(spec.marcatori) ? spec.marcatori : [];
  const frecce = (Array.isArray(spec.frecce) ? spec.frecce : []).map(f => ({
    ...f, daIdx: corsie.findIndex(c => c && c.id === (f.da && f.da.corsia)),
    aIdx: corsie.findIndex(c => c && c.id === (f.a && f.a.corsia)),
  })).filter(f => f.daIdx >= 0 && f.aIdx >= 0 && Number.isFinite(Number(f.da.t)) && Number.isFinite(Number(f.a.t)));
  const areaX = Math.max(150, ...corsie.map(c => Math.ceil(larghezza(testoSicuro(c && c.etichetta), FS) + 20)));
  const tx = t => scala(t, at.min, at.max, areaX, VIEW_W - 50);
  const gapFrecce = corsie.map((_, i) => frecce.filter(f => Math.min(f.daIdx, f.aIdx) === i && f.etichetta).length);
  let cursore = 55;
  const lanes = corsie.map((c, i) => {
    const ivs = intervalli.filter(iv => iv && c && iv.corsia === c.id && Number.isFinite(Number(iv.t0)) && Number(iv.t1) > Number(iv.t0));
    const labels = ivs.filter(iv => iv.etichetta).map(iv => {
      const label = testoSicuro(iv.etichetta), x = posizione(tx(Number(iv.t0)), label);
      return { label, x, left: x, right: x + larghezza(label) };
    });
    const rows = disponiEtichette(labels), top = cursore, barY = top + rows * PASSO + 8, bottom = barY + BARRA;
    cursore = bottom + Math.max(36, (gapFrecce[i] + 1) * PASSO);
    return { c, ivs, labels, top, barY, bottom };
  });
  const asseY = lanes[lanes.length - 1].bottom + 36;
  const markerLabels = marcatori.filter(m => m && Number.isFinite(Number(m.t)) && m.etichetta).map(m => {
    const label = testoSicuro(m.etichetta), x = posizione(tx(Number(m.t)), label, true), w = larghezza(label);
    return { label, x, left: x - w / 2, right: x + w / 2 };
  });
  const markerRows = disponiEtichette(markerLabels);
  const viewBoxH = Math.max(320, asseY + 84 + markerRows * PASSO);
  let inner = '<defs><marker id="freccia-temp" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#111827"/></marker></defs>';
  for (const m of marcatori) {
    if (!m || !Number.isFinite(Number(m.t))) continue;
    const x = tx(Number(m.t));
    inner += `<line x1="${x}" y1="45" x2="${x}" y2="${lanes[lanes.length - 1].bottom}" stroke="#9ca3af" stroke-width="1" stroke-dasharray="4,3"/>`;
    inner += testo(posizione(x, fmt(Number(m.t)), true), 30, fmt(Number(m.t)), 'text-anchor="middle" fill="#374151"');
  }
  for (const [i, lane] of lanes.entries()) {
    inner += `<rect x="${areaX}" y="${lane.barY}" width="${VIEW_W - areaX - 50}" height="${BARRA}" fill="${i % 2 ? '#f9fafb' : '#fff'}"/>`;
    const label = testoSicuro(lane.c && lane.c.etichetta || `corsia ${i + 1}`);
    inner += testo(areaX - 8, lane.barY + BARRA / 2 + 6, label, 'text-anchor="end" fill="#374151"', FS);
    for (const iv of lane.ivs) {
      const x0 = tx(Number(iv.t0)), x1 = tx(Number(iv.t1));
      inner += `<rect x="${x0}" y="${lane.barY}" width="${Math.max(1, x1 - x0)}" height="${BARRA}" fill="${STILE_COLOR[iv.stile] || '#6b7280'}" stroke="#111827" stroke-width="1.2" stroke-dasharray="${STILE_DASH[iv.stile] || 'solid'}" rx="4"/>`;
    }
    for (const e of lane.labels) inner += testo(e.x, lane.top + 18 + e.riga * PASSO, e.label, 'fill="#374151"');
  }
  const occupate = corsie.map(() => 0);
  for (const f of frecce) {
    const da = lanes[f.daIdx], a = lanes[f.aIdx], versoGiu = f.daIdx < f.aIdx;
    const x1 = tx(Number(f.da.t)), x2 = tx(Number(f.a.t));
    const y1 = versoGiu ? da.bottom : da.barY, y2 = versoGiu ? a.barY : a.bottom;
    inner += `<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#freccia-temp)"/>`;
    if (f.etichetta) {
      const label = testoSicuro(f.etichetta), gap = Math.min(f.daIdx, f.aIdx);
      const x = posizione((x1 + x2) / 2, label, true), y = lanes[gap].bottom + 18 + occupate[gap]++ * PASSO;
      const w = larghezza(label);
      inner += `<rect x="${x - w / 2}" y="${y - 18}" width="${w}" height="22" fill="#fff"/>`;
      inner += testo(x, y, label, 'text-anchor="middle" fill="#9b1c2b" font-weight="600"');
    }
  }
  inner += `<line x1="${areaX}" y1="${asseY}" x2="${VIEW_W - 50}" y2="${asseY}" stroke="#111827" stroke-width="2"/>`;
  const tacche = Math.min(10, Math.max(2, Math.floor((VIEW_W - areaX - 50) / 90)));
  for (let i = 0; i <= tacche; i++) {
    const t = at.min + (at.max - at.min) * i / tacche, x = tx(t);
    inner += `<line x1="${x}" y1="${asseY}" x2="${x}" y2="${asseY + 6}" stroke="#111827"/>`;
    inner += testo(x, asseY + 23, fmt(t), 'text-anchor="middle" fill="#374151"');
  }
  inner += testo((areaX + VIEW_W - 50) / 2, asseY + 50, testoSicuro(at.etichetta || 't'), 'text-anchor="middle" fill="#111827"', FS);
  for (const e of markerLabels) inner += testo(e.x, asseY + 78 + e.riga * PASSO, e.label, 'text-anchor="middle" fill="#9b1c2b" font-weight="600"');
  return { svgInner: inner, viewBox: { w: VIEW_W, h: viewBoxH }, serie: [], fs: FS };
}
