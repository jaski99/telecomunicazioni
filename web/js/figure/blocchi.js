/* Renderer 'blocchi': spec -> { svgInner, viewBox, serie, fs }.
   fs fisso = 14 unità viewBox; svg width = viewBoxW * 15/FS -> font reso 15 px.
   Colonne posizionate in modo cumulativo (x crescente con la colonna).
   ViewBox = bbox reale di forme e testi (+10 px padding).
   Mai testo fuori viewBox, mai translate negativi. */

import { testoSicuro, escapeHtml, stimaLarghezzaTesto } from './helpers.js';

const FORMA = { rettangolo: 'rettangolo', sommatore: 'sommatore', moltiplicatore: 'moltiplicatore', ritardo: 'ritardo', nodo: 'nodo', ingresso: 'ingresso', uscita: 'uscita' };
const FS = 14;
const R_CIRCLE = Math.round(FS * 1.3);   // 18
const H_RETT = Math.round(FS * 2.6);     // 36
const PAD_X = Math.round(FS * 1);        // 14
const MARGINE_COLONNA = Math.round(FS * 3); // 40 tra colonne
const ALTEZZA_RIGA = Math.round(FS * 4.3); // 60
const PADDING_BBOX = 10;
const VIEW_W_MAX = 700;

function larghezzaTesto(s, fs) { return stimaLarghezzaTesto(s, fs); }

function larghezzaBlocco(b, fs) {
  const et = testoSicuro(b.etichetta);
  switch (b.forma) {
    case FORMA.sommatore: return 2 * R_CIRCLE + PAD_X;
    case FORMA.moltiplicatore: return 2 * R_CIRCLE + PAD_X;
    case FORMA.ritardo: return 48 + PAD_X;
    case FORMA.nodo: return 14 + larghezzaTesto(et, fs) + PAD_X;
    case FORMA.ingresso: return 24 + PAD_X;
    case FORMA.uscita: return 32 + PAD_X;
    default: return Math.max(60, larghezzaTesto(et, fs) + 14);
  }
}

function altezzaBlocco(b, fs) {
  if (b.forma === FORMA.ritardo) return 32 + PAD_X;
  return H_RETT;
}

/* Testo su più righe (tspan) se supera 18 caratteri. */
function testoSuPiùRighe(et, fs, maxCharPerRiga = 18) {
  if (et.length <= maxCharPerRiga) {
    return `<text x="0" y="0" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${fs}">${escapeHtml(et)}</text>`;
  }
  const righe = [];
  for (let i = 0; i < et.length; i += maxCharPerRiga) righe.push(et.slice(i, i + maxCharPerRiga));
  const dy = -((righe.length - 1) * fs * 0.6) / 2;
  return righe.map((r, i) =>
    `<tspan x="0" y="${dy + i * fs * 0.6}" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${fs}">${escapeHtml(r)}</tspan>`
  ).join('');
}

function disegnaBlocco(b, cx, cy, fs, bw, bh) {
  const et = testoSicuro(b.etichetta);
  const id = b.id ? ` id="blocco-${escapeHtml(String(b.id))}"` : '';
  switch (b.forma) {
    case FORMA.sommatore:
      return `<g${id} class="blocco sommatore" transform="translate(${cx - R_CIRCLE},${cy - R_CIRCLE})"><circle cx="${R_CIRCLE}" cy="${R_CIRCLE}" r="${R_CIRCLE}" fill="#ffffff" stroke="#111827" stroke-width="2"/><line x1="${R_CIRCLE - 8}" y1="${R_CIRCLE}" x2="${R_CIRCLE + 8}" y2="${R_CIRCLE}" stroke="#111827" stroke-width="2.5"/><line x1="${R_CIRCLE}" y1="${R_CIRCLE - 8}" x2="${R_CIRCLE}" y2="${R_CIRCLE + 8}" stroke="#111827" stroke-width="2.5"/><text x="${R_CIRCLE}" y="${R_CIRCLE + 5}" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${fs}">${escapeHtml(et)}</text></g>`;
    case FORMA.moltiplicatore:
      return `<g${id} class="blocco moltiplicatore" transform="translate(${cx - R_CIRCLE},${cy - R_CIRCLE})"><circle cx="${R_CIRCLE}" cy="${R_CIRCLE}" r="${R_CIRCLE}" fill="#ffffff" stroke="#111827" stroke-width="2"/><path d="M ${R_CIRCLE - 7} ${R_CIRCLE - 7} L ${R_CIRCLE + 7} ${R_CIRCLE + 7} M ${R_CIRCLE + 7} ${R_CIRCLE - 7} L ${R_CIRCLE - 7} ${R_CIRCLE + 7}" stroke="#111827" stroke-width="2.5"/><text x="${R_CIRCLE}" y="${R_CIRCLE + 5}" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${fs}">${escapeHtml(et)}</text></g>`;
    case FORMA.ritardo:
      return `<g${id} class="blocco ritardo" transform="translate(${cx - 24},${cy - 16})"><rect x="0" y="0" width="48" height="32" fill="#ffffff" stroke="#111827" stroke-width="2" rx="4"/><text x="24" y="19" text-anchor="middle" fill="#111827" font-family="sans-serif" font-size="${Math.max(12, fs - 2)}">D</text><text x="24" y="44" text-anchor="middle" fill="#374151" font-family="sans-serif" font-size="${Math.max(11, fs - 4)}">${escapeHtml(et)}</text></g>`;
    case FORMA.nodo:
      return `<g${id} class="blocco nodo" transform="translate(${cx - 7},${cy - 7})"><circle cx="7" cy="7" r="6" fill="#111827"/><text x="17" y="11" fill="#374151" font-family="sans-serif" font-size="${fs}">${escapeHtml(et)}</text></g>`;
    case FORMA.ingresso:
      return `<g${id} class="blocco ingresso" transform="translate(${cx - 30},${cy - 10})"><line x1="0" y1="10" x2="24" y2="10" stroke="#111827" stroke-width="2.5"/><path d="M 24 10 L 16 4 L 16 16 Z" fill="#111827"/><text x="12" y="28" text-anchor="middle" fill="#374151" font-family="sans-serif" font-size="${fs}">${escapeHtml(et)}</text></g>`;
    case FORMA.uscita:
      return `<g${id} class="blocco uscita" transform="translate(${cx - 24},${cy - 10})"><path d="M 0 10 L 8 4 L 8 16 Z" fill="#111827"/><line x1="8" y1="10" x2="32" y2="10" stroke="#111827" stroke-width="2.5"/><text x="20" y="28" text-anchor="middle" fill="#374151" font-family="sans-serif" font-size="${fs}">${escapeHtml(et)}</text></g>`;
    default: {
      const testo = testoSuPiùRighe(et, fs);
      return `<g${id} class="blocco rettangolo" transform="translate(${cx - bw / 2},${cy - bh / 2})"><rect x="0" y="0" width="${bw}" height="${bh}" fill="#ffffff" stroke="#111827" stroke-width="2" rx="6"/><text x="${bw / 2}" y="${bh / 2}" text-anchor="middle" dominant-baseline="middle" fill="#111827" font-family="sans-serif" font-size="${fs}" font-weight="600">${testo}</text></g>`;
    }
  }
}

