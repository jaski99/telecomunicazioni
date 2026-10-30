/* Renderer degli schemi a blocchi: layout, ingombri e viewBox senza tagli. */
import { FS_BLOCCHI, layoutBlocchi, layoutCollegamenti } from './blocchi-layout.js';
import { attributiProgressivi } from './helpers.js';
import { disegnaBlocco, disegnaFreccia, disegnaTesto } from './blocchi-forme.js';

const PADDING = 10;
const LARGHEZZA_MASSIMA = 700;

/** Unione degli ingombri di forme, testi, linee e punte delle frecce. */
export function bboxBlocchi(nodi, collegamenti) {
  const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  function aggiungi(b) {
    box.left = Math.min(box.left, b.left); box.right = Math.max(box.right, b.right);
    box.top = Math.min(box.top, b.top); box.bottom = Math.max(box.bottom, b.bottom);
  }
  for (const nodo of nodi) aggiungi(nodo.box);
  for (const c of collegamenti) {
    for (const p of [c.inizio, c.base, c.fine, ...c.ali]) {
      aggiungi({ left: p.x - 1, right: p.x + 1, top: p.y - 1, bottom: p.y + 1 });
    }
    if (c.testo) {
      const t = c.testo;
      aggiungi({ left: t.x - t.w / 2, right: t.x + t.w / 2, top: t.y - t.h / 2, bottom: t.y + t.h / 2 });
    }
  }
  return box;
}

function costruisci(blocchi, collegamenti, limite, spazio) {
  const nodi = layoutBlocchi(blocchi, limite, spazio);
  const frecce = layoutCollegamenti(nodi, collegamenti, limite);
  const box = bboxBlocchi(nodi, frecce);
  const left = Math.floor(box.left - PADDING), top = Math.floor(box.top - PADDING);
  const right = Math.ceil(box.right + PADDING), bottom = Math.ceil(box.bottom + PADDING);
  return { nodi, frecce, left, top, w: right - left, h: bottom - top };
}

function riorganizza(blocchi, colonnePerRiga) {
  const colonne = [...new Set(blocchi.map(b => Number(b.colonna) || 0))].sort((a, b) => a - b);
  const righe = [...new Set(blocchi.map(b => Number(b.riga) || 0))].sort((a, b) => a - b);
  const righeBase = new Map(righe.map((r, i) => [r, i]));
  return blocchi.map(b => {
    const indice = colonne.indexOf(Number(b.colonna) || 0), fascia = Math.floor(indice / colonnePerRiga), pos = indice % colonnePerRiga;
    const fisica = fascia % 2 ? colonnePerRiga - 1 - pos : pos;
    return { ...b, colonna: fisica, riga: (righeBase.get(Number(b.riga) || 0) || 0) + fascia * righe.length };
  });
}

export function renderBlocchi(spec, opzioni = {}) {
  if (!spec || typeof spec !== 'object') throw new Error('spec mancante');
  const blocchi = Array.isArray(spec.blocchi) ? spec.blocchi.filter(b => b && typeof b === 'object') : [];
  if (blocchi.length < 2) throw new Error('servono almeno due blocchi');
  const collegamenti = Array.isArray(spec.collegamenti) ? spec.collegamenti : [];
  let disegno;
  // Se necessario, si va a capo e si riducono gli spazi, mai il viewBox.
  for (let limite = 16; limite >= 1; limite--) {
    const spazio = Math.max(0, 24 - (16 - limite) * 2);
    disegno = costruisci(blocchi, collegamenti, limite, spazio);
    if (disegno.w <= LARGHEZZA_MASSIMA) break;
  }
  if (disegno.w > LARGHEZZA_MASSIMA) {
    for (let maxColonne = 6; maxColonne >= 1; maxColonne--) {
      disegno = costruisci(riorganizza(blocchi, maxColonne), collegamenti, 16, 12);
      if (disegno.w <= LARGHEZZA_MASSIMA) break;
    }
  }
  const frecce = disegno.frecce.map(c => `<g ${attributiProgressivi(opzioni.progressione, 'collegamento', c.indice)}>${disegnaFreccia(c)}${disegnaTesto(c.testo, true)}</g>`).join('');
  const forme = disegno.nodi.map((n, i) => disegnaBlocco(n, opzioni, i)).join('');
  return { svgInner: `<g transform="translate(${-disegno.left},${-disegno.top})">${frecce}${forme}</g>`,
    viewBox: { w: disegno.w, h: disegno.h }, serie: [], fs: FS_BLOCCHI };
}
