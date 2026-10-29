/**
 * Renderer per specifiche di tipo 'grafico' (spettri, forme d'onda,
 * curve S(a), rho(G)). Funzione pura: spec -> stringa SVG interna.
 */

import {
  testoSicuro,
  fmtAsse,
  escapeHtml,
  scala,
  PALETTE,
} from './helpers.js';

const VIEW_W = 760;
const VIEW_H = 460;
const MARGIN = { left: 90, right: 150, top: 50, bottom: 80 };

const STILE_DASH = {
  linea: 'solid',
  tratteggio: '6,4',
  righe: 'solid',
  punti: 'solid',
};

/**
 * Calcola l'estensione dati considerando tutte le serie e le annotazioni.
 * @param {object} spec
 * @returns {{x: [number,number], y:[number,number]} | null}
 */
function estensione(spec) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  const serie = Array.isArray(spec.serie) ? spec.serie : [];
  for (const s of serie) {
    for (const p of (Array.isArray(s.punti) ? s.punti : [])) {
      if (p.length < 2) continue;
      const x = Number(p[0]), y = Number(p[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  for (const a of (Array.isArray(spec.annotazioni) ? spec.annotazioni : [])) {
    const x = Number(a.x), y = Number(a.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  if (minX === Infinity) return null;
  return { x: [minX, maxX], y: [minY, maxY] };
}

/**
 * Tracce asse: usa tacche dichiarate altrimenti genera 5 tacche equispaziate.
 * @param {number} min
 * @param {number} max
 * @returns {Array<number>}
 */
function taccheDefault(min, max) {
  const passi = [1, 2, 2.5, 5, 10];
  const range = max - min;
  let passo = 1;
  for (const p of passi) {
    const cand = range / p;
    if (cand >= 4 && cand <= 8) { passo = p; break; }
  }
  const n = Math.floor(range / passo) || 1;
  const out = [];
  let v = Math.ceil(min / passo) * passo;
  for (let i = 0; i <= n + 1; i++) {
    const val = v + i * passo;
    if (val >= min - 1e-9 && val <= max + 1e-9) out.push(val);
    if (out.length > 12) break;
  }
  return out.length ? out : [min, max];
}

export function renderGrafico(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const asseX = spec.asse_x; const asseY = spec.asse_y;
  if (!asseX || !asseY || typeof asseX.min !== 'number' || typeof asseX.max !== 'number'
    || typeof asseY.min !== 'number' || typeof asseY.max !== 'number'
    || !Array.isArray(spec.serie)) {
    throw new Error('assi o serie non valide');
  }
  if (!(asseX.max > asseX.min) || !(asseY.max > asseY.min)) {
    throw new Error('range assi non valido');
  }

  const dati = estensione(spec);
  const xMin = dati ? Math.min(asseX.min, dati.x[0]) : asseX.min;
  const xMax = dati ? Math.max(asseX.max, dati.x[1]) : asseX.max;
  const yMin = dati ? Math.min(asseY.min, dati.y[0]) : asseY.min;
  const yMax = dati ? Math.max(asseY.max, dati.y[1]) : asseY.max;

  const px = (x) => scala(x, xMin, xMax, MARGIN.left, VIEW_W - MARGIN.right);
  const py = (y) => scala(y, yMin, yMax, VIEW_H - MARGIN.bottom, MARGIN.top);

  const toTacche = (tacche) =>
    tacche.map((t) =>
      typeof t === 'number' ? { valore: t } : { valore: Number(t && t.valore), etichetta: t.etichetta }
    );
  const taccheXNorm = toTacche(
    Array.isArray(asseX.tacche) ? asseX.tacche : taccheDefault(xMin, xMax)
  ).filter((t) => Number.isFinite(t.valore));
  const taccheYNorm = toTacche(
    Array.isArray(asseY.tacche) ? asseY.tacche : taccheDefault(yMin, yMax)
  ).filter((t) => Number.isFinite(t.valore));

  let inner = '';
  // sfondo e griglia
  inner += `<rect x="${MARGIN.left}" y="${MARGIN.top}" width="${VIEW_W - MARGIN.left - MARGIN.right}" height="${VIEW_H - MARGIN.top - MARGIN.bottom}" fill="#ffffff" stroke="#e5e7eb" stroke-width="1"/>`;
  for (const t of taccheXNorm) {
    const x = px(t.valore);
    inner += `<line x1="${x}" y1="${MARGIN.top}" x2="${x}" y2="${VIEW_H - MARGIN.bottom}" stroke="#f3f4f6" stroke-width="1"/>`;
  }
  for (const t of taccheYNorm) {
    const y = py(t.valore);
    inner += `<line x1="${MARGIN.left}" y1="${y}" x2="${VIEW_W - MARGIN.right}" y2="${y}" stroke="#f3f4f6" stroke-width="1"/>`;
  }
  // assi
  inner += `<line x1="${MARGIN.left}" y1="${VIEW_H - MARGIN.bottom}" x2="${VIEW_W - MARGIN.right}" y2="${VIEW_H - MARGIN.bottom}" stroke="#374151" stroke-width="2"/>`;
  inner += `<line x1="${MARGIN.left}" y1="${MARGIN.top}" x2="${MARGIN.left}" y2="${VIEW_H - MARGIN.bottom}" stroke="#374151" stroke-width="2"/>`;
  // etichette assi
  inner += `<text x="${VIEW_W / 2}" y="${VIEW_H - 22}" text-anchor="middle" fill="#111827" font-size="13" font-family="sans-serif">${escapeHtml(testoSicuro(asseX.etichetta))}</text>`;
  inner += `<text x="22" y="${VIEW_H / 2}" text-anchor="middle" fill="#111827" font-size="13" font-family="sans-serif" transform="rotate(-90 22,${VIEW_H / 2})">${escapeHtml(testoSicuro(asseY.etichetta))}</text>`;
  // tacche x
  for (const t of taccheXNorm) {
    const x = px(t.valore);
    const lbl = testoSicuro(t.etichetta !== undefined ? t.etichetta : fmtAsse(t.valore));
    inner += `<line x1="${x}" y1="${VIEW_H - MARGIN.bottom}" x2="${x}" y2="${VIEW_H - MARGIN.bottom + 4}" stroke="#374151" stroke-width="1"/>`;
    inner += `<text x="${x}" y="${VIEW_H - MARGIN.bottom + 17}" text-anchor="middle" fill="#374151" font-size="11" font-family="sans-serif">${escapeHtml(lbl)}</text>`;
  }
  // tacche y
  for (const t of taccheYNorm) {
    const y = py(t.valore);
    const lbl = testoSicuro(t.etichetta !== undefined ? t.etichetta : fmtAsse(t.valore));
    inner += `<line x1="${MARGIN.left - 4}" y1="${y}" x2="${MARGIN.left}" y2="${y}" stroke="#374151" stroke-width="1"/>`;
    inner += `<text x="${MARGIN.left - 10}" y="${y + 4}" text-anchor="end" fill="#374151" font-size="11" font-family="sans-serif">${escapeHtml(lbl)}</text>`;
  }
  const yZero = py(0);
  const mostraZero = yZero >= MARGIN.top && yZero <= VIEW_H - MARGIN.bottom;
  // serie
  let serieIndex = 0;
  for (const s of spec.serie) {
    if (!Array.isArray(s.punti) || s.punti.length === 0) continue;
    const colore = PALETTE[serieIndex % PALETTE.length];
    const dash = STILE_DASH[s.stile] || 'solid';
    const etichetta = testoSicuro(s.etichetta || `serie ${serieIndex + 1}`);
    serieIndex++;
    const puntiValidi = [];
    for (const p of s.punti) {
      if (p.length < 2) continue;
      const x = Number(p[0]), y = Number(p[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) puntiValidi.push([x, y]);
    }
    if (puntiValidi.length === 0) continue;
    if (s.stile === 'righe') {
      const base = mostraZero ? yZero : py(yMin);
      const steli = puntiValidi.map(([x, y]) => `<line x1="${px(x)}" y1="${base}" x2="${px(x)}" y2="${py(y)}" stroke="${colore}" stroke-width="1.4"/>`).join('');
      const puntini = puntiValidi.map(([x, y]) => `<circle cx="${px(x)}" cy="${py(y)}" r="3" fill="${colore}"/>`).join('');
      inner += steli + puntini;
    } else if (s.stile === 'punti') {
      inner += puntiValidi.map(([x, y]) => `<circle cx="${px(x)}" cy="${py(y)}" r="3.5" fill="${colore}"/>`).join('');
    } else {
      // linea / tratteggio: polilinea
      const d = puntiValidi.map(([x, y], i) => (i === 0 ? 'M' : 'L') + px(x) + ',' + py(y)).join('');
      inner += `<path d="${d}" fill="none" stroke="${colore}" stroke-width="2" stroke-dasharray="${dash}"/>`;
      inner += puntiValidi.map(([x, y]) => `<circle cx="${px(x)}" cy="${py(y)}" r="2.6" fill="${colore}"/>`).join('');
    }
    // legenda (stile + etichetta: il significato non e' solo nel colore)
    const ly = MARGIN.top + 22 + (serieIndex - 1) * 20;
    inner += `<line x1="${VIEW_W - MARGIN.right + 10}" y1="${ly}" x2="${VIEW_W - MARGIN.right + 34}" y2="${ly}" stroke="${colore}" stroke-width="2.5" stroke-dasharray="${dash}"/>`;
    inner += `<text x="${VIEW_W - MARGIN.right + 42}" y="${ly + 5}" fill="#111827" font-size="12" font-family="sans-serif">${escapeHtml(etichetta)}</text>`;
  }
  // annotazioni
  for (const a of (Array.isArray(spec.annotazioni) ? spec.annotazioni : [])) {
    const x = Number(a.x), y = Number(a.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    inner += `<circle cx="${px(x)}" cy="${py(y)}" r="4" fill="#b00020"/>`;
    inner += `<text x="${px(x) + 7}" y="${py(y) - 7}" fill="#b00020" font-size="11" font-family="sans-serif" font-weight="bold">${escapeHtml(testoSicuro(a.testo))}</text>`;
  }
  return inner;
}