function freccia(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const ax = x2 - ux * 10, ay = y2 - uy * 10, rx = -uy * 7, ry = ux * 7;
  return `<path d="M ${x1} ${y1} L ${ax} ${ay}" fill="none" stroke="#111827" stroke-width="2" marker-end="url(#freccia)"/><path d="M ${ax + rx} ${ay + ry} L ${ax} ${ay} L ${ax - rx} ${ay - ry}" fill="#111827"/>`;
}

export function renderBlocchi(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const blocchi = Array.isArray(spec.blocchi) ? spec.blocchi : []; if (blocchi.length < 2) throw new Error('servono almeno due blocchi');
  const collegamenti = Array.isArray(spec.collegamenti) ? spec.collegamenti : [];

  // Raggruppa per colonna e calcola larghezza max per colonna
  const colonne = {};
  let colMax = -1, rigaMax = 0;
  for (const b of blocchi) { if (!b) continue; const c = b.colonna || 0; colMax = Math.max(colMax, c); rigaMax = Math.max(rigaMax, b.riga || 0); if (!colonne[c]) colonne[c] = []; colonne[c].push(b); }

  const colOrdine = Object.keys(colonne).map(Number).sort((a, b) => a - b);
  const colLarghezza = {}; const colX = {};
  let xCursore = 0;
  for (const c of colOrdine) {
    let maxW = 0; for (const b of colonne[c]) maxW = Math.max(maxW, larghezzaBlocco(b, FS));
    colLarghezza[c] = maxW;
    colX[c] = xCursore + maxW / 2;
    xCursore += maxW + MARGINE_COLONNA;
  }

  const fs = FS;
  const defs = '<defs><marker id="freccia" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M 0 0 L 8 3 L 0 6 Z" fill="#111827"/></marker></defs>';
  let inner = defs; const pos = new Map();

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  function aggiornaBbox(x, y, w, h) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x + w);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y + h);
  }

  for (const b of blocchi) {
    if (!b || typeof b !== 'object') continue;
    const c = b.colonna || 0; const r = b.riga || 0;
    const cx = colX[c]; const cy = PADDING_BBOX + r * ALTEZZA_RIGA + ALTEZZA_RIGA / 2;
    const bw = larghezzaBlocco(b, fs); const bh = altezzaBlocco(b, fs);
    inner += disegnaBlocco(b, cx, cy, fs, bw, bh);
    pos.set(String(b.id), { x: cx, y: cy });
    aggiornaBbox(cx - bw / 2, cy - bh / 2, bw, bh);
  }

  for (const c of collegamenti) {
    const da = pos.get(String(c && c.da)), a = pos.get(String(c && c.a)); if (!da || !a) continue;
    inner += freccia(da.x, da.y, a.x, a.y);
    const et = testoSicuro(c && c.etichetta); if (et) {
      const mx = (da.x + a.x) / 2; const my = (da.y + a.y) / 2 - 12;
      const etW = larghezzaTesto(et, Math.max(10, fs - 3));
      inner += `<text x="${mx}" y="${my}" text-anchor="middle" fill="#1f6feb" font-family="sans-serif" font-size="${Math.max(10, fs - 3)}" font-weight="600">${escapeHtml(et)}</text>`;
      aggiornaBbox(mx - etW / 2 - 5, my - 10, etW + 10, 20);
    }
  }

  minX -= PADDING_BBOX; maxX += PADDING_BBOX; minY -= PADDING_BBOX; maxY += PADDING_BBOX;
  let viewBoxW = Math.round(maxX - minX); let viewBoxH = Math.round(maxY - minY);
  if (viewBoxW > VIEW_W_MAX) viewBoxW = VIEW_W_MAX;
  if (viewBoxH < 320) viewBoxH = 320;

  const dx = PADDING_BBOX - minX; const dy = PADDING_BBOX - minY;
  inner = `<g transform="translate(${dx},${dy})">${inner}</g>`;
  return { svgInner: inner, viewBox: { w: viewBoxW, h: viewBoxH }, serie: [], fs };
}
