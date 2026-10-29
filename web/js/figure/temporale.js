/**
 * Renderer per specifiche di tipo 'temporale' (diagrammi temporali di
 * protocolli: sliding window, ALOHA, CSMA/CD, TDMA). Funzione pura:
 * spec -> stringa SVG interna.
 */

import { testoSicuro, escapeHtml, scala } from './helpers.js';

const VIEW_W = 940;
const VIEW_H = 560;
const AREA_X = 140;
const AREA_W = 760;
const LANE_H = 72;
const LANE_GAP = 20;

const STILE_COLOR = {
  trasmissione: '#1f6feb',
  attesa: '#e5e7eb',
  collisione: '#b00020',
  ack: '#2e8b57',
};
const STILE_DASH = {
  trasmissione: 'solid',
  attesa: '2,2',
  collisione: 'solid',
  ack: '6,3',
};

export function renderTemporale(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const asseT = spec.asse_t;
  if (!asseT || typeof asseT.min !== 'number' || typeof asseT.max !== 'number' || !(asseT.max > asseT.min)) {
    throw new Error('asse_t non valido');
  }
  const corsie = Array.isArray(spec.corsie) ? spec.corsie : [];
  if (corsie.length === 0) throw new Error('servono almeno una corsia');
  const intervalli = Array.isArray(spec.intervalli) ? spec.intervalli : [];
  const frecce = Array.isArray(spec.frecce) ? spec.frecce : [];
  const marcatori = Array.isArray(spec.marcatori) ? spec.marcatori : [];

  const tMin = Number(asseT.min); const tMax = Number(asseT.max);
  const tx = (t) => scala(t, tMin, tMax, AREA_X, AREA_X + AREA_W);
  const nCorsie = corsie.length;
  const altezzaCorsia = LANE_H;
  const origineY = 70;
  const passoY = altezzaCorsia + LANE_GAP;

  let inner = '';
  // sfondo corsie alternate
  for (let i = 0; i < nCorsie; i++) {
    const y = origineY + i * passoY;
    const sfondo = i % 2 === 0 ? '#ffffff' : '#f9fafb';
    inner += `<rect x="${AREA_X}" y="${y}" width="${AREA_W}" height="${altezzaCorsia}" fill="${sfondo}"/>`;
  }
  // etichette corsie e separatori orizzontali
  for (let i = 0; i < nCorsie; i++) {
    const y = origineY + i * passoY;
    const c = corsie[i];
    inner += `<text x="${AREA_X - 10}" y="${y + altezzaCorsia / 2 + 4}" text-anchor="end" fill="#374151" font-size="12" font-family="sans-serif">${escapeHtml(testoSicuro(c && c.etichetta ? c.etichetta : `corsia ${i + 1}`))}</text>`;
    inner += `<line x1="${AREA_X}" y1="${y + altezzaCorsia}" x2="${AREA_X + AREA_W}" y2="${y + altezzaCorsia}" stroke="#e5e7eb" stroke-width="1"/>`;
  }
  // asse del tempo in basso
  const asseY = origineY + nCorsie * passoY + 10;
  inner += `<line x1="${AREA_X}" y1="${asseY}" x2="${AREA_X + AREA_W}" y2="${asseY}" stroke="#111827" stroke-width="2"/>`;
  inner += `<text x="${AREA_X + AREA_W / 2}" y="${asseY + 24}" text-anchor="middle" fill="#111827" font-size="13" font-family="sans-serif">${escapeHtml(testoSicuro(asseT.etichetta || 't'))}</text>`;
  // tacche tempo (massimo 10)
  const nTacche = Math.min(10, Math.max(2, Math.floor(AREA_W / 90)));
  for (let i = 0; i <= nTacche; i++) {
    const t = tMin + (tMax - tMin) * (i / nTacche);
    const x = tx(t);
    inner += `<line x1="${x}" y1="${asseY}" x2="${x}" y2="${asseY + 6}" stroke="#111827" stroke-width="1.5"/>`;
    inner += `<text x="${x}" y="${asseY + 20}" text-anchor="middle" fill="#374151" font-size="11" font-family="sans-serif">${fmtAsse(t)}</text>`;
  }
  // intervalli
  for (const iv of intervalli) {
    const corsiaIdx = corsie.findIndex(c => c && c.id === iv.corsia);
    if (corsiaIdx < 0) continue;
    const t0 = Number(iv.t0); const t1 = Number(iv.t1);
    if (!Number.isFinite(t0) || !Number.isFinite(t1) || !(t1 > t0)) continue;
    const y = origineY + corsiaIdx * passoY + 10;
    const h = altezzaCorsia - 20;
    const x0 = tx(t0); const x1 = tx(t1);
    const colore = STILE_COLOR[iv.stile] || '#6b7280';
    const dash = STILE_DASH[iv.stile] || 'solid';
    inner += `<rect x="${x0}" y="${y}" width="${Math.max(1, x1 - x0)}" height="${h}" fill="${colore}" stroke="#111827" stroke-width="1.2" stroke-dasharray="${dash}" rx="4"/>`;
    if (iv.etichetta && x1 - x0 > 40) {
      inner += `<text x="${(x0 + x1) / 2}" y="${y + h / 2 + 4}" text-anchor="middle" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="600">${escapeHtml(testoSicuro(iv.etichetta))}</text>`;
    } else if (iv.etichetta) {
      inner += `<text x="${x0 + 4}" y="${y - 6}" fill="#374151" font-size="10" font-family="sans-serif">${escapeHtml(testoSicuro(iv.etichetta))}</text>`;
    }
  }
  // frecce tra punti
  for (const f of frecce) {
    // da e a sono oggetti {corsia, t}
    const daC = f.da && f.da.corsia; const aC = f.a && f.a.corsia;
    const iDa = corsie.findIndex(c => c && c.id === daC);
    const iA = corsie.findIndex(c => c && c.id === aC);
    if (iDa < 0 || iA < 0) continue;
    const tDa = Number(f.da && f.da.t); const tA = Number(f.a && f.a.t);
    if (!Number.isFinite(tDa) || !Number.isFinite(tA)) continue;
    const y1 = origineY + iDa * passoY + altezzaCorsia / 2;
    const y2 = origineY + iA * passoY + altezzaCorsia / 2;
    const x1 = tx(tDa); const x2 = tx(tA);
    inner += `<path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="#111827" stroke-width="1.8" marker-end="url(#freccia-temp)"/>`;
    if (f.etichetta) {
      const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2 - 8;
      inner += `<text x="${mx}" y="${my}" text-anchor="middle" fill="#b00020" font-size="10" font-family="sans-serif" font-weight="600">${escapeHtml(testoSicuro(f.etichetta))}</text>`;
    }
  }
  // marcatori di tempo
  for (const m of marcatori) {
    const t = Number(m.t);
    if (!Number.isFinite(t)) continue;
    const x = tx(t);
    inner += `<line x1="${x}" y1="${origineY}" x2="${x}" y2="${origineY + (nCorsie - 1) * passoY + altezzaCorsia}" stroke="#6b7280" stroke-width="1" stroke-dasharray="4,3"/>`;
    inner += `<text x="${x}" y="${origineY - 6}" text-anchor="middle" fill="#374151" font-size="10" font-family="sans-serif" font-weight="600">${fmtAsse(t)}</text>`;
    if (m.etichetta) {
      inner += `<text x="${x}" y="${origineY + (nCorsie) * passoY + altezzaCorsia + 14}" text-anchor="middle" fill="#b00020" font-size="11" font-family="sans-serif" font-weight="600">${escapeHtml(testoSicuro(m.etichetta))}</text>`;
    }
  }
  return `<defs><marker id="freccia-temp" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
    <path d="M 0 0 L 7 3.5 L 0 7 Z" fill="#111827"/>
  </marker></defs>${inner}`;
}

function fmtAsse(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '0';
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}
