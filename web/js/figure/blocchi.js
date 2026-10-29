/**
 * Renderer per specifiche di tipo 'blocchi' (schemi a blocchi, catene
 * nascita-morte). Funzione pura: spec -> stringa SVG interna.
 */

import { testoSicuro, escapeHtml } from './helpers.js';

const VIEW_W = 900;
const VIEW_H = 600;
const ORIGINE_X = 70;
const ORIGINE_Y = 60;
const CELLA_W = 78;
const CELLA_H = 70;

const FORMA = {
  rettangolo: 'rettangolo',
  sommatore: 'sommatore',
  moltiplicatore: 'moltiplicatore',
  ritardo: 'ritardo',
  nodo: 'nodo',
  ingresso: 'ingresso',
  uscita: 'uscita',
};

function cellaX(colonna) { return ORIGINE_X + colonna * CELLA_W + CELLA_W / 2; }
function cellaY(riga) { return ORIGINE_Y + riga * CELLA_H + CELLA_H / 2; }

function disegnaBlocco(b) {
  const cx = cellaX(b.colonna);
  const cy = cellaY(rigaDi(b));
  const etichetta = testoSicuro(b.etichetta);
  const idAttr = b.id ? ` id="blocco-${escapeHtml(String(b.id))}"` : '';
  switch (b.forma) {
    case FORMA.sommatore:
      return `<g${idAttr} class="blocco sommatore" transform="translate(${cx - 18},${cy - 18})">
        <circle cx="18" cy="18" r="18" fill="#ffffff" stroke="#111827" stroke-width="2"/>
        <line x1="10" y1="18" x2="26" y2="18" stroke="#111827" stroke-width="2.5"/>
        <line x1="18" y1="10" x2="18" y2="26" stroke="#111827" stroke-width="2.5"/>
        <text x="18" y="23" text-anchor="middle" fill="#111827" font-size="12" font-family="sans-serif">${escapeHtml(etichetta || '')}</text>
      </g>`;
    case FORMA.moltiplicatore:
      return `<g${idAttr} class="blocco moltiplicatore" transform="translate(${cx - 18},${cy - 18})">
        <circle cx="18" cy="18" r="18" fill="#ffffff" stroke="#111827" stroke-width="2"/>
        <path d="M 11 11 L 25 25 M 25 11 L 11 25" stroke="#111827" stroke-width="2.5"/>
        <text x="18" y="23" text-anchor="middle" fill="#111827" font-size="12" font-family="sans-serif">${escapeHtml(etichetta || '')}</text>
      </g>`;
    case FORMA.ritardo:
      return `<g${idAttr} class="blocco ritardo" transform="translate(${cx - 24},${cy - 16})">
        <rect x="0" y="0" width="48" height="32" fill="#ffffff" stroke="#111827" stroke-width="2" rx="4"/>
        <text x="24" y="19" text-anchor="middle" fill="#111827" font-size="13" font-family="sans-serif">D</text>
        <text x="24" y="44" text-anchor="middle" fill="#374151" font-size="10" font-family="sans-serif">${escapeHtml(etichetta || '')}</text>
      </g>`;
    case FORMA.nodo:
      return `<g${idAttr} class="blocco nodo" transform="translate(${cx - 7},${cy - 7})">
        <circle cx="7" cy="7" r="6" fill="#111827"/>
        <text x="${cx + 10}" y="${cy + 4}" fill="#374151" font-size="12" font-family="sans-serif">${escapeHtml(etichetta || '')}</text>
      </g>`;
    case FORMA.ingresso:
      return `<g${idAttr} class="blocco ingresso" transform="translate(${cx - 30},${cy - 10})">
        <line x1="0" y1="10" x2="24" y2="10" stroke="#111827" stroke-width="2.5"/>
        <path d="M 24 10 L 16 4 L 16 16 Z" fill="#111827"/>
        <text x="12" y="28" text-anchor="middle" fill="#374151" font-size="12" font-family="sans-serif">${escapeHtml(etichetta || '')}</text>
      </g>`;
    case FORMA.uscita:
      return `<g${idAttr} class="blocco uscita" transform="translate(${cx - 24},${cy - 10})">
        <path d="M 0 10 L 8 4 L 8 16 Z" fill="#111827"/>
        <line x1="8" y1="10" x2="32" y2="10" stroke="#111827" stroke-width="2.5"/>
        <text x="20" y="28" text-anchor="middle" fill="#374151" font-size="12" font-family="sans-serif">${escapeHtml(etichetta || '')}</text>
      </g>`;
    case FORMA.rettangolo:
    default:
      return `<g${idAttr} class="blocco rettangolo" transform="translate(${cx - 32},${cy - 18})">
        <rect x="0" y="0" width="64" height="36" fill="#ffffff" stroke="#111827" stroke-width="2" rx="6"/>
        <text x="32" y="16" text-anchor="middle" fill="#111827" font-size="12" font-family="sans-serif" font-weight="600">${escapeHtml(etichetta || '')}</text>
      </g>`;
  }
}

function rigaDi(b) { return Number.isFinite(b.riga) ? b.riga : 0; }
function colonnaDi(b) { return Number.isFinite(b.colonna) ? b.colonna : 0; }

function freccia(x1, y1, x2, y2) {
  const dx = x2 - x1; const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len; const uy = dy / len;
  // punta della freccia leggermente prima del punto d'arrivo
  const ax = x2 - ux * 10; const ay = y2 - uy * 10;
  const rx = -uy * 7; const ry = ux * 7;
  return `<path d="M ${x1} ${y1} L ${ax} ${ay}" fill="none" stroke="#111827" stroke-width="2" marker-end="url(#freccia)"/>
  <path d="M ${ax + rx} ${ay + ry} L ${ax} ${ay} L ${ax - rx} ${ay - ry}" fill="#111827"/>`;
}

export function renderBlocchi(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const blocchi = Array.isArray(spec.blocchi) ? spec.blocchi : [];
  if (blocchi.length < 2) throw new Error('servono almeno due blocchi');
  const collegamenti = Array.isArray(spec.collegamenti) ? spec.collegamenti : [];

  const defs = `<defs><marker id="freccia" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
    <path d="M 0 0 L 8 3 L 0 6 Z" fill="#111827"/>
  </marker></defs>`;

  let pos = new Map();
  let inner = defs;
  for (const b of blocchi) {
    if (!b || typeof b !== 'object') continue;
    const g = disegnaBlocco(b);
    inner += g;
    const cx = cellaX(colonnaDi(b));
    const cy = cellaY(rigaDi(b));
    pos.set(String(b.id), { x: cx, y: cy });
  }
  for (const c of collegamenti) {
    const da = pos.get(String(c && c.da)); const a = pos.get(String(c && c.a));
    if (!da || !a) continue; // riferimento a blocco inesistente: salta, senza eccezioni
    const etichetta = testoSicuro(c && c.etichetta);
    inner += freccia(da.x + 6, da.y, a.x - 6, a.y);
    if (etichetta) {
      const mx = (da.x + a.x) / 2; const my = (da.y + a.y) / 2 - 12;
      inner += `<text x="${mx}" y="${my}" text-anchor="middle" fill="#1f6feb" font-size="11" font-family="sans-serif" font-weight="600">${escapeHtml(etichetta)}</text>`;
    }
  }
  return inner;
}
